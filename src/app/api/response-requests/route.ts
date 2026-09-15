import { NextResponse } from 'next/server';
import { createResponseRequest } from '@/lib/investigation/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const req = await createResponseRequest({
      caseId: body.caseId,
      contactId: body.contactId,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      method: body.method,
      notes: body.notes,
    });
    return NextResponse.json(req);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to request response' }, { status: 500 });
  }
}
