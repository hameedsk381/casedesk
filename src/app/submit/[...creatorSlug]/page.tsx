import { redirect } from 'next/navigation';

const PORTAL_URL = process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL || 'http://localhost:3001';

export const dynamic = 'force-dynamic';

export default async function CreatorSubmitPage({
  params,
}: {
  params: Promise<{ creatorSlug: string[] }>;
}) {
  const { creatorSlug: segments } = await params;
  const parts = segments.filter(Boolean);

  // Accept both /submit/<slug> and links that accidentally include the
  // citizen portal host before the slug.
  const slug = parts[0]?.includes('.') ? parts.slice(1).join('/') : parts.join('/');

  if (!slug) {
    redirect(PORTAL_URL);
  }

  redirect(`${PORTAL_URL}/${slug}`);
}
