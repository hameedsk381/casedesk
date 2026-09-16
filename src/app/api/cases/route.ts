import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, getAccessibleWorkspaceIds, canUser } from '@/lib/auth/permissions';
import { listCases, createCase } from '@/lib/cases/service';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const category = searchParams.get('category') || undefined;
    const verificationStatus = searchParams.get('verificationStatus') || undefined;
    const assignedToId = searchParams.get('assignedToId') || undefined;
    const search = searchParams.get('search') || undefined;

    const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(user);
    if (accessibleWorkspaceIds.length === 0) {
      return NextResponse.json({ cases: [], total: 0 });
    }

    let workspaceId = searchParams.get('workspaceId') || undefined;
    if (workspaceId) {
      if (!hasWorkspaceAccess(user, workspaceId)) {
        return NextResponse.json({ error: 'Forbidden: Access denied to workspace' }, { status: 403 });
      }
    } else {
      workspaceId = accessibleWorkspaceIds[0];
    }

    const result = await listCases({
      workspaceId,
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canUser(user.role, 'create_case')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create case' }, { status: 403 });
    }

    const body = await request.json();

    let workspaceId = body.workspaceId;
    if (!workspaceId) {
      const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(user);
      workspaceId = accessibleWorkspaceIds[0];
    }

    if (!workspaceId || !hasWorkspaceAccess(user, workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to workspace' }, { status: 403 });
    }

    const createdById = user.id;

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
