import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, canUserInWorkspace, getWorkspaceRole } from '@/lib/auth/permissions';
import { pickTeamMembership } from '@/lib/team/context';
import { rejectCrossOrigin } from '@/lib/api/security';

// Removes someone from the workspace. Their account and the cases they worked on stay.
export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;

  const membership = pickTeamMembership(user);
  if (!membership || !canUserInWorkspace(user, membership.workspaceId, 'manage_team')) {
    return NextResponse.json({ error: 'Forbidden: you cannot manage the team' }, { status: 403 });
  }

  const { userId } = await params;
  if (userId === user.id) {
    return NextResponse.json({ error: 'You cannot remove yourself.' }, { status: 400 });
  }

  const target = await prisma.workspaceMember.findFirst({
    where: { workspaceId: membership.workspaceId, userId },
    select: { id: true, role: true },
  });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  if (target.role === 'OWNER') {
    return NextResponse.json({ error: 'The workspace owner cannot be removed.' }, { status: 403 });
  }
  if (target.role === 'ADMIN' && getWorkspaceRole(user, membership.workspaceId) !== 'OWNER') {
    return NextResponse.json({ error: 'Only the owner can remove an admin.' }, { status: 403 });
  }

  await prisma.workspaceMember.delete({ where: { id: target.id } });
  return NextResponse.json({ success: true });
}
