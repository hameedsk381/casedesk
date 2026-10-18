import type { Readable } from 'stream';
import type { Bucket } from '@google-cloud/storage';
import { normaliseKey } from './keys';
import type { StorageDriver } from './types';

/**
 * Google Cloud Storage driver.
 *
 *   GCS_BUCKET                 bucket name (setting this turns the driver on)
 *   GCS_CREDENTIALS_BASE64     base64 of the service account JSON key
 *   GCS_PREFIX                 optional folder prefix inside the bucket, e.g. "casedesk"
 *
 * Give the service account only "Storage Object Admin" on this one bucket, and keep
 * the bucket private (uniform bucket-level access, no public access).
 */

let bucketPromise: Promise<Bucket> | null = null;

function getBucket(): Promise<Bucket> {
  if (bucketPromise) return bucketPromise;
  bucketPromise = (async () => {
    const bucketName = process.env.GCS_BUCKET;
    if (!bucketName) throw new Error('GCS_BUCKET is not set');

    const { Storage } = await import('@google-cloud/storage');
    const encoded = process.env.GCS_CREDENTIALS_BASE64;
    let storage;
    if (encoded) {
      let credentials;
      try {
        credentials = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
      } catch {
        throw new Error('GCS_CREDENTIALS_BASE64 is not valid base64-encoded JSON');
      }
      if (!credentials.client_email || !credentials.private_key) {
        throw new Error('GCS_CREDENTIALS_BASE64 is not a service account key (missing client_email/private_key)');
      }
      storage = new Storage({ projectId: credentials.project_id, credentials });
    } else {
      // Falls back to Application Default Credentials (attached service account, GOOGLE_APPLICATION_CREDENTIALS).
      storage = new Storage();
    }
    return storage.bucket(bucketName);
  })();
  // Do not cache a failed setup, so fixing the configuration does not need a restart.
  bucketPromise.catch(() => {
    bucketPromise = null;
  });
  return bucketPromise;
}

function objectName(key: string): string | null {
  const normalised = normaliseKey(key);
  if (!normalised) return null;
  const prefix = (process.env.GCS_PREFIX || '').replace(/^\/+|\/+$/g, '');
  return prefix ? `${prefix}/${normalised}` : normalised;
}

export const gcsDriver: StorageDriver = {
  name: 'gcs',

  async put(key, buffer, contentType) {
    const name = objectName(key);
    if (!name) throw new Error('Invalid storage key');
    const bucket = await getBucket();
    await bucket.file(name).save(Buffer.from(buffer), {
      resumable: false,
      contentType: contentType || 'application/octet-stream',
      // Served only through the authenticated download route, never cached publicly.
      metadata: { cacheControl: 'private, max-age=0, no-store' },
    });
  },

  async exists(key) {
    const name = objectName(key);
    if (!name) return false;
    const [exists] = await (await getBucket()).file(name).exists();
    return exists;
  },

  async openReadStream(key): Promise<Readable | null> {
    const name = objectName(key);
    if (!name) return null;
    const file = (await getBucket()).file(name);
    const [exists] = await file.exists();
    return exists ? file.createReadStream() : null;
  },

  async remove(key) {
    const name = objectName(key);
    if (!name) return false;
    try {
      await (await getBucket()).file(name).delete({ ignoreNotFound: true });
      return true;
    } catch (err) {
      console.error('Failed to delete GCS object:', err instanceof Error ? err.message : err);
      return false;
    }
  },

  async localPath() {
    return null;
  },
};
