import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/permissions';
import { createCaseFromIntake } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const userId = user?.id || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id || '';

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty
    }

    const newCase = await createCaseFromIntake(id, userId, body);
    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create case from intake:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create case from intake' },
      { status: 500 }
    );
  }
}
