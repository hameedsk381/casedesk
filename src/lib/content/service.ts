import prisma from '../db/prisma';

export interface PublicationSafetyCheck {
  isSafe: boolean;
  warnings: string[];
  blockers: string[];
  metrics: {
    unverifiedClaimsCount: number;
    pendingResponsesCount: number;
    incompleteTasksCount: number;
    hasSourcePublishConsent: boolean;
  };
}

export async function checkPublicationSafety(caseId: string): Promise<PublicationSafetyCheck> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      claims: true,
      responseRequests: true,
      tasks: true,
      sources: true,
    },
  });

  if (!caseRecord) {
    throw new Error('Case not found');
  }

  const warnings: string[] = [];
  const blockers: string[] = [];

  // Check claims
  const unverifiedClaims = caseRecord.claims.filter(
    (c) => c.status === 'UNVERIFIED' || c.status === 'DISPUTED'
  );
  if (unverifiedClaims.length > 0) {
    warnings.push(
      `Case has ${unverifiedClaims.length} unverified or disputed claim(s). Ensure language qualifies them as allegations.`
    );
  }

  // Check right of reply
  const pendingResponses = caseRecord.responseRequests.filter(
    (r) => r.status === 'REQUESTED' || r.status === 'FOLLOW_UP_REQUIRED'
  );
  if (pendingResponses.length > 0) {
    warnings.push(
      `${pendingResponses.length} authority response request(s) are still pending or awaiting follow-up.`
    );
  }

  // Check tasks
  const incompleteUrgentTasks = caseRecord.tasks.filter(
    (t) => t.status !== 'DONE' && (t.priority === 'HIGH' || t.priority === 'URGENT')
  );
  if (incompleteUrgentTasks.length > 0) {
    warnings.push(
      `${incompleteUrgentTasks.length} high/urgent investigation task(s) are not yet marked completed.`
    );
  }

  // Check source consent
  const sourceWithoutPublishConsent = caseRecord.sources.find(
    (s) => !s.consentToPublish && !s.anonymous
  );
  if (sourceWithoutPublishConsent) {
    warnings.push(
      `Source "${sourceWithoutPublishConsent.name}" has NOT consented to public identification. Names must be redacted or anonymized.`
    );
  }

  const isSafe = blockers.length === 0;

  return {
    isSafe,
    warnings,
    blockers,
    metrics: {
      unverifiedClaimsCount: unverifiedClaims.length,
      pendingResponsesCount: pendingResponses.length,
      incompleteTasksCount: incompleteUrgentTasks.length,
      hasSourcePublishConsent: !sourceWithoutPublishConsent,
    },
  };
}

export async function createContentDraft(data: {
  caseId: string;
  type: string;
  title: string;
  body: string;
  createdById: string;
}) {
  return prisma.content.create({
    data: {
      caseId: data.caseId,
      type: data.type,
      title: data.title,
      body: data.body,
      status: 'DRAFT',
      createdById: data.createdById,
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function updateContentStatus(contentId: string, status: string, userId?: string) {
  const updated = await prisma.content.update({
    where: { id: contentId },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
    include: {
      case: true,
    },
  });

  if (status === 'PUBLISHED') {
    await prisma.case.update({
      where: { id: updated.caseId },
      data: {
        publicationStatus: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await prisma.caseEvent.create({
      data: {
        caseId: updated.caseId,
        type: 'CONTENT_PUBLISHED',
        title: 'Content Published',
        description: `Content "${updated.title}" published as ${updated.type}.`,
        createdById: userId,
        eventDate: new Date(),
      },
    });
  }

  return updated;
}
