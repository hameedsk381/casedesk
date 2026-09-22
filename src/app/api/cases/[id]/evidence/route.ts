import { NextResponse } from 'next/server';
import { saveEvidenceFile } from '@/lib/evidence/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';
import { rejectCrossOrigin } from '@/lib/api/security';
import { validateEvidenceUpload } from '@/lib/evidence/validation';

export async function POST(
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

    if (!canUserInWorkspace(user, caseRecord.workspaceId, 'add_evidence')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to add evidence' }, { status: 403 });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 26 * 1024 * 1024) {
      return NextResponse.json({ error: 'Evidence files must not exceed 25 MB' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | undefined;

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validationError = validateEvidenceUpload(file, buffer);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const evidence = await saveEvidenceFile({
      caseId,
      uploadedById: user.id,
      fileBuffer: buffer,
      originalFilename: file.name,
      mimeType: file.type,
      description,
    });

    return NextResponse.json(evidence);
  } catch (error: any) {
    console.error('Evidence upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
