import fs from 'fs';
import path from 'path';
import type { Readable } from 'stream';
import { normaliseKey } from './keys';
import type { StorageDriver } from './types';

// Private storage directory — outside public/ so files are never served directly.
// Statically scoped to <cwd>/uploads so build-time file tracing stays narrow
// (an env-derived base would force Turbopack to trace the whole project).
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

function resolveKey(key: string): string | null {
  const normalised = normaliseKey(key);
  if (!normalised) return null;
  const resolved = path.resolve(UPLOAD_BASE_DIR, normalised);
  const relative = path.relative(UPLOAD_BASE_DIR, resolved);
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    console.warn(`Path traversal attempt blocked: ${key}`);
    return null;
  }
  return resolved;
}

export const localDriver: StorageDriver = {
  name: 'local',

  async put(key, buffer) {
    const target = resolveKey(key);
    if (!target) throw new Error('Invalid storage key');
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, buffer);
  },

  async exists(key) {
    const target = resolveKey(key);
    return !!target && fs.existsSync(target);
  },

  async openReadStream(key): Promise<Readable | null> {
    const target = resolveKey(key);
    if (!target || !fs.existsSync(target)) return null;
    return fs.createReadStream(/*turbopackIgnore: true*/ target);
  },

  async remove(key) {
    const target = resolveKey(key);
    if (!target) return false;
    if (!fs.existsSync(target)) return true;
    try {
      await fs.promises.unlink(target);
      return true;
    } catch (err) {
      console.error('Failed to delete private file:', err);
      return false;
    }
  },

  async localPath(key) {
    const target = resolveKey(key);
    return target && fs.existsSync(target) ? target : null;
  },
};
