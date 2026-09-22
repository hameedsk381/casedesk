import { isIP } from 'node:net';

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function getClientIp(request: Request): string {
  if (process.env.TRUSTED_PROXY !== 'true') return 'unknown';
  const candidates = [
    request.headers.get('x-forwarded-for')?.split(',')[0].trim(),
    request.headers.get('x-real-ip')?.trim(),
  ];
  return candidates.find((candidate) => candidate && isIP(candidate) !== 0) || 'unknown';
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const timestamps = (buckets.get(key) || []).filter((time) => time > now - windowMs);
  if (timestamps.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((timestamps[0] + windowMs - now) / 1000));
    buckets.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }
  timestamps.push(now);
  buckets.set(key, timestamps);
  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.every((time) => time <= now - windowMs)) buckets.delete(bucketKey);
      if (buckets.size <= MAX_KEYS) break;
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function hasExceededContentLength(request: Request, maxBytes: number): boolean {
  const length = request.headers.get('content-length');
  return length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes);
}
