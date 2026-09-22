import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { requestInformationFromIntake } from '@/lib/intake/service';
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
    if (!canUserInWorkspace(user, item.workspaceId, 'edit_investigation')) return insufficientPermissions('edit_investigation');

    const body = await request.json();
    const requestedFields = body.requestedFields || [];
    const notes = body.notes || '';

    const updated = await requestInformationFromIntake(id, requestedFields, notes, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to request information:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request information' },
      { status: 500 }
    );
  }
}
