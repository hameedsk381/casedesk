const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });

function detectCitizenInputLanguage(text) {
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return 'Telugu Script';
  }

  const lower = text.toLowerCase();
  const englishWords = /\b(the|is|are|was|were|they|them|their|this|that|these|those|have|has|had|there|our|my|you|your|with|from|about|when|where|which|should|would|could|please|because|hospital|residents|people)\b/gi;
  const englishMatches = (lower.match(englishWords) || []).length;

  const tenglishMarkers = /\b(ma|maa|na|naa|mee|inti|illu|venaka|mundu|pakkana|colony|ooru|oori|chetta|neellu|neelu|pani|panulu|evaru|evvaru|enduku|yenduku|epudu|yepudu|ekkada|chala|kashtam|samasya|ibbandi|vallu|valla|chesina|pettina|chesaru|chesamu|chesanu|cheppandi|cheppanu|vestunnaru|adugutunnaru|pattichukovatledu|pattinchukovatledu|chudatledu|pettatledu|ravatledu|ivvatledu|ledu|ledhu|leru|levu|aindi|ayindi|undi|undhi|kuda|kooda|nunchi|nundi|daggara|ippudu|rojulu|repu|ninna|bribe|lancham|officers|officer|police|collector|tahsildar|tunnaru|tundi|tondi|atledu|vatledu|avtundi|avuthundi|cheyochu|cheyandi)\b/gi;
  const tenglishMatches = (lower.match(tenglishMarkers) || []).length;

  const verbalEndings = /(tunnaru|tundi|tondi|vatledu|katledu|kovatledu|atledu|ayindi|aindi|evaru|vallu|chesina|vestunna)\b/gi;
  const endingMatches = (lower.match(verbalEndings) || []).length;

  if (tenglishMatches > 0 || endingMatches > 0) {
    return 'Tenglish (Telugu in English/Latin letters)';
  }

  if (englishMatches >= 2) {
    return 'English';
  }

  return 'Tenglish (Telugu in English/Latin letters)';
}

const userSentence = "ma inti venaka ma colony vallu chetta vestunnaru . compliant chesina evaru pattichukovatledu";

async function testPrompt() {
  const detected = detectCitizenInputLanguage(userSentence);
  console.log('DETECTED LANGUAGE FOR USER SENTENCE:', detected);

  const prompt = `You are "Janata AI Reporter", an empathetic and confidential investigative journalism assistant for CaseDesk.

CRITICAL SCRIPT & LANGUAGE MATCHING RULE:
The user wrote their message in: ${detected}.
1. If user wrote in TENGLISH:
   -> YOU MUST RESPOND IN TENGLISH (clean conversational Telugu written in English/Latin letters, WhatsApp style).
   -> UNDER NO CIRCUMSTANCES should you respond in English or Telugu Unicode script!
   -> Example: "Meeru cheppina problem chala ibbandi ga untundi. Ee colony ye area / town lo undi? Evariki complaint chesaru? Mee daggara photos unte pampandi."
2. If user wrote in TELUGU SCRIPT:
   -> YOU MUST RESPOND IN TELUGU SCRIPT.
3. If user wrote in ENGLISH:
   -> YOU MUST RESPOND IN ENGLISH.

MANDATORY: Reply strictly in ${detected}! Keep it to 2-3 sentences.`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userSentence }
    ],
    temperature: 0.2,
    max_tokens: 300,
  });

  console.log('\nAI RESPONSE:');
  console.log(completion.choices[0]?.message?.content);
  const hasTeluguUnicode = /[\u0C00-\u0C7F]/.test(completion.choices[0]?.message?.content);
  console.log('Has Telugu Unicode script in reply?:', hasTeluguUnicode);
}

testPrompt().catch(console.error);
