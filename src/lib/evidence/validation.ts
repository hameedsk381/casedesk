const MAX_EVIDENCE_SIZE = 25 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
};

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function hasSignature(buffer: Buffer, mimeType: string): boolean {
  switch (mimeType) {
    case 'application/pdf':
      return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04]);
    case 'image/jpeg':
      return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif':
      return buffer.subarray(0, 4).toString('ascii') === 'GIF8';
    case 'image/webp':
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'video/mp4':
      return buffer.subarray(4, 8).toString('ascii') === 'ftyp';
    case 'audio/mpeg':
      return buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    case 'audio/wav':
    case 'audio/x-wav':
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
    default:
      return false;
  }
}

export function validateEvidenceUpload(file: File, buffer: Buffer): string | null {
  const mimeType = file.type.toLowerCase();
  const extensions = MIME_EXTENSIONS[mimeType];
  const lowerName = file.name.toLowerCase();

  if (!extensions || !extensions.some((extension) => lowerName.endsWith(extension))) {
    return 'Unsupported evidence file type';
  }
  if (buffer.length === 0 || buffer.length > MAX_EVIDENCE_SIZE) {
    return 'Evidence files must be between 1 byte and 25 MB';
  }
  if (!hasSignature(buffer, mimeType)) {
    return 'Evidence file signature does not match its declared type';
  }

  return null;
}
