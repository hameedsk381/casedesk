// Simple in-memory sliding-window rate limiter (single-container deployments)
const buckets = new Map<string, number[]>();

const MAX_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);

  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k);
      if (buckets.size <= MAX_KEYS) break;
    }
  }

  return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  // Forwarded headers are only authoritative when the deployment explicitly
  // declares that requests arrive through a trusted reverse proxy.
  if (process.env.TRUSTED_PROXY !== 'true') return 'unknown';

  const forwarded = request.headers.get('x-forwarded-for');
  const candidates = [forwarded?.split(',')[0].trim(), request.headers.get('x-real-ip')?.trim()];
  for (const candidate of candidates) {
    if (candidate && isIP(candidate) !== 0) return candidate;
  }
  return 'unknown';
}
import { isIP } from 'node:net';
