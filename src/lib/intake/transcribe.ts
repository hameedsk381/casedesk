export interface TranscriptionResult {
  transcript: string;
  durationEstimate: number; // in seconds
  languageDetected: 'Telugu' | 'English' | 'Other';
}

export async function transcribeAudio(
  fileName: string,
  bufferOrText?: Buffer | string
): Promise<TranscriptionResult> {
  const lowerName = fileName.toLowerCase();

  // Realistic mock transcripts based on audio file context
  if (lowerName.includes('telugu') || lowerName.includes('voice_memo_telugu')) {
    return {
      transcript:
        'నమస్కారం సార్, మేము తెనాలి రూరల్ నుండి మాట్లాడుతున్నాము. ఇక్కడ మార్కెట్ యార్డులో ధాన్యం బస్తాకు 5 కేజీలు తేమ పేరుతో అనధికారికంగా కట్ చేస్తున్నారు. అధికారులు ఎవరూ స్పందించడం లేదు. దయచేసి విచారించండి.',
      durationEstimate: 85,
      languageDetected: 'Telugu',
    };
  }

  if (lowerName.includes('hospital') || lowerName.includes('paderu') || lowerName.includes('icu')) {
    return {
      transcript:
        'Namaskaram akka, I am speaking from Paderu agency tribal belt. 108 emergency ambulance service has been halted because the district medical officer canceled fuel vendor payments. Yesterday a pregnant woman was carried on a wooden doli for 12 kilometers through forest hills. Both mother and infant are in emergency ward now.',
      durationEstimate: 154,
      languageDetected: 'English',
    };
  }

  return {
    transcript:
      'Audio recording received from citizen hotline. Voice dispatch describes civic infrastructure dispute and requesting newsroom intervention.',
    durationEstimate: 92,
    languageDetected: 'English',
  };
}
