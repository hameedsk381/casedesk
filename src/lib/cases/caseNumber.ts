import prisma from '../db/prisma';

export async function generateCaseNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `CD-${currentYear}-`;
  const counterName = `CASE_${currentYear}`;

  try {
    // Atomic upsert with increment
    const counter = await prisma.sequenceCounter.upsert({
      where: { name: counterName },
      create: { name: counterName, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
      select: { lastValue: true },
    });

    // If counter was just initialized to 1, calibrate against existing seeded cases
    if (counter.lastValue === 1) {
      const latestCase = await prisma.case.findFirst({
        where: { caseNumber: { startsWith: prefix } },
        orderBy: { caseNumber: 'desc' },
        select: { caseNumber: true },
      });

      if (latestCase?.caseNumber) {
        const parts = latestCase.caseNumber.split('-');
        if (parts.length === 3) {
          const parsed = parseInt(parts[2], 10);
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
    console.warn('SequenceCounter fallback for case number:', err?.message || err);

    try {
      const latestCase = await prisma.case.findFirst({
        where: { caseNumber: { startsWith: prefix } },
        orderBy: { caseNumber: 'desc' },
        select: { caseNumber: true },
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
    } catch {
      // If DB is completely unreachable, generate time-based unique sequence
      const fallbackSeq = (Date.now() % 90000) + Math.floor(Math.random() * 1000) + 1;
      return `${prefix}${String(fallbackSeq).padStart(5, '0')}`;
    }
  }
}
