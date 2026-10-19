import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  getCurrentUser,
  hasWorkspaceAccess,
  canUserInWorkspace,
  getAccessibleWorkspaceIds,
} from '@/lib/auth/permissions';
import { unauthorized, forbidden, insufficientPermissions } from '@/lib/api/guards';
import { rejectCrossOrigin } from '@/lib/api/security';
import { normalizeCategories, effectiveCategories } from '@/lib/cases/categories';

async function resolveWorkspaceId(user: any, requested?: string): Promise<string | null> {
  if (requested) return hasWorkspaceAccess(user, requested) ? requested : null;
  const ids = await getAccessibleWorkspaceIds(user);
  return ids[0] ?? null;
}

/** The user's active workspace, including its configurable case categories. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const requested = new URL(request.url).searchParams.get('workspaceId') || undefined;
    const workspaceId = await resolveWorkspaceId(user, requested);
    if (!workspaceId) return forbidden();

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true, description: true, categories: true },
    });
    if (!workspace) return forbidden();

    return NextResponse.json({
      workspace: {
        ...workspace,
        categories: effectiveCategories(workspace.categories),
      },
      canManage: canUserInWorkspace(user, workspaceId, 'manage_workspace'),
    });
  } catch (error: any) {
    console.error('Error loading workspace:', error);
    return NextResponse.json({ error: 'Failed to load workspace' }, { status: 500 });
  }
}

/** Updates the workspace name, description and case categories. Requires manage_workspace. */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const body = await request.json();

    const workspaceId = await resolveWorkspaceId(user, body.workspaceId);
    if (!workspaceId) return forbidden();
    if (!canUserInWorkspace(user, workspaceId, 'manage_workspace')) {
      return insufficientPermissions('manage_workspace');
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }
    if (name.length > 120 || description.length > 2000) {
      return NextResponse.json({ error: 'Workspace name or description is too long' }, { status: 400 });
    }

    const data: { name: string; description: string | null; categories?: string[] } = {
      name,
      description: description || null,
    };

    if (body.categories !== undefined) {
      const categories = normalizeCategories(body.categories);
      if (categories === null) {
        return NextResponse.json({ error: 'categories must be an array of strings' }, { status: 400 });
      }
      data.categories = categories;
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
      select: { id: true, name: true, description: true, slug: true, categories: true },
    });

    return NextResponse.json({
      workspace: { ...updated, categories: effectiveCategories(updated.categories) },
    });
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}
