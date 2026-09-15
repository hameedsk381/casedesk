import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { listIntakeItems, createIntakeItem } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const sourceType = searchParams.get('sourceType') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const category = searchParams.get('category') || undefined;
    const language = searchParams.get('language') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'priority' | 'newest') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    let workspaceId = searchParams.get('workspaceId') || undefined;
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id;
    }

    const result = await listIntakeItems({
      workspaceId,
      status,
      sourceType,
      priority,
      category,
      language,
      search,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to list intake items:', error);
    return NextResponse.json({ error: 'Failed to retrieve intake items' }, { status: 500 });
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

    const user = await getCurrentUser();

    const item = await createIntakeItem({
      workspaceId,
      sourceType: body.sourceType || 'WEB_FORM',
      senderName: body.senderName,
      senderPhone: body.senderPhone,
      senderEmail: body.senderEmail,
      preferredLanguage: body.preferredLanguage,
      rawText: body.rawText,
      transcription: body.transcription,
      attachments: body.attachments,
      assignedToId: user?.id,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create intake item:', error);
    return NextResponse.json({ error: 'Failed to create intake item' }, { status: 500 });
  }
}
