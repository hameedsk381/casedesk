import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getCaseById } from '@/lib/cases/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { caseId, format } = await request.json();

    if (!caseId || !format) {
      return NextResponse.json({ error: 'Case ID and format required' }, { status: 400 });
    }

    const caseData = await getCaseById(caseId);
    if (!caseData) {
      return notFound('Case');
    }
    if (!hasWorkspaceAccess(user, caseData.workspaceId)) return forbidden();
    if (!canUserInWorkspace(user, caseData.workspaceId, 'create_content')) return insufficientPermissions('create_content');

    const ai = getAIProvider();
    const generated = await ai.generateContentFromCase(caseData, format);

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
