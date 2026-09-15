import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contact = await prisma.contact.create({
      data: {
        caseId: body.caseId,
        name: body.name,
        organization: body.organization,
        role: body.role,
        phone: body.phone,
        email: body.email,
        type: body.type || 'AUTHORITY',
        notes: body.notes,
      },
    });
    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 });
  }
}
