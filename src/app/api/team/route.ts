import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { canUser, getCurrentUser } from '@/lib/auth/permissions';
import { pickTeamMembership } from '@/lib/team/context';

// The team screen's data: members of the user's workspace and, for people who may
// manage the team, the pending invitations.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const membership = pickTeamMembership(user);
  if (!membership) return NextResponse.json({ error: 'No workspace' }, { status: 404 });

  const canManage = canUser(membership.role, 'manage_team');
  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: membership.workspaceId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, createdAt: true, user: { select: { id: true, name: true, email: true } } },
    }),
    canManage
      ? prisma.workspaceInvite.findMany({
          where: { workspaceId: membership.workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    workspaceId: membership.workspaceId,
    workspaceName: membership.workspace?.name ?? null,
    myRole: membership.role,
    myUserId: user.id,
    canManage,
    members: members.map((m) => ({ userId: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
    invites,
  });
}
