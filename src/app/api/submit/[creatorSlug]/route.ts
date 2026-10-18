import { NextResponse } from 'next/server';
import { getSubmissionEndpoint } from '@/lib/intake/submissionService';
import { handleSubmissionPost } from '@/lib/intake/submitHandler';
import { getCorsHeaders } from '@/lib/api/cors';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ creatorSlug: string }> }
) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const { creatorSlug } = await params;
    const endpoint = await getSubmissionEndpoint(creatorSlug, true);

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
  const { creatorSlug } = await params;
  return handleSubmissionPost(request, creatorSlug);
}
