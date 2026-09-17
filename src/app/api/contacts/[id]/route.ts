import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

async function loadContactWorkspace(id: string): Promise<string | null> {
  const contact = await prisma.contact.findUnique({
    where: { id },
    select: { case: { select: { workspaceId: true } } },
  });
  return contact?.case.workspaceId ?? null;
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
    const wsId = await loadContactWorkspace(id);
    if (!wsId) return notFound('Contact');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const body = await request.json();
    const updated = await prisma.contact.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
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
    const wsId = await loadContactWorkspace(id);
    if (!wsId) return notFound('Contact');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
