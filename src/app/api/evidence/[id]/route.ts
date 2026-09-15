import { NextResponse } from 'next/server';
import { deleteEvidence } from '@/lib/evidence/service';
import { getCurrentUser } from '@/lib/auth/permissions';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    await deleteEvidence(id, user?.id || 'system');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete evidence error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete evidence' }, { status: 500 });
  }
}
