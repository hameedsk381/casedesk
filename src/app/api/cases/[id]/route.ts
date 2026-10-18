import { NextResponse } from 'next/server';
import { getCaseById, updateCase } from '@/lib/cases/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { pickAllowedFields, rejectCrossOrigin } from '@/lib/api/security';
import { eraseCase, ErasureError } from '@/lib/privacy/erasure';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const caseRecord = await getCaseById(id);

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, caseRecord.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    return NextResponse.json(caseRecord);
  } catch (error: any) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const { id } = await params;
    const caseRecord = await getCaseById(id);
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, caseRecord.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    if (!canUserInWorkspace(user, caseRecord.workspaceId, 'edit_case')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to edit case' }, { status: 403 });
    }

    const body = await request.json();
    const data = pickAllowedFields<Record<string, unknown>>(body, [
      'title', 'summary', 'category', 'priority', 'status', 'location', 'sourceType',
      'sourceText', 'aiSummary', 'aiPriorityReason', 'verificationStatus',
      'publicationStatus', 'resolutionStatus', 'nextAction', 'healthStatus',
      'healthReason', 'assignedToId', 'publishedAt', 'resolvedAt',
    ]);
    const updated = await updateCase(id, data, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: error.message || 'Failed to update case' }, { status: 500 });
  }
}

/**
 * Permanently erases a case, its linked citizen reports and every stored file
 * (attachments and evidence). Irreversible, so the caller must send the case
 * number as confirmation: DELETE with body { "confirm": "CD-2026-00001" }.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const { id } = await params;
    const caseRecord = await getCaseById(id);
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    if (!hasWorkspaceAccess(user, caseRecord.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }
    if (!canUserInWorkspace(user, caseRecord.workspaceId, 'delete_case')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete case' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== caseRecord.caseNumber) {
      return NextResponse.json(
        { error: 'Confirmation required: send the case number as "confirm" to erase this case permanently.' },
        { status: 400 }
      );
    }

    const result = await eraseCase(id, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof ErasureError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error erasing case:', error);
    return NextResponse.json({ error: 'Failed to erase case' }, { status: 500 });
  }
}
