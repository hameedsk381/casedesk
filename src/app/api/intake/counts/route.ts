import { NextResponse } from 'next/server';
import { getIntakeCounts } from '@/lib/intake/service';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let workspaceId = searchParams.get('workspaceId') || undefined;
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst();
      workspaceId = ws?.id;
    }

    const counts = await getIntakeCounts(workspaceId);
    return NextResponse.json(counts);
  } catch (error: any) {
    console.error('Failed to get intake counts:', error);
    return NextResponse.json({ error: 'Failed to retrieve counts' }, { status: 500 });
  }
}
