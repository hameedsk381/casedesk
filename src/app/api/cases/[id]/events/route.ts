import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCaseById } from '@/lib/cases/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';
import { rejectCrossOrigin } from '@/lib/api/security';

// Timeline event types the desk may log by hand.
const ALLOWED_TYPES = new Set([
  'FOLLOW_UP_CREATED',
  'STATUS_CHANGED',
  'INFORMATION_REQUESTED',
  'DOCUMENT_UPLOADED',
  'CLAIM_ADDED',
  'VERIFICATION_UPDATED',
  'CONTACT_CREATED',
  'RESPONSE_REQUESTED',
  'RESPONSE_RECEIVED',
  'CONTENT_CREATED',
  'CONTENT_PUBLISHED',
]);

/** Adds a manual entry to a case timeline (e.g. a post-publication development). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const { id } = await params;
    const caseRecord = await getCaseById(id);
    if (!caseRecord) return notFound('Case');
    if (!hasWorkspaceAccess(user, caseRecord.workspaceId)) return forbidden();
    if (!canUserInWorkspace(user, caseRecord.workspaceId, 'edit_case')) {
      return insufficientPermissions('edit_case');
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const type = ALLOWED_TYPES.has(body.type) ? body.type : 'FOLLOW_UP_CREATED';

    const event = await prisma.caseEvent.create({
      data: {
        caseId: id,
        type,
        title: title.slice(0, 200),
        description: description ? description.slice(0, 5000) : null,
        createdById: user.id,
        eventDate: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: caseRecord.workspaceId,
        caseId: id,
        userId: user.id,
        action: 'CASE_EVENT_CREATED',
        metadata: JSON.stringify({ type, title: event.title }),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case event:', error);
    return NextResponse.json({ error: 'Failed to create case event' }, { status: 500 });
  }
}
