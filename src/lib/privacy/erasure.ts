import prisma from '../db/prisma';
import { deletePrivateFile } from '../storage';

/** An erasure that cannot proceed; the message is safe to show to staff. */
export class ErasureError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
    this.name = 'ErasureError';
  }
}

/**
 * Deletes stored files first and only then the database rows. If any file cannot
 * be deleted (as opposed to already being gone) nothing in the database is
 * touched, so the erasure can simply be retried. File names are never logged.
 */
async function deleteFilesOrThrow(paths: string[]): Promise<void> {
  const results = await Promise.all(paths.map((p) => deletePrivateFile(p)));
  const failed = results.filter((ok) => !ok).length;
  if (failed > 0) {
    throw new ErasureError(`${failed} stored file(s) could not be deleted, so nothing was erased. Please try again.`, 502);
  }
}

/**
 * Erases a citizen report that has not become a case: its attachments (disk or
 * cloud bucket) and the report itself. Reports linked to a case must be erased
 * through the case, because the case holds copies of the text.
 */
export async function eraseIntakeItem(intakeId: string, userId: string) {
  const item = await prisma.intakeItem.findUnique({
    where: { id: intakeId },
    select: {
      id: true,
      workspaceId: true,
      referenceNumber: true,
      createdCaseId: true,
      duplicateCaseId: true,
      attachments: { select: { filePath: true } },
    },
  });
  if (!item) throw new ErasureError('Report not found', 404);
  if (item.createdCaseId || item.duplicateCaseId) {
    throw new ErasureError('This report is linked to a case. Erase the case instead — it also removes the linked reports and files.');
  }

  await deleteFilesOrThrow(item.attachments.map((a) => a.filePath));
  await prisma.intakeItem.delete({ where: { id: item.id } });

  await prisma.activityLog.create({
    data: {
      workspaceId: item.workspaceId,
      userId,
      action: 'REPORT_ERASED',
      metadata: JSON.stringify({ referenceNumber: item.referenceNumber, files: item.attachments.length }),
    },
  });

  return { referenceNumber: item.referenceNumber, files: item.attachments.length, reports: 1 };
}

/**
 * Erases a case together with every linked citizen report, all attachments and
 * all case evidence files. Rows that cascade from the case (claims, tasks,
 * contacts, response requests, content…) go with it.
 */
export async function eraseCase(caseId: string, userId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      caseNumber: true,
      workspaceId: true,
      evidence: { select: { filePath: true } },
      createdFromIntakes: { select: { id: true, attachments: { select: { filePath: true } } } },
      mergedIntakes: { select: { id: true, attachments: { select: { filePath: true } } } },
    },
  });
  if (!caseRecord) throw new ErasureError('Case not found', 404);

  const intakes = [...caseRecord.createdFromIntakes, ...caseRecord.mergedIntakes];
  const intakeIds = [...new Set(intakes.map((i) => i.id))];
  const filePaths = [
    ...caseRecord.evidence.map((e) => e.filePath),
    ...intakes.flatMap((i) => i.attachments.map((a) => a.filePath)),
  ];

  await deleteFilesOrThrow(filePaths);

  await prisma.$transaction([
    prisma.intakeItem.deleteMany({ where: { id: { in: intakeIds } } }),
    prisma.case.delete({ where: { id: caseRecord.id } }),
  ]);

  // The case's own activity rows are gone with it, so record the erasure without a case link.
  await prisma.activityLog.create({
    data: {
      workspaceId: caseRecord.workspaceId,
      userId,
      action: 'CASE_ERASED',
      metadata: JSON.stringify({ caseNumber: caseRecord.caseNumber, reports: intakeIds.length, files: filePaths.length }),
    },
  });

  return { caseNumber: caseRecord.caseNumber, reports: intakeIds.length, files: filePaths.length };
}
