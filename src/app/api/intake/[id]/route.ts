import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { getIntakeItemById, updateIntakeReview } from '@/lib/intake/service';
import { unauthorized, forbidden, insufficientPermissions } from '@/lib/api/guards';
import { rejectCrossOrigin } from '@/lib/api/security';
import { eraseIntakeItem, ErasureError } from '@/lib/privacy/erasure';

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
    const item = await getIntakeItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Intake item not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, item.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Failed to get intake item:', error);
    return NextResponse.json({ error: 'Failed to retrieve item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const item = await getIntakeItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Intake item not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, item.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }
    if (!canUserInWorkspace(user, item.workspaceId, 'edit_case')) return insufficientPermissions('edit_case');

    const body = await request.json();
    const updated = await updateIntakeReview(id, body, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update intake review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

/**
 * Permanently erases a citizen report and its attachments (for reports that have
 * not become a case — erase the case otherwise). Irreversible, so the caller must
 * send the reference number as confirmation: { "confirm": "CD-IN-2026-00042" }.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const { id } = await params;
    const item = await getIntakeItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Intake item not found' }, { status: 404 });
    }
    if (!hasWorkspaceAccess(user, item.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }
    if (!canUserInWorkspace(user, item.workspaceId, 'delete_case')) return insufficientPermissions('delete_case');

    const body = await request.json().catch(() => ({}));
    if (!item.referenceNumber || body?.confirm !== item.referenceNumber) {
      return NextResponse.json(
        { error: 'Confirmation required: send the reference number as "confirm" to erase this report permanently.' },
        { status: 400 }
      );
    }

    const result = await eraseIntakeItem(id, user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof ErasureError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Failed to erase intake item:', error);
    return NextResponse.json({ error: 'Failed to erase report' }, { status: 500 });
  }
}
