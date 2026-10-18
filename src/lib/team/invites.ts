import { createHash, randomBytes } from 'crypto';
import prisma from '../db/prisma';
import { isMailConfigured, sendInviteEmail } from '../mailer';
import { getWorkspaceRole } from '../auth/permissions';

/** Roles an invite can grant. OWNER is never granted by invite. */
export const INVITABLE_ROLES = ['RESEARCHER', 'EDITOR', 'VIEWER', 'ADMIN'] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];
export const DEFAULT_INVITE_ROLE: InvitableRole = 'RESEARCHER';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** A problem the caller can show to staff as-is. */
export class TeamError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'TeamError';
  }
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isInvitableRole(role: unknown): role is InvitableRole {
  return typeof role === 'string' && (INVITABLE_ROLES as readonly string[]).includes(role);
}

/**
 * Creates an invite (replacing any pending one for the same email), and emails it
 * when SMTP is configured. The raw link is returned once so the inviter can also
 * copy it by hand; only its hash is stored.
 */
export async function createWorkspaceInvite(params: {
  workspaceId: string;
  email: string;
  role: InvitableRole;
  inviter: { id: string; name: string; workspaceMembers?: Array<{ workspaceId: string; role: string }> };
}) {
  const email = params.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email)) {
    throw new TeamError('Enter a valid email address.');
  }
  // Only an OWNER may hand out admin rights.
  if (params.role === 'ADMIN' && getWorkspaceRole(params.inviter, params.workspaceId) !== 'OWNER') {
    throw new TeamError('Only the workspace owner can invite an admin.', 403);
  }

  const existingMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId: params.workspaceId, user: { email } },
    select: { id: true },
  });
  if (existingMember) throw new TeamError('That person is already a member of this workspace.', 409);

  const workspace = await prisma.workspace.findUnique({ where: { id: params.workspaceId }, select: { name: true } });
  if (!workspace) throw new TeamError('Workspace not found.', 404);

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await prisma.$transaction(async (tx) => {
    await tx.workspaceInvite.deleteMany({ where: { workspaceId: params.workspaceId, email, acceptedAt: null } });
    return tx.workspaceInvite.create({
      data: {
        workspaceId: params.workspaceId,
        email,
        role: params.role,
        tokenHash: hashInviteToken(token),
        invitedById: params.inviter.id,
        expiresAt,
      },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    });
  });

  const baseUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const inviteUrl = `${baseUrl}/invite/${token}`;

  let emailSent = false;
  if (isMailConfigured()) {
    try {
      await sendInviteEmail({ to: email, inviterName: params.inviter.name, workspaceName: workspace.name, role: params.role, inviteUrl, expiresAt });
      emailSent = true;
    } catch (error) {
      console.error('[team] Invite email failed:', error instanceof Error ? error.message : error);
    }
  }

  return { invite, inviteUrl, emailSent };
}

/** The pending, unexpired invite for a raw token, or null. */
export async function findValidInvite(token: string) {
  if (!token || token.length > 200) return null;
  return prisma.workspaceInvite.findFirst({
    where: { tokenHash: hashInviteToken(token), acceptedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      email: true,
      role: true,
      workspaceId: true,
      workspace: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });
}
