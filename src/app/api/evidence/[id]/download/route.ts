import { NextResponse } from 'next/server';
import { getEvidenceFilePath } from '@/lib/evidence/service';
import { openPrivateFileStream, toWebStream } from '@/lib/storage';
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
    const nodeStream = await openPrivateFileStream(fileInfo.relativePath);
    if (!nodeStream) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }
    const webStream = toWebStream(nodeStream);

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
