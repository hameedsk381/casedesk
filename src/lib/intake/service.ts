import prisma from '../db/prisma';
import { triageIntakeItem } from './triage';
import { detectDuplicateIntake } from './duplicateDetector';
import { createCase } from '../cases/service';

export interface ListIntakeParams {
  workspaceId?: string;
  status?: string;
  sourceType?: string;
  priority?: string;
  category?: string;
  language?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'priority' | 'newest';
}

export async function listIntakeItems(params: ListIntakeParams = {}) {
  const {
    workspaceId,
    status = 'ALL',
    sourceType = 'ALL',
    priority = 'ALL',
    category = 'ALL',
    language = 'ALL',
    search,
    limit = 50,
    offset = 0,
    sortBy = 'priority',
  } = params;

  const where: any = {};

  if (workspaceId) {
    where.workspaceId = workspaceId;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (sourceType && sourceType !== 'ALL') {
    where.sourceType = sourceType;
  }

  if (priority && priority !== 'ALL') {
    where.aiPriority = priority;
  }

  if (category && category !== 'ALL') {
    where.aiCategory = category;
  }

  if (language && language !== 'ALL') {
    where.preferredLanguage = language;
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { senderName: { contains: term } },
      { senderPhone: { contains: term } },
      { senderEmail: { contains: term } },
      { rawText: { contains: term } },
      { aiSummary: { contains: term } },
      { aiLocation: { contains: term } },
      { aiCategory: { contains: term } },
    ];
  }

  // Fetch items
  const [items, totalCount] = await Promise.all([
    prisma.intakeItem.findMany({
      where,
      include: {
        createdCase: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
          },
        },
        mergedCase: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
            status: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, avatarUrl: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
        attachments: true,
      },
      orderBy:
        sortBy === 'newest'
          ? { createdAt: 'desc' }
          : [
              // Custom sorting priority: URGENT -> HIGH -> NEEDS_REVIEW -> newest
              { createdAt: 'desc' },
            ],
      take: limit,
      skip: offset,
    }),
    prisma.intakeItem.count({ where }),
  ]);

  // Sort by priority if requested
  const priorityWeight: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const statusWeight: Record<string, number> = {
    NEEDS_REVIEW: 3,
    AI_TRIAGED: 2,
    NEEDS_INFORMATION: 1,
  };

  if (sortBy === 'priority') {
    items.sort((a, b) => {
      const pA = priorityWeight[a.aiPriority || 'MEDIUM'] || 0;
      const pB = priorityWeight[b.aiPriority || 'MEDIUM'] || 0;
      if (pB !== pA) return pB - pA;

      const sA = statusWeight[a.status] || 0;
      const sB = statusWeight[b.status] || 0;
      if (sB !== sA) return sB - sA;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return { items, totalCount };
}

export async function getIntakeCounts(workspaceId?: string) {
  const whereWorkspace = workspaceId ? { workspaceId } : {};

  const [total, needsReview, highPriority, potentialDuplicates, needsInformation] = await Promise.all([
    prisma.intakeItem.count({ where: whereWorkspace }),
    prisma.intakeItem.count({
      where: {
        ...whereWorkspace,
        status: { in: ['NEEDS_REVIEW', 'AI_TRIAGED', 'INCOMING'] },
      },
    }),
    prisma.intakeItem.count({
      where: {
        ...whereWorkspace,
        aiPriority: { in: ['HIGH', 'URGENT'] },
        status: { notIn: ['ARCHIVED', 'CASE_CREATED', 'MERGED'] },
      },
    }),
    prisma.intakeItem.count({
      where: {
        ...whereWorkspace,
        duplicateCandidate: true,
        status: { notIn: ['ARCHIVED', 'MERGED'] },
      },
    }),
    prisma.intakeItem.count({
      where: {
        ...whereWorkspace,
        status: 'NEEDS_INFORMATION',
      },
    }),
  ]);

  return {
    total,
    needsReview,
    highPriority,
    potentialDuplicates,
    needsInformation,
  };
}

export async function getIntakeItemById(id: string) {
  return prisma.intakeItem.findUnique({
    where: { id },
    include: {
      createdCase: {
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
          priority: true,
          category: true,
        },
      },
      mergedCase: {
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
        },
      },
      assignedTo: {
        select: { id: true, name: true, avatarUrl: true },
      },
      reviewedBy: {
        select: { id: true, name: true },
      },
      attachments: true,
    },
  });
}

export async function createIntakeItem(data: {
  workspaceId: string;
  sourceType: string;
  senderName: string;
  senderPhone?: string;
  senderEmail?: string;
  preferredLanguage?: string;
  rawText: string;
  transcription?: string;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
    type?: string;
  }>;
  assignedToId?: string;
}) {
  // 1. Run AI Triage
  const textToAnalyze = data.transcription || data.rawText;
  const triage = await triageIntakeItem(textToAnalyze, data.sourceType);

  // 2. Run Duplicate Detection against active cases
  const existingCases = await prisma.case.findMany({
    where: { workspaceId: data.workspaceId },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      summary: true,
      category: true,
      location: true,
    },
    take: 50,
  });

  const dupCheck = detectDuplicateIntake(textToAnalyze, triage.category, triage.location, existingCases);

  const preferredLanguage = data.preferredLanguage || triage.language || 'English';

  const item = await prisma.intakeItem.create({
    data: {
      workspaceId: data.workspaceId,
      sourceType: data.sourceType,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      senderEmail: data.senderEmail,
      preferredLanguage,
      rawText: data.rawText,
      transcription: data.transcription,
      attachmentCount: data.attachments?.length || 0,
      status: 'NEEDS_REVIEW',
      aiCategory: triage.category,
      aiSummary: triage.summary,
      aiPriority: triage.priority,
      aiPriorityReason: triage.priorityReason,
      aiLocation: triage.location,
      aiEntities: JSON.stringify({
        people: triage.people,
        organizations: triage.organizations,
        dates: triage.dates,
      }),
      aiClaims: JSON.stringify(triage.claims),
      aiMissingInformation: JSON.stringify(triage.missingInformation),
      sensitiveInfoDetected: JSON.stringify(triage.sensitiveInfo),
      duplicateCandidate: dupCheck.isDuplicate,
      duplicateCaseId: dupCheck.candidateCaseId,
      assignedToId: data.assignedToId,
      attachments: data.attachments && data.attachments.length > 0
        ? {
            create: data.attachments.map((att) => ({
              fileName: att.fileName,
              filePath: att.filePath,
              mimeType: att.mimeType,
              size: att.size,
              type: att.type || 'DOCUMENT',
            })),
          }
        : undefined,
    },
    include: {
      attachments: true,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId: data.workspaceId,
      userId: data.assignedToId || (await prisma.user.findFirst({ where: { role: 'OWNER' } }))?.id || '',
      action: 'INTAKE_RECEIVED',
      metadata: JSON.stringify({
        intakeId: item.id,
        senderName: item.senderName,
        sourceType: item.sourceType,
        priority: item.aiPriority,
      }),
    },
  });

  return item;
}

export async function updateIntakeReview(
  id: string,
  data: {
    aiCategory?: string;
    aiPriority?: string;
    aiPriorityReason?: string;
    aiSummary?: string;
    aiLocation?: string;
    aiClaims?: string[];
    aiMissingInformation?: string[];
    assignedToId?: string;
    status?: string;
  },
  userId: string
) {
  const item = await prisma.intakeItem.update({
    where: { id },
    data: {
      ...(data.aiCategory !== undefined ? { aiCategory: data.aiCategory } : {}),
      ...(data.aiPriority !== undefined ? { aiPriority: data.aiPriority } : {}),
      ...(data.aiPriorityReason !== undefined ? { aiPriorityReason: data.aiPriorityReason } : {}),
      ...(data.aiSummary !== undefined ? { aiSummary: data.aiSummary } : {}),
      ...(data.aiLocation !== undefined ? { aiLocation: data.aiLocation } : {}),
      ...(data.aiClaims !== undefined ? { aiClaims: JSON.stringify(data.aiClaims) } : {}),
      ...(data.aiMissingInformation !== undefined
        ? { aiMissingInformation: JSON.stringify(data.aiMissingInformation) }
        : {}),
      ...(data.assignedToId !== undefined ? { assignedToId: data.assignedToId } : {}),
      ...(data.status !== undefined ? { status: data.status } : { status: 'NEEDS_REVIEW' }),
      reviewedAt: new Date(),
      reviewedById: userId,
    },
    include: {
      attachments: true,
      createdCase: true,
      mergedCase: true,
    },
  });

  await prisma.activityLog.create({
    data: {
      workspaceId: item.workspaceId,
      userId,
      action: 'INTAKE_REVIEWED',
      metadata: JSON.stringify({ intakeId: item.id, senderName: item.senderName }),
    },
  });

  return item;
}

export async function createCaseFromIntake(
  intakeId: string,
  userId: string,
  overrides: {
    title?: string;
    summary?: string;
    category?: string;
    priority?: string;
    location?: string;
    assignedToId?: string;
  } = {}
) {
  const item = await prisma.intakeItem.findUnique({
    where: { id: intakeId },
    include: { attachments: true },
  });

  if (!item) throw new Error('Intake item not found');

  let parsedClaims: string[] = [];
  try {
    if (item.aiClaims) parsedClaims = JSON.parse(item.aiClaims);
  } catch {
    parsedClaims = [item.rawText.slice(0, 150)];
  }

  const title =
    overrides.title ||
    item.aiSummary?.slice(0, 80) ||
    `Grievance from ${item.senderName} (${item.sourceType})`;

  const category = overrides.category || item.aiCategory || 'Civic Infrastructure';
  const priority = overrides.priority || item.aiPriority || 'MEDIUM';
  const location = overrides.location || item.aiLocation || 'Andhra Pradesh';

  // 1. Create Case
  const newCase = await createCase({
    workspaceId: item.workspaceId,
    createdById: userId,
    title,
    summary: overrides.summary || item.aiSummary || item.rawText.slice(0, 300),
    category,
    priority,
    location,
    sourceType: item.sourceType,
    sourceText: item.transcription ? `[Audio Transcript]: ${item.transcription}` : item.rawText,
    aiSummary: item.aiSummary || undefined,
    aiPriorityReason: item.aiPriorityReason || 'Created from Intake Inbox',
    assignedToId: overrides.assignedToId || item.assignedToId || userId,
    nextAction: 'Review citizen intake dossier, corroborate statements, and schedule witness call',
    healthStatus: 'NEEDS_ATTENTION',
    healthReason: 'Newly created from intake report; pending initial triage investigation',
    source: {
      name: item.senderName,
      phone: item.senderPhone || undefined,
      email: item.senderEmail || undefined,
      preferredLanguage: item.preferredLanguage,
      location,
      notes: `Original channel: ${item.sourceType}. Received: ${item.createdAt.toISOString()}`,
      anonymous: false,
      consentToContact: true,
      consentToPublish: false,
    },
    claims: parsedClaims.map((c) => ({
      text: c,
      status: 'UNVERIFIED',
      source: item.senderName,
    })),
  });

  // 2. Associate attachments as evidence if any
  if (item.attachments && item.attachments.length > 0) {
    for (const att of item.attachments) {
      await prisma.evidence.create({
        data: {
          caseId: newCase.id,
          name: att.fileName,
          type: att.type || 'DOCUMENT',
          filePath: att.filePath,
          mimeType: att.mimeType,
          size: att.size,
          description: `Original intake attachment from ${item.senderName} (${item.sourceType})`,
          verificationStatus: 'UNVERIFIED',
          uploadedById: userId,
        },
      });
    }
  }

  // 3. Add timeline event to Case
  await prisma.caseEvent.create({
    data: {
      caseId: newCase.id,
      type: 'CASE_CREATED',
      title: 'Case created from intake',
      description: `Case dossier initiated from citizen report by ${item.senderName} received via ${item.sourceType}.`,
      createdById: userId,
      eventDate: new Date(),
    },
  });

  // 4. Update IntakeItem status
  await prisma.intakeItem.update({
    where: { id: item.id },
    data: {
      status: 'CASE_CREATED',
      createdCaseId: newCase.id,
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });

  // 5. Activity Log
  await prisma.activityLog.create({
    data: {
      workspaceId: item.workspaceId,
      caseId: newCase.id,
      userId,
      action: 'CASE_CREATED_FROM_INTAKE',
      metadata: JSON.stringify({
        intakeId: item.id,
        caseNumber: newCase.caseNumber,
        sourceType: item.sourceType,
      }),
    },
  });

  return newCase;
}

export async function mergeIntakeWithCase(intakeId: string, targetCaseId: string, userId: string) {
  const item = await prisma.intakeItem.findUnique({
    where: { id: intakeId },
    include: { attachments: true },
  });

  if (!item) throw new Error('Intake item not found');

  const targetCase = await prisma.case.findUnique({
    where: { id: targetCaseId },
  });

  if (!targetCase) throw new Error('Target case not found');

  // 1. Copy attachments as evidence to target case
  if (item.attachments && item.attachments.length > 0) {
    for (const att of item.attachments) {
      await prisma.evidence.create({
        data: {
          caseId: targetCase.id,
          name: att.fileName,
          type: att.type || 'DOCUMENT',
          filePath: att.filePath,
          mimeType: att.mimeType,
          size: att.size,
          description: `Merged intake attachment from ${item.senderName} (${item.sourceType})`,
          verificationStatus: 'UNVERIFIED',
          uploadedById: userId,
        },
      });
    }
  }

  // 2. Add timeline event to target Case
  await prisma.caseEvent.create({
    data: {
      caseId: targetCase.id,
      type: 'STATUS_CHANGED',
      title: 'Additional report merged from intake inbox',
      description: `Secondary corroborating report from ${item.senderName} (${item.sourceType}) merged to strengthen case provenance.`,
      createdById: userId,
      eventDate: new Date(),
    },
  });

  // 3. Update IntakeItem
  const updatedItem = await prisma.intakeItem.update({
    where: { id: item.id },
    data: {
      status: 'MERGED',
      duplicateCaseId: targetCase.id,
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });

  // 4. Activity Log
  await prisma.activityLog.create({
    data: {
      workspaceId: item.workspaceId,
      caseId: targetCase.id,
      userId,
      action: 'INTAKE_MERGED',
      metadata: JSON.stringify({
        intakeId: item.id,
        targetCaseNumber: targetCase.caseNumber,
        sender: item.senderName,
      }),
    },
  });

  return { item: updatedItem, case: targetCase };
}

export async function requestInformationFromIntake(
  intakeId: string,
  requestedFields: string[],
  notes: string,
  userId: string
) {
  const item = await prisma.intakeItem.findUnique({
    where: { id: intakeId },
  });

  if (!item) throw new Error('Intake item not found');

  // Update status
  const updated = await prisma.intakeItem.update({
    where: { id: intakeId },
    data: {
      status: 'NEEDS_INFORMATION',
      aiMissingInformation: JSON.stringify(requestedFields),
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });

  // Activity Log
  await prisma.activityLog.create({
    data: {
      workspaceId: item.workspaceId,
      userId,
      action: 'INFORMATION_REQUESTED',
      metadata: JSON.stringify({
        intakeId: item.id,
        requestedFields,
        notes,
      }),
    },
  });

  return updated;
}

export async function archiveIntakeItem(intakeId: string, reason: string, userId: string) {
  const item = await prisma.intakeItem.update({
    where: { id: intakeId },
    data: {
      status: 'ARCHIVED',
      archiveReason: reason,
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });

  await prisma.activityLog.create({
    data: {
      workspaceId: item.workspaceId,
      userId,
      action: 'INTAKE_ARCHIVED',
      metadata: JSON.stringify({ intakeId: item.id, reason }),
    },
  });

  return item;
}

export async function bulkArchiveIntake(ids: string[], reason: string, userId: string) {
  return prisma.intakeItem.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'ARCHIVED',
      archiveReason: reason,
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });
}

export async function bulkAssignIntake(ids: string[], assignedToId: string, userId: string) {
  return prisma.intakeItem.updateMany({
    where: { id: { in: ids } },
    data: {
      assignedToId,
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });
}

export async function bulkMarkReviewed(ids: string[], userId: string) {
  return prisma.intakeItem.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'NEEDS_REVIEW',
      reviewedAt: new Date(),
      reviewedById: userId,
    },
  });
}
