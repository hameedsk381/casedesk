import { NextResponse } from 'next/server';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import { createCaseFromIntake } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';
import { unauthorized, forbidden, insufficientPermissions, notFound } from '@/lib/api/guards';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const item = await prisma.intakeItem.findUnique({ where: { id }, select: { workspaceId: true } });
    if (!item) return notFound('Intake item');
    if (!hasWorkspaceAccess(user, item.workspaceId)) return forbidden();
    if (!canUserInWorkspace(user, item.workspaceId, 'create_case')) return insufficientPermissions('create_case');

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty
    }

    const newCase = await createCaseFromIntake(id, user.id, body);
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create case from intake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create case from intake' },
      { status: 500 }
    );
  }
}
