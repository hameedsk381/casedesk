import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
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
