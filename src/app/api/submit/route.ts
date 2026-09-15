import { NextResponse } from 'next/server';
import { getSubmissionEndpoint, processCitizenSubmission } from '@/lib/intake/submissionService';
import path from 'path';
import fs from 'fs/promises';

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

      // Process uploaded files
      const files = formData.getAll('files') as File[];
      if (files && files.length > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'submissions');
        await fs.mkdir(uploadDir, { recursive: true });

        for (const file of files) {
          if (file.size === 0) continue;
          const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const diskPath = path.join(uploadDir, safeName);
          const buffer = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(diskPath, buffer);

          let fileType = 'DOCUMENT';
          if (file.type.startsWith('image/')) fileType = 'IMAGE';
          else if (file.type.startsWith('video/')) fileType = 'VIDEO';
          else if (file.type.startsWith('audio/')) fileType = 'AUDIO';

          uploadedFiles.push({
            fileName: file.name,
            filePath: `/uploads/submissions/${safeName}`,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            type: fileType,
          });
        }
      }
    } else {
      payload = await request.json();
    }

    if (!payload.story || payload.story.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please describe what happened in your story or voice message.' },
        { status: 400, headers: corsHeaders }
      );
    }

    payload.files = [...(payload.files || []), ...uploadedFiles];

    const result = await processCitizenSubmission(payload);
    return NextResponse.json(result, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Submission processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit citizen report' },
      { status: 500, headers: corsHeaders }
    );
  }
}
