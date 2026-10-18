import Link from 'next/link';
import { getServerLang } from '@/lib/i18n/serverLang';
import { IllustrationEmpty, IllustrationTracker } from '@/components/illustrations';

export const dynamic = 'force-dynamic';

const INTERNAL_API_URL =
  process.env.INTERNAL_CASEDESK_URL ||
  process.env.NEXT_PUBLIC_CASEDESK_API_URL ||
  'http://localhost:3000';

type Lang = 'en' | 'te';

interface FeedResponse {
  summary: {
    total: number;
    resolved: number;
    awaitingResponse: number;
    overdueResponses: number;
    averageDaysToResolve: number | null;
  };
  wards: Array<{
    municipality: string | null;
    ward: string;
    total: number;
    resolved: number;
    awaiting: number;
    overdue: number;
    averageDaysToResolve: number | null;
  }>;
  cases: Array<{
    caseNumber: string;
    title: string;
    category: string;
    ward: string | null;
    municipality: string | null;
    publishedAt: string | null;
    resolved: boolean;
    daysToResolve: number | null;
    responses: Array<{
      authority: string;
      answered: boolean;
      daysWaiting: number;
      overdue: boolean;
      escalationLevel: 0 | 1 | 2 | 3;
    }>;
  }>;
}

const T = {
  en: {
    title: 'Public Accountability Tracker',
    intro:
      'Reports shared with permission by citizens, and how quickly the responsible departments answered. Names and contact details are never shown.',
    reports: 'Reports published',
    resolved: 'Resolved',
    awaiting: 'Awaiting a reply',
    overdue: 'Waiting 7+ days or past deadline',
    avg: 'Avg. days to resolve',
    byWard: 'By ward',
    ward: 'Ward',
    municipality: 'Municipality',
    allWards: 'All wards',
    cases: 'Published reports',
    none: 'No published reports yet.',
    unavailable: 'The tracker is temporarily unavailable. Please try again shortly.',
    waiting: (d: number) => `No reply · ${d} day${d === 1 ? '' : 's'}`,
    repliedIn: (d: number) => `Replied in ${d} day${d === 1 ? '' : 's'}`,
    resolvedTag: 'Resolved',
    openTag: 'Open',
    report: 'Report a problem',
    back: 'Back to home',
    noWard: 'Ward not given',
    days: 'days',
  },
  te: {
    title: 'బహిరంగ జవాబుదారీ పట్టిక',
    intro:
      'పౌరులు అనుమతితో పంచుకున్న ఫిర్యాదులు, సంబంధిత శాఖలు ఎంత త్వరగా స్పందించాయో ఇక్కడ చూడవచ్చు. పేర్లు, సంప్రదింపు వివరాలు ఎప్పుడూ చూపబడవు.',
    reports: 'ప్రచురించిన ఫిర్యాదులు',
    resolved: 'పరిష్కారమైనవి',
    awaiting: 'సమాధానం కోసం వేచి ఉన్నవి',
    overdue: '7+ రోజులు లేదా గడువు దాటినవి',
    avg: 'పరిష్కారానికి సగటు రోజులు',
    byWard: 'వార్డుల వారీగా',
    ward: 'వార్డు',
    municipality: 'పురపాలక సంఘం',
    allWards: 'అన్ని వార్డులు',
    cases: 'ప్రచురించిన ఫిర్యాదులు',
    none: 'ఇంకా ప్రచురించిన ఫిర్యాదులు లేవు.',
    unavailable: 'ప్రస్తుతం అందుబాటులో లేదు. కొంతసేపటి తర్వాత ప్రయత్నించండి.',
    waiting: (d: number) => `సమాధానం లేదు · ${d} రోజులు`,
    repliedIn: (d: number) => `${d} రోజుల్లో స్పందించారు`,
    resolvedTag: 'పరిష్కారమైంది',
    openTag: 'తెరిచి ఉంది',
    report: 'సమస్యను తెలియజేయండి',
    back: 'హోమ్‌కు వెళ్లండి',
    noWard: 'వార్డు తెలియదు',
    days: 'రోజులు',
  },
} as const;

async function loadFeed(ward: string | undefined, municipality: string | undefined): Promise<FeedResponse | null> {
  try {
    const params = new URLSearchParams();
    if (ward) params.set('ward', ward);
    if (municipality) params.set('municipality', municipality);
    const query = params.size ? `?${params}` : '';
    const res = await fetch(`${INTERNAL_API_URL}/api/submit/public${query}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as FeedResponse;
  } catch {
    return null;
  }
}

function levelClass(level: number, answered: boolean) {
  if (answered) return 'bg-success/10 text-success border-success/30';
  if (level >= 3) return 'bg-destructive/10 text-destructive border-destructive/40';
  if (level >= 1) return 'bg-amber-500/10 text-amber-700 border-amber-500/40';
  return 'bg-surface text-muted-foreground border-border';
}

export default async function AccountabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ ward?: string | string[]; municipality?: string | string[]; lang?: string | string[] }>;
}) {
  const params = await searchParams;
  const lang: Lang = await getServerLang(params.lang);
  const ward = typeof params.ward === 'string' ? params.ward.slice(0, 50) : undefined;
  const t = T[lang];
  const municipality = typeof params.municipality === 'string' ? params.municipality.slice(0, 100) : undefined;
  const feed = await loadFeed(ward, municipality);

  const href = (opts: { ward?: string; municipality?: string; lang: Lang }) => {
    const q = new URLSearchParams();
    if (opts.ward) q.set('ward', opts.ward);
    if (opts.municipality) q.set('municipality', opts.municipality);
    const s = q.toString();
    return `/accountability${s ? `?${s}` : ''}`;
  };

  // Language toggles go through /api/lang so the choice is remembered site-wide.
  const switchLang = (next: Lang) =>
    `/api/lang?lang=${next}&next=${encodeURIComponent(href({ ward, municipality, lang }))}`;

  return (
    <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
      <header className="relative space-y-3">
        <IllustrationTracker className="pointer-events-none absolute right-0 top-10 hidden h-40 w-auto md:block" />
        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
          <Link href="/" className="text-muted-foreground hover:text-primary">← {t.back}</Link>
          <div className="flex gap-3">
            <Link href={switchLang('en')} className={lang === 'en' ? 'text-primary' : 'text-muted-foreground'}>EN</Link>
            <Link href={switchLang('te')} className={lang === 'te' ? 'text-primary' : 'text-muted-foreground'}>తె</Link>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">{t.title}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{t.intro}</p>
        {(ward || municipality) && (
          <p className="text-xs font-bold text-primary">
            {[municipality, ward ? `${t.ward} ${ward}` : null].filter(Boolean).join(', ')} · <Link href={href({ lang })} className="underline">{t.allWards}</Link>
          </p>
        )}
      </header>

      {!feed ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.unavailable}</p>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              [t.reports, feed.summary.total],
              [t.resolved, feed.summary.resolved],
              [t.awaiting, feed.summary.awaitingResponse],
              [t.overdue, feed.summary.overdueResponses],
              [t.avg, feed.summary.averageDaysToResolve ?? '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-border bg-card p-4">
                <div className="text-2xl font-extrabold text-primary">{value}</div>
                <div className="text-[11px] font-semibold text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </section>

          {feed.wards.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-primary">{t.byWard}</h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="text-left text-[11px] uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">{t.municipality}</th>
                      <th className="p-3">{t.ward}</th>
                      <th className="p-3">{t.reports}</th>
                      <th className="p-3">{t.resolved}</th>
                      <th className="p-3">{t.awaiting}</th>
                      <th className="p-3">{t.overdue}</th>
                      <th className="p-3">{t.avg}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feed.wards.map((row) => (
                      <tr key={`${row.municipality}|${row.ward}`} className="border-t border-border">
                        <td className="p-3">{row.municipality || '—'}</td>
                        <td className="p-3 font-bold">
                          {row.ward === 'UNSPECIFIED' ? (
                            t.noWard
                          ) : (
                            <Link href={href({ ward: row.ward, municipality: row.municipality || undefined, lang })} className="text-primary hover:underline">{row.ward}</Link>
                          )}
                        </td>
                        <td className="p-3">{row.total}</td>
                        <td className="p-3">{row.resolved}</td>
                        <td className="p-3">{row.awaiting}</td>
                        <td className="p-3">{row.overdue}</td>
                        <td className="p-3">{row.averageDaysToResolve ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-primary">{t.cases}</h2>
            {feed.cases.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
                <IllustrationEmpty className="h-32 w-auto" />
                <p className="text-sm text-muted-foreground">{t.none}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {feed.cases.map((c) => (
                  <li key={c.caseNumber} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="font-mono">{c.caseNumber}</span>
                      <span>·</span>
                      <span>{c.category}</span>
                      <span>·</span>
                      <span>{c.ward ? `${c.municipality ? c.municipality + ', ' : ''}${t.ward} ${c.ward}` : t.noWard}</span>
                      <span className={`ml-auto rounded-full border px-2 py-0.5 ${c.resolved ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-surface'}`}>
                        {c.resolved
                          ? `${t.resolvedTag}${c.daysToResolve !== null ? ` · ${c.daysToResolve} ${t.days}` : ''}`
                          : t.openTag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-primary">{c.title}</h3>
                    {c.responses.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {c.responses.map((r, i) => (
                          <span key={i} className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${levelClass(r.escalationLevel, r.answered)}`}>
                            {r.authority}: {r.answered ? t.repliedIn(r.daysWaiting) : t.waiting(r.daysWaiting)}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <div>
        <Link href="/" className="inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">{t.report}</Link>
      </div>
    </main>
  );
}
