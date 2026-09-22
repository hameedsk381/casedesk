import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { archiveIntakeItem } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';
import { unauthorized, forbidden, insufficientPermissions, notFound } from '@/lib/api/guards';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const item = await prisma.intakeItem.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!item) return notFound('Intake item');
    if (!hasWorkspaceAccess(user, item.workspaceId)) return forbidden();
    if (!canUserInWorkspace(user, item.workspaceId, 'edit_case')) return insufficientPermissions('edit_case');

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

    const updated = await archiveIntakeItem(id, reason, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to archive intake item:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive intake item' },
      { status: 500 }
    );
  }
}
