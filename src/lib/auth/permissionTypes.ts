/**
 * Client-safe permission vocabulary. This module deliberately has no server
 * imports (no Prisma/session) so it can be bundled into client components.
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'RESEARCHER' | 'EDITOR' | 'VIEWER';

export type PermissionAction =
  | 'manage_workspace'
  | 'manage_team'
  | 'create_case'
  | 'edit_case'
  | 'delete_case'
  | 'add_evidence'
  | 'delete_evidence'
  | 'edit_investigation'
  | 'create_content'
  | 'approve_content'
  | 'publish_content'
  | 'change_case_status';

export const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
  'manage_workspace',
  'manage_team',
  'create_case',
  'edit_case',
  'delete_case',
  'add_evidence',
  'delete_evidence',
  'edit_investigation',
  'create_content',
  'approve_content',
  'publish_content',
  'change_case_status',
];

export type WorkspacePermissions = Record<PermissionAction, boolean>;

/**
 * The user's role within the workspace currently in context. Falls back to
 * null when the user has no membership (e.g. immediately after sign-up).
 */
export function primaryWorkspaceRole(
  user: { role?: string; workspaceMembers?: Array<{ role?: string }> } | null | undefined
): string | null {
  const role = user?.workspaceMembers?.[0]?.role;
  return typeof role === 'string' ? role : null;
}

/** Every action enabled. Used as the fallback when no workspace is in context. */
export function allowAllPermissions(): WorkspacePermissions {
  const map = {} as WorkspacePermissions;
  for (const action of ALL_PERMISSION_ACTIONS) {
    map[action] = true;
  }
  return map;
}
