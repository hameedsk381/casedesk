import prisma from '../db/prisma';

export async function generateCaseNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CD-${currentYear}-`;

  // Find the latest case number for this year
  const latestCase = await prisma.case.findFirst({
    where: {
      caseNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      caseNumber: 'desc',
    },
    select: {
      caseNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestCase?.caseNumber) {
    const parts = latestCase.caseNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}
