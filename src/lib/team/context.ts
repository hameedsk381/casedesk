import { canUser } from '../auth/permissions';

type Membership = { workspaceId: string; role: string; workspace?: { name: string } | null };

/**
 * The workspace the team screen manages: the first one where the user may manage
 * the team, otherwise their first workspace (read-only view).
 */
export function pickTeamMembership<T extends Membership>(user: { workspaceMembers?: T[] }): T | null {
  const memberships = user.workspaceMembers || [];
  return memberships.find((m) => canUser(m.role, 'manage_team')) || memberships[0] || null;
}
