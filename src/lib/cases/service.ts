import prisma from '../db/prisma';
import { Prisma } from '@prisma/client';
import { generateCaseNumber } from './caseNumber';
import { pickAllowedFields } from '../api/security';

export interface ListCasesParams {
  workspaceId?: string;
  status?: string;
  priority?: string;
  category?: string;
  verificationStatus?: string;
  assignedToId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listCases(params: ListCasesParams = {}) {
  const {
    workspaceId,
    status,
    priority,
    category,
    verificationStatus,
    assignedToId,
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

  if (priority && priority !== 'ALL') {
    where.priority = priority;
  }

  if (category && category !== 'ALL') {
    where.category = category;
  }

  if (verificationStatus && verificationStatus !== 'ALL') {
    where.verificationStatus = verificationStatus;
  }

  if (assignedToId && assignedToId !== 'ALL') {
    where.assignedToId = assignedToId;
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { caseNumber: { contains: term } },
      { title: { contains: term } },
      { summary: { contains: term } },
      { location: { contains: term } },
      {
        sources: {
          some: {
            name: { contains: term },
          },
        },
      },
    ];
  }

  const [rawCases, totalCount] = await Promise.all([
    prisma.case.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        sources: {
          take: 1,
        },
        verificationItems: {
          select: { id: true, status: true },
        },
        _count: {
          select: {
            claims: true,
            evidence: true,
            tasks: true,
            contents: true,
            verificationItems: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.case.count({ where }),
  ]);

  const cases = rawCases.map((c) => {
    const totalVerif = c.verificationItems?.length || 0;
    const verifiedCount = c.verificationItems?.filter((v) => v.status === 'VERIFIED').length || 0;
    const verificationPercentage = totalVerif > 0 ? Math.round((verifiedCount / totalVerif) * 100) : 0;
    return {
      ...c,
      verifiedCount,
      totalVerificationCount: totalVerif,
      verificationPercentage,
    };
  });

  return { cases, totalCount };
}

export interface CaseHealthResult {
  healthStatus: 'ON_TRACK' | 'NEEDS_ATTENTION' | 'BLOCKED';
  healthReason: string;
}

export function calculateCaseHealth(caseRecord: {
  status: string;
  priority: string;
  responseRequests?: Array<{ deadline?: Date | string | null; status: string }>;
  verificationItems?: Array<{ status: string }>;
  claims?: Array<{ status: string }>;
  assignedToId?: string | null;
}): CaseHealthResult {
  const now = new Date();

  // 1. Check for overdue response requests
  const overdueRequests = (caseRecord.responseRequests || []).filter(
    (r) => r.status !== 'RECEIVED' && r.deadline && new Date(r.deadline) < now
  );
  if (overdueRequests.length > 0) {
    const daysOverdue = Math.max(
      1,
      Math.floor((now.getTime() - new Date(overdueRequests[0].deadline!).getTime()) / (1000 * 60 * 60 * 24))
    );
    return {
      healthStatus: 'BLOCKED',
      healthReason: `Authority right-of-reply overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
    };
  }

  // 2. Check for unassigned urgent/high priority
  if (!caseRecord.assignedToId && (caseRecord.priority === 'URGENT' || caseRecord.priority === 'HIGH')) {
    return {
      healthStatus: 'NEEDS_ATTENTION',
      healthReason: 'High priority case unassigned; triage required',
    };
  }

  // 3. Check for approaching deadlines (within next 48h)
  const upcomingRequests = (caseRecord.responseRequests || []).filter(
    (r) =>
      r.status !== 'RECEIVED' &&
      r.deadline &&
      new Date(r.deadline) >= now &&
      new Date(r.deadline).getTime() - now.getTime() <= 48 * 3600 * 1000
  );
  if (upcomingRequests.length > 0) {
    return {
      healthStatus: 'NEEDS_ATTENTION',
      healthReason: 'Right of reply deadline approaching within 48 hours',
    };
  }

  // 4. Claims and verification status checks
  const totalVerif = caseRecord.verificationItems?.length || 0;
  const verifiedVerif = (caseRecord.verificationItems || []).filter((v) => v.status === 'VERIFIED').length;

  if (caseRecord.status === 'UNDER_REVIEW' || caseRecord.status === 'VERIFICATION') {
    if (totalVerif === 0 || verifiedVerif === 0) {
      return {
        healthStatus: 'NEEDS_ATTENTION',
        healthReason: 'Core factual claims require corroboration & field evidence',
      };
    }
  }

  if (caseRecord.status === 'RESOLVED' || caseRecord.status === 'CLOSED') {
    return {
      healthStatus: 'ON_TRACK',
      healthReason: 'Case resolved or archived',
    };
  }

  return {
    healthStatus: 'ON_TRACK',
    healthReason: 'Investigation progressing on schedule',
  };
}

export async function getCaseById(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: {
      workspace: true,
      assignedTo: {
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      sources: true,
      claims: {
        orderBy: { createdAt: 'asc' },
      },
      verificationItems: {
        include: {
          verifiedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      evidence: {
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      events: {
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { eventDate: 'desc' },
      },
      tasks: {
        include: {
          assignedTo: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      contacts: {
        include: {
          responseRequests: {
            orderBy: { requestedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      responseRequests: {
        include: {
          contact: true,
        },
        orderBy: { requestedAt: 'desc' },
      },
      contents: {
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      createdFromIntakes: {
        select: {
          id: true,
          sourceType: true,
          senderName: true,
          createdAt: true,
          aiSummary: true,
          rawText: true,
        },
      },
      mergedIntakes: {
        select: {
          id: true,
          sourceType: true,
          senderName: true,
          createdAt: true,
          aiSummary: true,
          rawText: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createCase(data: {
  workspaceId: string;
  createdById: string;
  title: string;
  summary: string;
  category: string;
  priority?: string;
  location: string;
  sourceType?: string;
  sourceText?: string;
  aiSummary?: string;
  aiPriorityReason?: string;
  assignedToId?: string;
  nextAction?: string;
  healthStatus?: string;
  healthReason?: string;
  source?: {
    name: string;
    phone?: string;
    email?: string;
    preferredLanguage?: string;
    location?: string;
    anonymous?: boolean;
    consentToContact?: boolean;
    consentToPublish?: boolean;
    notes?: string;
  };
  claims?: Array<{ text: string; status?: string; source?: string }>;
}) {
  const caseNumber = await generateCaseNumber();

  const newCase = await prisma.case.create({
    data: {
      caseNumber,
      workspaceId: data.workspaceId,
      createdById: data.createdById,
      title: data.title,
      summary: data.summary,
      category: data.category,
      priority: data.priority || 'MEDIUM',
      status: 'NEW',
      location: data.location,
      sourceType: data.sourceType || 'TEXT',
      sourceText: data.sourceText,
      aiSummary: data.aiSummary,
      aiPriorityReason: data.aiPriorityReason,
      assignedToId: data.assignedToId,
      verificationStatus: 'NOT_STARTED',
      publicationStatus: 'NOT_PUBLISHED',
      resolutionStatus: 'OPEN',
      nextAction: data.nextAction || 'Conduct initial witness interview and formulate verification plan',
      healthStatus: data.healthStatus || 'NEEDS_ATTENTION',
      healthReason: data.healthReason || 'Newly registered case awaiting initial triage and verification plan',
      sources: data.source
        ? {
            create: {
              name: data.source.name,
              phone: data.source.phone,
              email: data.source.email,
              preferredLanguage: data.source.preferredLanguage || 'English',
              location: data.source.location || data.location,
              anonymous: data.source.anonymous || false,
              consentToContact: data.source.consentToContact !== false,
              consentToPublish: data.source.consentToPublish || false,
              notes: data.source.notes,
            },
          }
        : undefined,
      claims: data.claims && data.claims.length > 0
        ? {
            create: data.claims.map((c) => ({
              text: c.text,
              status: c.status || 'UNVERIFIED',
              source: c.source || 'Complainant initial statement',
            })),
          }
        : undefined,
      events: {
        create: {
          type: 'CASE_CREATED',
          title: 'Case Registered',
          description: `Case ${caseNumber} created with category ${data.category}.`,
          createdById: data.createdById,
          eventDate: new Date(),
        },
      },
      activityLogs: {
        create: {
          workspaceId: data.workspaceId,
          userId: data.createdById,
          action: 'CASE_CREATED',
          metadata: JSON.stringify({ caseNumber, title: data.title }),
        },
      },
    },
    include: {
      sources: true,
      claims: true,
      assignedTo: true,
    },
  });

  return newCase;
}

export async function updateCase(id: string, data: any, userId?: string) {
  const safeData = pickAllowedFields<Record<string, unknown>>(data, [
    'title', 'summary', 'category', 'priority', 'status', 'location', 'sourceType',
    'sourceText', 'aiSummary', 'aiPriorityReason', 'verificationStatus',
    'publicationStatus', 'resolutionStatus', 'nextAction', 'healthStatus',
    'healthReason', 'assignedToId', 'publishedAt', 'resolvedAt',
  ]);
  const updated = await prisma.case.update({
    where: { id },
    data: safeData as Prisma.CaseUpdateInput,
  });

  if (userId) {
    await prisma.activityLog.create({
      data: {
        workspaceId: updated.workspaceId,
        caseId: updated.id,
        userId,
        action: 'CASE_UPDATED',
        metadata: JSON.stringify({ fields: Object.keys(safeData) }),
      },
    });
  }

  return updated;
}
