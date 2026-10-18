import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getClientIp, rateLimit } from '@/lib/security';

// Generates an SVG QR code that opens the portal pre-filled with a ward, e.g.
//   /api/qr?ward=12            -> <portal>/?ward=12
//   /api/qr?ward=12&slug=desk  -> <portal>/desk?ward=12
// Print these on posters so each ward's reports are tagged automatically.

const PORTAL_BASE_URL = process.env.PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL;

export async function GET(request: Request) {
  const rl = rateLimit(`qr:${getClientIp(request)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
  }

  const url = new URL(request.url);
  const ward = url.searchParams.get('ward')?.trim() || '';
  const slug = url.searchParams.get('slug')?.trim() || '';

  if (!/^[A-Za-z0-9 ._-]{1,50}$/.test(ward)) {
    return NextResponse.json({ error: 'Provide a ward (letters, numbers, spaces, . _ - only).' }, { status: 400 });
  }
  if (slug && !/^[A-Za-z0-9_-]{1,100}$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
  }

  // Never derive the printed URL from request headers: a poster QR must point
  // at the canonical public address, so require it to be configured.
  const base = (PORTAL_BASE_URL || (process.env.NODE_ENV !== 'production' ? url.origin : '')).replace(/\/$/, '');
  if (!base) {
    return NextResponse.json({ error: 'PUBLIC_PORTAL_URL is not configured.' }, { status: 500 });
  }

  const target = `${base}/${slug ? encodeURIComponent(slug) : ''}?ward=${encodeURIComponent(ward)}`;
  const svg = await QRCode.toString(target, { type: 'svg', errorCorrectionLevel: 'M', margin: 2, width: 512 });

  return new NextResponse(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400',
      'content-disposition': `inline; filename="ward-${ward.replace(/[^A-Za-z0-9_-]/g, '_')}.svg"`,
    },
  });
}
