import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const claim = await prisma.claim.create({
      data: {
        caseId: body.caseId,
        text: body.text,
        status: body.status || 'UNVERIFIED',
        source: body.source,
        notes: body.notes,
      },
    });
    return NextResponse.json(claim);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add claim' }, { status: 500 });
  }
}
