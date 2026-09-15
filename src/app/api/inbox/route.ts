import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { listInboxMessages, createInboxMessage } from '@/lib/inbox/service';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    let workspaceId = searchParams.get('workspaceId') || undefined;
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id;
    }

    const result = await listInboxMessages({
      workspaceId,
      status,
      channel,
      search,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to list inbox messages:', error);
    return NextResponse.json({ error: 'Failed to retrieve inbox messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let workspaceId = body.workspaceId;
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id;
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
    }

    if (!body.senderName || !body.rawText) {
      return NextResponse.json({ error: 'senderName and rawText are required' }, { status: 400 });
    }

    const message = await createInboxMessage({
      workspaceId,
      sourceChannel: body.sourceChannel || 'WEB_PORTAL',
      senderName: body.senderName,
      senderContact: body.senderContact,
      rawText: body.rawText,
      aiSuggestedTitle: body.aiSuggestedTitle,
      aiSuggestedCategory: body.aiSuggestedCategory,
      aiSuggestedPriority: body.aiSuggestedPriority,
      aiSummary: body.aiSummary,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create inbox message:', error);
    return NextResponse.json({ error: 'Failed to create inbox message' }, { status: 500 });
  }
}