import prisma from '../db/prisma';
import { triageIntakeItem } from '../intake/triage';
import { detectDuplicateIntake } from '../intake/duplicateDetector';
import { transcribeAudioWithGroq } from '../ai/groq';
import { getPrivateFilePath } from '../storage';

// Maximum concurrent AI triage workers to avoid Groq rate limit spikes
const MAX_CONCURRENCY = 2;
const activeJobs = new Set<string>();
const queue: string[] = [];
let runningWorkers = 0;

/**
 * Enqueues an intake item for asynchronous AI transcription, triage, and duplicate detection.
 */
export function enqueueIntakeTriage(intakeItemId: string): void {
  if (activeJobs.has(intakeItemId) || queue.includes(intakeItemId)) {
    return;
  }
  queue.push(intakeItemId);
  scheduleWorker();
}

function scheduleWorker(): void {
  while (runningWorkers < MAX_CONCURRENCY && queue.length > 0) {
    const nextId = queue.shift();
    if (nextId) {
      runningWorkers++;
      activeJobs.add(nextId);
      processIntakeItem(nextId)
        .catch((err) => {
          console.error(`Error processing intake queue item ${nextId}:`, err);
        })
        .finally(() => {
          activeJobs.delete(nextId);
          runningWorkers--;
          scheduleWorker();
        });
    }
  }
}

/**
 * Helper to retry async functions with exponential backoff for external API resilience (e.g. Groq 429/503).
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries <= 0) throw error;
    console.warn(`AI request failed, retrying in ${delayMs}ms... Error:`, error?.message || error);
    await new Promise((res) => setTimeout(res, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Executes full background triage lifecycle for an IntakeItem.
 */
async function processIntakeItem(intakeItemId: string): Promise<void> {
  const item = await prisma.intakeItem.findUnique({
    where: { id: intakeItemId },
    include: {
      attachments: true,
      workspace: {
        select: { id: true, name: true },
      },
    },
  });

  if (!item || item.status !== 'INCOMING') {
    return;
  }

  let story = item.rawText || '';
  let transcription = item.transcription;

  // 1. Audio Transcription if voice note exists without transcription
  if (!transcription && item.attachments.length > 0) {
    const audioAttachment = item.attachments.find(
      (a) => a.type === 'AUDIO' || a.mimeType?.startsWith('audio/')
    );

    if (audioAttachment) {
      try {
        const diskPath = getPrivateFilePath(audioAttachment.filePath);
        if (diskPath) {
          const langCode = item.preferredLanguage === 'Telugu' ? 'te' : 'en';
          const transcribed = await withRetry(() =>
            transcribeAudioWithGroq(diskPath, langCode)
          );

          if (transcribed) {
            transcription = transcribed;
            if (!story || story.startsWith('Voice dispatch')) {
              story = transcribed;
            }
          }
        }
      } catch (audioErr) {
        console.warn(`Voice transcription failed for intake ${item.id}:`, audioErr);
      }
    }
  }

  // 2. Run AI Triage with resilience fallback
  let triaged: any = null;
  try {
    triaged = await withRetry(() =>
      triageIntakeItem(story || 'Citizen dispatch received without text body', item.sourceType)
    );
  } catch (triageErr) {
    console.error(`AI triage failed for intake ${item.id} after retries:`, triageErr);
  }

  // 3. Targeted duplicate candidate search (scoped by workspace & category)
  let duplicateCandidate = false;
  let candidateCaseId: string | null = null;

  try {
    const targetCategory = item.aiCategory || triaged?.category || undefined;
    const existingCases = await prisma.case.findMany({
      where: {
        workspaceId: item.workspaceId,
        ...(targetCategory ? { category: targetCategory } : {}),
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        summary: true,
        category: true,
        location: true,
      },
    });

    if (existingCases.length > 0) {
      const duplicateResult = detectDuplicateIntake(
        story,
        targetCategory || 'Other',
        item.aiLocation || triaged?.location || '',
        existingCases
      );

      if (duplicateResult.isDuplicate && duplicateResult.candidateCaseId) {
        duplicateCandidate = true;
        candidateCaseId = duplicateResult.candidateCaseId;
      }
    }
  } catch (dupErr) {
    console.warn(`Duplicate check failed for intake ${item.id}:`, dupErr);
  }

  // 4. Update IntakeItem with results and transition status to NEEDS_REVIEW
  await prisma.intakeItem.update({
    where: { id: intakeItemId },
    data: {
      rawText: story,
      transcription: transcription || null,
      status: 'NEEDS_REVIEW',
      aiSummary: triaged?.summary || 'Citizen report received. Editorial review required.',
      aiCategory: item.aiCategory || triaged?.category || 'General Civic Issue',
      aiPriority: triaged?.priority || 'MEDIUM',
      aiPriorityReason: triaged?.priorityReason || null,
      aiLocation: item.aiLocation || triaged?.location || null,
      aiEntities: triaged
        ? JSON.stringify({
            people: triaged.people || [],
            organizations: triaged.organizations || [],
            dates: triaged.dates || [],
          })
        : null,
      aiClaims: triaged?.claims ? JSON.stringify(triaged.claims) : null,
      aiMissingInformation: triaged?.missingInformation
        ? JSON.stringify(triaged.missingInformation)
        : null,
      sensitiveInfoDetected: triaged?.sensitiveInfoDetected
        ? JSON.stringify(triaged.sensitiveInfoDetected)
        : null,
      duplicateCandidate,
      duplicateCaseId: candidateCaseId,
    },
  });
}

/**
 * Recovers and enqueues any items that were left in INCOMING status due to server restarts.
 */
export async function processPendingIntakes(): Promise<number> {
  const pending = await prisma.intakeItem.findMany({
    where: { status: 'INCOMING' },
    select: { id: true },
    take: 20,
  });

  for (const item of pending) {
    enqueueIntakeTriage(item.id);
  }

  return pending.length;
}
