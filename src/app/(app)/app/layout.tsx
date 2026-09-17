import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/permissions';
import AppShell from '@/components/app/AppShell';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Investigation Workspace — CaseDesk',
  description: 'CaseDesk Operational Investigation Desk',
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // If no user is logged in, redirect to login page for strict authentication
  if (!user) {
    redirect('/login');
  }

  return <AppShell user={user}>{children}</AppShell>;
}
