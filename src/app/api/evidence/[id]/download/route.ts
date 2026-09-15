import { NextResponse } from 'next/server';
import fs from 'fs';
import { getEvidenceFilePath } from '@/lib/evidence/service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileInfo = await getEvidenceFilePath(id);

    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    const fileStream = fs.readFileSync(fileInfo.absolutePath);

    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': fileInfo.mimeType,
        'Content-Disposition': `inline; filename="${fileInfo.filename}"`,
        'Content-Length': fileInfo.size.toString(),
      },
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
  }
}
