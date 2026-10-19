import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/permissions';
import { rejectCrossOrigin } from '@/lib/api/security';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

/** Updates the signed-in user's own profile (currently just their display name). */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (name.length > 120) {
      return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
