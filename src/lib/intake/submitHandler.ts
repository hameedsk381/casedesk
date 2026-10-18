import { NextResponse } from 'next/server';
import { processCitizenSubmission, SubmissionError } from '@/lib/intake/submissionService';
import { savePrivateUpload } from '@/lib/storage';
import { CitizenSubmissionSchema } from '@/lib/contracts/intake';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { getCorsHeaders } from '@/lib/api/cors';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp',
  'mp3', 'wav', 'webm', 'ogg', 'mp4', 'm4a', 'mov',
]);

function extensionOf(file: File): string | undefined {
  return file.name.split('.').pop()?.toLowerCase();
}

function isAllowedUpload(file: File): boolean {
  const extension = extensionOf(file);
  return ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) && !!extension && ALLOWED_EXTENSIONS.has(extension);
}

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

/**
 * Checks common file signatures before storing untrusted uploads. This is not
 * malware scanning, but prevents an executable or arbitrary text file from
 * being accepted merely because a client supplied a trusted MIME type.
 */
function hasAllowedSignature(file: File, buffer: Buffer): boolean {
  switch (extensionOf(file)) {
    case 'pdf':
      return hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case 'jpg':
    case 'jpeg':
      return hasPrefix(buffer, [0xff, 0xd8, 0xff]);
    case 'png':
      return hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'webp':
      return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    case 'wav':
      return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE';
    case 'ogg':
      return buffer.toString('ascii', 0, 4) === 'OggS';
    case 'mp3':
      return buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
    case 'webm':
      return hasPrefix(buffer, [0x1a, 0x45, 0xdf, 0xa3]); // EBML
    case 'mp4':
    case 'm4a':
    case 'mov':
      return buffer.toString('ascii', 4, 8) === 'ftyp';
    case 'doc':
      return hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case 'docx':
      return hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04]); // ZIP container
    default:
      return false;
  }
}

const MAX_REQUEST_BYTES = 35 * 1024 * 1024;

/**
 * Shared POST handler for citizen submissions. `slug` is the endpoint slug from
 * the URL; when undefined (legacy /api/submit) the slug may come from the body.
 */
export async function handleSubmissionPost(request: Request, slug: string | undefined): Promise<Response> {
  const corsHeaders = getCorsHeaders(request);
  const fail = (error: string, status: number, extra?: Record<string, unknown>, headers?: Record<string, string>) =>
    NextResponse.json({ error, ...extra }, { status, headers: { ...corsHeaders, ...headers } });

  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES)) {
      return fail('Submission request is too large.', 413);
    }

    const rl = rateLimit(`submit:${getClientIp(request)}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return fail('Too many reports submitted. Please try again shortly.', 429, undefined, {
        'Retry-After': String(rl.retryAfterSeconds),
      });
    }

    const contentType = request.headers.get('content-type') || '';
    let payload: any = {};
    const uploadedFiles: Array<{ fileName: string; filePath: string; mimeType: string; size: number; type: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const text = (key: string) => (formData.get(key) as string) || undefined;

      payload.slug = slug ?? text('slug');
      payload.story = (formData.get('story') as string) || '';
      for (const key of [
        'transcription', 'district', 'town', 'municipality', 'address', 'incidentDate', 'category',
        'senderName', 'senderPhone', 'senderEmail', 'preferredLanguage',
      ]) {
        payload[key] = text(key);
      }
      payload.isAnonymous = formData.get('isAnonymous') === 'true';
      // Consent is opt-in: a missing field is not consent.
      payload.consentAccuracy = formData.get('consentAccuracy') === 'true';
      payload.consentContact = formData.get('consentContact') === 'true';
      payload.consentNoGuarantee = formData.get('consentNoGuarantee') === 'true';
      payload.consentToPublish = text('consentToPublish') || 'DISCUSS_FIRST';

      const files = formData.getAll('files') as File[];
      if (files.length > 10) return fail('Too many files. Maximum 10 files per report.', 413);

      let totalUploadSize = 0;
      for (const file of files) {
        if (file.size === 0) continue;
        if (file.size > 10 * 1024 * 1024) return fail('One of your files is too large. Maximum 10 MB per file.', 413);
        if (!isAllowedUpload(file)) {
          return fail('Unsupported file type. Upload a PDF, Word document, image, audio, or video file.', 415);
        }
        totalUploadSize += file.size;
        if (totalUploadSize > 30 * 1024 * 1024) return fail('Your attachments are too large. Maximum 30 MB total.', 413);

        let fileType = 'DOCUMENT';
        if (file.type.startsWith('image/')) fileType = 'IMAGE';
        else if (file.type.startsWith('video/')) fileType = 'VIDEO';
        else if (file.type.startsWith('audio/')) fileType = 'AUDIO';

        const buffer = Buffer.from(await file.arrayBuffer());
        if (!hasAllowedSignature(file, buffer)) return fail('The file contents do not match its declared type.', 415);

        const saved = await savePrivateUpload({ buffer, subDirectory: 'submissions', fileName: file.name });
        uploadedFiles.push({
          fileName: file.name,
          filePath: saved.relativePath,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          type: fileType,
        });
      }
    } else {
      payload = await request.json();
      if (slug) payload.slug = slug;
      payload.story = payload.story || payload.content || '';
      // JSON clients cannot reference server paths; only uploaded files are attached.
      delete payload.files;
    }

    payload.files = [...uploadedFiles];

    const validation = CitizenSubmissionSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid submission payload';
      return fail(firstError, 400, { validationErrors: validation.error.flatten().fieldErrors });
    }

    const result = await processCitizenSubmission(validation.data);
    return NextResponse.json(result, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return fail('Invalid request body.', 400);
    if (error instanceof SubmissionError) return fail(error.message, error.status);
    console.error('Submission error:', error);
    return fail('Failed to submit citizen report. Please try again.', 500);
  }
}
