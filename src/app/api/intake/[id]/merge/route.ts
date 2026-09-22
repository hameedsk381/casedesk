import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { mergeIntakeWithCase } from '@/lib/intake/service';
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
    if (!body.targetCaseId) {
      return NextResponse.json({ error: 'targetCaseId is required to merge' }, { status: 400 });
    }

    const targetCase = await prisma.case.findUnique({ where: { id: body.targetCaseId }, select: { workspaceId: true } });
    if (!targetCase) return notFound('Case');
    if (targetCase.workspaceId !== item.workspaceId) return forbidden();

    const result = await mergeIntakeWithCase(id, body.targetCaseId, user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to merge intake with case:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge intake with case' },
      { status: 500 }
    );
  }
}
