import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getCaseById } from '@/lib/cases/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_case')) return insufficientPermissions('edit_case');

    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    const caseData = await getCaseById(caseId);
    if (!caseData) {
      return notFound('Case');
    }
    if (!hasWorkspaceAccess(user, caseData.workspaceId)) return forbidden();

    const ai = getAIProvider();
    const brief = await ai.generateCaseBrief(caseData);

    return NextResponse.json({ brief });
  } catch (error: any) {
    console.error('Case brief generation error:', error);
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 });
  }
}
