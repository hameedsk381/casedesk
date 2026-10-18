import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { PublicProof } from '@/lib/publicFeed';

type Lang = 'en' | 'te';

const T = {
  en: {
    overline: 'Proof, not promises',
    title: 'Real numbers from this helpdesk',
    live: 'Counted live from the helpdesk. Nothing here is estimated or invented.',
    received: 'Reports received',
    asked: 'Departments asked to respond',
    replied: 'Departments that replied',
    avg: 'Avg. days to reply',
    recent: 'Recently published',
    noneYet:
      'This is a new helpdesk. Live numbers and published reports will appear here as they come in — we will not show figures we cannot back up.',
    resolved: 'Resolved',
    open: 'Open',
    noReply: (d: number) => `no reply · ${d}d`,
    replied2: (d: number) => `replied in ${d}d`,
    tracker: 'Open the full public tracker',
    howTitle: 'How we keep this honest',
    how: [
      'Reports are published only when the citizen allows it.',
      'Departments are named — never individual officials — and their replies, or silence, are shown with dates.',
      'Names, phone numbers and exact addresses are never published.',
      'Every report is reviewed by Open Vaartha journalists before any public action.',
    ],
  },
  te: {
    overline: 'హామీలు కాదు, ఆధారాలు',
    title: 'ఈ హెల్ప్‌డెస్క్ నుంచి నిజమైన లెక్కలు',
    live: 'హెల్ప్‌డెస్క్ నుంచి ప్రత్యక్షంగా లెక్కించినవి. ఏదీ అంచనా లేదా కల్పితం కాదు.',
    received: 'అందిన ఫిర్యాదులు',
    asked: 'వివరణ కోరిన శాఖలు',
    replied: 'స్పందించిన శాఖలు',
    avg: 'స్పందనకు సగటు రోజులు',
    recent: 'ఇటీవల ప్రచురించినవి',
    noneYet:
      'ఇది కొత్త హెల్ప్‌డెస్క్. ఫిర్యాదులు వచ్చేకొద్దీ ప్రత్యక్ష లెక్కలు, ప్రచురించిన కథనాలు ఇక్కడ కనిపిస్తాయి — రుజువు చేయలేని సంఖ్యలను మేము చూపము.',
    resolved: 'పరిష్కారమైంది',
    open: 'తెరిచి ఉంది',
    noReply: (d: number) => `స్పందన లేదు · ${d}రో`,
    replied2: (d: number) => `${d} రోజుల్లో స్పందన`,
    tracker: 'పూర్తి బహిరంగ పట్టికను తెరవండి',
    howTitle: 'నిజాయితీగా ఎలా ఉంచుతాము',
    how: [
      'పౌరుడు అనుమతిస్తేనే ఫిర్యాదు ప్రచురిస్తాము.',
      'శాఖల పేర్లు మాత్రమే — వ్యక్తిగత అధికారుల పేర్లు కాదు — వారి సమాధానం లేదా మౌనం తేదీలతో చూపుతాము.',
      'పేర్లు, ఫోన్ నంబర్లు, ఖచ్చితమైన చిరునామాలు ఎప్పుడూ ప్రచురించము.',
      'ప్రతి ఫిర్యాదును ఓపెన్ వార్తా జర్నలిస్టులు పరిశీలించిన తర్వాతే బహిరంగ చర్య.',
    ],
  },
} as const;

export function ProofSection({ proof, lang }: { proof: PublicProof | null; lang: Lang }) {
  const t = T[lang];
  const hasData = !!proof && proof.overall.received > 0;

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 bg-card border-b border-border">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="max-w-xl space-y-2">
          <span className="overline">{t.overline}</span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight text-primary">{t.title}</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{hasData ? t.live : t.noneYet}</p>
        </div>

        {hasData && proof && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                [t.received, proof.overall.received],
                [t.asked, proof.overall.departmentsAsked],
                [t.replied, proof.overall.departmentsReplied],
                [t.avg, proof.overall.averageReplyDays ?? '—'],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="text-3xl font-black text-primary">{value}</div>
                  <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>

            {proof.cases.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary">{t.recent}</h3>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {proof.cases.map((c) => (
                    <li key={c.caseNumber} className="rounded-2xl border border-border bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
                        <span>{c.ward ? `${c.municipality ? c.municipality + ', ' : ''}${lang === 'te' ? 'వార్డు' : 'Ward'} ${c.ward}` : c.category}</span>
                        <span className={c.resolved ? 'text-success' : ''}>{c.resolved ? t.resolved : t.open}</span>
                      </div>
                      <p className="text-sm font-bold text-primary leading-snug">{c.title}</p>
                      {c.responses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {c.responses.map((r, i) => (
                            <span key={i} className="rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              {r.authority}: {r.answered ? t.replied2(r.daysWaiting) : t.noReply(r.daysWaiting)}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="rounded-3xl border border-border bg-secondary/30 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck size={18} />
            <h3 className="text-sm font-bold">{t.howTitle}</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.how.map((line) => (
              <li key={line} className="flex items-start gap-2 text-xs leading-relaxed text-foreground">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <a href={`/accountability?lang=${lang}`} className="touch-target inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover">
          {t.tracker} <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}
