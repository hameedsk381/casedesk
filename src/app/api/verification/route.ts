import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/permissions';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const item = await prisma.verificationItem.create({
      data: {
        caseId: body.caseId,
        statement: body.statement,
        status: body.status || 'PENDING',
        evidenceRequired: body.evidenceRequired,
        notes: body.notes,
        verifiedById: body.status === 'VERIFIED' ? user?.id : null,
        verifiedAt: body.status === 'VERIFIED' ? new Date() : null,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add verification item' }, { status: 500 });
  }
}
