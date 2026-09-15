import { NextResponse } from 'next/server';
import { checkPublicationSafety } from '@/lib/content/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 });
    }

    const check = await checkPublicationSafety(caseId);
    return NextResponse.json(check);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Safety check failed' }, { status: 500 });
  }
}
