import { NextResponse } from 'next/server';
import { checkPublicationSafety } from '@/lib/content/service';
import { getCurrentUser, hasWorkspaceAccess } from '@/lib/auth/permissions';
import { caseWorkspaceId, unauthorized, forbidden, notFound } from '@/lib/api/guards';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    const wsId = await caseWorkspaceId(caseId);
    if (!wsId) return notFound('Case');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const check = await checkPublicationSafety(caseId);
    return NextResponse.json(check);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Safety check failed' }, { status: 500 });
  }
}
