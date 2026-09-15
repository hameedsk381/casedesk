import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { listCases, createCase } from '@/lib/cases/service';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const category = searchParams.get('category') || undefined;
    const verificationStatus = searchParams.get('verificationStatus') || undefined;
    const assignedToId = searchParams.get('assignedToId') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await listCases({
      status,
      priority,
      category,
      verificationStatus,
      assignedToId,
      search,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to list cases:', error);
    return NextResponse.json({ error: 'Failed to retrieve cases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    // Default workspace
    let workspaceId = body.workspaceId;
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id;
    }

    const createdById = user?.id || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id;

    if (!createdById || !workspaceId) {
      return NextResponse.json({ error: 'Workspace or user not initialized' }, { status: 400 });
    }

    const newCase = await createCase({
      workspaceId,
      createdById,
      title: body.title,
      summary: body.summary,
      category: body.category || 'Other',
      priority: body.priority || 'MEDIUM',
      location: body.location || 'Unspecified',
      sourceType: body.sourceType || 'TEXT',
      sourceText: body.sourceText,
      aiSummary: body.aiSummary,
      aiPriorityReason: body.aiPriorityReason,
      assignedToId: body.assignedToId || null,
      source: body.source,
      claims: body.claims,
    });

    return NextResponse.json(newCase);
  } catch (error: any) {
    console.error('Failed to create case:', error);
    return NextResponse.json({ error: error.message || 'Failed to create case' }, { status: 500 });
  }
}
