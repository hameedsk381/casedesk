import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';
import { pickAllowedFields, rejectCrossOrigin } from '@/lib/api/security';

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
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;
    const { id } = await params;
    const wsId = await loadClaimWorkspace(id);
    if (!wsId) return notFound('Claim');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();
    if (!canUserInWorkspace(user, wsId, 'edit_case')) return insufficientPermissions('edit_case');

    const body = await request.json();
    const updated = await prisma.claim.update({
      where: { id },
      data: pickAllowedFields<Record<string, unknown>>(body, ['text', 'status', 'source', 'notes']) as Prisma.ClaimUpdateInput,
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
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;
    const { id } = await params;
    const wsId = await loadClaimWorkspace(id);
    if (!wsId) return notFound('Claim');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();
    if (!canUserInWorkspace(user, wsId, 'edit_case')) return insufficientPermissions('edit_case');

    await prisma.claim.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete claim' }, { status: 500 });
  }
}
