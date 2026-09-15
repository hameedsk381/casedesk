import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getCaseById } from '@/lib/cases/service';

export async function POST(request: Request) {
  try {
    const { caseId, format } = await request.json();

    if (!caseId || !format) {
      return NextResponse.json({ error: 'Case ID and format required' }, { status: 400 });
    }

    const caseData = await getCaseById(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const ai = getAIProvider();
    const generated = await ai.generateContentFromCase(caseData, format);

    return NextResponse.json(generated);
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
