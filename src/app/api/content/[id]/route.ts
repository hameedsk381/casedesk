import { NextResponse } from 'next/server';
import { updateContentStatus } from '@/lib/content/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { unauthorized, insufficientPermissions, forbidden, notFound } from '@/lib/api/guards';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;

    const content = await prisma.content.findUnique({
      where: { id },
      select: { case: { select: { workspaceId: true } } },
    });
    if (!content) return notFound('Content');
    if (!hasWorkspaceAccess(user, content.case.workspaceId)) return forbidden();

    const body = await request.json();

    if (body.status === 'APPROVED') {
      if (!canUser(user.role, 'approve_content')) return insufficientPermissions('approve_content');
    } else if (body.status === 'PUBLISHED') {
      if (!canUser(user.role, 'publish_content')) return insufficientPermissions('publish_content');
    } else if (body.status) {
      if (!canUser(user.role, 'create_content')) return insufficientPermissions('create_content');
    }

    if (body.status) {
      const updated = await updateContentStatus(id, body.status, user.id);
      return NextResponse.json(updated);
    }

    if (!canUser(user.role, 'create_content')) return insufficientPermissions('create_content');

    const updated = await prisma.content.update({ where: { id }, data: body });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
