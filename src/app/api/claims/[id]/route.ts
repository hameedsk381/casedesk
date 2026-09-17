import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

async function loadClaimWorkspace(id: string): Promise<string | null> {
  const claim = await prisma.claim.findUnique({
    where: { id },
    select: { case: { select: { workspaceId: true } } },
  });
  return claim?.case.workspaceId ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_case')) return insufficientPermissions('edit_case');

    const { id } = await params;
    const wsId = await loadClaimWorkspace(id);
    if (!wsId) return notFound('Claim');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const body = await request.json();
    const updated = await prisma.claim.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_case')) return insufficientPermissions('edit_case');

    const { id } = await params;
    const wsId = await loadClaimWorkspace(id);
    if (!wsId) return notFound('Claim');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    await prisma.claim.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete claim' }, { status: 500 });
  }
}
