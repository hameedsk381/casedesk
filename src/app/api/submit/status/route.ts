import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { TrackingStatusSchema } from '@/lib/contracts/intake';
import { getCorsHeaders } from '@/lib/api/cors';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const rl = rateLimit(`tracking:${getClientIp(request)}`, 20, 10 * 60_000);
    if (!rl.allowed) return NextResponse.json({ error: 'Too many tracking requests. Please try again shortly.' }, { status: 429, headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfterSeconds) } });
    const { searchParams } = new URL(request.url);
    const parsed = TrackingStatusSchema.safeParse({ ref: searchParams.get('ref') });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid reference number format.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const ref = parsed.data.ref;

    const intakeItem = await prisma.intakeItem.findFirst({
      where: { referenceNumber: ref },
      select: {
        id: true,
        referenceNumber: true,
        status: true,
        createdAt: true,
        createdCase: {
          select: {
            id: true,
            caseNumber: true,
            status: true,
            resolutionStatus: true,
            publishedAt: true,
            resolvedAt: true,
            responseRequests: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!intakeItem) {
      return NextResponse.json(
        {
          error: 'No report found matching this tracking reference number.',
          ref,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    const linkedCase = intakeItem.createdCase;
    const isTriaged = intakeItem.status !== 'INCOMING';
    const isInvestigating =
      !!linkedCase &&
      ['INVESTIGATION', 'VERIFICATION', 'CONTENT_READY', 'PUBLISHED', 'RESOLVED', 'FOLLOW_UP'].includes(
        linkedCase.status
      );
    const hasAuthorityAction =
      !!linkedCase &&
      (linkedCase.responseRequests.length > 0 ||
        ['PUBLISHED', 'RESOLVED'].includes(linkedCase.status));
    const isPublishedOrResolved =
      !!linkedCase &&
      (linkedCase.status === 'PUBLISHED' ||
        linkedCase.status === 'RESOLVED' ||
        linkedCase.resolutionStatus === 'RESOLVED');

    // Milestone status descriptions
    let statusEn = 'Under Review by Journalists';
    let statusTe = 'జర్నలిస్టుల పరిశీలనలో ఉంది';

    if (intakeItem.status === 'INCOMING') {
      statusEn = 'Report Received — Processing Intake';
      statusTe = 'ఫిర్యాదు అందింది — పరిశీలన ప్రారంభమవుతోంది';
    } else if (isPublishedOrResolved) {
      statusEn = 'Action Taken / Story Published';
      statusTe = 'కథనం ప్రచురితమైంది / పరిష్కారం లభించింది';
    } else if (hasAuthorityAction) {
      statusEn = 'Inquiry Sent to Authorities';
      statusTe = 'అధికారులను వివరణ కోరడం జరిగింది';
    } else if (isInvestigating) {
      statusEn = 'Ground Investigation Underway';
      statusTe = 'క్షేత్రస్థాయి విచారణ జరుగుతోంది';
    } else if (intakeItem.status === 'ARCHIVED') {
      statusEn = 'Editorial Review Completed';
      statusTe = 'పరిశీలన పూర్తయింది';
    }

    return NextResponse.json(
      {
        ref: intakeItem.referenceNumber,
        receivedAt: intakeItem.createdAt,
        status: statusEn,
        statusTe,
        steps: [
          {
            title: '1. Report Received',
            titleTe: '1. ఫిర్యాదు అందింది',
            done: true,
          },
          {
            title: '2. Details Under Review',
            titleTe: '2. వివరాలు పరిశీలిస్తున్నారు',
            done: isTriaged,
          },
          {
            title: '3. Ground Verification',
            titleTe: '3. క్షేత్రస్థాయి విచారణ',
            done: isInvestigating,
          },
          {
            title: '4. Action with Authorities',
            titleTe: '4. అధికారులను నిలదీయడం',
            done: hasAuthorityAction,
          },
        ],
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Tracking status lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to look up report status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
