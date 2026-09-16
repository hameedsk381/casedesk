import { NextResponse } from 'next/server';
import { getSubmissionEndpoint, processCitizenSubmission } from '@/lib/intake/submissionService';
import { savePrivateUpload } from '@/lib/storage';
import { CitizenSubmissionSchema } from '@/lib/contracts/intake';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || undefined;
    const endpoint = await getSubmissionEndpoint(slug);

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
    console.error('Failed to get submission endpoint:', error);
    return NextResponse.json(
      { error: 'Endpoint not found or unavailable' },
      { status: 404, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  try {
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

      payload.slug = (formData.get('slug') as string) || undefined;
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
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.size === 0) continue;

          let fileType = 'DOCUMENT';
          if (file.type.startsWith('image/')) fileType = 'IMAGE';
          else if (file.type.startsWith('video/')) fileType = 'VIDEO';
          else if (file.type.startsWith('audio/')) fileType = 'AUDIO';

          const buffer = Buffer.from(await file.arrayBuffer());
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
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit citizen report' },
      { status: 500, headers: corsHeaders }
    );
  }
}
