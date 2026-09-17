import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const FALLBACK_SECRET = 'casedesk-secret-key-2026-secure-session-salt-jwt';

if (
  process.env.NODE_ENV === 'production' &&
  (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === FALLBACK_SECRET || process.env.SESSION_SECRET.startsWith('casedesk-'))
) {
  console.warn(
    '[session] WARNING: SESSION_SECRET is unset or a known default. Set a long random SESSION_SECRET before real production use.'
  );
}

const SECRET_KEY = new TextEncoder().encode(process.env.SESSION_SECRET || FALLBACK_SECRET);

const COOKIE_NAME = 'casedesk_session';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
