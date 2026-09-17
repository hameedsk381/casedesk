import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { getIntakeItemById, updateIntakeReview } from '@/lib/intake/service';
import { unauthorized, forbidden, insufficientPermissions } from '@/lib/api/guards';

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
    if (!canUser(user.role, 'edit_case')) return insufficientPermissions('edit_case');

    const { id } = await params;
    const item = await getIntakeItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Intake item not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, item.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updateIntakeReview(id, body, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update intake review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
