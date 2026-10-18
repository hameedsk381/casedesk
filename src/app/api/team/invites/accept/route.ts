import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { validatePassword } from '@/lib/auth/signupPolicy';
import { findValidInvite, hashInviteToken } from '@/lib/team/invites';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

// Public: accepts an invitation. POST { token, password, name? }.
//  - New email: creates the account (name + a strong password); the email comes from the invite.
//  - Existing account: the password must match; the account joins the workspace.
export async function POST(request: Request) {
  try {
    const ipLimit = rateLimit(`invite-accept:${getClientIp(request)}`, 20, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    const invite = await findValidInvite(token);
    if (!invite) {
      return NextResponse.json({ error: 'This invitation is invalid, expired or already used.' }, { status: 400 });
    }

    // Throttle guessing the password of an existing account through its invite.
    const accountLimit = rateLimit(`invite-account:${invite.email}`, 10, 15 * 60 * 1000);
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(accountLimit.retryAfterSeconds) } }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    let user: { id: string; email: string; role: string; name: string };

    if (existing) {
      if (!(await verifyPassword(password, existing.passwordHash))) {
        return NextResponse.json({ error: 'That password is not correct for this account.' }, { status: 401 });
      }
      user = existing;
    } else {
      if (!name || name.length > 100) {
        return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
      }
      const passwordError = validatePassword(password);
      if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
      user = await prisma.user.create({
        data: { name, email: invite.email, passwordHash: await hashPassword(password), role: invite.role },
        select: { id: true, email: true, role: true, name: true },
      });
    }

    // Claim the invite atomically so a link cannot be used twice.
    const claimed = await prisma.workspaceInvite.updateMany({
      where: { id: invite.id, acceptedAt: null, tokenHash: hashInviteToken(token) },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ error: 'This invitation is invalid, expired or already used.' }, { status: 400 });
    }

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
      update: {},
      create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
    });

    await setSessionCookie(
      await createSessionToken({ userId: user.id, email: user.email, role: user.role, name: user.name })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invite accept error:', error);
    return NextResponse.json({ error: 'Could not accept the invitation' }, { status: 500 });
  }
}
