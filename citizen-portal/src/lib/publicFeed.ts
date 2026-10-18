const INTERNAL_API_URL =
  process.env.INTERNAL_CASEDESK_URL ||
  process.env.NEXT_PUBLIC_CASEDESK_API_URL ||
  'http://localhost:3000';

export interface PublicFeedCase {
  caseNumber: string;
  title: string;
  category: string;
  ward: string | null;
  municipality: string | null;
  resolved: boolean;
  daysToResolve: number | null;
  responses: Array<{
    authority: string;
    answered: boolean;
    daysWaiting: number;
    escalationLevel: 0 | 1 | 2 | 3;
  }>;
}

export interface PublicProof {
  overall: {
    received: number;
    departmentsAsked: number;
    departmentsReplied: number;
    averageReplyDays: number | null;
  };
  cases: PublicFeedCase[];
}

/** Real, counted numbers and recent published cases for the home page. Null if CaseDesk is unreachable. */
export async function loadPublicProof(): Promise<PublicProof | null> {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/submit/public`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.overall) return null;
    return { overall: data.overall, cases: (data.cases || []).slice(0, 3) };
  } catch {
    return null;
  }
}
