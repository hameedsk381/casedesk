import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCurrentUser, hasWorkspaceAccess } from '@/lib/auth/permissions';
import { openPrivateFileStream, toWebStream } from '@/lib/storage';

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
    const attachment = await prisma.intakeAttachment.findUnique({
      where: { id },
      include: {
        intakeItem: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    if (!hasWorkspaceAccess(user, attachment.intakeItem.workspaceId)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this workspace' }, { status: 403 });
    }

    const nodeStream = await openPrivateFileStream(attachment.filePath);
    if (!nodeStream) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    const webStream = toWebStream(nodeStream);

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': attachment.size.toString(),
      },
    });
  } catch (error: any) {
    console.error('Intake attachment download error:', error);
    return NextResponse.json({ error: 'Error downloading attachment' }, { status: 500 });
  }
}
