import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { isMailConfigured, sendWelcomeEmail } from '@/lib/mailer';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Throttle account creation: 5 signups per hour per IP
    const rl = rateLimit(`signup:${getClientIp(request)}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Get default workspace or create one
    let defaultWorkspace = await prisma.workspace.findFirst();
    if (!defaultWorkspace) {
      defaultWorkspace = await prisma.workspace.create({
        data: {
          name: `${name}'s Desk`,
          slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-desk',
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'RESEARCHER',
        workspaceMembers: {
          create: {
            workspaceId: defaultWorkspace.id,
            role: 'RESEARCHER',
          },
        },
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await setSessionCookie(token);

    // Send welcome email (fire-and-forget, never blocks signup)
    if (isMailConfigured()) {
      sendWelcomeEmail({ name: user.name, email: user.email }).catch((err) =>
        console.error('[signup] Welcome email failed:', err?.message || err)
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
