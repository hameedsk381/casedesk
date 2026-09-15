import prisma from '../db/prisma';

export async function generateIntakeReferenceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CD-IN-${currentYear}-`;

  // Find the latest reference number for the current year
  const latestItem = await prisma.intakeItem.findFirst({
    where: {
      referenceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      referenceNumber: 'desc',
    },
    select: {
      referenceNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestItem?.referenceNumber) {
    const parts = latestItem.referenceNumber.split('-');
    if (parts.length === 4) {
      const parsed = parseInt(parts[3], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  const paddedSequence = String(nextSequence).padStart(5, '0');
  return `${prefix}${paddedSequence}`;
}
