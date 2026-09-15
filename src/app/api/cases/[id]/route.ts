import { NextResponse } from 'next/server';
import { getCaseById, updateCase } from '@/lib/cases/service';
import { getCurrentUser } from '@/lib/auth/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseRecord = await getCaseById(id);

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(caseRecord);
  } catch (error: any) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const data = await request.json();

    const updated = await updateCase(id, data, user?.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: error.message || 'Failed to update case' }, { status: 500 });
  }
}
