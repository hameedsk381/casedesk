#!/usr/bin/env node
/**
 * Post-deploy smoke test for a staging (or production) deployment.
 *
 *   PORTAL_URL=https://portal.example.org node scripts/smoke-test.mjs
 *
 * Environment
 *   PORTAL_URL           required — public citizen portal
 *   SLUG                 submission endpoint slug (default: NEXT_PUBLIC_DEFAULT_SLUG or janata-investigation-desk)
 *   STAFF_URL            optional — staff workspace; expects /login to load
 *   PUBLIC_CASEDESK_URL  optional — the API-only instance; expects the staff app to answer 404
 *   CASEDESK_URL         optional — where /api/cron/escalate lives (needed with CRON_SECRET)
 *   CRON_SECRET          optional — verifies the escalation endpoint rejects/accepts correctly
 *
 * WARNING: this submits a real test report (marked "[SMOKE TEST]") into the
 * deployment's database. Delete it from the staff app afterwards. It makes three
 * submissions, so it uses 3 of the 5 allowed per 10 minutes from your IP.
 */

const portal = (process.env.PORTAL_URL || '').replace(/\/$/, '');
if (!portal) {
  console.error('smoke-test: set PORTAL_URL, e.g. PORTAL_URL=https://portal.example.org');
  process.exit(2);
}
const slug = process.env.SLUG || process.env.NEXT_PUBLIC_DEFAULT_SLUG || 'janata-investigation-desk';
const staff = (process.env.STAFF_URL || '').replace(/\/$/, '');
const publicCaseDesk = (process.env.PUBLIC_CASEDESK_URL || '').replace(/\/$/, '');
const caseDesk = (process.env.CASEDESK_URL || '').replace(/\/$/, '');
const cronSecret = process.env.CRON_SECRET || '';

// 1x1 transparent PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

let failures = 0;
const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push(['PASS', name, detail || '']);
  } catch (error) {
    failures++;
    results.push(['FAIL', name, error instanceof Error ? error.message : String(error)]);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(url, init) {
  return fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20_000), ...init });
}

function reportForm({ consent = true, file } = {}) {
  const form = new FormData();
  form.set('slug', slug);
  form.set('story', '[SMOKE TEST] Automated launch check — please ignore and delete this report.');
  form.set('district', 'Test District');
  form.set('town', 'Test Town');
  form.set('isAnonymous', 'true');
  form.set('consentAccuracy', String(consent));
  form.set('consentNoGuarantee', String(consent));
  form.set('consentContact', 'false');
  form.set('consentToPublish', 'NO');
  if (file) form.append('files', file.blob, file.name);
  return form;
}

let referenceNumber = '';

await check('portal home loads', async () => {
  const res = await get(`${portal}/`);
  expect(res.status === 200, `status ${res.status}`);
});

await check('security headers on the portal', async () => {
  const res = await get(`${portal}/`);
  expect(res.headers.get('x-content-type-options') === 'nosniff', 'missing X-Content-Type-Options');
  expect(res.headers.get('content-security-policy'), 'missing Content-Security-Policy');
  if (portal.startsWith('https://')) expect(res.headers.get('strict-transport-security'), 'missing HSTS over https');
});

await check('privacy notice loads', async () => {
  const res = await get(`${portal}/privacy`);
  expect(res.status === 200, `status ${res.status}`);
  const html = await res.text();
  expect(/privacy|గోప్యతా/i.test(html), 'page has no privacy text');
  expect(/mailto:/.test(html), 'no contact email shown — set PRIVACY_CONTACT_EMAIL');
});

await check('public accountability tracker loads', async () => {
  const res = await get(`${portal}/accountability`);
  expect(res.status === 200, `status ${res.status}`);
});

await check(`submission endpoint "${slug}" exists and is active`, async () => {
  const res = await get(`${portal}/api/submit/${encodeURIComponent(slug)}`);
  expect(res.status === 200, `status ${res.status} (run the admin bootstrap so the endpoint exists)`);
  const data = await res.json();
  expect(data?.endpoint?.slug === slug, 'unexpected endpoint payload');
});

await check('submission without consent is rejected (400)', async () => {
  const res = await get(`${portal}/api/submit/${encodeURIComponent(slug)}`, { method: 'POST', body: reportForm({ consent: false }) });
  expect(res.status === 400, `status ${res.status}`);
});

await check('disguised file is rejected (415)', async () => {
  const fake = { blob: new Blob(['not really a pdf'], { type: 'application/pdf' }), name: 'fake.pdf' };
  const res = await get(`${portal}/api/submit/${encodeURIComponent(slug)}`, { method: 'POST', body: reportForm({ file: fake }) });
  expect(res.status === 415, `status ${res.status}`);
});

await check('valid report with an image is accepted (201)', async () => {
  const image = { blob: new Blob([PNG], { type: 'image/png' }), name: 'smoke.png' };
  const res = await get(`${portal}/api/submit/${encodeURIComponent(slug)}`, { method: 'POST', body: reportForm({ file: image }) });
  expect(res.status === 201, `status ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  referenceNumber = data.referenceNumber;
  expect(/^CD-IN-\d{4}-\d{5}$/.test(referenceNumber), `bad reference number "${referenceNumber}"`);
  return referenceNumber;
});

await check('tracking lookup finds the new report', async () => {
  expect(referenceNumber, 'no reference number from the previous step');
  const res = await get(`${portal}/api/submit/status?ref=${encodeURIComponent(referenceNumber)}`);
  expect(res.status === 200, `status ${res.status}`);
  const data = await res.json();
  expect(data.ref === referenceNumber, 'reference mismatch');
});

await check('unknown tracking reference returns 404', async () => {
  const res = await get(`${portal}/api/submit/status?ref=CD-IN-1999-00001`);
  expect(res.status === 404, `status ${res.status}`);
});

await check('public feed returns real counts', async () => {
  const res = await get(`${portal}/api/submit/public`);
  expect(res.status === 200, `status ${res.status}`);
  const data = await res.json();
  expect(typeof data?.overall?.received === 'number', 'no overall counts');
  expect(data.overall.received >= 1, 'received count did not include the test report');
  return `received=${data.overall.received}`;
});

await check('ward lookup reports availability', async () => {
  const res = await get(`${portal}/api/submit/ward`);
  expect(res.status === 200, `status ${res.status}`);
  const data = await res.json();
  expect(typeof data.available === 'boolean', 'no availability flag');
  return data.available ? 'ward boundaries loaded' : 'no ward boundaries loaded (button hidden)';
});

await check('QR code generator works', async () => {
  const res = await get(`${portal}/api/qr?ward=1&municipality=Smoke%20Test`);
  expect(res.status === 200, `status ${res.status} (set PUBLIC_PORTAL_URL on the portal)`);
  expect((res.headers.get('content-type') || '').includes('svg'), 'not an SVG');
});

await check('path traversal through the proxy is refused', async () => {
  const res = await get(`${portal}/api/submit/..%2Fhealth`);
  expect(res.status === 404, `status ${res.status}`);
});

if (staff) {
  await check('staff workspace login page loads', async () => {
    const res = await get(`${staff}/login`);
    expect(res.status === 200, `status ${res.status}`);
  });
}

if (publicCaseDesk) {
  await check('staff app is hidden on the public API instance', async () => {
    for (const p of ['/login', '/app', '/api/auth/me']) {
      const res = await get(`${publicCaseDesk}${p}`);
      expect(res.status === 404, `${p} returned ${res.status}, expected 404`);
    }
  });
}

if (cronSecret && caseDesk) {
  await check('escalation endpoint rejects a missing/wrong secret', async () => {
    const res = await get(`${caseDesk}/api/cron/escalate`, { method: 'POST', headers: { Authorization: 'Bearer wrong' } });
    expect(res.status === 401, `status ${res.status}`);
  });
  await check('escalation endpoint runs with the right secret', async () => {
    const res = await get(`${caseDesk}/api/cron/escalate`, { method: 'POST', headers: { Authorization: `Bearer ${cronSecret}` } });
    expect(res.status === 200, `status ${res.status}`);
    const data = await res.json();
    return `checked=${data.checked} escalated=${data.escalated}`;
  });
}

console.log('');
for (const [status, name, detail] of results) {
  console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}
console.log(`\n${results.length - failures}/${results.length} checks passed.`);

console.log(`
Manual steps (staff workspace) — tick each one:
  [ ] Sign in at the staff URL with the admin account
  [ ] Find the "[SMOKE TEST]" report${referenceNumber ? ` (${referenceNumber})` : ''} in the intake inbox and open its attachment
  [ ] Create a case from it, set its ward, and add an authority contact
  [ ] Create a response request for the authority and mark it as requested
  [ ] Set consent to publish and publish the case; confirm it shows on /accountability with the authority chip
  [ ] Backdate the request 8 days in the database, run the escalation endpoint, confirm a follow-up task and notification appear
  [ ] Mark the response received; confirm the tracker shows "Replied in N days"
  [ ] Delete the test case and report
`);

process.exit(failures === 0 ? 0 : 1);
