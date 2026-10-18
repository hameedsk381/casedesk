/**
 * Exercises the Google Cloud Storage driver against a tiny in-process fake of the
 * GCS JSON API (no network, no credentials):
 *
 *   npx tsx scratch/test-gcs-driver.mts
 *
 * It only covers the calls the driver makes (upload, metadata, download, delete).
 * Do one real-bucket check on staging too — see the smoke-test notes.
 */
import http from 'http';
import { createHash } from 'crypto';
import type { AddressInfo } from 'net';
import { CRC32C } from '@google-cloud/storage';

const objects = new Map<string, { data: Buffer; contentType: string }>();
let lastPutCacheControl = '';

function readBody(req: http.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Real GCS returns checksums, and the client library verifies uploads against them.
function hashes(data: Buffer) {
  const crc = new CRC32C();
  crc.update(data);
  return { md5Hash: createHash('md5').update(data).digest('base64'), crc32c: crc.toString() };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const json = (status: number, body: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'POST' && url.pathname.startsWith('/upload/storage/v1/b/')) {
    const body = await readBody(req);
    const boundary = /boundary=(.+)$/.exec(req.headers['content-type'] || '')?.[1]?.replace(/"/g, '');
    if (!boundary) return json(400, { error: 'expected multipart' });
    const parts = body.toString('binary').split(`--${boundary}`).filter((p) => p.trim() && p.trim() !== '--');
    const [metaPart, dataPart] = parts;
    const meta = JSON.parse(metaPart.slice(metaPart.indexOf('\r\n\r\n') + 4).trim());
    const raw = dataPart.slice(dataPart.indexOf('\r\n\r\n') + 4).replace(/\r\n$/, '');
    lastPutCacheControl = meta.cacheControl || '';
    const objectName = url.searchParams.get('name') || meta.name; // the client sends the name in the query string
    objects.set(objectName, { data: Buffer.from(raw, 'binary'), contentType: meta.contentType || '' });
    return json(200, { name: objectName, bucket: 'test-bucket', size: String(raw.length), ...hashes(Buffer.from(raw, 'binary')) });
  }

  const match = /^(?:\/storage\/v1)?\/b\/[^/]+\/o\/(.+)$/.exec(url.pathname);
  if (match) {
    const name = decodeURIComponent(match[1]);
    const found = objects.get(name);
    if (req.method === 'DELETE') {
      if (!found) return json(404, { error: { code: 404, message: 'Not Found' } });
      objects.delete(name);
      res.writeHead(204);
      return res.end();
    }
    if (!found) return json(404, { error: { code: 404, message: 'Not Found' } });
    if (url.searchParams.get('alt') === 'media') {
      res.writeHead(200, { 'content-type': found.contentType || 'application/octet-stream' });
      return res.end(found.data);
    }
    return json(200, { name, bucket: 'test-bucket', size: String(found.data.length), ...hashes(found.data) });
  }

  json(404, { error: { code: 404, message: `unhandled ${req.method} ${url.pathname}` } });
});

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = (server.address() as AddressInfo).port;

process.env.STORAGE_EMULATOR_HOST = `http://127.0.0.1:${port}`;
process.env.GCS_BUCKET = 'test-bucket';
process.env.GCS_PREFIX = 'casedesk';

const { savePrivateUpload, privateFileExists, openPrivateFileStream, withPrivateFileOnDisk, deletePrivateFile, storageDriverName } =
  await import('../src/lib/storage');

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

try {
  check('driver is gcs', storageDriverName() === 'gcs');

  const content = Buffer.from('citizen attachment ✓ 2026');
  const saved = await savePrivateUpload({ buffer: content, subDirectory: 'submissions', fileName: 'my photo.png', contentType: 'image/png' });
  check('save returns a key under the subdirectory', saved.relativePath.startsWith('submissions/') && saved.relativePath.endsWith('my_photo.png'), saved.relativePath);
  check('object stored under the configured prefix', [...objects.keys()].some((k) => k === `casedesk/${saved.relativePath}`), [...objects.keys()].join(','));
  check('content type and no-store cache header sent', objects.get(`casedesk/${saved.relativePath}`)?.contentType === 'image/png' && lastPutCacheControl.includes('no-store'));

  check('exists is true after save', await privateFileExists(saved.relativePath));

  const stream = await openPrivateFileStream(saved.relativePath);
  const chunks: Buffer[] = [];
  if (stream) for await (const c of stream) chunks.push(Buffer.from(c as Buffer));
  check('stream returns the saved bytes', Buffer.concat(chunks).equals(content));

  const viaTemp = await withPrivateFileOnDisk(saved.relativePath, async (filePath) => {
    const fs = await import('fs');
    return { same: fs.readFileSync(filePath).equals(content), path: filePath };
  });
  const fsMod = await import('fs');
  check('temp file copy matches and is cleaned up', !!viaTemp?.same && !fsMod.existsSync(viaTemp.path));

  check('missing file: exists false, stream null, temp helper null',
    !(await privateFileExists('submissions/nope.png')) && (await openPrivateFileStream('submissions/nope.png')) === null &&
    (await withPrivateFileOnDisk('submissions/nope.png', async () => 1)) === null);

  const unsafe = ['../../secret', 'a/../../b', 'a/./b', 'a//b', 'a\\b', ''];
  const unsafeBlocked = (await Promise.all(unsafe.map((k) => privateFileExists(k)))).every((x) => x === false) &&
    (await Promise.all(unsafe.map((k) => deletePrivateFile(k)))).every((x) => x === false);
  check('unsafe keys are rejected before reaching the bucket', unsafeBlocked);

  check('delete removes the object', (await deletePrivateFile(saved.relativePath)) && !objects.has(`casedesk/${saved.relativePath}`));
  check('exists is false after delete', !(await privateFileExists(saved.relativePath)));
} finally {
  server.close();
}

console.log(failures === 0 ? '\nAll GCS driver checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
