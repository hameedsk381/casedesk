#!/usr/bin/env node
/**
 * Checks a Google Cloud Storage setup from your own machine — the key never has to
 * leave it and is never printed unless you ask for the base64 form.
 *
 *   # Test a key file against a bucket (writes, reads and deletes one tiny object)
 *   node scripts/check-gcs.mjs --key-file ./service-account.json --bucket my-bucket
 *
 *   # Print the one-line base64 value to paste into Dokploy as GCS_CREDENTIALS_BASE64
 *   node scripts/check-gcs.mjs --key-file ./service-account.json --print-base64
 *
 *   # Test what is already in the environment / .env (GCS_BUCKET, GCS_CREDENTIALS_BASE64, GCS_PREFIX)
 *   node scripts/check-gcs.mjs
 *
 * Never commit the key file. After copying the base64 value into Dokploy, delete the file.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

try {
  process.loadEnvFile?.('.env'); // does not override variables that are already set
} catch {
  // no .env file
}

function fail(message) {
  console.error(`check-gcs: ${message}`);
  process.exit(1);
}

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--print-base64') args.printBase64 = true;
  else if (arg === '--key-file' || arg === '--bucket' || arg === '--prefix') {
    const value = process.argv[++i];
    if (!value || value.startsWith('--')) fail(`${arg} needs a value`);
    args[arg.slice(2)] = value;
  } else fail(`unknown option "${arg}"`);
}

let credentials;
let base64;
if (args['key-file']) {
  let raw;
  try {
    raw = readFileSync(args['key-file'], 'utf8');
  } catch (error) {
    fail(`cannot read ${args['key-file']}: ${error.code || error.message}`);
  }
  try {
    credentials = JSON.parse(raw);
  } catch {
    fail('the key file is not valid JSON — download the JSON key (not P12) from the service account');
  }
  base64 = Buffer.from(JSON.stringify(credentials)).toString('base64');
} else if (process.env.GCS_CREDENTIALS_BASE64) {
  try {
    credentials = JSON.parse(Buffer.from(process.env.GCS_CREDENTIALS_BASE64, 'base64').toString('utf8'));
  } catch {
    fail('GCS_CREDENTIALS_BASE64 is not valid base64-encoded JSON');
  }
}

if (credentials) {
  if (credentials.type !== 'service_account' || !credentials.client_email || !credentials.private_key) {
    fail('this is not a service account key (it needs type "service_account", client_email and private_key)');
  }
  console.log(`Service account: ${credentials.client_email}`);
  console.log(`Project:         ${credentials.project_id || '(none in key)'}`);
}

if (args.printBase64) {
  if (!base64) fail('--print-base64 needs --key-file');
  console.log('\nGCS_CREDENTIALS_BASE64 (one line — paste into Dokploy, treat as a password):\n');
  console.log(base64);
  console.log('\nThen delete the key file from this computer.');
  process.exit(0);
}

const bucketName = args.bucket || process.env.GCS_BUCKET;
if (!bucketName) fail('no bucket given — use --bucket <name> or set GCS_BUCKET');
const prefix = (args.prefix ?? process.env.GCS_PREFIX ?? '').replace(/^\/+|\/+$/g, '');

const { Storage } = await import('@google-cloud/storage');
const storage = credentials ? new Storage({ projectId: credentials.project_id, credentials }) : new Storage();
const bucket = storage.bucket(bucketName);

let problems = 0;
const ok = (message) => console.log(`✅ ${message}`);
const bad = (message) => {
  problems++;
  console.log(`❌ ${message}`);
};
const note = (message) => console.log(`ℹ️  ${message}`);

const name = `${prefix ? `${prefix}/` : ''}_check/${randomUUID()}.txt`;
const content = `casedesk storage check ${new Date().toISOString()}`;
const file = bucket.file(name);

try {
  await file.save(content, { resumable: false, contentType: 'text/plain' });
  ok('can write to the bucket');
  const [exists] = await file.exists();
  exists ? ok('can see the object it wrote') : bad('wrote an object but cannot see it');
  const [downloaded] = await file.download();
  downloaded.toString() === content ? ok('can read it back, content matches') : bad('read back different content');
} catch (error) {
  const code = error?.code;
  if (code === 403) bad('permission denied — the service account needs "Storage Object Admin" on this bucket');
  else if (code === 404) bad(`bucket "${bucketName}" was not found — check the name`);
  else if (code === 401 || /invalid_grant|invalid.*key|Could not load the default credentials/i.test(String(error?.message))) {
    bad('the credentials were rejected — the key may be disabled/deleted, or no key was provided');
  } else bad(`unexpected error: ${error?.message || error}`);
} finally {
  try {
    await file.delete({ ignoreNotFound: true });
    ok('can delete (test object removed)');
  } catch (error) {
    bad(`cannot delete the test object (${error?.code || error?.message}) — erasing reports would fail`);
  }
}

// Bucket-level settings need extra permission (storage.buckets.get); skip quietly without it.
try {
  const [metadata] = await bucket.getMetadata();
  const publicPrevention = metadata.iamConfiguration?.publicAccessPrevention;
  const uniform = metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled;
  publicPrevention === 'enforced' ? ok('public access prevention is enforced') : bad(`public access prevention is "${publicPrevention || 'not set'}" — turn it on so nothing can be made public`);
  uniform ? ok('uniform bucket-level access is on') : bad('uniform bucket-level access is off — turn it on');
  const softDelete = metadata.softDeletePolicy?.retentionDurationSeconds;
  if (softDelete !== undefined && Number(softDelete) > 0) {
    bad(`soft delete keeps deleted files for ${Math.round(Number(softDelete) / 86400)} day(s) — erased reports stay recoverable that long. Set it to 0, or say so in your privacy notice`);
  } else {
    ok('soft delete retention is 0 (erased files are gone immediately)');
  }
  if (metadata.versioning?.enabled) bad('object versioning is on — erased files would be kept as old versions. Turn it off');
  note(`bucket location: ${metadata.location}`);
} catch (error) {
  if (error?.code === 403) note('skipped bucket-setting checks (the service account may not read bucket settings; check them in the Cloud console)');
  else note(`skipped bucket-setting checks (${error?.message || error})`);
}

console.log(problems === 0 ? '\nAll checks passed.' : `\n${problems} problem(s) found.`);
process.exit(problems === 0 ? 0 : 1);
