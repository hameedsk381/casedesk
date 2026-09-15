const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.log('No GROQ_API_KEY');
  process.exit(1);
}

const groq = new Groq({ apiKey });

const sampleDispatch = "Maa Tenali town lo government area hospital lo emergency medicines levu, doctor kuda night duty ki ravatledu. Ninna night oka pregnant lady vachindi, doctor leka Guntur refer chesaru kani ambulance leka late aindi. Officials patinchukovatledu.";

async function testTriage() {
  const prompt = `You are the chief AI triage editor for an investigative journalism newsroom in India (CaseDesk).
Your job is to analyze incoming citizen dispatches. Dispatches may be in English, Telugu Unicode script, or "Tenglish" (Telugu words written phonetically with English/Latin letters, e.g. "Maa oori hospital lo doctors leru", "Roads motham guntalu paddayi", "Bribe adugutunnaru").

You MUST:
1. Comprehend Tenglish phonetics with 100% accuracy.
2. In "normalizedEnglishSummary" and "summary", provide a clear, professional English journalistic summary of the citizen's complaint.
3. Categorize accurately (Healthcare, Civic Infrastructure, Government Services, Environment, Education, Police / Law Enforcement, Other).
4. Assign priority (URGENT, HIGH, MEDIUM, LOW) and justify it.
5. Identify district/town, claims, people, organizations, dates, missing information.
6. Set "language" to "Tenglish", "Telugu", or "English".

CITIZEN DISPATCH:
"""
${sampleDispatch}
"""

Language Hint: Tenglish

Analyze the text and return a VALID JSON object matching this schema:
{
  "summary": "1-2 sentence factual journalistic summary of the complaint",
  "normalizedEnglishSummary": "Complete English translation and structured summary",
  "category": "One of: Healthcare, Civic Infrastructure, Government Services, Environment, Education, Police / Law Enforcement, Other",
  "priority": "One of: URGENT, HIGH, MEDIUM, LOW",
  "priorityReason": "1-2 sentence editorial justification for why this priority was assigned",
  "location": "District, mandal/town, or landmark mentioned in dispatch",
  "claims": ["List of distinct verifiable claims made by the complainant"],
  "people": ["Names or roles of individuals mentioned"],
  "organizations": ["Departments, institutions, hospitals, or contractors mentioned"],
  "dates": ["Dates, timeframes, or deadlines mentioned"],
  "missingInformation": ["Crucial evidence or details needed to verify this story"],
  "suggestedAction": "One of: CREATE_CASE, REQUEST_INFORMATION, REVIEW, ARCHIVE",
  "language": "Tenglish, Telugu, or English"
}

Return ONLY the JSON object. No other text.`;

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: 'You are an expert investigative journalism editor and multilingual triage AI. Always respond in valid JSON.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1500,
  });

  console.log('TRIAGE JSON OUTPUT:');
  console.log(JSON.stringify(JSON.parse(completion.choices[0]?.message?.content || '{}'), null, 2));
}

testTriage().catch(console.error);
