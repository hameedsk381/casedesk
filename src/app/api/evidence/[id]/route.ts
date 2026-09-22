import { NextResponse } from 'next/server';
import { deleteEvidence } from '@/lib/evidence/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { rejectCrossOrigin } from '@/lib/api/security';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const originError = rejectCrossOrigin(request);
    if (originError) return originError;

    const { id } = await params;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, evidence.case.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    if (!canUserInWorkspace(user, evidence.case.workspaceId, 'delete_evidence')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete evidence' }, { status: 403 });
    }

    await deleteEvidence(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete evidence error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete evidence' }, { status: 500 });
  }
}
