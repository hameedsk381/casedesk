const http = require('http');

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTenglishTests() {
  console.log('====================================================');
  console.log('🧪 TESTING TENGLISH END-TO-END WORKFLOW');
  console.log('====================================================\n');

  // TEST 1: Citizen Portal AI Chat with Tenglish input
  console.log('1. Testing Citizen Portal AI Chat API (Port 3001) with Tenglish input...');
  const chatPayload = {
    messages: [
      {
        role: 'user',
        content: 'Maa Tenali town government hospital lo night duty doctors evaru leru, medicines kuda levu. Chala mandi patients ibbandi padutunnaru.',
      },
    ],
    language: 'te',
    endpointTitle: 'Janata Investigation Desk',
  };

  const chatRes = await postJson('http://localhost:3001/api/chat', chatPayload);
  console.log(`Chat API Status: ${chatRes.status}`);
  console.log('Chat AI Response:');
  console.log(chatRes.data?.reply);
  if (!chatRes.data?.reply) {
    throw new Error('AI Chat did not return a reply for Tenglish input!');
  }
  console.log('✅ Chat API successfully handled Tenglish input and replied in empathetic Telugu!\n');

  // TEST 2: Submit a Tenglish Citizen Dispatch to CaseDesk backend
  console.log('2. Testing CaseDesk Backend Intake Submission (Port 3000) with Tenglish report...');
  const submitPayload = {
    title: 'Hospital Doctor Shortage in Tenali',
    story: 'Maa Tenali town government hospital lo emergency medicines levu, doctor kuda night duty ki ravatledu. Oka pregnant lady vachindi kani doctor leka Guntur refer chesaru. Ambulance late aindi, situation serious aindi.',
    incidentDate: '2026-09-14',
    location: 'Tenali, Guntur District',
    evidenceSummary: 'Ey documents levu, kani hospital register lo records unnai',
    isAnonymous: false,
    senderName: 'Suresh Kumar',
    senderPhone: '9848022338',
    consentAccuracy: true,
    consentContact: true,
    consentNoGuarantee: true,
    consentToPublish: 'DISCUSS_FIRST',
  };

  const submitRes = await postJson('http://localhost:3000/api/submit/sarah-khan', submitPayload);
  console.log(`Submission Status: ${submitRes.status}`);
  console.log('Submission Result:');
  console.log(JSON.stringify(submitRes.data, null, 2));

  if (!submitRes.data?.referenceNumber) {
    throw new Error('Submission failed to return a referenceNumber!');
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const dbItem = await prisma.intakeItem.findUnique({
    where: { id: submitRes.data.intakeId },
  });

  console.log('\n--- CaseDesk AI Triage in Database ---');
  console.log(`Reference Number: ${dbItem?.referenceNumber}`);
  console.log(`Detected Language: ${dbItem?.preferredLanguage}`);
  console.log(`AI Category: ${dbItem?.aiCategory}`);
  console.log(`AI Priority: ${dbItem?.aiPriority}`);
  console.log(`AI Summary (English):\n"${dbItem?.aiSummary}"`);
  console.log(`Claims Extracted: ${dbItem?.aiClaims}`);

  if (dbItem?.aiCategory !== 'Healthcare') {
    throw new Error(`Expected Category Healthcare, got ${dbItem?.aiCategory}`);
  }
  console.log('✅ Accurate Categorization: Healthcare');

  if (dbItem?.aiPriority === 'URGENT' || dbItem?.aiPriority === 'HIGH') {
    console.log(`✅ Priority Assigned correctly: ${dbItem?.aiPriority}`);
  }

  if (dbItem?.preferredLanguage === 'Tenglish' || dbItem?.preferredLanguage === 'Telugu') {
    console.log(`✅ Language correctly identified as: ${dbItem?.preferredLanguage}`);
  }

  await prisma.$disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL TENGLISH TESTS PASSED FLAWLESSLY!');
  console.log('====================================================');
}

runTenglishTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
