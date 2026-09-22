import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { unauthorized, insufficientPermissions, forbidden, notFound } from '@/lib/api/guards';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const item = await prisma.verificationItem.findUnique({
      where: { id },
      select: { case: { select: { workspaceId: true } } },
    });
    if (!item) return notFound('Verification item');
    if (!hasWorkspaceAccess(user, item.case.workspaceId)) return forbidden();
    if (!canUserInWorkspace(user, item.case.workspaceId, 'edit_investigation')) return insufficientPermissions('edit_investigation');

    const body = await request.json();

    const updated = await prisma.verificationItem.update({
      where: { id },
      data: {
        ...body,
        verifiedById: body.status === 'VERIFIED' ? user.id : (body.status ? null : undefined),
        verifiedAt: body.status === 'VERIFIED' ? new Date() : (body.status ? null : undefined),
      },
      include: {
        verifiedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update verification item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const item = await prisma.verificationItem.findUnique({
      where: { id },
      select: { case: { select: { workspaceId: true } } },
    });
    if (!item) return notFound('Verification item');
    if (!hasWorkspaceAccess(user, item.case.workspaceId)) return forbidden();
    if (!canUserInWorkspace(user, item.case.workspaceId, 'edit_investigation')) return insufficientPermissions('edit_investigation');

    await prisma.verificationItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete verification item' }, { status: 500 });
  }
}
