const http = require('http');

function postChat(content, language = 'te') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messages: [{ role: 'user', content }],
      language,
      endpointTitle: 'Janata Investigation Desk',
    });

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyAll() {
  console.log('--- 1. TESTING USER EXACT TENGLISH SENTENCE ---');
  const userRes = await postChat(
    'ma inti venaka ma colony vallu chetta vestunnaru . compliant chesina evaru pattichukovatledu',
    'en'
  );
  console.log('AI Reply:\n', userRes.reply);
  const hasTeluguInReply0 = /[\u0C00-\u0C7F]/.test(userRes.reply);
  const isEnglishReply0 = /\b(the|there|hospital|we have received|could you tell me|please share)\b/i.test(userRes.reply);
  if (hasTeluguInReply0 || isEnglishReply0) {
    console.error('❌ FAIL: Expected Tenglish (Latin alphabet, Telugu words)!');
    process.exit(1);
  } else {
    console.log('✅ PASS: AI replied in Tenglish to user exact sentence (even when UI was on "en")!\n');
  }

  console.log('--- 2. TESTING HOSPITAL TENGLISH INPUT ---');
  const tenglishRes = await postChat(
    'Maa Tenali town government hospital lo emergency medicines levu, doctor kuda night duty ki ravatledu.'
  );
  console.log('AI Reply:\n', tenglishRes.reply);
  const hasTeluguInReply1 = /[\u0C00-\u0C7F]/.test(tenglishRes.reply);
  if (hasTeluguInReply1) {
    console.error('❌ FAIL: Expected Tenglish (Latin alphabet), but got Telugu Unicode script!');
    process.exit(1);
  } else {
    console.log('✅ PASS: AI replied in Tenglish (Latin letters matching user input)!\n');
  }

  console.log('--- 2. TESTING TELUGU SCRIPT INPUT ---');
  const teluguRes = await postChat(
    'మా తెనాలి టౌన్ ప్రభుత్వ ఆసుపత్రిలో అత్యవసర మందులు లేవు, డాక్టర్లు కూడా నైట్ డ్యూటీకి రావట్లేదు.'
  );
  console.log('AI Reply:\n', teluguRes.reply);
  const hasTeluguInReply2 = /[\u0C00-\u0C7F]/.test(teluguRes.reply);
  if (!hasTeluguInReply2) {
    console.error('❌ FAIL: Expected Telugu Unicode script, but got Latin script!');
    process.exit(1);
  } else {
    console.log('✅ PASS: AI replied in Telugu script matching user input!\n');
  }

  console.log('--- 3. TESTING ENGLISH INPUT ---');
  const englishRes = await postChat(
    'The government hospital in Tenali lacks emergency medicines and doctors on night shift.',
    'en'
  );
  console.log('AI Reply:\n', englishRes.reply);
  const hasTeluguInReply3 = /[\u0C00-\u0C7F]/.test(englishRes.reply);
  if (hasTeluguInReply3) {
    console.error('❌ FAIL: Expected English, but got Telugu script!');
    process.exit(1);
  } else {
    console.log('✅ PASS: AI replied in English matching user input!\n');
  }

  console.log('🎉 ALL SCRIPT & LANGUAGE MATCHING VERIFICATIONS PASSED!');
}

verifyAll().catch(console.error);
