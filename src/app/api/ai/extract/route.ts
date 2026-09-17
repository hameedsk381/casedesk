import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getCurrentUser, canUser } from '@/lib/auth/permissions';
import { unauthorized, insufficientPermissions } from '@/lib/api/guards';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_case')) return insufficientPermissions('edit_case');

    const { message } = await request.json();

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
