import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public/staff split. When STAFF_APP_ENABLED=false this instance serves ONLY the
 * endpoints the citizen portal needs; the staff workspace (pages and every
 * staff API) answers 404. Run the public instance that way and run a separate,
 * privately reachable instance with STAFF_APP_ENABLED=true for your team.
 * Unset means enabled, so local development is unaffected.
 *
 * This is deployment-level, not header-based, so it cannot be bypassed by
 * spoofing a Host header.
 */
const PUBLIC_PREFIXES = ['/api/submit', '/api/health', '/api/cron/escalate'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  if (process.env.STAFF_APP_ENABLED !== 'false') return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return new NextResponse('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
