import { NextResponse } from 'next/server';
import { createContentDraft, updateContentStatus, checkPublicationSafety } from '@/lib/content/service';
import { getCurrentUser } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const createdById = user?.id || (await prisma.user.findFirst())?.id;
    if (!createdById) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const content = await createContentDraft({
      caseId: body.caseId,
      type: body.type,
      title: body.title,
      body: body.body,
      createdById,
    });

    return NextResponse.json(content);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create content' }, { status: 500 });
  }
}
