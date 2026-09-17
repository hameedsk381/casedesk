import { CitizenLandingPage } from '@/components/CitizenLandingPage';

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
    title: 'Community Helpdesk',
    description: 'Share community service needs and local improvement suggestions with the helpdesk team.',
    requireContact: false,
    allowAnonymous: true,
    allowVoice: true,
    allowAttachments: true,
    workspaceName: 'Community Helpdesk',
  };
}

export default async function HomePage() {
  const endpoint = await getEndpoint();

  return (
    <div className="w-full flex-1 flex flex-col">
      <CitizenLandingPage endpoint={endpoint} />
    </div>
  );
}
