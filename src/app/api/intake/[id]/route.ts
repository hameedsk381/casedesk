import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { getIntakeItemById, updateIntakeReview } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getIntakeItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Intake item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Failed to get intake item:', error);
    return NextResponse.json({ error: 'Failed to retrieve item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const userId = user?.id || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id || '';

    const body = await request.json();
    const updated = await updateIntakeReview(id, body, userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update intake review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
