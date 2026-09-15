import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();

    const updated = await prisma.verificationItem.update({
      where: { id },
      data: {
        ...body,
        verifiedById: body.status === 'VERIFIED' ? user?.id : (body.status ? null : undefined),
        verifiedAt: body.status === 'VERIFIED' ? new Date() : (body.status ? null : undefined),
      },
      include: {
        verifiedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update verification item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.verificationItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete verification item' }, { status: 500 });
  }
}
