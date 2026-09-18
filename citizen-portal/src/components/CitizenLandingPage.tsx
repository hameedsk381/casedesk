'use client';

import React, { useState } from 'react';
import {
  Megaphone,
  Lock,
  Mic,
  FileText,
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
}

type ViewState = 'landing' | 'form';
type Language = 'en' | 'te';

export function CitizenLandingPage({ endpoint }: Props) {
  const [view, setView] = useState<ViewState>('landing');
  const [lang, setLang] = useState<Language>('en');
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
          <CitizenSubmissionForm endpoint={endpoint} lang={lang} setLang={setLang} onBackToSelect={() => setView('landing')} />
        </main>
      </div>
    );
  }

  /* ─── Landing Page Data ─── */
  const categories = [
    { icon: HeartPulse, color: 'bg-rose-100 text-rose-600', title: lang === 'te' ? 'వైద్యం' : 'Healthcare', desc: lang === 'te' ? 'ఆసుపత్రులు, మందులు, వైద్యం' : 'Hospitals, medicines, treatment' },
    { icon: Users, color: 'bg-amber-100 text-amber-600', title: lang === 'te' ? 'పింఛను & రేషన్' : 'Welfare', desc: lang === 'te' ? 'పింఛను, రేషన్ కార్డు, సంక్షేమం' : 'Pensions, ration cards, schemes' },
    { icon: Scale, color: 'bg-emerald-100 text-emerald-600', title: lang === 'te' ? 'అవినీతి' : 'Corruption', desc: lang === 'te' ? 'లంచాలు, అవినీతి, మోసాలు' : 'Bribes, fraud, misconduct' },
    { icon: Zap, color: 'bg-sky-100 text-sky-600', title: lang === 'te' ? 'మున్సిపల్' : 'Municipal', desc: lang === 'te' ? 'రోడ్లు, నీరు, విద్యుత్' : 'Roads, water, electricity' },
    { icon: Eye, color: 'bg-violet-100 text-violet-600', title: lang === 'te' ? 'పాఠశాలలు' : 'Education', desc: lang === 'te' ? 'పాఠశాలలు, ఉపాధ్యాయులు' : 'Schools, teachers, facilities' },
    { icon: Globe, color: 'bg-teal-100 text-teal-600', title: lang === 'te' ? 'ఇతరాలు' : 'Other Issues', desc: lang === 'te' ? 'ఏదైనా ప్రజా సమస్య' : 'Any civic problem' },
  ];

  const steps = [
    { n: '1', title: lang === 'te' ? 'వివరాలు చెప్పండి' : 'Share Details', desc: lang === 'te' ? 'వాయిస్ లేదా టైప్ చేసి సేవకు సంబంధించిన వివరాలు చెప్పండి.' : 'Speak or type the service need in any language.', icon: MessageCircle },
    { n: '2', title: lang === 'te' ? 'సమీక్ష' : 'We Review', desc: lang === 'te' ? 'మా బృందం వివరాలను జాగ్రత్తగా పరిశీలిస్తుంది.' : 'Our team reviews the details carefully.', icon: Search },
    { n: '3', title: lang === 'te' ? 'సమన్వయం' : 'Coordinate', desc: lang === 'te' ? 'అవసరమైతే సంబంధిత సేవా విభాగానికి సమాచారాన్ని పంపడంలో సహాయం చేస్తాము.' : 'When appropriate, we help route information to the relevant service team.', icon: Eye },
    { n: '4', title: lang === 'te' ? 'పురోగతి' : 'Follow-up', desc: lang === 'te' ? 'మీ రిఫరెన్స్ కోడ్‌తో స్థితిని చూడవచ్చు.' : 'Use your reference code to check progress.', icon: TrendingUp },
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
            <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
              <Megaphone size={18} />
            </div>
            <span className="font-extrabold text-sm text-primary">
              {endpoint.workspaceName || endpoint.title || 'ComplainBox'}
            </span>
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
              <span>{lang === 'te' ? '100% ఉచితం & రహస్యం' : 'Free, private, and easy to use'}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary leading-[1.02] tracking-tight max-w-xl">
              {lang === 'te' ? (
                <>మీ గొంతు<br /><span className="text-primary/60">మార్పు తెస్తుంది.</span></>
              ) : (
                <>Your voice<br /><span className="text-primary/60">can change things.</span></>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
              {lang === 'te'
                ? 'మీ ప్రాంతంలోని సమస్యను మైక్ నొక్కి చెప్పండి లేదా టైప్ చేయండి. మీ సమాచారం మా టీమ్‌కు చేరుతుంది.'
                : 'Report a problem in your area by speaking or typing. Your information reaches a team that can follow up.'}
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

      {/* ── STATS BAR ── */}
      <section className="border-y border-border bg-surface/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
          {stats.map((s, i) => (
            <div key={i} className="px-4 py-5 text-center">
              <div className="text-xl sm:text-2xl font-black text-primary">{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-5xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-10 space-y-2">
          <span className="overline">{lang === 'te' ? 'ఎలా పనిచేస్తుంది' : 'How it works'}</span>
          <h2 className="text-2xl sm:text-3xl font-black text-primary">
            {lang === 'te' ? 'నాలుగు సులభ దశలు' : 'Four simple steps'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative p-5 rounded-2xl bg-card border border-border group hover:border-primary/30 transition-colors">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-3 w-6 h-0.5 bg-border" />
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon size={22} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{s.n}</span>
                  <h3 className="font-bold text-sm text-primary">{s.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-surface/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 space-y-2">
            <span className="overline">{lang === 'te' ? 'ఎందుకు మమ్మల్ని' : 'Why us'}</span>
            <h2 className="text-2xl sm:text-3xl font-black text-primary">
              {lang === 'te' ? 'మీకు అవసరమైనవన్నీ' : 'Everything you need'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-primary mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 max-w-5xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-10 space-y-2">
          <span className="overline">{lang === 'te' ? 'సమస్యలు' : 'Common issues'}</span>
          <h2 className="text-2xl sm:text-3xl font-black text-primary">
            {lang === 'te' ? 'ఏ రకమైన సమస్యైనా' : 'Report any problem'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={idx}
                onClick={() => setView('form')}
                className="touch-target p-4 rounded-xl bg-card border border-border flex items-center gap-3.5 text-left hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cat.color} group-hover:scale-105 transition-transform`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-primary block">{cat.title}</span>
                  <span className="text-[11px] text-muted-foreground block leading-tight mt-0.5">{cat.desc}</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto relative overflow-hidden p-8 sm:p-10 rounded-3xl bg-primary text-white text-center space-y-5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute top-4 right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

          <div className="relative space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              {lang === 'te' ? 'సమస్యను దాచవద్దు.' : "Don't stay silent."}
            </h2>
            <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
              {lang === 'te'
                ? 'మీ గొంతు వినిపించాలి. ఉచితం, సురక్షితం, గోప్యం.'
                : 'Your voice matters. Free, safe, and confidential.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setView('form')}
                className="touch-target w-full sm:w-auto px-8 py-4 bg-white text-primary hover:bg-white/90 font-bold text-base rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Mic size={18} />
                {lang === 'te' ? 'ఇప్పుడే చెప్పండి →' : 'Speak Now →'}
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="touch-target w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-base rounded-xl border border-white/20 transition cursor-pointer"
              >
                {lang === 'te' ? 'స్థితి చూడండి' : 'Track Report'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-surface/30 safe-area-bottom">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <span className="font-extrabold text-sm text-primary">{endpoint.workspaceName || endpoint.title || 'ComplainBox'}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                {lang === 'te' ? 'ప్రజా సమస్యలను పరిశీలించే, నిజాలు బయటపెట్టే ప్లాట్‌ఫామ్.' : 'A platform to investigate and expose civic issues.'}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider">{lang === 'te' ? 'లింకులు' : 'Links'}</h4>
              <div className="space-y-1.5">
                {[lang === 'te' ? 'గోప్యతా విధానం' : 'Privacy Policy', lang === 'te' ? 'నిబంధనలు' : 'Terms of Use', lang === 'te' ? 'సంప్రదింపు' : 'Contact Us'].map((link, i) => (
                  <a key={i} href="#" className="touch-target flex items-center text-xs text-muted-foreground hover:text-primary transition">{link}</a>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-primary uppercase tracking-wider">{lang === 'te' ? 'నమ్మకం' : 'Trust'}</h4>
              <div className="space-y-1.5">
                {[
                  { icon: Lock, text: lang === 'te' ? 'ఎండ్-టు-ఎండ్ ఎన్క్రిప్షన్' : 'End-to-end encryption' },
                  { icon: Megaphone, text: lang === 'te' ? 'మూలాల రక్షణ' : 'Source protection guarantee' },
                  { icon: CheckCircle2, text: lang === 'te' ? 'స్వతంత్ర పరిశోధన' : 'Independent investigation' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <t.icon size={12} className="text-success shrink-0" />
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-muted-foreground">
              © {new Date().getFullYear()} {endpoint.workspaceName || endpoint.title || 'ComplainBox'}. {lang === 'te' ? 'అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Lock size={10} />
              <span>{lang === 'te' ? 'డేటా ఎన్క్రిప్ట్ & రక్షించబడింది' : 'Data encrypted & protected'}</span>
            </div>
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
