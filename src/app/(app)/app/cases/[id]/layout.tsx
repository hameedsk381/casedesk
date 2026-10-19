import React from 'react';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { getCaseById } from '@/lib/cases/service';
import { getCurrentUser, hasWorkspaceAccess, getWorkspacePermissions } from '@/lib/auth/permissions';
import CaseWorkspaceHeader from '@/components/app/CaseWorkspaceHeader';
import CaseWorkspaceSidebar from '@/components/app/CaseWorkspaceSidebar';
import EraseCaseButton from '@/components/app/EraseCaseButton';
import { CasePermissionsProvider } from '@/components/app/CasePermissionsProvider';

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

  // A missing session is an auth problem, not a missing page: send the viewer to
  // sign in rather than showing a misleading 404.
  if (!user) {
    redirect('/login');
  }

  const caseRecord = await getCaseById(id);

  // Only a genuinely absent or inaccessible case is a 404.
  if (!caseRecord || !hasWorkspaceAccess(user, caseRecord.workspaceId)) {
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

  const permissions = getWorkspacePermissions(user, caseRecord.workspaceId);

  return (
    <div className="space-y-6">
      <CaseWorkspaceHeader caseRecord={caseRecord} users={users} permissions={permissions} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Active Tab Subview */}
        <div className="flex-1 min-w-0 w-full">
          <CasePermissionsProvider permissions={permissions}>{children}</CasePermissionsProvider>
        </div>

        {/* Persistent Newsroom Sidebar */}
        <CaseWorkspaceSidebar caseRecord={caseRecord} users={users} permissions={permissions} />
      </div>

      {permissions.delete_case && (
        <EraseCaseButton caseId={caseRecord.id} caseNumber={caseRecord.caseNumber} />
      )}
    </div>
  );
}
