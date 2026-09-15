import Groq from 'groq-sdk';
import fs from 'fs';

const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey
  ? new Groq({
      apiKey,
    })
  : null;

/**
 * Best-Suited Groq Model Matrix:
 * 1. TRIAGE & CLAIMS: OpenAI GPT-OSS 120B (Deep reasoning, 500 tps, handles Telugu & English)
 * 2. FAST CLASSIFICATION: OpenAI GPT-OSS 20B (Ultra-fast duplicate scoring & classification)
 * 3. AUDIO TRANSCRIPTION: Whisper Large V3 Turbo (Fast, multilingual speech-to-text, 400 RPM)
 * 4. INVESTIGATIVE REASONING: OpenAI GPT-OSS 120B (Journalistic workflow strategy)
 */
export const GROQ_MODELS = {
  TRIAGE: 'openai/gpt-oss-120b',
  FAST_CLASSIFIER: 'openai/gpt-oss-20b',
  AUDIO_TRANSCRIPTION: 'whisper-large-v3-turbo',
  INVESTIGATIVE_REASONING: 'openai/gpt-oss-120b',
} as const;

export interface GroqTriageOutput {
  summary: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priorityReason: string;
  location: string;
  claims: string[];
  people: string[];
  organizations: string[];
  dates: string[];
  missingInformation: string[];
  suggestedAction: 'CREATE_CASE' | 'REQUEST_INFORMATION' | 'REVIEW' | 'POSSIBLE_DUPLICATE' | 'ARCHIVE';
  language: 'Telugu' | 'English' | 'Tenglish' | 'Other';
  normalizedEnglishSummary: string;
}

/**
 * 1. Editorial Triage & Claims Extraction using Llama 3.3 70B Versatile / GPT-OSS 120B
 */
export async function triageWithGroq(
  text: string,
  detectedLanguage: string
): Promise<GroqTriageOutput | null> {
  if (!groq) return null;

  try {
    const prompt = `You are the chief AI triage editor for an investigative journalism newsroom in India (CaseDesk).
Your job is to analyze incoming citizen dispatches, categorize them, assess their investigative urgency, extract core verifiable claims and entities, and provide an English translation summary.

CITIZEN DISPATCH LANGUAGE HANDLING:
Dispatches may be in:
1. English
2. Telugu Unicode script (e.g. మా ఊరిలో ఆసుపత్రి సమస్య)
3. Tenglish (Telugu phonetically transliterated with English/Latin letters, e.g. "Maa oori hospital lo doctors leru", "Drinking water pipeline break aindi 10 days nunchi", "Tahsildar office lo bribe adugutunnaru", "Road motham guntalu paddayi").

You MUST:
1. Accurately interpret Tenglish phonetics into its true Telugu meaning.
2. In "normalizedEnglishSummary" and "summary", provide a clean, professional, journalistic English translation and summary of the grievance.
3. Categorize accurately into: Healthcare, Civic Infrastructure, Government Services, Environment, Education, Police / Law Enforcement, Other.
4. If original text was in Tenglish, set "language" to "Tenglish". If in Telugu script, set "language" to "Telugu". If English, set "language" to "English".

CITIZEN DISPATCH:
"""
${text}
"""

Language Hint: ${detectedLanguage}

Analyze the text and return a VALID JSON object matching this schema:
{
  "summary": "1-2 sentence factual journalistic summary of the complaint in English",
  "normalizedEnglishSummary": "Complete English translation and structured summary",
  "category": "One of: Healthcare, Civic Infrastructure, Government Services, Environment, Education, Police / Law Enforcement, Other",
  "priority": "One of: URGENT, HIGH, MEDIUM, LOW",
  "priorityReason": "1-2 sentence editorial justification for why this priority was assigned (e.g., active health hazard, public fund diversion, time-sensitive victim safety)",
  "location": "District, mandal/town, or landmark mentioned in dispatch",
  "claims": ["List of distinct verifiable claims made by the complainant"],
  "people": ["Names or roles of individuals mentioned (politicians, doctors, victims, officials)"],
  "organizations": ["Departments, institutions, hospitals, or contractors mentioned"],
  "dates": ["Dates, timeframes, or deadlines mentioned"],
  "missingInformation": ["Crucial evidence or details needed to verify this story (e.g. application slip, FIR copy, photo of damage, official response)"],
  "suggestedAction": "One of: CREATE_CASE, REQUEST_INFORMATION, REVIEW, ARCHIVE",
  "language": "One of: Tenglish, Telugu, English, Other"
}

Return ONLY the JSON object. No other text.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.TRIAGE,
      messages: [
        {
          role: 'system',
          content: 'You are an expert investigative journalism editor and multilingual triage AI. Always respond in valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as GroqTriageOutput;
  } catch (error) {
    console.error('Groq AI Triage Error:', error);
    return null;
  }
}

/**
 * 2. Voice Note Audio Transcription using Whisper Large V3 Turbo
 */
export async function transcribeAudioWithGroq(
  filePath: string,
  language?: 'te' | 'en'
): Promise<string | null> {
  if (!groq || !fs.existsSync(filePath)) return null;

  try {
    const fileStream = fs.createReadStream(filePath);
    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: GROQ_MODELS.AUDIO_TRANSCRIPTION,
      language: language,
      response_format: 'verbose_json',
      temperature: 0.0,
    });

    return transcription.text || null;
  } catch (error) {
    console.error('Groq Whisper Transcription Error:', error);
    return null;
  }
}

/**
 * 3. High-Speed Duplicate Detection using Llama 3.1 8B Instant (560 tps)
 */
export async function checkDuplicateWithGroq(
  dispatchText: string,
  candidateCases: Array<{ id: string; caseNumber: string; title: string; summary: string }>
): Promise<{ isDuplicate: boolean; matchedCaseId?: string; confidence: number; reasoning: string } | null> {
  if (!groq || candidateCases.length === 0) return null;

  try {
    const prompt = `Assess whether this new citizen dispatch is describing the SAME underlying incident or corruption case as any of the existing open cases.

NEW DISPATCH:
"""
${dispatchText}
"""

EXISTING CASES:
${candidateCases.map((c) => `- Case [${c.caseNumber}] (ID: ${c.id}): ${c.title} — ${c.summary}`).join('\n')}

Return JSON:
{
  "isDuplicate": true or false,
  "matchedCaseId": "ID of matched case if duplicate, otherwise null",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief 1 sentence reason"
}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.FAST_CLASSIFIER,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.0,
      max_tokens: 200,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch (error) {
    console.error('Groq Fast Duplicate Check Error:', error);
    return null;
  }
}

/**
 * 4. Context-Aware Operational Next Action Engine using Llama 3.3 70B Versatile
 */
export async function generateNextActionWithGroq(caseContext: {
  title: string;
  summary: string;
  category: string;
  status: string;
  claims: string[];
  evidenceCount: number;
}): Promise<string | null> {
  if (!groq) return null;

  try {
    const prompt = `You are the managing editor of an investigative journalism desk.
Given this active case context:
- Title: ${caseContext.title}
- Summary: ${caseContext.summary}
- Category: ${caseContext.category}
- Status: ${caseContext.status}
- Verified Claims: ${caseContext.claims.join(', ')}
- Evidence Items on file: ${caseContext.evidenceCount}

What is the single most urgent, concrete operational next action the journalist should take today?
(e.g., "Request response from District Medical Officer on ventilator logs", "File RTI regarding 2025 tender allocation", "Verify hospital discharge summary").
Respond with only the action string in 6-12 words.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.INVESTIGATIVE_REASONING,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 60,
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq Next Action Error:', error);
    return null;
  }
}
