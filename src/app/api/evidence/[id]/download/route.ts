import { NextResponse } from 'next/server';
import fs from 'fs';
import { getEvidenceFilePath } from '@/lib/evidence/service';
import { getCurrentUser, hasWorkspaceAccess } from '@/lib/auth/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const fileInfo = await getEvidenceFilePath(id);

    if (!fileInfo) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    // Verify workspace access
    if (!hasWorkspaceAccess(user, fileInfo.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    // Stream file without loading entire file into memory
    const nodeStream = fs.createReadStream(fileInfo.absolutePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': fileInfo.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileInfo.filename)}"`,
        'Content-Length': fileInfo.size.toString(),
      },
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json({ error: 'Error downloading file' }, { status: 500 });
  }
}
