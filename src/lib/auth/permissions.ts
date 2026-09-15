import { getSession } from './session';
import prisma from '../db/prisma';

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
