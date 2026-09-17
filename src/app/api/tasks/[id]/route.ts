import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

async function loadTaskWorkspace(id: string): Promise<string | null> {
  const task = await prisma.task.findUnique({
    where: { id },
    select: { case: { select: { workspaceId: true } } },
  });
  return task?.case.workspaceId ?? null;
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
    const wsId = await loadTaskWorkspace(id);
    if (!wsId) return notFound('Task');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const body = await request.json();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...body,
        completedAt: body.status === 'DONE' ? new Date() : (body.status ? null : undefined),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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
    const wsId = await loadTaskWorkspace(id);
    if (!wsId) return notFound('Task');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
