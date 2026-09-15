import prisma from '../db/prisma';

export const STANDARD_INVESTIGATION_CHECKLIST = [
  'Confirm source identity and contact consent',
  'Confirm incident date and specific time window',
  'Confirm exact geographic location and jurisdiction',
  'Review primary documentary evidence and metadata',
  'Verify complaint / registration reference number',
  'Identify relevant statutory authority or official department',
  'Issue formal Right of Reply / enquiry letter to authority',
  'Track deadline and review official response',
  'Identify factual contradictions between source and authority',
  'Final editorial and legal safety review',
];

export async function createInvestigationTask(data: {
  caseId: string;
  title: string;
  description?: string;
  priority?: string;
  assignedToId?: string;
  dueDate?: Date;
  createdById: string;
}) {
  return prisma.task.create({
    data: {
      caseId: data.caseId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      status: 'TODO',
      assignedToId: data.assignedToId,
      dueDate: data.dueDate,
      createdById: data.createdById,
    },
    include: {
      assignedTo: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  });
}

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      completedAt: newStatus === 'DONE' ? new Date() : null,
    },
  });
}

export async function updateVerificationItem(itemId: string, data: {
  status: string;
  notes?: string;
  verifiedById?: string;
}) {
  return prisma.verificationItem.update({
    where: { id: itemId },
    data: {
      status: data.status,
      notes: data.notes,
      verifiedById: data.status === 'VERIFIED' ? data.verifiedById : null,
      verifiedAt: data.status === 'VERIFIED' ? new Date() : null,
    },
  });
}

export async function updateClaimStatus(claimId: string, status: string, notes?: string) {
  return prisma.claim.update({
    where: { id: claimId },
    data: {
      status,
      notes,
    },
  });
}

export async function createContact(data: {
  caseId: string;
  name: string;
  organization?: string;
  role?: string;
  phone?: string;
  email?: string;
  type?: string;
  notes?: string;
}) {
  return prisma.contact.create({
    data: {
      caseId: data.caseId,
      name: data.name,
      organization: data.organization,
      role: data.role,
      phone: data.phone,
      email: data.email,
      type: data.type || 'AUTHORITY',
      notes: data.notes,
    },
  });
}

export async function createResponseRequest(data: {
  caseId: string;
  contactId: string;
  requestedAt?: Date;
  deadline?: Date;
  method?: string;
  notes?: string;
}) {
  const req = await prisma.responseRequest.create({
    data: {
      caseId: data.caseId,
      contactId: data.contactId,
      requestedAt: data.requestedAt || new Date(),
      deadline: data.deadline,
      method: data.method || 'Email',
      status: 'REQUESTED',
      notes: data.notes,
    },
    include: {
      contact: true,
    },
  });

  // Log timeline event
  await prisma.caseEvent.create({
    data: {
      caseId: data.caseId,
      type: 'RESPONSE_REQUESTED',
      title: 'Right of Reply Dispatched',
      description: `Dispatched response enquiry to ${req.contact.name} (${req.contact.organization || 'Authority'}).`,
      eventDate: new Date(),
    },
  });

  return req;
}

export async function updateResponseRequestStatus(requestId: string, data: {
  status: string;
  responseText?: string;
  notes?: string;
}) {
  const updated = await prisma.responseRequest.update({
    where: { id: requestId },
    data: {
      status: data.status,
      responseText: data.responseText,
      responseReceivedAt: data.status === 'RECEIVED' ? new Date() : null,
      notes: data.notes,
    },
    include: {
      contact: true,
    },
  });

  if (data.status === 'RECEIVED') {
    await prisma.caseEvent.create({
      data: {
        caseId: updated.caseId,
        type: 'RESPONSE_RECEIVED',
        title: 'Authority Response Received',
        description: `Official response logged from ${updated.contact.name}.`,
        eventDate: new Date(),
      },
    });
  }

  return updated;
}
