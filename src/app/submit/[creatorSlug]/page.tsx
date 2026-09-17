import { redirect } from 'next/navigation';

const PORTAL_URL = process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL || 'http://localhost:3001';

export const dynamic = 'force-dynamic';

export default async function CreatorSubmitPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>;
}) {
  const { creatorSlug } = await params;
  redirect(`${PORTAL_URL}/${creatorSlug}`);
}
