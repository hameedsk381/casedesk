import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { convertInboxToCase } from '@/lib/inbox/service';
import prisma from '@/lib/db/prisma';
import { unauthorized, insufficientPermissions, forbidden, notFound } from '@/lib/api/guards';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'create_case')) return insufficientPermissions('create_case');

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body might be empty for default conversion
    }

    const message = await prisma.inboxMessage.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!message) return notFound('Message');

    const workspaceId = body.workspaceId || message.workspaceId;
    if (!hasWorkspaceAccess(user, workspaceId)) return forbidden();

    const newCase = await convertInboxToCase({
      messageId: id,
      userId: user.id,
      workspaceId,
      title: body.title,
      category: body.category,
      priority: body.priority,
      location: body.location,
      assignedToId: body.assignedToId,
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error('Failed to convert inbox message to case:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert message to case' },
      { status: 500 }
    );
  }
}
