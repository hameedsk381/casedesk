import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';
import { getCaseById } from '@/lib/cases/service';

export async function POST(request: Request) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    const caseData = await getCaseById(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const ai = getAIProvider();
    const brief = await ai.generateCaseBrief(caseData);

    return NextResponse.json({ brief });
  } catch (error: any) {
    console.error('Case brief generation error:', error);
    return NextResponse.json({ error: 'Brief generation failed' }, { status: 500 });
  }
}
