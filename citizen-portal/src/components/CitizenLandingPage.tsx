'use client';

import React, { useState } from 'react';
import {
  Megaphone,
  Lock,
  Mic,
  ArrowRight,
  CheckCircle2,
  Search,
  HeartPulse,
  Scale,
  Users,
  X,
  Check,
  Zap,
  Eye,
  Globe,
  MessageCircle,
  Camera,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { CitizenSubmissionForm } from './CitizenSubmissionForm';

interface EndpointConfig {
  slug: string;
  title: string;
  description?: string;
  requireContact?: boolean;
  allowAnonymous?: boolean;
  allowVoice?: boolean;
  allowAttachments?: boolean;
  workspaceName?: string;
}

interface Props {
  endpoint: EndpointConfig;
  initialWard?: string;
  initialLang?: Language;
}

type ViewState = 'landing' | 'form';
type Language = 'en' | 'te';

export function CitizenLandingPage({ endpoint, initialWard, initialLang = 'en' }: Props) {
  const [view, setView] = useState<ViewState>('landing');
  const [lang, setLangState] = useState<Language>(initialLang);
  // Remember the choice (read server-side by every page) for a year.
  const setLang = (next: Language) => {
    setLangState(next);
    try {
      document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
    } catch {}
  };
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!code) return;
    setIsSearching(true);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/submit/status?ref=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setLookupResult({
          ref: data.ref,
          status: lang === 'te' ? data.statusTe : data.status,
          steps: data.steps.map((s: any) => ({
            title: lang === 'te' ? s.titleTe : s.title,
            done: s.done,
          })),
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setLookupResult({
          error: true,
          ref: code,
          message: lang === 'te' ? 'ఈ కోడ్‌తో ఫిర్యాదు కనిపించలేదు.' : errData.error || 'No report found.',
        });
      }
    } catch {
      setLookupResult({ error: true, ref: code, message: lang === 'te' ? 'నెట్‌వర్క్ సమస్య.' : 'Unable to connect.' });
    } finally {
      setIsSearching(false);
    }
  };

  /* ─── Form sub-view ─── */
  if (view === 'form') {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card safe-area-top">
          <button onClick={() => setView('landing')} className="touch-target flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary cursor-pointer">← {lang === 'te' ? 'హోమ్' : 'Home'}</button>
          <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-xs font-bold border border-border">
            <button onClick={() => setLang('en')} className={`touch-target flex items-center justify-center px-2.5 py-1.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
            <button onClick={() => setLang('te')} className={`touch-target flex items-center justify-center px-2.5 py-1.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
          </div>
        </div>
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col">
          <CitizenSubmissionForm endpoint={endpoint} initialWard={initialWard} lang={lang} setLang={setLang} onBackToSelect={() => setView('landing')} />
        </main>
      </div>
    );
  }

  /* ─── Landing Page Data ─── */
  const categories = [
    { icon: TrendingUp, color: 'bg-sky-100 text-sky-600', title: lang === 'te' ? 'రోడ్లు & డ్రైనేజీ' : 'Roads & Drains', desc: lang === 'te' ? 'గుంతలు, మురుగు కాలువలు, వరద నీరు' : 'Potholes, blocked drains, waterlogging' },
    { icon: Globe, color: 'bg-teal-100 text-teal-600', title: lang === 'te' ? 'నీరు & పారిశుద్ధ్యం' : 'Water & Sanitation', desc: lang === 'te' ? 'తాగునీరు, చెత్త సేకరణ, పరిశుభ్రత' : 'Drinking water, garbage, cleanliness' },
    { icon: Zap, color: 'bg-amber-100 text-amber-600', title: lang === 'te' ? 'వీధి దీపాలు & విద్యుత్' : 'Streetlights & Power', desc: lang === 'te' ? 'వెలగని దీపాలు, విద్యుత్ సమస్యలు' : 'Broken lights, power faults' },
    { icon: HeartPulse, color: 'bg-rose-100 text-rose-600', title: lang === 'te' ? 'ఆరోగ్యం & సంక్షేమం' : 'Health & Welfare', desc: lang === 'te' ? 'ఆసుపత్రులు, పింఛను, రేషన్ కార్డు' : 'Hospitals, pensions, ration cards' },
    { icon: Users, color: 'bg-violet-100 text-violet-600', title: lang === 'te' ? 'పాఠశాలలు & సేవలు' : 'Schools & Services', desc: lang === 'te' ? 'పాఠశాలలు, కార్యాలయ సేవలు, సర్టిఫికెట్లు' : 'Schools, office services, certificates' },
    { icon: Scale, color: 'bg-emerald-100 text-emerald-600', title: lang === 'te' ? 'అవినీతి & ఇతరాలు' : 'Corruption & Other', desc: lang === 'te' ? 'లంచాలు, మోసాలు, ఏదైనా ప్రజా సమస్య' : 'Bribes, misconduct, any civic problem' },
  ];

  const steps = [
    { n: '1', title: lang === 'te' ? 'వివరాలు చెప్పండి' : 'Share Details', desc: lang === 'te' ? 'వాయిస్ లేదా టైప్ చేసి సేవకు సంబంధించిన వివరాలు చెప్పండి.' : 'Speak or type the service need in any language.', icon: MessageCircle },
    { n: '2', title: lang === 'te' ? 'సమీక్ష' : 'We Review', desc: lang === 'te' ? 'మా బృందం వివరాలను జాగ్రత్తగా పరిశీలిస్తుంది.' : 'Our team reviews the details carefully.', icon: Search },
    { n: '3', title: lang === 'te' ? 'శాఖను అడుగుతాము' : 'We Ask the Department', desc: lang === 'te' ? 'ధృవీకరించిన సమస్యలపై సంబంధిత మున్సిపల్ శాఖ వివరణ కోరతాము.' : 'For verified issues, we ask the responsible municipal department for a response.', icon: Eye },
    { n: '4', title: lang === 'te' ? 'బహిరంగ పట్టిక' : 'Public Tracker', desc: lang === 'te' ? 'మీ అనుమతితో, ఏ శాఖ ఎంత త్వరగా స్పందించిందో అందరూ చూడవచ్చు.' : 'With your permission, everyone can see how quickly each department responded.', icon: TrendingUp },
  ];

  const stats = [
    { value: '100%', label: lang === 'te' ? 'ఉచితం' : 'Free forever' },
    { value: '24/7', label: lang === 'te' ? 'అందుబాటు' : 'Always open' },
    { value: '100%', label: lang === 'te' ? 'గోప్యం' : 'Confidential' },
    { value: '3+', label: lang === 'te' ? 'భాషలు' : 'Languages' },
  ];

  const features = [
    { icon: Mic, title: lang === 'te' ? 'వాయిస్ సపోర్ట్' : 'Voice First', desc: lang === 'te' ? 'రాయడం కష్టమైతే మైక్ నొక్కి మాట్లాడండి.' : "Can't type? Just tap the mic and speak." },
    { icon: Lock, title: lang === 'te' ? 'రహస్యం' : 'Complete Privacy', desc: lang === 'te' ? 'మీ పేరు ఎప్పటికీ బహిర్గతం కాదు.' : 'Your identity is never revealed publicly.' },
    { icon: Globe, title: lang === 'te' ? 'బహుభాషా' : 'Multilingual', desc: lang === 'te' ? 'తెలుగు, Tenglish, English లో చెప్పవచ్చు.' : 'Telugu, Tenglish, or English — your choice.' },
    { icon: Camera, title: lang === 'te' ? 'ఆధారాలు' : 'Evidence Upload', desc: lang === 'te' ? 'ఫోటోలు, వీడియోలు, పత్రాలు జతచేయండి.' : 'Upload photos, videos, or documents.' },
  ];

  /* ─── Render ─── */
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/15 selection:text-primary">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-border safe-area-top">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <img src="/complianbox.png" alt="ComplianBox" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-extrabold text-sm text-primary">{endpoint.workspaceName || endpoint.title || 'ComplianBox'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowStatusModal(true)} className="touch-target flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border text-xs font-semibold text-muted-foreground hover:text-primary transition cursor-pointer">
              <Search size={14} />
              <span className="hidden sm:inline">{lang === 'te' ? 'స్థితి చూడండి' : 'Track Report'}</span>
            </button>
            <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-xs font-bold border border-border">
              <button onClick={() => setLang('te')} className={`touch-target flex items-center justify-center px-2.5 py-1.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
              <button onClick={() => setLang('en')} className={`touch-target flex items-center justify-center px-2.5 py-1.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-secondary/35 blur-3xl" />

        <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] items-center gap-10 px-4 sm:px-6 pt-10 pb-12 sm:pt-20 sm:pb-20">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-subtle border border-success/20 text-success text-xs font-bold">
              <Megaphone size={13} />
              <span>{lang === 'te' ? 'మున్సిపల్ ఎన్నికల వేళ: మీ వార్డు సమస్యలు' : 'Municipal elections: put your ward on record'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary leading-[1.02] tracking-tight max-w-xl">
              {lang === 'te' ? (
                <>మీ వార్డు. మీ సమస్యలు.<br /><span className="text-primary/60">రికార్డులో.</span></>
              ) : (
                <>Your ward. Your issues.<br /><span className="text-primary/60">On the record.</span></>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
              {lang === 'te'
                ? 'రోడ్లు, నీరు, డ్రైనేజీ, వీధి దీపాలు, సేవలు — మీ వార్డులో ఏది సరిగా లేదో చెప్పండి. ఏ శాఖ స్పందిస్తుందో, ఏది స్పందించదో మేము నమోదు చేస్తాము. ఈ సేవ స్వతంత్రమైనది; ఏ పార్టీకి లేదా అభ్యర్థికి మద్దతు ఇవ్వదు.'
                : 'Roads, water, drains, streetlights, services — tell us what is broken in your ward. We track which departments respond and which do not. This helpdesk is independent and does not support any party or candidate.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 max-w-md mx-auto lg:mx-0">
              <button
                onClick={() => setView('form')}
                className="w-full group py-4 px-6 bg-primary hover:bg-primary-hover text-white font-bold text-base rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.97]"
              >
                <Mic size={20} />
                <span>{lang === 'te' ? 'చెప్పండి' : 'Speak or type a report'}</span>
                <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="w-full sm:w-auto shrink-0 py-4 px-5 bg-card hover:bg-surface border-2 border-border hover:border-primary/40 text-primary font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search size={18} />
                <span>{lang === 'te' ? 'స్థితి' : 'Track'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
              {[
                lang === 'te' ? 'అనామకంగా పంపవచ్చు' : 'Anonymous option',
                lang === 'te' ? 'తెలుగు & English' : 'Telugu & English',
                lang === 'te' ? 'ఖాతా అవసరం లేదు' : 'No account needed',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <a href={`/accountability?lang=${lang}`} className="touch-target inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover">
              {lang === 'te' ? 'ఏ శాఖలు స్పందించాయో చూడండి' : 'See which departments have responded'} <ArrowRight size={15} />
            </a>
          </div>

          <div className="relative max-w-md w-full mx-auto lg:ml-auto">
            <div className="absolute -inset-3 rounded-[2rem] bg-primary/[0.07] blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl bg-primary p-5 sm:p-7 text-white shadow-xl shadow-primary/20">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-secondary/10 blur-2xl" />

              <div className="relative space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                      {lang === 'te' ? 'ఇది సులభం' : 'It only takes a minute'}
                    </div>
                    <h2 className="mt-2 text-2xl font-black leading-tight">
                      {lang === 'te' ? 'మీ సమస్యను రికార్డ్ చేయండి' : 'Record what happened'}
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-lg">
                    <Mic size={21} />
                  </div>
                </div>

                <button
                  onClick={() => setView('form')}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/15 cursor-pointer active:scale-[0.98]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-md group-hover:scale-105 transition-transform">
                    <Mic size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{lang === 'te' ? 'మైక్ నొక్కి మాట్లాడండి' : 'Tap to record your voice'}</span>
                    <span className="mt-0.5 block text-xs text-secondary">{lang === 'te' ? 'లేదా టైప్ చేయండి' : 'Or type your report instead'}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-secondary group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {[20, 32, 46, 28, 38, 24, 42, 30, 18, 35, 25, 44, 22, 32, 18].map((height, i) => (
                    <span key={i} className="h-10 flex-1 rounded-full bg-secondary/70" style={{ height: `${height}%` }} />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/15 pt-4 text-center">
                  <div><div className="text-sm font-black">01</div><div className="mt-0.5 text-[10px] text-secondary">{lang === 'te' ? 'చెప్పండి' : 'Tell us'}</div></div>
                  <div><div className="text-sm font-black">02</div><div className="mt-0.5 text-[10px] text-secondary">{lang === 'te' ? 'పరిశీలన' : 'We review'}</div></div>
                  <div><div className="text-sm font-black">03</div><div className="mt-0.5 text-[10px] text-secondary">{lang === 'te' ? 'చర్య' : 'We follow up'}</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS RIBBON ── */}
      <section className="border-y-2 border-primary bg-primary text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/15">
          {stats.map((s, i) => (
            <div key={i} className="px-4 py-5 sm:py-6 text-center">
              <div className="text-xl sm:text-2xl font-black">{s.value}</div>
              <div className="text-[10px] text-secondary font-bold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="relative overflow-hidden bg-primary px-4 sm:px-6 py-16 sm:py-20 text-white">
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -right-8 top-22 h-40 w-40 rounded-full border border-white/10" />
        <div className="relative max-w-5xl mx-auto">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{lang === 'te' ? 'మీ ఫిర్యాదు నుంచి చర్య వరకు' : 'From report to action'}</span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">{lang === 'te' ? 'మీ వార్డు సమస్య నుంచి శాఖ సమాధానం వరకు.' : 'From your ward problem to a department answer.'}</h2>
            <p className="text-sm leading-relaxed text-secondary max-w-lg">{lang === 'te' ? 'మేము విషయాన్ని ధృవీకరించి, సంబంధిత శాఖను అడిగి, వచ్చిన సమాధానాన్ని (లేదా సమాధానం రాకపోవడాన్ని) బహిరంగంగా చూపుతాము. ఫలితాలకు హామీ ఇవ్వము.' : 'We verify the issue, ask the responsible department, and show the answer — or the silence — in public. We cannot promise outcomes.'}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={19} /></div>
                    <span className="text-3xl font-black text-white/20">{s.n}</span>
                  </div>
                  <h3 className="mt-5 text-sm font-bold">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-secondary">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY THIS EXISTS ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[.85fr_1.15fr] gap-10 lg:gap-16 items-start">
          <div className="space-y-4">
            <span className="overline">{lang === 'te' ? 'ఎందుకు ఇది ఉంది' : 'Why ComplianBox exists'}</span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight text-primary">{lang === 'te' ? 'ప్రతి వార్డు మాట వినబడాలి.' : 'Every ward deserves to be heard.'}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{lang === 'te' ? 'ఒక వీధి, ఒక కాలువ, ఒక నీటి పైపు లేదా ఒక కార్యాలయం సమస్య మొత్తం కాలనీని ప్రభావితం చేస్తుంది. ఎన్నికల ముందు ఇవి రికార్డులో ఉండాలి — మీ అనుభవం సహాయపడుతుంది.' : 'One street, drain, water pipe, or office can affect a whole colony. Before the elections, these problems should be on record — your report helps.'}</p>
            <button onClick={() => setView('form')} className="touch-target inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover cursor-pointer group">
              {lang === 'te' ? 'మీ సమస్య చెప్పండి' : 'Share your experience'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`rounded-2xl border border-border p-5 ${i === 0 ? 'bg-secondary/35' : 'bg-card'} hover:-translate-y-0.5 transition-transform`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white"><Icon size={19} /></div>
                  <h3 className="mt-5 font-bold text-sm text-primary">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ISSUE DIRECTORY ── */}
      <section className="bg-surface px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <span className="overline">{lang === 'te' ? 'ఏ సమస్యైనా' : 'No issue is too small'}</span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary">{lang === 'te' ? 'మీ వార్డును రికార్డులో ఉంచండి.' : 'Put your ward on the record.'}</h2>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{lang === 'te' ? 'కేటగిరీ ఎంచుకుని వెంటనే ప్రారంభించండి.' : 'Choose a category to start a report. You can explain the details in your own words.'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <button key={idx} onClick={() => setView('form')} className="touch-target group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left cursor-pointer hover:border-primary/40 hover:shadow-md transition-all">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cat.color} group-hover:scale-105 transition-transform`}><Icon size={21} /></div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-primary">{cat.title}</span>
                    <span className="mt-1 block text-[11px] leading-tight text-muted-foreground">{cat.desc}</span>
                  </div>
                  <ChevronRight size={17} className="shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRIVACY PROMISE ── */}
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto rounded-3xl border-2 border-foreground bg-secondary/40 p-6 sm:p-10 shadow-[5px_5px_0_hsl(var(--primary))]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary"><Lock size={18} /><span className="text-xs font-bold uppercase tracking-[0.16em]">{lang === 'te' ? 'మీ భద్రత మొదట' : 'Your safety comes first'}</span></div>
              <h2 className="text-2xl sm:text-3xl font-black text-primary">{lang === 'te' ? 'మీ పేరు చెప్పాల్సిన అవసరం లేదు.' : 'You do not have to reveal your name.'}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-secondary-foreground">{lang === 'te' ? 'మీరు అనామకంగా ఉండవచ్చు. మా టీమ్‌కు అవసరమైనంత సమాచారం మాత్రమే ఇవ్వండి. ప్రచురణకు ముందు ప్రతి వివరాన్ని జాగ్రత్తగా పరిశీలిస్తాము.' : 'You can stay anonymous. Share only what feels safe. Every detail is reviewed carefully before any public action is taken.'}</p>
            </div>
            <button onClick={() => setView('form')} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-md hover:bg-primary-hover transition cursor-pointer active:scale-95 whitespace-nowrap">
              <Mic size={17} /> {lang === 'te' ? 'ప్రారంభించండి' : 'Start a report'}
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 text-white">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative max-w-2xl space-y-5">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{lang === 'te' ? 'మీ గొంతు ముఖ్యం' : 'Your voice matters'}</span>
            <h2 className="text-3xl sm:text-5xl font-black leading-[1.02]">{lang === 'te' ? 'చెప్పండి. ట్రాక్ చేయండి. ఎవరు స్పందిస్తారో చూడండి.' : 'Report it. Track it. See who answers.'}</h2>
            <p className="max-w-lg text-sm sm:text-base leading-relaxed text-secondary">{lang === 'te' ? 'ఉచితం. సురక్షితం. స్వతంత్రం — ఏ పార్టీకి లేదా అభ్యర్థికి సంబంధం లేదు.' : 'Free to use. Private by design. Independent — not linked to any party or candidate.'}</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button onClick={() => setView('form')} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-bold text-primary shadow-lg hover:bg-white/90 transition cursor-pointer active:scale-95"><Mic size={18} />{lang === 'te' ? 'ఇప్పుడే చెప్పండి' : 'Report now'}</button>
              <button onClick={() => setShowStatusModal(true)} className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 py-4 text-base font-bold text-white hover:bg-white/15 transition cursor-pointer"><Search size={17} />{lang === 'te' ? 'స్థితి చూడండి' : 'Track a report'}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-surface/50 safe-area-bottom">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-9">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-sm space-y-3">
              <div className="flex items-center gap-2.5"><img src="/complianbox.png" alt="ComplianBox" className="h-9 w-9 rounded-xl object-contain" /><span className="font-extrabold text-sm text-primary">{endpoint.workspaceName || endpoint.title || 'ComplianBox'}</span></div>
              <p className="text-xs leading-relaxed text-muted-foreground">{lang === 'te' ? 'వార్డు స్థాయి సమస్యలను వెలుగులోకి తెచ్చే స్వతంత్ర, పక్షపాతం లేని వేదిక. ఏ రాజకీయ పార్టీకి లేదా అభ్యర్థికి మద్దతు ఇవ్వదు.' : 'An independent, non-partisan way to bring ward-level problems into the open. It does not support any political party or candidate.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-xs">
              <button onClick={() => setView('form')} className="touch-target text-left font-semibold text-muted-foreground hover:text-primary cursor-pointer">{lang === 'te' ? 'ఫిర్యాదు పంపండి' : 'Submit a report'}</button>
              <button onClick={() => setShowStatusModal(true)} className="touch-target text-left font-semibold text-muted-foreground hover:text-primary cursor-pointer">{lang === 'te' ? 'స్థితి చూడండి' : 'Track a report'}</button>
              <a href={`/accountability?lang=${lang}`} className="touch-target text-left font-semibold text-muted-foreground hover:text-primary">{lang === 'te' ? 'బహిరంగ జవాబుదారీ పట్టిక' : 'Public accountability tracker'}</a>
              <span className="flex items-center gap-1.5 text-muted-foreground"><Lock size={12} className="text-success" />{lang === 'te' ? 'గోప్యత రక్షితం' : 'Privacy protected'}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 size={12} className="text-success" />{lang === 'te' ? 'స్వతంత్ర పరిశీలన' : 'Independent review'}</span>
            </div>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border pt-5 text-[10px] text-muted-foreground">
            <span>© {new Date().getFullYear()} {endpoint.workspaceName || endpoint.title || 'ComplianBox'}</span>
            <span>{lang === 'te' ? 'డేటా ఎన్క్రిప్ట్ & రక్షించబడింది' : 'Data encrypted & protected'}</span>
          </div>
        </div>
      </footer>

      {/* ── STATUS MODAL — Bottom Sheet ── */}
      {showStatusModal && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => { setShowStatusModal(false); setLookupResult(null); setTrackingCode(''); }} />
          <div className="bottom-sheet">
            <div className="bottom-sheet-content p-5 space-y-4">
              <div className="flex justify-center pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Search size={16} />
                  <span>{lang === 'te' ? 'స్థితి చూడండి' : 'Track Status'}</span>
                </div>
                <button onClick={() => { setShowStatusModal(false); setLookupResult(null); setTrackingCode(''); }} className="touch-target flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer"><X size={18} /></button>
              </div>

              {!lookupResult ? (
                <form onSubmit={handleTrackSubmit} className="space-y-3">
                  <input type="text" required placeholder="CD-IN-2026-XXXXX" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} className="w-full p-3.5 bg-background border border-border rounded-xl text-base font-mono font-bold text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase" />
                  <button type="submit" disabled={isSearching || !trackingCode.trim()} className="touch-target w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition cursor-pointer disabled:opacity-50">
                    {isSearching ? '...' : (lang === 'te' ? 'చూపించు' : 'Check Status')}
                  </button>
                </form>
              ) : lookupResult.error ? (
                <div className="space-y-3 text-center py-4">
                  <div className="text-sm text-destructive font-bold">{lookupResult.message}</div>
                  <button onClick={() => setLookupResult(null)} className="touch-target text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">{lang === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Try again'}</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-success-subtle border border-success/20 text-center">
                    <div className="text-[10px] font-bold text-success uppercase">{lang === 'te' ? 'స్థితి' : 'Status'}</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{lookupResult.status}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{lookupResult.ref}</div>
                  </div>
                  <div className="space-y-1.5">
                    {lookupResult.steps.map((st: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs p-2.5 rounded-lg bg-background">
                        {st.done ? <Check size={14} className="text-success shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                        <span className={st.done ? 'text-primary font-semibold' : 'text-muted-foreground'}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setLookupResult(null)} className="touch-target w-full text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">{lang === 'te' ? 'మరొక కోడ్' : 'Check another'}</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
