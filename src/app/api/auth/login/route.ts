import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// Real bcrypt hash of a throwaway value; only used to equalise timing for unknown emails.
const dummyHash = hashPassword(randomUUID());

export async function POST(request: Request) {
  try {
    // Throttle brute-force attempts: 10 attempts per 15 minutes per IP
    const rl = rateLimit(`login:${getClientIp(request)}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const normalisedEmail = email.toLowerCase().trim();

    // Per-account throttle on top of the per-IP one, so a distributed guesser
    // cannot hammer a single account.
    const accountLimit = rateLimit(`login-email:${normalisedEmail}`, 10, 15 * 60 * 1000);
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(accountLimit.retryAfterSeconds) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalisedEmail },
    });

    if (!user) {
      // Spend the same time as a real check so response timing does not reveal which emails exist.
      await verifyPassword(password, await dummyHash);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
