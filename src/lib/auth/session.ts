import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const DEVELOPMENT_SECRET = 'local-development-only-casedesk-session-secret';
const MIN_SECRET_LENGTH = 32;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  const isWeak = !secret || secret.length < MIN_SECRET_LENGTH || secret.startsWith('casedesk-');

  if (isProduction && isWeak) {
    throw new Error(
      'SESSION_SECRET must be set to a long, random, non-default value in production.'
    );
  }

  return new TextEncoder().encode(secret || DEVELOPMENT_SECRET);
}

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
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
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
