import { NextResponse } from 'next/server';
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, isLanguage } from '@/lib/i18n/serverLang';

// Saves the language choice in a cookie and returns to the page the user came
// from, e.g. /api/lang?lang=te&next=/accountability — used by server-rendered
// pages whose language toggles are plain links.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang');
  const next = url.searchParams.get('next') || '/';

  // Only same-site relative paths: reject "//host", "/\host" and absolute URLs.
  const safeNext = /^\/(?![/\\])/.test(next) ? next : '/';

  // Resolve against the request URL's own host is unreliable behind a proxy,
  // so redirect with a relative Location header.
  const response = new NextResponse(null, { status: 303, headers: { Location: safeNext } });
  if (isLanguage(lang)) {
    response.cookies.set(LANG_COOKIE, lang, {
      maxAge: LANG_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  return response;
}
