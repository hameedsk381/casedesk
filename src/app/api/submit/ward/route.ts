import { NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/api/cors';
import { getClientIp, rateLimit } from '@/lib/rateLimit';
import { lookupWard, wardLookupAvailable } from '@/lib/geo/wards';

// Ward detection for the citizen form.
//   GET  /api/submit/ward            -> { available }   (is a boundary file loaded?)
//   POST /api/submit/ward {lat, lng} -> { available, ward }
// Coordinates travel in the POST body, are used only to look up the ward, and are
// never stored or logged.

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  return NextResponse.json(
    { available: wardLookupAvailable() },
    { headers: { ...getCorsHeaders(request), 'Cache-Control': 'public, max-age=300' } }
  );
}

export async function POST(request: Request) {
  const headers = { ...getCorsHeaders(request), ...NO_STORE };

  const rl = rateLimit(`ward:${getClientIp(request)}`, 30, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { ...headers, 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > 1024)) {
    return NextResponse.json({ error: 'Request too large.' }, { status: 413, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers });
  }

  const { lat, lng } = (body ?? {}) as { lat?: unknown; lng?: unknown };
  if (
    typeof lat !== 'number' || typeof lng !== 'number' ||
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400, headers });
  }

  const available = wardLookupAvailable();
  return NextResponse.json({ available, ward: available ? lookupWard(lat, lng) : null }, { headers });
}
