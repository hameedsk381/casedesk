import prisma from '../db/prisma';
import { isMailConfigured, sendMail } from '../mailer';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days without a reply at which each escalation level triggers. */
const LEVELS: Array<{ level: 1 | 2 | 3; days: number }> = [
  { level: 3, days: 30 },
  { level: 2, days: 14 },
  { level: 1, days: 7 },
];

const PRIORITY_BY_LEVEL = { 1: 'MEDIUM', 2: 'HIGH', 3: 'URGENT' } as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function targetLevel(daysWaiting: number): 0 | 1 | 2 | 3 {
  return LEVELS.find((l) => daysWaiting >= l.days)?.level ?? 0;
}

export interface EscalationResult {
  checked: number;
  escalated: number;
}

/**
 * Escalates authority response requests that have gone unanswered for 7, 14
 * and 30 days. Each level fires once per request: an atomic conditional update
 * claims the level, so it is safe to run from several instances or from both
 * the in-process timer and an external cron.
 *
 * Per escalation it creates a follow-up task for the case owner, notifies the
 * team (everyone at level 3) and moves the request status along
 * (7d -> FOLLOW_UP_REQUIRED, 30d -> NO_RESPONSE). At 30 days it also emails
 * the team when SMTP is configured.
 */
export async function runResponseEscalation(now = new Date()): Promise<EscalationResult> {
  const pending = await prisma.responseRequest.findMany({
    where: {
      status: { in: ['REQUESTED', 'FOLLOW_UP_REQUIRED', 'NO_RESPONSE'] },
      responseReceivedAt: null,
      escalationLevel: { lt: 3 },
      requestedAt: { lte: new Date(now.getTime() - LEVELS[LEVELS.length - 1].days * DAY_MS) },
    },
    take: 500,
    select: {
      id: true,
      status: true,
      requestedAt: true,
      escalationLevel: true,
      contact: { select: { organization: true, role: true } },
      case: {
        select: {
          id: true,
          caseNumber: true,
          title: true,
          workspaceId: true,
          assignedToId: true,
          createdById: true,
        },
      },
    },
  });

  let escalated = 0;

  for (const request of pending) {
    const daysWaiting = Math.floor((now.getTime() - request.requestedAt.getTime()) / DAY_MS);
    const level = targetLevel(daysWaiting);
    if (level === 0 || level <= request.escalationLevel) continue;

    const claimed = await prisma.responseRequest.updateMany({
      where: { id: request.id, escalationLevel: { lt: level }, responseReceivedAt: null },
      data: {
        escalationLevel: level,
        lastEscalatedAt: now,
        ...(level === 3
          ? { status: 'NO_RESPONSE' }
          : request.status === 'REQUESTED'
            ? { status: 'FOLLOW_UP_REQUIRED' }
            : {}),
      },
    });
    if (claimed.count === 0) continue; // another instance claimed this level
    escalated++;

    try {
      await notifyTeam({ request, level, daysWaiting });
    } catch (err: unknown) {
      // The level is already recorded; a failed notification must not block the rest.
      console.error('[escalation] Failed to notify for response request', request.id, err);
    }
  }

  return { checked: pending.length, escalated };
}

async function notifyTeam(params: {
  request: {
    id: string;
    contact: { organization: string | null; role: string | null };
    case: {
      id: string;
      caseNumber: string;
      title: string;
      workspaceId: string;
      assignedToId: string | null;
      createdById: string;
    };
  };
  level: 1 | 2 | 3;
  daysWaiting: number;
}) {
  const { request, level, daysWaiting } = params;
  const authority = request.contact.organization || request.contact.role || 'the concerned department';
  const owner = request.case.assignedToId || request.case.createdById;

  const label = level === 1 ? 'Follow up' : level === 2 ? 'Escalate' : 'Final escalation';
  const title = `${label}: no reply from ${authority} (${daysWaiting} days)`;
  const message =
    `${request.case.caseNumber} "${request.case.title}" — ${authority} has not replied to the response request in ${daysWaiting} days.` +
    (level === 3 ? ' Consider publishing the non-response and escalating to a higher authority.' : ' Send a reminder or follow-up.');

  await prisma.task.create({
    data: {
      caseId: request.case.id,
      title,
      description: message,
      priority: PRIORITY_BY_LEVEL[level],
      assignedToId: owner,
      createdById: request.case.createdById,
      dueDate: new Date(Date.now() + 2 * DAY_MS),
    },
  });

  // Level 1-2 notify the case owner; level 3 notifies the whole workspace team.
  const members =
    level === 3
      ? await prisma.workspaceMember.findMany({
          where: { workspaceId: request.case.workspaceId },
          select: { userId: true, user: { select: { email: true } } },
          take: 25,
        })
      : [];
  const recipientIds = new Set<string>([owner, ...members.map((m) => m.userId)]);

  await prisma.notification.createMany({
    data: [...recipientIds].map((userId) => ({ userId, type: 'RESPONSE_ESCALATION', title, message })),
  });

  if (level === 3 && isMailConfigured()) {
    const notifyOverride = process.env.WORKSPACE_NOTIFY_EMAIL;
    const to = notifyOverride
      ? notifyOverride.split(',').map((e) => e.trim()).filter(Boolean)
      : members.map((m) => m.user.email).filter(Boolean);
    if (to.length > 0) {
      await sendMail({
        to,
        subject: title,
        text: message,
        html: `<p><strong>${escapeHtml(title)}</strong></p><p>${escapeHtml(message)}</p>`,
      });
    }
  }
}

const HOUR_MS = 60 * 60 * 1000;
let timerStarted = false;

/** Runs escalation once an hour from inside the app process. */
export function startResponseEscalationTimer(): void {
  if (timerStarted) return;
  timerStarted = true;
  const tick = () =>
    void runResponseEscalation().catch((err: unknown) =>
      console.error('[escalation] Run failed:', err instanceof Error ? err.message : err)
    );
  setInterval(tick, HOUR_MS).unref?.();
  tick();
}
