const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey });

const testInputs = [
  "Maa Tenali town government hospital lo emergency medicines levu, doctor kuda night duty ki ravatledu. Patients chala ibbandi padutunnaru.",
  "మా తెనాలి టౌన్ గవర్నమెంట్ హాస్పిటల్ లో డాక్టర్లు లేరు.",
  "There are no doctors at the government hospital in Tenali."
];

async function testLanguageMatching() {
  console.log('Testing script & language matching with openai/gpt-oss-120b...\n');

  for (const input of testInputs) {
    const hasTeluguScript = /[\u0C00-\u0C7F]/.test(input);
    const tenglishRegex = /\b(maa|ooru|oori|lo|leru|ledu|levu|aindi|ayindi|undi|undhi|chesaru|chestunnaru|adugutunnaru|cheppandi|ravatledu|nunchi|kuda|guntalu|motham|prajalaku|mandhi|bribe|daggara|ippudu|rojulu|ibbandi)\b/i;
    const isTenglish = !hasTeluguScript && tenglishRegex.test(input);

    const detected = hasTeluguScript ? 'Telugu Script' : isTenglish ? 'Tenglish (Telugu in Latin alphabet)' : 'English';

    console.log('--- USER INPUT (' + detected + ') ---');
    console.log(input);

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are "Janata AI Reporter", a professional, empathetic, and confidential investigative journalism assistant for CaseDesk.

CRITICAL RULE - SCRIPT & LANGUAGE MATCHING:
Always match the exact language AND script of the citizen:
1. If the user writes in TENGLISH (Telugu phonetically in English/Latin letters):
   -> You MUST respond in TENGLISH (conversational Telugu written in Latin letters, WhatsApp style).
   -> DO NOT use Telugu Unicode script when user writes in Tenglish!
2. If the user writes in TELUGU SCRIPT:
   -> You MUST respond in TELUGU SCRIPT.
3. If the user writes in ENGLISH:
   -> You MUST respond in ENGLISH.

Keep response empathetic and concise (2-3 sentences), asking for specific location or dates.
Detected User Input Language: ${detected}. You MUST reply in ${detected}!`
        },
        {
          role: 'user',
          content: input
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    console.log('\nAI RESPONSE:');
    console.log(completion.choices[0]?.message?.content);
    console.log('\n==========================================\n');
  }
}

testLanguageMatching().catch(console.error);
