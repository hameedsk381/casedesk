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

  // Blockers: hard gates that must be cleared before content may be approved.

  // 1. Claims that are unverified or actively disputed must not be published
  //    as fact.
  const unverifiedClaims = caseRecord.claims.filter(
    (c) => c.status === 'UNVERIFIED' || c.status === 'DISPUTED'
  );
  if (unverifiedClaims.length > 0) {
    blockers.push(
      `${unverifiedClaims.length} claim(s) are still unverified or disputed. Corroborate them in the Claims tab before approval.`
    );
  }

  // 2. Right of reply must be complete (no outstanding authority requests).
  const settledResponseStatuses = new Set(['RECEIVED', 'NO_RESPONSE', 'NOT_REQUESTED']);
  const pendingResponses = caseRecord.responseRequests.filter(
    (r) => !settledResponseStatuses.has(r.status)
  );
  if (pendingResponses.length > 0) {
    blockers.push(
      `${pendingResponses.length} authority response request(s) are still pending or awaiting follow-up. Record the reply (or a documented no-response) first.`
    );
  }

  // 3. A named source must have consented to public identification.
  const sourceWithoutPublishConsent = caseRecord.sources.find(
    (s) => !s.consentToPublish && !s.anonymous
  );
  if (sourceWithoutPublishConsent) {
    blockers.push(
      `Source "${sourceWithoutPublishConsent.name}" has not consented to public identification. Redact or anonymize before approval.`
    );
  }

  // Warnings: advisory only; do not block approval.

  const partiallySupportedClaims = caseRecord.claims.filter(
    (c) => c.status === 'PARTIALLY_SUPPORTED'
  );
  if (partiallySupportedClaims.length > 0) {
    warnings.push(
      `${partiallySupportedClaims.length} claim(s) are only partially supported. Attribute or soften them before publication.`
    );
  }

  const incompleteUrgentTasks = caseRecord.tasks.filter(
    (t) => t.status !== 'DONE' && (t.priority === 'HIGH' || t.priority === 'URGENT')
  );
  if (incompleteUrgentTasks.length > 0) {
    warnings.push(
      `${incompleteUrgentTasks.length} high/urgent investigation task(s) are not yet marked completed.`
    );
  }

  if (caseRecord.sources.length === 0) {
    warnings.push(
      'No source is recorded on this case. Confirm provenance before publishing.'
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
