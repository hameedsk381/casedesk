import path from 'path';

/**
 * Sanitizes a filename to prevent directory traversal and unexpected characters.
 */
export function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Turns a stored relative path into a safe storage key, or null if it is unsafe
 * (empty, absolute, containing "..", backslashes or NUL). Used by every storage
 * driver so traversal protection does not depend on which one is active.
 */
export function normaliseKey(relativePath: string): string | null {
  if (!relativePath) return null;
  const cleaned = relativePath
    .replace(/^(\/|\\)+/, '')
    .replace(/^uploads(\/|\\)+/i, '');
  if (!cleaned || cleaned.includes('\0') || cleaned.includes('\\')) return null;
  const segments = cleaned.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) return null;
  return segments.join('/');
}

/** Builds "<subDirectory>/<unique>_<safeName>" for a new upload. */
export function buildObjectKey(subDirectory: string | undefined, fileName: string): { key: string; safeName: string } {
  const subDir = subDirectory ? subDirectory.replace(/^(\/|\\)+/, '').replace(/\\/g, '/') : '';
  const safeName = sanitizeFileName(fileName);
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const finalName = `${uniquePrefix}_${safeName}`;
  return { key: subDir ? `${subDir}/${finalName}` : finalName, safeName };
}
