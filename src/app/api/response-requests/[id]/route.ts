import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { updateResponseRequestStatus } from '@/lib/investigation/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_investigation')) return insufficientPermissions('edit_investigation');

    const { id } = await params;
    const existing = await prisma.responseRequest.findUnique({
      where: { id },
      select: { case: { select: { workspaceId: true } } },
    });
    if (!existing) return notFound('Response request');
    if (!hasWorkspaceAccess(user, existing.case.workspaceId)) return forbidden();

    const body = await request.json();

    const updated = await updateResponseRequestStatus(id, {
      status: body.status,
      responseText: body.responseText,
      notes: body.notes,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update response request' }, { status: 500 });
  }
}
