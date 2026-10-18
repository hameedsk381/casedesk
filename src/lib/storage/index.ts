import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Readable } from 'stream';
import { buildObjectKey, normaliseKey, sanitizeFileName } from './keys';
import { localDriver } from './local';
import { gcsDriver } from './gcs';
import type { StorageDriver } from './types';

export { sanitizeFileName };

/**
 * Private file storage facade. Files go to Google Cloud Storage when GCS_BUCKET is
 * set, otherwise to the local uploads directory (development / single-host).
 * Callers only deal in relative keys like "submissions/<id>_<name>".
 */
let announced = false;

function driver(): StorageDriver {
  const active = process.env.GCS_BUCKET ? gcsDriver : localDriver;
  if (!announced) {
    announced = true;
    console.log(`[storage] Using ${active.name === 'gcs' ? `Google Cloud Storage bucket "${process.env.GCS_BUCKET}"` : 'local disk storage'}`);
  }
  return active;
}

export function storageDriverName(): 'local' | 'gcs' {
  return driver().name;
}

/** Saves a file under a subdirectory and returns its storage key. */
export async function savePrivateUpload(params: {
  buffer: Buffer | Uint8Array;
  subDirectory?: string;
  fileName: string;
  contentType?: string;
}): Promise<{ relativePath: string; fileName: string; size: number }> {
  const { key, safeName } = buildObjectKey(params.subDirectory, params.fileName);
  await driver().put(key, params.buffer, params.contentType);
  return { relativePath: key, fileName: safeName, size: params.buffer.length };
}

export async function privateFileExists(relativePath: string): Promise<boolean> {
  const key = normaliseKey(relativePath);
  return key ? driver().exists(key) : false;
}

/** A readable stream of the file, or null if it does not exist. */
export async function openPrivateFileStream(relativePath: string): Promise<Readable | null> {
  const key = normaliseKey(relativePath);
  return key ? driver().openReadStream(key) : null;
}

/** Deletes a file. True when it is gone (deleted now or already missing); false if the delete failed. */
export async function deletePrivateFile(relativePath: string): Promise<boolean> {
  const key = normaliseKey(relativePath);
  return key ? driver().remove(key) : false;
}

/**
 * Runs `fn` with a real file path for tools that need one (e.g. audio upload for
 * transcription). Local files are used in place; remote ones are copied to a
 * temporary file that is always removed afterwards. Returns null if the file is missing.
 */
export async function withPrivateFileOnDisk<T>(
  relativePath: string,
  fn: (filePath: string) => Promise<T>
): Promise<T | null> {
  const key = normaliseKey(relativePath);
  if (!key) return null;
  const active = driver();

  const existing = await active.localPath(key);
  if (existing) return fn(existing);

  const stream = await active.openReadStream(key);
  if (!stream) return null;

  const tempPath = path.join(os.tmpdir(), `casedesk-${randomUUID()}${path.extname(key)}`);
  try {
    await new Promise<void>((resolve, reject) => {
      const out = fs.createWriteStream(tempPath, { mode: 0o600 });
      stream.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => resolve());
      stream.pipe(out);
    });
    return await fn(tempPath);
  } finally {
    await fs.promises.unlink(tempPath).catch(() => {});
  }
}

/** Adapts a Node stream to a web ReadableStream for Response bodies. */
export function toWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}
