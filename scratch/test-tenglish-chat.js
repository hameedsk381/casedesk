const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.log('No GROQ_API_KEY found in process.env');
  process.exit(1);
}

const groq = new Groq({ apiKey });

const testTenglishInputs = [
  "Maa Tenali town lo government hospital lo emergency medicines levu, doctor kuda night duty ki ravatledu. Patients chala ibbadi padutunnaru.",
  "Guntur district chilakaluripet mandal lo main road motham guntalu paddayi, drinking water pipeline break aindi 2 weeks nunchi dirty water vastondi.",
  "Maa mandal Tahsildar office lo pattadar passbook ivvadaniki 25000 bribe adugutunnaru, ivvakapothe delay chestunnaru."
];

async function runTest() {
  console.log('Testing Groq with Tenglish inputs using openai/gpt-oss-120b...\n');

  for (const input of testTenglishInputs) {
    console.log('--- USER TENGLISH INPUT ---');
    console.log(input);

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are "Janata AI Reporter", a professional, empathetic, and confidential investigative journalism assistant for CaseDesk in Andhra Pradesh and Telangana.
Citizens frequently write in "Tenglish" (Telugu words written using English/Latin alphabet).
You MUST understand Tenglish seamlessly. Reply in warm, empathetic Telugu script (with familiar words), asking for specific missing details (exact location/dates/documents) in 2-3 sentences. Do NOT ask them to change their script.`
        },
        {
          role: 'user',
          content: input
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    console.log('\nAI RESPONSE (Telugu):');
    console.log(completion.choices[0]?.message?.content);
    console.log('\n==========================================\n');
  }
}

runTest().catch(console.error);
