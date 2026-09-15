import { NextResponse } from 'next/server';
import { updateContentStatus } from '@/lib/content/service';
import { getCurrentUser } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();

    if (body.status) {
      const updated = await updateContentStatus(id, body.status, user?.id);
      return NextResponse.json(updated);
    }

    const updated = await prisma.content.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
