import { getSession } from './session';
import prisma from '../db/prisma';
import {
  ALL_PERMISSION_ACTIONS,
  type PermissionAction,
  type UserRole,
  type WorkspacePermissions,
} from './permissionTypes';

export type { PermissionAction, UserRole, WorkspacePermissions } from './permissionTypes';
export { ALL_PERMISSION_ACTIONS } from './permissionTypes';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  OWNER: [
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
  ],
  ADMIN: [
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
  ],
  RESEARCHER: [
    'create_case',
    'edit_case',
    'add_evidence',
    'edit_investigation',
    'create_content',
    'change_case_status',
  ],
  EDITOR: [
    'edit_case',
    'edit_investigation',
    'create_content',
    'approve_content',
    'publish_content',
  ],
  VIEWER: [],
};

export function canUser(role: string, action: PermissionAction): boolean {
  const allowed = ROLE_PERMISSIONS[role as UserRole] || [];
  return allowed.includes(action);
}

export function getWorkspaceRole(
  user: { workspaceMembers?: Array<{ workspaceId: string; role: string }> } | null,
  workspaceId: string
): UserRole | null {
  const membership = user?.workspaceMembers?.find((member) => member.workspaceId === workspaceId);
  return (membership?.role as UserRole) || null;
}

export function canUserInWorkspace(
  user: { workspaceMembers?: Array<{ workspaceId: string; role: string }> } | null,
  workspaceId: string,
  action: PermissionAction
): boolean {
  const role = getWorkspaceRole(user, workspaceId);
  return role ? canUser(role, action) : false;
}

/**
 * A serialisable map of every permission action for one workspace, so server
 * components can hand the client exactly what it may render/enable.
 */
export function getWorkspacePermissions(
  user: { workspaceMembers?: Array<{ workspaceId: string; role: string }> } | null,
  workspaceId: string
): WorkspacePermissions {
  const role = getWorkspaceRole(user, workspaceId);
  const allowed = role ? ROLE_PERMISSIONS[role] || [] : [];
  const map = {} as WorkspacePermissions;
  for (const action of ALL_PERMISSION_ACTIONS) {
    map[action] = allowed.includes(action);
  }
  return map;
}

/**
 * The union of permissions across every workspace the user belongs to. Used by
 * the app shell for global affordances (e.g. the "New Case" action) where no
 * single workspace is in context.
 */
export function getUnionWorkspacePermissions(
  user: { workspaceMembers?: Array<{ workspaceId: string; role: string }> } | null
): WorkspacePermissions {
  const memberships = user?.workspaceMembers || [];
  const map = {} as WorkspacePermissions;
  for (const action of ALL_PERMISSION_ACTIONS) {
    map[action] = memberships.some((m) => canUser(m.role, action));
  }
  return map;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        workspaceMembers: {
          include: {
            workspace: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Checks whether a user has access to a given workspaceId.
 * Access is defined by WorkspaceMember records — every role, including OWNER/ADMIN,
 * must be a member of the workspace (prevents cross-creator data leaks).
 */
export function hasWorkspaceAccess(user: { role: string; workspaceMembers?: Array<{ workspaceId: string }> } | null, workspaceId: string): boolean {
  if (!user) return false;
  return !!user.workspaceMembers?.some((m) => m.workspaceId === workspaceId);
}

/**
 * Returns all accessible workspace IDs for the given user (workspaces they are a member of).
 */
export async function getAccessibleWorkspaceIds(user: { id: string; role: string; workspaceMembers?: Array<{ workspaceId: string }> }): Promise<string[]> {
  return user.workspaceMembers?.map((m) => m.workspaceId) || [];
}
