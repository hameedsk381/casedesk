import fs from 'fs';
import path from 'path';

// Private storage directory - completely outside public/ to prevent direct unauthenticated HTTP access.
// Statically scoped to <cwd>/uploads so build-time file tracing stays narrow
// (an env-derived base would force Turbopack to trace the whole project).
export const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

/**
 * Ensures a directory exists synchronously or creates it recursively.
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Sanitizes a filename to prevent directory traversal and unexpected characters.
 */
export function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Safely resolves a relative storage path to an absolute path.
 * Protects against directory traversal (e.g. ../../etc/passwd).
 */
export function getPrivateFilePath(relativePath: string): string | null {
  if (!relativePath) return null;

  // Strip any leading slashes or 'uploads/' prefix if present
  const cleaned = relativePath
    .replace(/^(\/|\\)+/, '')
    .replace(/^uploads(\/|\\)+/i, '');

  const resolved = path.resolve(UPLOAD_BASE_DIR, cleaned);

  // Security check: ensure resolved path is within UPLOAD_BASE_DIR. Comparing
  // path prefixes is unsafe (e.g. "uploads-archive" starts with "uploads").
  const relativeToUploadDir = path.relative(UPLOAD_BASE_DIR, resolved);
  if (
    relativeToUploadDir === '' ||
    relativeToUploadDir === '..' ||
    relativeToUploadDir.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToUploadDir)
  ) {
    console.warn(`Path traversal attempt blocked: ${relativePath}`);
    return null;
  }

  return fs.existsSync(resolved) ? resolved : null;
}

/**
 * Saves a Buffer or Uint8Array into private storage under a specific subdirectory.
 */
export async function savePrivateUpload(params: {
  buffer: Buffer | Uint8Array;
  subDirectory?: string;
  fileName: string;
}): Promise<{
  relativePath: string;
  absolutePath: string;
  fileName: string;
  size: number;
}> {
  const subDir = params.subDirectory
    ? params.subDirectory.replace(/^(\/|\\)+/, '')
    : '';

  const targetDir = subDir
    ? path.join(UPLOAD_BASE_DIR, subDir)
    : UPLOAD_BASE_DIR;

  ensureDirectoryExists(targetDir);

  const safeName = sanitizeFileName(params.fileName);
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const finalFileName = `${uniquePrefix}_${safeName}`;
  const absolutePath = path.join(targetDir, finalFileName);

  await fs.promises.writeFile(absolutePath, params.buffer);

  const relativePath = subDir
    ? path.join(subDir, finalFileName).replace(/\\/g, '/')
    : finalFileName;

  return {
    relativePath,
    absolutePath,
    fileName: safeName,
    size: params.buffer.length,
  };
}

/**
 * Deletes a file from private storage safely.
 */
export async function deletePrivateFile(relativePath: string): Promise<boolean> {
  const absolutePath = getPrivateFilePath(relativePath);
  if (!absolutePath) return false;

  try {
    await fs.promises.unlink(absolutePath);
    return true;
  } catch (err) {
    console.error('Failed to delete private file:', err);
    return false;
  }
}

/**
 * Creates a readable file stream for streaming large files without high memory usage.
 */
export function createPrivateFileStream(relativePath: string): fs.ReadStream | null {
  const absolutePath = getPrivateFilePath(relativePath);
  if (!absolutePath) return null;
  return fs.createReadStream(/*turbopackIgnore: true*/ absolutePath);
}
