import { NextResponse } from 'next/server';
import { globalSearch } from '@/lib/search/service';
import { getCurrentUser, hasWorkspaceAccess, getAccessibleWorkspaceIds } from '@/lib/auth/permissions';
import { unauthorized, forbidden } from '@/lib/api/guards';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const accessibleWorkspaceIds = await getAccessibleWorkspaceIds(user);
    if (accessibleWorkspaceIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    let workspaceId = accessibleWorkspaceIds[0];
    const requestedWorkspaceId = searchParams.get('workspaceId');
    if (requestedWorkspaceId) {
      if (!hasWorkspaceAccess(user, requestedWorkspaceId)) return forbidden();
      workspaceId = requestedWorkspaceId;
    }

    const results = await globalSearch(q, workspaceId);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
