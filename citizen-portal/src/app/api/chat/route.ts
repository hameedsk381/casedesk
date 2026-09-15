import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

const SYSTEM_PROMPT = `You are "Janata AI Reporter", a professional, empathetic, and confidential investigative journalism assistant for Janata Investigation Desk (CaseDesk) led by investigative journalist Sarah Khan in Andhra Pradesh and Telangana, India.

YOUR MISSION:
Help citizens and whistleblowers report civic issues, healthcare failures, public fund corruption, environmental dumping, and welfare denial in a safe, conversational manner.

TENGLISH (TELUGU IN ENGLISH SCRIPT) PROFICIENCY:
- In Andhra Pradesh & Telangana, the majority of citizens type in "Tenglish" (Telugu words written phonetically with English/Latin letters).
- Examples of Tenglish you will encounter:
  * "Maa oori hospital lo doctors leru, medicines kuda levu"
  * "Drinking water pipeline break aindi, 10 days nunchi water ravatledu"
  * "Guntur district chilakaluripet lo road motham damage aindi, guntalu paddayi"
  * "Collector office lo certificate ivvadaniki bribe adugutunnaru"
  * "Ration card apply chesaamu, kani officers reject chestunnaru"
  * "Pattadar passbook ivvadaniki Tahsildar office lo dabbulu adugutunnaru"
- You MUST fully comprehend Tenglish with zero friction.
- NEVER scold the user or ask them to switch scripts.

CRITICAL SCRIPT & LANGUAGE MATCHING RULE:
You MUST always reply in the EXACT SAME language and script that the citizen used:
1. If the user writes in TENGLISH (Telugu written using English/Latin alphabet, e.g. "Maa oori hospital lo doctors leru"):
   -> YOU MUST RESPOND IN TENGLISH (clean, natural, conversational Telugu written in English/Latin letters, WhatsApp style).
   -> DO NOT respond in Telugu Unicode script when the user wrote in Tenglish!
   -> Example Tenglish response:
      "Meeru cheppina hospital samasya chala serious ga undi. Ee incident ye mandal / district lo jarigindi? Doctors evaru night duty ki ravatledo cheppagalara? Mee daggara emanna photos unte share cheyandi, lekapoyina mee maate chaalu."
2. If the user writes in TELUGU SCRIPT (తెలుగు లిపి, e.g. "మా ఊరి ఆసుపత్రిలో డాక్టర్లు లేరు"):
   -> YOU MUST RESPOND IN TELUGU SCRIPT (తెలుగు లిపిలో మాత్రమే సమాధానం ఇవ్వండి).
3. If the user writes in ENGLISH:
   -> YOU MUST RESPOND IN ENGLISH.

GUIDELINES:
1. Empathy & Trust: Validate the citizen's experience. Be respectful, supportive, and reassuring about confidentiality.
2. Tone: Professional yet warm, like an attentive investigative reporter taking down notes on a field story.
3. Information Gathering (One step at a time, do not overwhelm):
   - Ask for: Location (District, Mandal, Town/Village, Landmark)
   - Specific details of what occurred (Who was involved, what was promised vs what happened)
   - Approximate dates or timeline
   - Whether they have any supporting documents, photos, or hospital/application receipts (remind them: "Even if you have no documents, your word is enough for our journalists to begin inquiry").
4. Source Anonymity: Reassure whistleblowers that they can remain completely anonymous.
5. Brevity: Keep responses concise (2 to 4 sentences maximum) so it feels like a WhatsApp conversation, not an essay.
6. Ready to submit: When you have gathered the basic facts (what happened and general location), summarize what you understood in 2 bullet points, and tell them they can click the "Submit Report" button or add more details.`;

interface ChatMessage {
  role: string;
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const language: string = body?.language || '';
    const endpointTitle: string = body?.endpointTitle || '';

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const hasTeluguScript = /[\u0C00-\u0C7F]/.test(lastUserMsg);

    const lower = lastUserMsg.toLowerCase();
    const englishWords = /\b(the|is|are|was|were|they|them|their|this|that|these|those|have|has|had|there|our|my|you|your|with|from|about|when|where|which|should|would|could|please|because|residents)\b/gi;
    const englishMatches = (lower.match(englishWords) || []).length;

    const tenglishMarkers = /\b(ma|maa|na|naa|mee|inti|illu|venaka|mundu|pakkana|colony|ooru|oori|chetta|neellu|neelu|pani|panulu|evaru|evvaru|enduku|yenduku|epudu|yepudu|ekkada|chala|kashtam|samasya|ibbandi|vallu|valla|chesina|pettina|chesaru|chesamu|chesanu|cheppandi|cheppanu|vestunnaru|adugutunnaru|pattichukovatledu|pattinchukovatledu|chudatledu|pettatledu|ravatledu|ivvatledu|ledu|ledhu|leru|levu|aindi|ayindi|undi|undhi|kuda|kooda|nunchi|nundi|daggara|ippudu|rojulu|repu|ninna|bribe|lancham|officers|officer|police|collector|tahsildar|tunnaru|tundi|tondi|atledu|vatledu|avtundi|avuthundi|cheyochu|cheyandi)\b/gi;
    const tenglishMatches = (lower.match(tenglishMarkers) || []).length;
    const verbalEndings = /(tunnaru|tundi|tondi|vatledu|katledu|kovatledu|atledu|ayindi|aindi|evaru|vallu|chesina|vestunna)\b/gi;
    const endingMatches = (lower.match(verbalEndings) || []).length;

    let targetLanguage = 'English';
    let isTenglish = false;

    if (hasTeluguScript) {
      targetLanguage = 'Telugu Script (తెలుగు లిపి)';
    } else if (tenglishMatches > 0 || endingMatches > 0 || (language === 'te' && englishMatches === 0)) {
      isTenglish = true;
      targetLanguage = 'Tenglish (Telugu phonetically in English/Latin letters, WhatsApp style)';
    } else if (englishMatches >= 2) {
      targetLanguage = 'English';
    } else {
      // Default fallback for Latin text: if language is Telugu or user has any regional phonetics, treat as Tenglish
      isTenglish = language === 'te';
      targetLanguage = isTenglish
        ? 'Tenglish (Telugu phonetically in English/Latin letters, WhatsApp style)'
        : 'English';
    }

    if (!groq) {
      // Fallback empathetic responses when API key is not configured
      let fallbackReply = '';
      const userCount = messages.filter((m) => m.role === 'user').length;

      if (isTenglish) {
        if (userCount === 1) {
          fallbackReply = 'Meeru cheppina issue chala serious ga undi. Ee incident ye district leda mandal lo jarigindi? Hospital leda office peru cheppagalara?';
        } else if (userCount === 2) {
          fallbackReply = 'Details ichinanduku thanks. Ee incident epudu jarigindi? Mee daggara emanna photos, complaint copies leda receipts unnaya? (Aadharalu lekapoyina parvaledu).';
        } else {
          fallbackReply = 'Meeru ichina details anni note chesamu. Kindha unna "Submit Report" button nokki mee dispatch ni newsroom ki secure ga pampochu.';
        }
      } else if (hasTeluguScript || language === 'te') {
        if (userCount === 1) {
          fallbackReply = 'మీరు తెలిపిన విషయం చాలా తీవ్రమైనది. ఈ సంఘటన ఏ జిల్లా లేదా మండలంలో జరిగింది? బాధితులకు సంబంధించిన వివరాలు లేదా ఆసుపత్రి/కార్యాలయం పేరు చెప్పగలరా?';
        } else if (userCount === 2) {
          fallbackReply = 'వివరాలు అందించినందుకు ధన్యవాదాలు. ఈ సంఘటన ఎప్పుడు జరిగింది? దీనికి సంబంధించి మీ వద్ద ఏవైనా ఫోటోలు, ఫిర్యాదు కాపీలు లేదా రశీదులు ఉన్నాయా? (ఆధారాలు లేకపోయినా పర్వాలేదు).';
        } else {
          fallbackReply = 'మీరు తెలిపిన వివరాలన్నీ పరిశీలించాము. మీ కథనం మా జర్నలిస్టుల దర్యాప్తుకు చాలా ఉపయోగపడుతుంది. మీరు కింద ఉన్న "సమర్పించండి" బటన్ నొక్కి మీ ఫిర్యాదును అధికారికంగా పంపవచ్చు.';
        }
      } else {
        if (userCount === 1) {
          fallbackReply = 'Thank you for sharing this. This sounds like an important public interest issue. Could you tell me which district or mandal this occurred in, and which office or hospital was involved?';
        } else if (userCount === 2) {
          fallbackReply = 'Understood. When did this take place? Do you have any photos, complaint receipts, or documents? (Remember, you can still submit even if you do not have documents).';
        } else {
          fallbackReply = 'I have gathered the key details of your report. You can now tap the "Submit Report" button below to transmit your dispatch securely to our investigative newsroom.';
        }
      }

      return NextResponse.json({
        reply: fallbackReply,
      });
    }

    const groqMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\nActive Newsroom Desk: ${endpointTitle || 'Janata Investigation Desk'}\nUSER INPUT SCRIPT DETECTED: ${targetLanguage}\nMANDATORY INSTRUCTION: The user wrote in ${targetLanguage}. You MUST reply directly in the SAME language and script (${targetLanguage}). If the user wrote in Tenglish, your response MUST be in Tenglish (English/Latin letters), never in Telugu script!`,
      },
      ...messages.slice(-10).map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content || '',
      })),
    ];

    let reply = '';
    try {
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 400,
      });
      reply = completion.choices[0]?.message?.content || '';
    } catch (primaryErr: any) {
      console.warn('Primary Groq model openai/gpt-oss-120b failed, trying openai/gpt-oss-20b:', primaryErr.message);
      const fallbackCompletion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: groqMessages,
        temperature: 0.3,
        max_tokens: 400,
      });
      reply = fallbackCompletion.choices[0]?.message?.content || '';
    }

    return NextResponse.json({
      reply,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
