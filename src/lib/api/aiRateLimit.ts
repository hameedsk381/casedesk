import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

/**
 * Per-user cap on AI calls (each one costs money). Returns a 429 response when
 * the user is over the limit, otherwise null.
 */
export function aiRateLimitResponse(userId: string): NextResponse | null {
  const rl = rateLimit(`ai:${userId}`, 30, 60 * 60 * 1000);
  if (rl.allowed) return null;
  return NextResponse.json(
    { error: 'AI request limit reached. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
  );
}
