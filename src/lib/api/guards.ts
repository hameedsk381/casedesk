import { NextResponse } from 'next/server';
import prisma from '../db/prisma';
import { getCurrentUser, hasWorkspaceAccess, canUser, type PermissionAction } from '../auth/permissions';

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json(
    { error: 'Forbidden: Access denied to this workspace' },
    { status: 403 }
  );
}

export function insufficientPermissions(action: PermissionAction) {
  return NextResponse.json(
    { error: `Forbidden: Your role does not allow "${action}"` },
    { status: 403 }
  );
}

/** Returns true when the user's role permits the action, else false. */
export function roleAllows(user: { role: string } | null, action: PermissionAction): boolean {
  return canUser(user?.role || '', action);
}

export function notFound(entity: string) {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

/** Resolves the workspace a case belongs to, or null if the case does not exist. */
export async function caseWorkspaceId(caseId: string): Promise<string | null> {
  if (!caseId) return null;
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { workspaceId: true },
  });
  return c?.workspaceId ?? null;
}

/** Returns the authenticated user, or a 401 response — use with early return. */
export async function requireUser(): Promise<
  { user: Record<string, any>; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { response: unauthorized() };
  return { user };
}
