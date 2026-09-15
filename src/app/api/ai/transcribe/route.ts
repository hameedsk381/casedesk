import { NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ai = getAIProvider();
    const transcription = await ai.transcribeAudio(buffer, file.name);

    return NextResponse.json(transcription);
  } catch (error: any) {
    console.error('Audio transcribe error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
