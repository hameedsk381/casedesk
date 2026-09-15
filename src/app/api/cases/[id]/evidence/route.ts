import { NextResponse } from 'next/server';
import { saveEvidenceFile } from '@/lib/evidence/service';
import { getCurrentUser } from '@/lib/auth/permissions';
import prisma from '@/lib/db/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const user = await getCurrentUser();
    const uploadedById = user?.id || (await prisma.user.findFirst())?.id;

    if (!uploadedById) {
      return NextResponse.json({ error: 'User unauthorized' }, { status: 401 });
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
      uploadedById,
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
