import Link from 'next/link';
import prisma from '@/lib/db/prisma';
import { findValidInvite } from '@/lib/team/invites';
import AcceptInviteForm from '@/components/app/AcceptInviteForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accept invitation', robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findValidInvite(token);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <img src="/casedesk.png" alt="CaseDesk" className="mx-auto h-12 w-auto max-w-[220px] object-contain" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {invite ? (
          <AcceptInviteForm
            token={token}
            email={invite.email}
            workspaceName={invite.workspace.name}
            inviterName={invite.invitedBy.name}
            role={invite.role}
            hasAccount={!!(await prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } }))}
          />
        ) : (
          <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-surface-3 sm:px-10 text-center space-y-3">
            <h2 className="text-lg font-bold text-primary">This invitation can&apos;t be used</h2>
            <p className="text-sm text-muted-foreground">
              It may have expired, been revoked, or already been used. Ask the person who invited you to send a new one.
            </p>
            <Link href="/login" className="inline-block text-sm font-semibold text-primary hover:underline">Go to sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
