import { NextResponse } from 'next/server';
import { createResponseRequest } from '@/lib/investigation/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { caseWorkspaceId, unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_investigation')) return insufficientPermissions('edit_investigation');

    const body = await request.json();

    const wsId = await caseWorkspaceId(body.caseId);
    if (!wsId) return notFound('Case');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const req = await createResponseRequest({
      caseId: body.caseId,
      contactId: body.contactId,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      method: body.method,
      notes: body.notes,
    });
    return NextResponse.json(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to request response' }, { status: 500 });
  }
}
