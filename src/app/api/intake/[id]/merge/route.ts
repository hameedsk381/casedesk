import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { mergeIntakeWithCase } from '@/lib/intake/service';
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
    if (!body.targetCaseId) {
      return NextResponse.json({ error: 'targetCaseId is required to merge' }, { status: 400 });
    }

    const result = await mergeIntakeWithCase(id, body.targetCaseId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to merge intake with case:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to merge intake with case' },
      { status: 500 }
    );
  }
}
