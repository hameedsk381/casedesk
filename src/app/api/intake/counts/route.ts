import { NextResponse } from 'next/server';
import { getIntakeCounts } from '@/lib/intake/service';
import { getCurrentUser, hasWorkspaceAccess, getAccessibleWorkspaceIds } from '@/lib/auth/permissions';
import { unauthorized, forbidden } from '@/lib/api/guards';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(user);
    if (accessibleWorkspaceIds.length === 0) {
      return NextResponse.json({});
    }

    const { searchParams } = new URL(request.url);
    let workspaceId = searchParams.get('workspaceId') || undefined;
    if (workspaceId) {
      if (!hasWorkspaceAccess(user, workspaceId)) return forbidden();
    } else {
      workspaceId = accessibleWorkspaceIds[0];
    }

    const counts = await getIntakeCounts(workspaceId);
    return NextResponse.json(counts);
  } catch (error: any) {
    console.error('Failed to get intake counts:', error);
    return NextResponse.json({ error: 'Failed to retrieve counts' }, { status: 500 });
  }
}
