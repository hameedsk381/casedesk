import prisma from '../db/prisma';
import { createCase } from '../cases/service';

export interface ListInboxParams {
  workspaceId?: string;
  status?: string;
  channel?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listInboxMessages(params: ListInboxParams = {}) {
  const {
    workspaceId,
    status = 'ALL',
    channel = 'ALL',
    search,
    limit = 50,
    offset = 0,
  } = params;

  const where: any = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (channel && channel !== 'ALL') {
    where.sourceChannel = channel;
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { senderName: { contains: term } },
      { senderContact: { contains: term } },
      { rawText: { contains: term } },
      { aiSuggestedTitle: { contains: term } },
    ];
  }

  const [messages, totalCount, unprocessedCount] = await Promise.all([
    prisma.inboxMessage.findMany({
      where,
      include: {
        convertedCase: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.inboxMessage.count({ where }),
    prisma.inboxMessage.count({
      where: {
        ...(workspaceId ? { workspaceId } : {}),
        status: 'UNPROCESSED',
      },
    }),
  ]);

  return { messages, totalCount, unprocessedCount };
}

export async function getInboxMessage(id: string) {
  return prisma.inboxMessage.findUnique({
    where: { id },
    include: {
      convertedCase: {
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

export async function createInboxMessage(data: {
  workspaceId: string;
  sourceChannel: string;
  senderName: string;
  senderContact?: string;
  rawText: string;
  aiSuggestedTitle?: string;
  aiSuggestedCategory?: string;
  aiSuggestedPriority?: string;
  aiSummary?: string;
}) {
  return prisma.inboxMessage.create({
    data: {
      workspaceId: data.workspaceId,
      sourceChannel: data.sourceChannel,
      senderName: data.senderName,
      senderContact: data.senderContact,
      rawText: data.rawText,
      aiSuggestedTitle: data.aiSuggestedTitle || 'Citizen Report — ' + data.senderName,
      aiSuggestedCategory: data.aiSuggestedCategory || 'Civic Infrastructure',
      aiSuggestedPriority: data.aiSuggestedPriority || 'MEDIUM',
      aiSummary: data.aiSummary || data.rawText.slice(0, 200),
      status: 'UNPROCESSED',
    },
  });
}

export async function convertInboxToCase(params: {
  messageId: string;
  userId: string;
  workspaceId: string;
  title?: string;
  category?: string;
  priority?: string;
  location?: string;
  assignedToId?: string;
}) {
  const message = await prisma.inboxMessage.findUnique({
    where: { id: params.messageId },
  });

  if (!message) {
    throw new Error('Inbox message not found');
  }

  const title = params.title || message.aiSuggestedTitle || `Report from ${message.senderName}`;
  const category = params.category || message.aiSuggestedCategory || 'Civic Infrastructure';
  const priority = params.priority || message.aiSuggestedPriority || 'MEDIUM';
  const location = params.location || 'Reported Location Pending Verification';

  const newCase = await createCase({
    workspaceId: params.workspaceId,
    createdById: params.userId,
    title,
    summary: message.aiSummary || message.rawText.slice(0, 300),
    category,
    priority,
    location,
    sourceType: message.sourceChannel,
    sourceText: message.rawText,
    aiSummary: message.aiSummary || undefined,
    aiPriorityReason: 'Converted from incoming citizen report in intake inbox',
    assignedToId: params.assignedToId || params.userId,
    nextAction: 'Review citizen message details, verify contact authenticity, and request supporting media',
    healthStatus: 'NEEDS_ATTENTION',
    healthReason: 'Recently converted from inbox; requires intake triage and witness call',
    source: {
      name: message.senderName,
      phone: message.senderContact?.startsWith('+') ? message.senderContact : undefined,
      email: message.senderContact?.includes('@') ? message.senderContact : undefined,
      notes: `Original channel: ${message.sourceChannel}. Received: ${message.receivedAt.toISOString()}`,
      anonymous: false,
      consentToContact: true,
      consentToPublish: false,
    },
    claims: [
      {
        text: message.rawText.slice(0, 250),
        status: 'UNVERIFIED',
        source: message.senderName,
      },
    ],
  });

  // Update message status
  await prisma.inboxMessage.update({
    where: { id: message.id },
    data: {
      status: 'PROCESSED',
      convertedCaseId: newCase.id,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId: params.workspaceId,
      caseId: newCase.id,
      userId: params.userId,
      action: 'INBOX_CONVERTED',
      metadata: JSON.stringify({
        messageId: message.id,
        sender: message.senderName,
        caseNumber: newCase.caseNumber,
      }),
    },
  });

  return newCase;
}

export async function ignoreInboxMessage(messageId: string) {
  return prisma.inboxMessage.update({
    where: { id: messageId },
    data: {
      status: 'IGNORED',
    },
  });
}

export async function restoreInboxMessage(messageId: string) {
  return prisma.inboxMessage.update({
    where: { id: messageId },
    data: {
      status: 'UNPROCESSED',
    },
  });
}
