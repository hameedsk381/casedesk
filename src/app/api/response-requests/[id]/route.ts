import { NextResponse } from 'next/server';
import { updateResponseRequestStatus } from '@/lib/investigation/service';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateResponseRequestStatus(id, {
      status: body.status,
      responseText: body.responseText,
      notes: body.notes,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update response request' }, { status: 500 });
  }
}
