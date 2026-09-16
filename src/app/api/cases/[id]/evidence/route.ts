import { NextResponse } from 'next/server';
import { saveEvidenceFile } from '@/lib/evidence/service';
import { getCurrentUser, hasWorkspaceAccess, canUser } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canUser(user.role, 'add_evidence')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to add evidence' }, { status: 403 });
    }

    const { id: caseId } = await params;
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, workspaceId: true },
    });

    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, caseRecord.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const evidence = await saveEvidenceFile({
      caseId,
      uploadedById: user.id,
      fileBuffer: buffer,
      originalFilename: file.name,
      mimeType: file.type || 'application/octet-stream',
      description,
    });

    return NextResponse.json(evidence);
  } catch (error: any) {
    console.error('Evidence upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
