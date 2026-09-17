import prisma from '../db/prisma';
import { triageIntakeItem } from '../intake/triage';
import { detectDuplicateIntake } from '../intake/duplicateDetector';
import { transcribeAudioWithGroq } from '../ai/groq';
import { getPrivateFilePath } from '../storage';

const MAX_CONCURRENCY = 2;
const STALE_LOCK_MS = 10 * 60 * 1000;
let runningWorkers = 0;
let draining = false;
let workerStarted = false;

/** Keeps delayed retries moving even when no new citizen submits a report. */
export function startIntakeQueueWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  setInterval(() => void drainIntakeTriageQueue(), 30_000).unref?.();
  void drainIntakeTriageQueue();
}

/** Starts a non-blocking drain after a triage job is committed. */
export function enqueueIntakeTriage(_intakeItemId?: string): void {
  void drainIntakeTriageQueue();
}

/** Creates durable jobs for submissions that predate the queue table, then drains eligible work. */
export async function processPendingIntakes(): Promise<number> {
  const pending = await prisma.intakeItem.findMany({
    where: { status: 'INCOMING', triageJob: { is: null } },
    select: { id: true, workspaceId: true },
    take: 100,
  });

  if (pending.length > 0) {
    await prisma.$transaction(
      pending.map((item) =>
        prisma.intakeTriageJob.create({ data: { intakeItemId: item.id, workspaceId: item.workspaceId } })
      )
    );
  }
  await drainIntakeTriageQueue();
  return pending.length;
}

/** Claims persisted jobs atomically, so jobs survive restarts and may run on multiple app instances. */
export async function drainIntakeTriageQueue(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    const now = new Date();
    await prisma.intakeTriageJob.updateMany({
      where: { status: 'RUNNING', lockedAt: { lt: new Date(now.getTime() - STALE_LOCK_MS) } },
      data: { status: 'QUEUED', lockedAt: null, availableAt: now },
    });

    while (runningWorkers < MAX_CONCURRENCY) {
      const jobs = await prisma.intakeTriageJob.findMany({
        where: { status: 'QUEUED', availableAt: { lte: new Date() } },
        orderBy: { createdAt: 'asc' }, take: 20,
        select: { id: true, attempts: true, maxAttempts: true },
      });
      if (!jobs.length) break;
      let claimed = false;
      for (const job of jobs) {
        if (runningWorkers >= MAX_CONCURRENCY) break;
        const result = await prisma.intakeTriageJob.updateMany({
          where: { id: job.id, status: 'QUEUED', availableAt: { lte: new Date() } },
          data: { status: 'RUNNING', lockedAt: new Date(), attempts: { increment: 1 } },
        });
        if (!result.count) continue;
        claimed = true;
        runningWorkers++;
        void runJob(job.id, job.attempts + 1, job.maxAttempts).finally(() => {
          runningWorkers--;
          void drainIntakeTriageQueue();
        });
      }
      if (!claimed) break;
    }
  } finally {
    draining = false;
  }
}

async function runJob(jobId: string, attempt: number, maxAttempts: number): Promise<void> {
  try {
    const job = await prisma.intakeTriageJob.findUnique({ where: { id: jobId }, select: { intakeItemId: true } });
    if (!job) return;
    await processIntakeItem(job.intakeItemId);
    await prisma.intakeTriageJob.update({ where: { id: jobId }, data: { status: 'COMPLETED', completedAt: new Date(), lockedAt: null, lastError: null } });
  } catch (error: any) {
    const exhausted = attempt >= maxAttempts;
    await prisma.intakeTriageJob.update({
      where: { id: jobId },
      data: exhausted
        ? { status: 'FAILED', lockedAt: null, lastError: error?.message || 'Unknown triage processing error' }
        : { status: 'QUEUED', lockedAt: null, availableAt: new Date(Date.now() + Math.min(30_000 * 2 ** (attempt - 1), 900_000)), lastError: error?.message || 'Unknown triage processing error' },
    });
    console.error(`Intake triage job ${jobId} failed on attempt ${attempt}:`, error);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1500): Promise<T> {
  try { return await fn(); } catch (error: any) {
    if (retries <= 0) throw error;
    console.warn(`AI request failed, retrying in ${delayMs}ms:`, error?.message || error);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

async function processIntakeItem(intakeItemId: string): Promise<void> {
  const item = await prisma.intakeItem.findUnique({
    where: { id: intakeItemId }, include: { attachments: true, workspace: { select: { id: true, name: true } } },
  });
  if (!item || item.status !== 'INCOMING') return;

  let story = item.rawText || '';
  let transcription = item.transcription;
  const audio = item.attachments.find((attachment) => attachment.type === 'AUDIO' || attachment.mimeType?.startsWith('audio/'));
  if (!transcription && audio) {
    try {
      const path = getPrivateFilePath(audio.filePath);
      if (path) {
        const result = await withRetry(() => transcribeAudioWithGroq(path, item.preferredLanguage === 'Telugu' ? 'te' : 'en'));
        if (result) { transcription = result; if (!story || story.startsWith('Voice dispatch')) story = result; }
      }
    } catch (error) { console.warn(`Voice transcription failed for intake ${item.id}:`, error); }
  }

  let triaged: any = null;
  try { triaged = await withRetry(() => triageIntakeItem(story || 'Citizen dispatch received without text body', item.sourceType)); }
  catch (error) { console.error(`AI triage failed for intake ${item.id} after retries:`, error); }

  let duplicateCandidate = false;
  let duplicateCaseId: string | null = null;
  try {
    const category = item.aiCategory || triaged?.category || undefined;
    const cases = await prisma.case.findMany({
      where: { workspaceId: item.workspaceId, ...(category ? { category } : {}) }, take: 50, orderBy: { createdAt: 'desc' },
      select: { id: true, caseNumber: true, title: true, summary: true, category: true, location: true },
    });
    if (cases.length) {
      const duplicate = detectDuplicateIntake(story, category || 'Other', item.aiLocation || triaged?.location || '', cases);
      duplicateCandidate = duplicate.isDuplicate;
      duplicateCaseId = duplicate.candidateCaseId || null;
    }
  } catch (error) { console.warn(`Duplicate check failed for intake ${item.id}:`, error); }

  await prisma.intakeItem.update({ where: { id: intakeItemId }, data: {
    rawText: story, transcription: transcription || null, status: 'NEEDS_REVIEW',
    aiSummary: triaged?.summary || 'Citizen submission received. Team review required.',
    aiCategory: item.aiCategory || triaged?.category || 'General Civic Issue', aiPriority: triaged?.priority || 'MEDIUM',
    aiPriorityReason: triaged?.priorityReason || null, aiLocation: item.aiLocation || triaged?.location || null,
    aiEntities: triaged ? JSON.stringify({ people: triaged.people || [], organizations: triaged.organizations || [], dates: triaged.dates || [] }) : null,
    aiClaims: triaged?.claims ? JSON.stringify(triaged.claims) : null,
    aiMissingInformation: triaged?.missingInformation ? JSON.stringify(triaged.missingInformation) : null,
    sensitiveInfoDetected: triaged?.sensitiveInfo ? JSON.stringify(triaged.sensitiveInfo) : null,
    duplicateCandidate, duplicateCaseId,
  } });
}
