import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { convertInboxToCase } from '@/lib/inbox/service';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body might be empty for default conversion
    }

    // Default workspace
    let workspaceId = body.workspaceId;
    if (!workspaceId) {
      const message = await prisma.inboxMessage.findUnique({ where: { id }, select: { workspaceId: true } });
      workspaceId = message?.workspaceId;
    }
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id;
    }

    const userId = user?.id || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id;

    if (!userId || !workspaceId) {
      return NextResponse.json({ error: 'Workspace or User not initialized' }, { status: 400 });
    }

    const newCase = await convertInboxToCase({
      messageId: id,
      userId,
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
