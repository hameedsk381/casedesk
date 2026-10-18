import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, canUserInWorkspace } from '@/lib/auth/permissions';
import { rejectCrossOrigin } from '@/lib/api/security';

// Revokes a pending invitation.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const { id } = await params;
  const invite = await prisma.workspaceInvite.findUnique({ where: { id }, select: { id: true, workspaceId: true } });
  if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  if (!canUserInWorkspace(user, invite.workspaceId, 'manage_team')) {
    return NextResponse.json({ error: 'Forbidden: you cannot manage the team' }, { status: 403 });
  }

  await prisma.workspaceInvite.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
