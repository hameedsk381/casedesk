import { CitizenLandingPage } from '@/components/CitizenLandingPage';
import Link from 'next/link';

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_CASEDESK_API_URL || 'http://localhost:3000';
const INTERNAL_API_URL = process.env.INTERNAL_CASEDESK_URL || PUBLIC_API_URL;

async function getCreatorEndpoint(slug: string) {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/submit/${slug}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.endpoint) return data.endpoint;
    }
  } catch (err) {
    console.warn(`Could not reach CaseDesk API for slug ${slug}:`, err);
  }
  return null;
}

export default async function CreatorPortalPage({
  params,
}: {
  params: Promise<{ creatorSlug: string }>;
}) {
  const { creatorSlug } = await params;
  const endpoint = await getCreatorEndpoint(creatorSlug);

  if (!endpoint) {
    return (
      <div className="max-w-md mx-auto my-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-navy">Citizen Portal Unavailable</h1>
        <p className="text-sm text-slate-500">
          The requested desk or creator channel (<span className="font-mono text-slate-700">{creatorSlug}</span>) could not be found or is currently paused.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-xl bg-navy hover:bg-navy/90 text-white text-xs font-medium transition"
          >
            Go to Default Story Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <CitizenLandingPage endpoint={endpoint} apiBaseUrl={PUBLIC_API_URL} />
    </div>
  );
}
