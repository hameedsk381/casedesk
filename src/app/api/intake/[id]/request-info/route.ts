import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { requestInformationFromIntake } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const userId = user?.id || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id || '';

    const body = await request.json();
    const requestedFields = body.requestedFields || [];
    const notes = body.notes || '';

    const updated = await requestInformationFromIntake(id, requestedFields, notes, userId);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to request information:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request information' },
      { status: 500 }
    );
  }
}
