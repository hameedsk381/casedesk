import type { Readable } from 'stream';

/** A place private files are kept. Keys are relative paths like "submissions/123_file.png". */
export interface StorageDriver {
  name: 'local' | 'gcs';
  put(key: string, buffer: Buffer | Uint8Array, contentType?: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  openReadStream(key: string): Promise<Readable | null>;
  /** True when the file no longer exists (deleted now or already gone); false if the delete failed. */
  remove(key: string): Promise<boolean>;
  /** An on-disk path when the driver already has one (local), otherwise null. */
  localPath(key: string): Promise<string | null>;
}
