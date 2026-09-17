import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { ignoreInboxMessage, restoreInboxMessage } from '@/lib/inbox/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, forbidden, insufficientPermissions } from '@/lib/api/guards';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const message = await prisma.inboxMessage.findUnique({
      where: { id },
      include: {
        convertedCase: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (!hasWorkspaceAccess(user, message.workspaceId)) return forbidden();

    return NextResponse.json(message);
  } catch (error: any) {
    console.error('Failed to get inbox message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const existing = await prisma.inboxMessage.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (!hasWorkspaceAccess(user, existing.workspaceId)) return forbidden();

    const body = await request.json();

    const allowedStatuses = ['UNPROCESSED', 'PROCESSED', 'IGNORED'];
    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await prisma.inboxMessage.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.aiSuggestedTitle ? { aiSuggestedTitle: body.aiSuggestedTitle } : {}),
        ...(body.aiSuggestedCategory ? { aiSuggestedCategory: body.aiSuggestedCategory } : {}),
        ...(body.aiSuggestedPriority ? { aiSuggestedPriority: body.aiSuggestedPriority } : {}),
        ...(body.aiSummary ? { aiSummary: body.aiSummary } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update inbox message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const existing = await prisma.inboxMessage.findUnique({
      where: { id },
      select: { workspaceId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (!hasWorkspaceAccess(user, existing.workspaceId)) return forbidden();

    await prisma.inboxMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete inbox message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
