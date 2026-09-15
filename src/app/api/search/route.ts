import { NextResponse } from 'next/server';
import { globalSearch } from '@/lib/search/service';
import prisma from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const ws = await prisma.workspace.findFirst();
    const results = await globalSearch(q, ws?.id);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
