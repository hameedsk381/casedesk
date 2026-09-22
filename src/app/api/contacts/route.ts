import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { caseWorkspaceId, unauthorized, forbidden, notFound, insufficientPermissions } from '@/lib/api/guards';
import { rejectCrossOrigin } from '@/lib/api/security';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;
    const body = await request.json();

    const wsId = await caseWorkspaceId(body.caseId);
    if (!wsId) return notFound('Case');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();
    if (!canUserInWorkspace(user, wsId, 'edit_case')) return insufficientPermissions('edit_case');

    const contact = await prisma.contact.create({
      data: {
        caseId: body.caseId,
        name: body.name,
        organization: body.organization,
        role: body.role,
        phone: body.phone,
        email: body.email,
        type: body.type || 'AUTHORITY',
        notes: body.notes,
      },
    });
    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 });
  }
}
