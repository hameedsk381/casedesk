import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getCurrentUser, canUserInWorkspace, getAccessibleWorkspaceIds, hasWorkspaceAccess } from '@/lib/auth/permissions';
import { unauthorized, forbidden, insufficientPermissions } from '@/lib/api/guards';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const body = await request.json();
    const { message, workspaceId } = body;
    const workspaceIds = await getAccessibleWorkspaceIds(user);
    const targetWorkspaceId = workspaceId || workspaceIds[0];
    if (!targetWorkspaceId || !hasWorkspaceAccess(user, targetWorkspaceId)) return forbidden();
    if (!canUserInWorkspace(user, targetWorkspaceId, 'edit_case')) return insufficientPermissions('edit_case');

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required for extraction' }, { status: 400 });
    }

    const ai = getAIProvider();
    const extracted = await ai.extractCaseFromMessage(message);

    return NextResponse.json(extracted);
  } catch (error: any) {
    console.error('AI extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract case information' }, { status: 500 });
  }
}
