import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { updateContentStatus } from '@/lib/content/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { unauthorized, insufficientPermissions, forbidden, notFound } from '@/lib/api/guards';
import { pickAllowedFields, rejectCrossOrigin } from '@/lib/api/security';

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

    const content = await prisma.content.findUnique({
      where: { id },
      select: { case: { select: { workspaceId: true } } },
    });
    if (!content) return notFound('Content');
    if (!hasWorkspaceAccess(user, content.case.workspaceId)) return forbidden();

    const body = await request.json();

    if (body.status === 'APPROVED') {
      if (!canUserInWorkspace(user, content.case.workspaceId, 'approve_content')) return insufficientPermissions('approve_content');
    } else if (body.status === 'PUBLISHED') {
      if (!canUserInWorkspace(user, content.case.workspaceId, 'publish_content')) return insufficientPermissions('publish_content');
    } else if (body.status) {
      if (!canUserInWorkspace(user, content.case.workspaceId, 'create_content')) return insufficientPermissions('create_content');
    }

    if (body.status) {
      const updated = await updateContentStatus(id, body.status, user.id);
      return NextResponse.json(updated);
    }

    if (!canUserInWorkspace(user, content.case.workspaceId, 'create_content')) return insufficientPermissions('create_content');

    const updated = await prisma.content.update({
      where: { id },
      data: pickAllowedFields<Record<string, unknown>>(body, ['type', 'title', 'body']) as Prisma.ContentUpdateInput,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
