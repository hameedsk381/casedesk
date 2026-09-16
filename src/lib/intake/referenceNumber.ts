import prisma from '../db/prisma';

export async function generateIntakeReferenceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CD-IN-${currentYear}-`;
  const counterName = `INTAKE_${currentYear}`;

  try {
    // Atomic upsert with increment
    const counter = await prisma.sequenceCounter.upsert({
      where: { name: counterName },
      create: { name: counterName, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
      select: { lastValue: true },
    });

    // If counter was just initialized to 1, calibrate against existing data
    if (counter.lastValue === 1) {
      const latestItem = await prisma.intakeItem.findFirst({
        where: { referenceNumber: { startsWith: prefix } },
        orderBy: { referenceNumber: 'desc' },
        select: { referenceNumber: true },
      });

      if (latestItem?.referenceNumber) {
        const parts = latestItem.referenceNumber.split('-');
        if (parts.length === 4) {
          const parsed = parseInt(parts[3], 10);
          if (!isNaN(parsed) && parsed >= 1) {
            const calibrated = parsed + 1;
            await prisma.sequenceCounter.update({
              where: { name: counterName },
              data: { lastValue: calibrated },
            });
            return `${prefix}${String(calibrated).padStart(5, '0')}`;
          }
        }
      }
    }

    const paddedSequence = String(counter.lastValue).padStart(5, '0');
    return `${prefix}${paddedSequence}`;
  } catch (err: any) {
    console.warn('SequenceCounter fallback for intake reference:', err?.message || err);

    try {
      const latestItem = await prisma.intakeItem.findFirst({
        where: { referenceNumber: { startsWith: prefix } },
        orderBy: { referenceNumber: 'desc' },
        select: { referenceNumber: true },
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
    } catch {
      // If DB is completely unreachable, generate time-based unique sequence
      const fallbackSeq = (Date.now() % 90000) + Math.floor(Math.random() * 1000) + 1;
      return `${prefix}${String(fallbackSeq).padStart(5, '0')}`;
    }
  }
}
