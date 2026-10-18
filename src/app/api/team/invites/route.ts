import { NextResponse } from 'next/server';
import { getCurrentUser, canUserInWorkspace } from '@/lib/auth/permissions';
import { pickTeamMembership } from '@/lib/team/context';
import { createWorkspaceInvite, DEFAULT_INVITE_ROLE, isInvitableRole, TeamError } from '@/lib/team/invites';
import { rejectCrossOrigin } from '@/lib/api/security';
import { rateLimit } from '@/lib/rateLimit';

// Creates an invitation: POST { "email": "...", "role": "RESEARCHER" }
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const membership = pickTeamMembership(user);
    if (!membership || !canUserInWorkspace(user, membership.workspaceId, 'manage_team')) {
      return NextResponse.json({ error: 'Forbidden: you cannot manage the team' }, { status: 403 });
    }

    const limit = rateLimit(`team-invite:${user.id}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many invitations. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const role = body?.role ?? DEFAULT_INVITE_ROLE;
    if (typeof body?.email !== 'string') return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    if (!isInvitableRole(role)) return NextResponse.json({ error: 'Choose Researcher, Editor, Viewer or Admin.' }, { status: 400 });

    const { invite, inviteUrl, emailSent } = await createWorkspaceInvite({
      workspaceId: membership.workspaceId,
      email: body.email,
      role,
      inviter: user,
    });
    return NextResponse.json({ invite, inviteUrl, emailSent }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof TeamError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Failed to create invite:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
