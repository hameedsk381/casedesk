import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { getClientIp, hasExceededContentLength, rateLimit } from '@/lib/security';

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`transcribe:${getClientIp(request)}`, 10, 10 * 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many transcription requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
    if (hasExceededContentLength(request, 15 * 1024 * 1024)) return NextResponse.json({ error: 'Audio file is too large. Maximum 15 MB.' }, { status: 413 });
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    if (file.size === 0 || file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file is too large. Maximum 15 MB.' }, { status: 413 });
    }
    if (!['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'].includes(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'Unsupported audio file type.' }, { status: 415 });
    }

    if (!groq) {
      return NextResponse.json({
        text: 'Voice note recorded (Voice audio received by the helpdesk)',
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
