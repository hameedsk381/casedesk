import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!groq) {
      return NextResponse.json({
        text: 'Voice note recorded (Voice audio received by Janata Investigation Desk)',
        duration: 0,
        isDemo: true,
      });
    }

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3-turbo',
      language: language === 'te' ? 'te' : undefined,
      response_format: 'verbose_json',
      temperature: 0.0,
    });

    return NextResponse.json({
      text: transcription.text || '',
      duration: (transcription as any).duration || 0,
    });
  } catch (error: any) {
    console.error('Groq Whisper Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
