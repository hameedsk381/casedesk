import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createInvestigationTask } from '@/lib/investigation/service';
import { getCurrentUser } from '@/lib/auth/permissions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const assignedToId = searchParams.get('assignedToId');
    const status = searchParams.get('status');

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        case: {
          select: { id: true, caseNumber: true, title: true, priority: true },
        },
        assignedTo: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const createdById = user?.id || (await prisma.user.findFirst())?.id;
    if (!createdById) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await createInvestigationTask({
      caseId: body.caseId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      assignedToId: body.assignedToId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      createdById,
    });

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500 });
  }
}
