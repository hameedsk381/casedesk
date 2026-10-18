import { CitizenLandingPage } from '@/components/CitizenLandingPage';
import { getServerLang } from '@/lib/i18n/serverLang';
import { loadPublicProof } from '@/lib/publicFeed';

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_CASEDESK_API_URL || 'http://localhost:3000';
const INTERNAL_API_URL = process.env.INTERNAL_CASEDESK_URL || PUBLIC_API_URL;
const DEFAULT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_SLUG || 'janata-investigation-desk';

async function getEndpoint() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/submit/${DEFAULT_SLUG}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.endpoint) return data.endpoint;
    }
  } catch (err) {
    console.warn('Could not reach CaseDesk API directly during SSR, falling back to local config:', err);
  }

  return {
    slug: DEFAULT_SLUG,
    title: 'ComplianBox',
    description: 'Share community service needs and local improvement suggestions with the helpdesk team.',
    requireContact: false,
    allowAnonymous: true,
    allowVoice: true,
    allowAttachments: true,
    workspaceName: 'ComplianBox',
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ ward?: string | string[]; municipality?: string | string[] }>;
}) {
  const { ward, municipality } = await searchParams;
  const endpoint = await getEndpoint();

  return (
    <div className="w-full flex-1 flex flex-col">
      <CitizenLandingPage endpoint={endpoint} initialWard={typeof ward === 'string' ? ward.slice(0, 50) : undefined} initialMunicipality={typeof municipality === 'string' ? municipality.slice(0, 100) : undefined} initialLang={await getServerLang()} proof={await loadPublicProof()} />
    </div>
  );
}
