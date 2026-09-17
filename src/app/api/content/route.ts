import { NextResponse } from 'next/server';
import { createContentDraft } from '@/lib/content/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { unauthorized, insufficientPermissions, forbidden, notFound } from '@/lib/api/guards';
import { caseWorkspaceId } from '@/lib/api/workspace';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canUser(user.role, 'create_content')) return insufficientPermissions('create_content');

    const body = await request.json();
    if (!body.caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 });

    const wsId = await caseWorkspaceId(body.caseId);
    if (!wsId) return notFound('Case');
    if (!hasWorkspaceAccess(user, wsId)) return forbidden();

    const content = await createContentDraft({
      caseId: body.caseId,
      type: body.type,
      title: body.title,
      body: body.body,
      createdById: user.id,
    });

    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create content' }, { status: 500 });
  }
}
