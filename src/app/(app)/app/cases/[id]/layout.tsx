import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { getCaseById } from '@/lib/cases/service';
import { getCurrentUser, hasWorkspaceAccess, canUserInWorkspace } from '@/lib/auth/permissions';
import CaseWorkspaceHeader from '@/components/app/CaseWorkspaceHeader';
import CaseWorkspaceSidebar from '@/components/app/CaseWorkspaceSidebar';
import EraseCaseButton from '@/components/app/EraseCaseButton';

export const dynamic = 'force-dynamic';

export default async function CaseWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const caseRecord = await getCaseById(id);

  if (!caseRecord) {
    notFound();
  }

  if (!user || !hasWorkspaceAccess(user, caseRecord.workspaceId)) {
    notFound();
  }

  const users = await prisma.user.findMany({
    where: {
      workspaceMembers: {
        some: { workspaceId: caseRecord.workspaceId },
      },
    },
    select: { id: true, name: true, role: true, avatarUrl: true },
  });

  const canErase = canUserInWorkspace(user, caseRecord.workspaceId, 'delete_case');

  return (
    <div className="space-y-6">
      <CaseWorkspaceHeader caseRecord={caseRecord} users={users} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Active Tab Subview */}
        <div className="flex-1 min-w-0 w-full">{children}</div>

        {/* Persistent Newsroom Sidebar */}
        <CaseWorkspaceSidebar caseRecord={caseRecord} users={users} />
      </div>

      {canErase && <EraseCaseButton caseId={caseRecord.id} caseNumber={caseRecord.caseNumber} />}
    </div>
  );
}
