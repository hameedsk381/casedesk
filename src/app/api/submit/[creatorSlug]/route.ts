import { NextResponse } from 'next/server';
import { getSubmissionEndpoint, processCitizenSubmission } from '@/lib/intake/submissionService';
import { savePrivateUpload } from '@/lib/storage';
import { CitizenSubmissionSchema } from '@/lib/contracts/intake';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

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
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp',
  'mp3', 'wav', 'webm', 'ogg', 'mp4', 'mov',
]);

function isAllowedUpload(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) && !!extension && ALLOWED_EXTENSIONS.has(extension);
}

/**
 * Checks common file signatures before storing untrusted uploads. This is not
 * malware scanning, but prevents an executable or arbitrary text file from
 * being accepted merely because a client supplied a trusted MIME type.
 */
function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function hasAllowedSignature(file: File, buffer: Buffer): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ creatorSlug: string }> }
) {
  try {
    const { creatorSlug } = await params;
    const endpoint = await getSubmissionEndpoint(creatorSlug);

    return NextResponse.json(
      {
        endpoint: {
          slug: endpoint.slug,
          title: endpoint.title,
          description: endpoint.description,
          requireContact: endpoint.requireContact,
          allowAnonymous: endpoint.allowAnonymous,
          allowVoice: endpoint.allowVoice,
          allowAttachments: endpoint.allowAttachments,
          workspaceName: endpoint.workspace?.name,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.warn('Failed to get creator endpoint:', error?.message || error);
    return NextResponse.json(
      { error: 'Endpoint not found or unavailable' },
      { status: 404, headers: corsHeaders }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ creatorSlug: string }> }
) {
  try {
    const { creatorSlug } = await params;

    const rl = rateLimit(`submit:${getClientIp(request)}`, 5, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many reports submitted. Please try again shortly.' },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let payload: any = {};
    const uploadedFiles: Array<{
      fileName: string;
      filePath: string;
      mimeType: string;
      size: number;
      type: string;
    }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      payload.slug = creatorSlug;
      payload.story = (formData.get('story') as string) || '';
      payload.transcription = (formData.get('transcription') as string) || undefined;
      payload.district = (formData.get('district') as string) || undefined;
      payload.town = (formData.get('town') as string) || undefined;
      payload.address = (formData.get('address') as string) || undefined;
      payload.incidentDate = (formData.get('incidentDate') as string) || undefined;
      payload.category = (formData.get('category') as string) || undefined;
      payload.senderName = (formData.get('senderName') as string) || undefined;
      payload.senderPhone = (formData.get('senderPhone') as string) || undefined;
      payload.senderEmail = (formData.get('senderEmail') as string) || undefined;
      payload.preferredLanguage = (formData.get('preferredLanguage') as string) || undefined;
      payload.isAnonymous = formData.get('isAnonymous') === 'true';
      payload.consentAccuracy = formData.get('consentAccuracy') !== 'false';
      payload.consentContact = formData.get('consentContact') !== 'false';
      payload.consentNoGuarantee = formData.get('consentNoGuarantee') !== 'false';
      payload.consentToPublish = (formData.get('consentToPublish') as string) || 'DISCUSS_FIRST';

      const files = formData.getAll('files') as File[];
      let totalUploadSize = 0;
      if (files && files.length > 0) {
        if (files.length > 10) {
          return NextResponse.json(
            { error: 'Too many files. Maximum 10 files per report.' },
            { status: 413, headers: corsHeaders }
          );
        }
        for (const file of files) {
          if (file.size === 0) continue;
          if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
              { error: 'One of your files is too large. Maximum 10 MB per file.' },
              { status: 413, headers: corsHeaders }
            );
          }
          if (!isAllowedUpload(file)) {
            return NextResponse.json(
              { error: 'Unsupported file type. Upload a PDF, Word document, image, audio, or video file.' },
              { status: 415, headers: corsHeaders }
            );
          }
          totalUploadSize += file.size;
          if (totalUploadSize > 30 * 1024 * 1024) {
            return NextResponse.json(
              { error: 'Your attachments are too large. Maximum 30 MB total.' },
              { status: 413, headers: corsHeaders }
            );
          }

          let fileType = 'DOCUMENT';
          if (file.type.startsWith('image/')) fileType = 'IMAGE';
          else if (file.type.startsWith('video/')) fileType = 'VIDEO';
          else if (file.type.startsWith('audio/')) fileType = 'AUDIO';

          const buffer = Buffer.from(await file.arrayBuffer());
          if (!hasAllowedSignature(file, buffer)) {
            return NextResponse.json(
              { error: 'The file contents do not match its declared type.' },
              { status: 415, headers: corsHeaders }
            );
          }
          const saved = await savePrivateUpload({
            buffer,
            subDirectory: 'submissions',
            fileName: file.name,
          });

          uploadedFiles.push({
            fileName: file.name,
            filePath: saved.relativePath,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            type: fileType,
          });
        }
      }
    } else {
      payload = await request.json();
      payload.slug = creatorSlug;
      payload.story = payload.story || payload.content || '';
    }

    payload.files = [...(payload.files || []), ...uploadedFiles];

    // Validate payload with Zod schema
    const validation = CitizenSubmissionSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid submission payload';
      return NextResponse.json(
        { error: firstError, validationErrors: validation.error.flatten().fieldErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await processCitizenSubmission(validation.data);
    return NextResponse.json(result, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Creator submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit citizen report' },
      { status: 500, headers: corsHeaders }
    );
  }
}
