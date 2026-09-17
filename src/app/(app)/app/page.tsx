import React from 'react';
import prisma from '@/lib/db/prisma';
import DashboardClient from '@/components/app/DashboardClient';
import { calculateCaseHealth } from '@/lib/cases/service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [
    allCases,
    inboxUnprocessedCount,
    recentActivities,
  ] = await Promise.all([
    prisma.case.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
        sources: {
          take: 1,
        },
        verificationItems: {
          select: { id: true, status: true },
        },
        responseRequests: {
          select: { id: true, status: true, deadline: true },
        },
        claims: {
          select: { id: true, status: true },
        },
        _count: {
          select: {
            claims: true,
            evidence: true,
            tasks: true,
            contents: true,
            verificationItems: true,
          },
        },
      },
    }),
    prisma.intakeItem.count({
      where: { status: 'NEEDS_REVIEW' },
    }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        case: { select: { caseNumber: true, title: true } },
      },
    }),
  ]);

  const processedCases = allCases.map((c) => {
    const totalVerif = c.verificationItems?.length || 0;
    const verifiedCount = c.verificationItems?.filter((v) => v.status === 'VERIFIED').length || 0;
    const verificationPercentage = totalVerif > 0 ? Math.round((verifiedCount / totalVerif) * 100) : 0;

    let healthStatus = c.healthStatus;
    let healthReason = c.healthReason;

    // Evaluate dynamic health if needed
    if (!healthStatus || healthStatus === 'ON_TRACK') {
      const dynamic = calculateCaseHealth(c);
      if (dynamic.healthStatus !== 'ON_TRACK') {
        healthStatus = dynamic.healthStatus;
        healthReason = dynamic.healthReason;
      }
    }

    return {
      ...c,
      healthStatus: healthStatus || 'ON_TRACK',
      healthReason: healthReason || 'Investigation progressing on schedule',
      verifiedCount,
      totalVerificationCount: totalVerif,
      verificationPercentage,
    };
  });

  const blockedCases = processedCases.filter((c) => c.healthStatus === 'BLOCKED');
  const needsAttentionCases = processedCases.filter((c) => c.healthStatus === 'NEEDS_ATTENTION');
  const dueTodayCases = processedCases.filter((c) => c.status === 'FOLLOW_UP');
  const urgentCases = processedCases
    .filter((c) => c.priority === 'URGENT' || c.healthStatus === 'BLOCKED')
    .slice(0, 4);

  return (
    <DashboardClient
      cases={processedCases}
      urgentCases={urgentCases}
      blockedCases={blockedCases}
      needsAttentionCases={needsAttentionCases}
      dueTodayCases={dueTodayCases}
      inboxUnprocessedCount={inboxUnprocessedCount}
      recentActivities={recentActivities}
    />
  );
}
