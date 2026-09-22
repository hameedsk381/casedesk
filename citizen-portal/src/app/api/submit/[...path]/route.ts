import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/security';

// Same-origin proxy: forwards /api/submit/* from the citizen portal to the
// CaseDesk app over the internal network. Citizens' browsers only ever talk
// to this portal — CaseDesk never needs to be publicly reachable.

const INTERNAL_API_URL =
  process.env.INTERNAL_CASEDESK_URL ||
  process.env.NEXT_PUBLIC_CASEDESK_API_URL ||
  'http://localhost:3000';

async function forward(request: Request, path: string[]): Promise<Response> {
  if (!['GET', 'POST'].includes(request.method)) {
    return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
  }
  if (path.length !== 1 || !path[0] || path[0].includes('..')) {
    return NextResponse.json({ error: 'Invalid submission endpoint.' }, { status: 404 });
  }
  const query = new URL(request.url).search;
  const target = `${INTERNAL_API_URL}/api/submit/${path.map(encodeURIComponent).join('/')}${query}`;

  const headers: Record<string, string> = {};
  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  // Preserve client IP so CaseDesk's rate limiter stays per-citizen
  const clientIp = getClientIp(request);
  if (clientIp !== 'unknown') headers['x-forwarded-for'] = clientIp;

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(60_000),
    });

    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err: any) {
    console.error('[submit-proxy] Forwarding failed:', err?.message || err);
    return NextResponse.json(
      { error: 'The helpdesk is temporarily unavailable. Please try again shortly.' },
      { status: 502 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return forward(request, path);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return forward(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
