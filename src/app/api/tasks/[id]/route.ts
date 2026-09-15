import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...body,
        completedAt: body.status === 'DONE' ? new Date() : (body.status ? null : undefined),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
