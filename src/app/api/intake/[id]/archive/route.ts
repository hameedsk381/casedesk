import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { archiveIntakeItem } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const userId = user?.id || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id || '';

    const body = await request.json();
    const reason = body.reason || 'OTHER';

    const validReasons = [
      'SPAM',
      'OUT_OF_SCOPE',
      'DUPLICATE',
      'INSUFFICIENT_INFORMATION',
      'NOT_RELEVANT',
      'OTHER',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${validReasons.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await archiveIntakeItem(id, reason, userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to archive intake item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive intake item' },
      { status: 500 }
    );
  }
}
