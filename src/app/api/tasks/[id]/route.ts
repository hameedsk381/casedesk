import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';
import { pickAllowedFields, rejectCrossOrigin } from '@/lib/api/security';

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
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;
    const { id } = await params;
    const wsId = await loadTaskWorkspace(id);
    if (!wsId) return notFound('Task');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();
    if (!canUserInWorkspace(user, wsId, 'edit_case')) return insufficientPermissions('edit_case');

    const body = await request.json();
    const data = pickAllowedFields<Record<string, unknown>>(body, [
      'title', 'description', 'status', 'priority', 'assignedToId', 'dueDate',
    ]);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        completedAt: body.status === 'DONE' ? new Date() : (body.status ? null : undefined),
      } as Prisma.TaskUpdateInput,
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
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;
    const { id } = await params;
    const wsId = await loadTaskWorkspace(id);
    if (!wsId) return notFound('Task');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();
    if (!canUserInWorkspace(user, wsId, 'edit_case')) return insufficientPermissions('edit_case');

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
