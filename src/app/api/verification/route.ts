import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import { unauthorized, insufficientPermissions, forbidden, notFound } from '@/lib/api/guards';
import { caseWorkspaceId } from '@/lib/api/workspace';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'edit_investigation')) return insufficientPermissions('edit_investigation');

    const body = await request.json();

    const wsId = await caseWorkspaceId(body.caseId);
    if (!wsId) return notFound('Case');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const item = await prisma.verificationItem.create({
      data: {
        caseId: body.caseId,
        statement: body.statement,
        status: body.status || 'PENDING',
        evidenceRequired: body.evidenceRequired,
        notes: body.notes,
        verifiedById: body.status === 'VERIFIED' ? user.id : null,
        verifiedAt: body.status === 'VERIFIED' ? new Date() : null,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add verification item' }, { status: 500 });
  }
}
