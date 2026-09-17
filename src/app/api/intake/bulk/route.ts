import { NextResponse } from 'next/server';
import { getCurrentUser, canUser } from '@/lib/auth/permissions';
import { bulkArchiveIntake, bulkAssignIntake, bulkMarkReviewed } from '@/lib/intake/service';
import { unauthorized, insufficientPermissions } from '@/lib/api/guards';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_case')) return insufficientPermissions('edit_case');

    const body = await request.json();
    const { action, ids, reason, assignedToId } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    if (action === 'ARCHIVE') {
      const result = await bulkArchiveIntake(ids, reason || 'OTHER', user.id);
      return NextResponse.json({ success: true, count: result.count });
    } else if (action === 'ASSIGN') {
      if (!assignedToId) {
        return NextResponse.json({ error: 'assignedToId is required for ASSIGN action' }, { status: 400 });
      }
      const result = await bulkAssignIntake(ids, assignedToId, user.id);
      return NextResponse.json({ success: true, count: result.count });
    } else if (action === 'MARK_REVIEWED') {
      const result = await bulkMarkReviewed(ids, user.id);
      return NextResponse.json({ success: true, count: result.count });
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to perform bulk action:', error);
    return NextResponse.json(
      { error: error.message || 'Bulk action failed' },
      { status: 500 }
    );
  }
}
