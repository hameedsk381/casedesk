'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mic,
  Bot,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Languages,
  EyeOff,
  Droplets,
  HeartPulse,
  Scale,
  Users,
  X,
  ChevronRight,
  Check
} from 'lucide-react';
import { CitizenPortalHub } from './CitizenPortalHub';

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

type ViewState = 'landing' | 'submit_hub';
type Language = 'en' | 'te';

export function CitizenLandingPage({ endpoint }: Props) {
  const [view, setView] = useState<ViewState>('landing');
  const [lang, setLang] = useState<Language>('en'); // Default to English

  // Status Lookup state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // If user clicked to start reporting
  if (view === 'submit_hub') {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Back button bar */}
        <div className="bg-primary text-white px-4 py-2 text-xs flex items-center justify-between">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-1.5 hover:text-slate-300 font-bold transition cursor-pointer"
          >
            ← {lang === 'te' ? 'హోమ్ పేజీకి వెళ్ళండి' : 'Back to Home'}
          </button>
          <span className="text-slate-300 text-[11px]">
            {lang === 'te' ? 'గోప్య సహాయ కేంద్రం' : 'Private & Confidential'}
          </span>
        </div>
        <div className="flex-1">
          <CitizenPortalHub endpoint={endpoint} initialLang={lang} />
        </div>
      </div>
    );
  }

  // Handle tracking search
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
          message:
            lang === 'te'
              ? 'ఈ కోడ్‌తో ఫిర్యాదు కనిపించలేదు. సరైన కోడ్ వేయండి.'
              : errData.error || 'No report found with this code.',
        });
      }
    } catch {
      setLookupResult({
        error: true,
        ref: code,
        message:
          lang === 'te'
            ? 'నెట్‌వర్క్ సమస్య. కాసేపటి తర్వాత ప్రయత్నించండి.'
            : 'Unable to connect. Please try again later.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const simpleCategories = [
    {
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-50',
      title: lang === 'te' ? 'ఆసుపత్రులు & వైద్యం' : 'Hospitals & Health',
      desc: lang === 'te' ? 'డాక్టర్లు లేరు, మందులు లేవు, సరైన వైద్యం అందడం లేదు.' : 'No doctors, missing medicines, poor treatment.',
    },
    {
      icon: Droplets,
      color: 'text-sky-600 bg-sky-50',
      title: lang === 'te' ? 'రోడ్లు & తాగునీరు' : 'Roads & Water',
      desc: lang === 'te' ? 'గుంతల రోడ్లు, తాగునీటి సమస్య, మురుగు కాలువలు.' : 'Potholes, dirty water, bad drainage.',
    },
    {
      icon: Users,
      color: 'text-amber-600 bg-amber-50',
      title: lang === 'te' ? 'ఫించన్లు & రేషన్' : 'Pensions & Ration',
      desc: lang === 'te' ? 'ఫించన్ రావడం లేదు, రేషన్ కార్డు సమస్యలు.' : 'Pension not coming, ration card issues.',
    },
    {
      icon: Scale,
      color: 'text-emerald-600 bg-emerald-50',
      title: lang === 'te' ? 'లంచాలు & అవినీతి' : 'Bribes & Corruption',
      desc: lang === 'te' ? 'ప్రభుత్వ పనులకు లంచం అడగడం.' : 'Officials asking bribes for govt work.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-card via-background to-surface text-foreground font-sans antialiased selection:bg-primary/15 selection:text-primary">
      
      {/* 1. SIMPLE CLEAN HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-3 shadow-2xs py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-2xs">
              <ShieldCheck size={16} />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-primary block leading-none">
                {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {lang === 'te' ? 'ప్రజా సమస్యల పోర్టల్' : 'Citizen Helpdesk'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Button */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-background hover:bg-slate-100 border border-surface-3 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <Search size={13} className="text-slate-500" />
              <span className="hidden sm:inline">{lang === 'te' ? 'ఫిర్యాదు స్థితి' : 'Track Status'}</span>
            </button>

            {/* Language Pill Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white border border-surface-3 rounded-xl text-xs font-bold shadow-2xs">
              <button
                onClick={() => setLang('te')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  lang === 'te' ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
                }`}
              >
                తెలుగు
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
                }`}
              >
                English
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. SIMPLE, HUMAN HERO SECTION */}
      <section className="px-4 pt-8 pb-10 sm:pt-14 sm:pb-16 text-center">
        <div className="max-w-2xl mx-auto space-y-5">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{lang === 'te' ? '100% ఉచితం & మీ పేరు రహస్యం' : '100% Free & Identity Protected'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-primary leading-tight tracking-tight">
            {lang === 'te' ? (
              <>
                మీ ఊరిలో సమస్య ఉందా? <br />
                <span className="text-primary">మా జర్నలిస్టులకు చెప్పండి.</span>
              </>
            ) : (
              <>
                Facing a public issue? <br />
                <span className="text-primary">Tell our investigative reporters.</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto font-normal">
            {lang === 'te'
              ? 'ఆసుపత్రిలో మందులు లేవా? రోడ్లు పాడైపోయాయా? లంచం అడుగుతున్నారా? తెలుగు, Tenglish లేదా English లో టైప్ చేయవచ్చు లేదా మైక్ నొక్కి చెప్పవచ్చు.'
              : 'Hospital issues? Damaged roads? Pension troubles? You can easily write in English, Telugu, or Tenglish, or speak via voice note.'}
          </p>

          {/* MAIN BIG ACTION BUTTON */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => setView('submit_hub')}
            className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-white font-black text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
          >
            <Mic size={18} className="text-primary" />
            <span>{lang === 'te' ? 'మీ సమస్య చెప్పండి →' : 'Tell Us What Happened →'}</span>
          </button>
          </div>

          {/* 4 SIMPLE REASSURANCES */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'మీ పేరు దాగి ఉంటుంది' : 'Your name stays hidden'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'మైక్ నొక్కి చెప్పవచ్చు' : 'Just speak into the mic'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'తెలుగు, Tenglish & English' : 'Telugu, Tenglish & English'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'మా టీమ్ పరిశీలిస్తుంది' : 'We investigate & follow up'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TWO EASY CHOICES (CHAT OR FORM) */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-bold text-primary">
            {lang === 'te' ? 'మీకు ఏది సులభంగా అనిపిస్తే అది ఎంచుకోండి:' : 'Choose how you want to report:'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Choice 1: AI Chat */}
          <div
            onClick={() => setView('submit_hub')}
            className="p-5 rounded-3xl bg-white border-2 border-primary/30 hover:border-primary shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Bot size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {lang === 'te' ? 'చాలా సులభం' : 'Easiest • Voice'}
                </span>
              </div>

              <h3 className="font-black text-sm sm:text-base text-primary group-hover:text-primary transition">
                {lang === 'te' ? 'AI సహాయకుడితో మాట్లాడండి' : 'Chat with AI Assistant'}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'te'
                  ? 'వాట్సాప్‌లో మాట్లాడినట్లుగా మైక్‌తో మాట్లాడండి. సహాయకుడు ప్రశ్నలు అడుగుతూ మీ వివరాలు నమోదు చేస్తాడు.'
                  : 'Talk naturally like in WhatsApp. Use voice notes or type. AI guides you with simple questions.'}
              </p>
            </div>

            <div className="pt-4 flex items-center text-xs font-bold text-primary">
              <span>{lang === 'te' ? 'చాట్ ప్రారంభించండి →' : 'Start Chat →'}</span>
            </div>
          </div>

          {/* Choice 2: Simple Form */}
          <div
            onClick={() => setView('submit_hub')}
            className="p-5 rounded-3xl bg-white border border-surface-3 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-primary flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <FileText size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {lang === 'te' ? 'దశల వారీగా' : 'Step-by-Step'}
                </span>
              </div>

              <h3 className="font-black text-sm sm:text-base text-primary group-hover:text-primary/80 transition">
                {lang === 'te' ? 'ఫారమ్ పూరించండి' : 'Fill Out a Form'}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'te'
                  ? 'ఏం జరిగింది, ఎక్కడ జరిగింది, ఫోటోలు లాంటి వివరాలను మీ స్వంత వేగంతో ఫారమ్‌లో రాయండి.'
                  : 'Fill in details, location, and attach photos or documents step-by-step at your own pace.'}
              </p>
            </div>

            <div className="pt-4 flex items-center text-xs font-bold text-primary">
              <span>{lang === 'te' ? 'ఫారమ్ తెరవండి →' : 'Open Form →'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. COMMON PROBLEMS WE SOLVE */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="p-6 rounded-3xl bg-white border border-surface-3 shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-primary">
            {lang === 'te' ? 'సాధారణంగా ప్రజలు చెప్పే సమస్యలు:' : 'Common issues reported by citizens:'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {simpleCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="p-3 rounded-2xl bg-background/70 border border-surface-3 flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-primary block truncate">
                      {cat.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                      {cat.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (JUST 3 SIMPLE STEPS) */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-bold text-primary">
            {lang === 'te' ? 'మీ ఫిర్యాదు తర్వాత ఏం జరుగుతుంది?' : 'What happens after you report?'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-surface-3 space-y-1.5 text-center shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-bold text-xs text-primary">
              {lang === 'te' ? 'మీరు చెబుతారు' : '1. You Tell Us'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              {lang === 'te' ? 'వాయిస్ లేదా టైప్ చేసి మీ సమస్య చెప్పండి.' : 'Speak or type what happened.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-surface-3 space-y-1.5 text-center shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-bold text-xs text-primary">
              {lang === 'te' ? 'మేము పరిశీలిస్తాము' : '2. We Investigate'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              {lang === 'te' ? 'మా రిపోర్టర్లు నిజం చేసి చూస్తారు.' : 'Our reporters check the facts.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-surface-3 space-y-1.5 text-center shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-bold text-xs text-primary">
              {lang === 'te' ? 'సమస్య పరిష్కారం' : '3. Problem Solved'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              {lang === 'te' ? 'అధికారులను ప్రశ్నించి పరిష్కారం కోరతారు.' : 'Authorities are questioned to fix it.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM PROMINENT CTA */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full text-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-primary text-white space-y-4 shadow-md">
          <h2 className="text-lg sm:text-2xl font-black">
            {lang === 'te' ? 'సమస్యను దాచవద్దు. ధైర్యంగా చెప్పండి.' : 'Don\'t stay silent. Tell us what\'s wrong.'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            {lang === 'te'
              ? 'మీ పేరు ఎవరికీ చెప్పము. పూర్తిగా ఉచితం మరియు సురక్షితం.'
              : 'Your identity is protected. Completely free and safe.'}
          </p>
          <button
            onClick={() => setView('submit_hub')}
            className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            {lang === 'te' ? 'ఇప్పుడే చెప్పండి →' : 'Report Now →'}
          </button>
        </div>
      </section>

      {/* 7. REASSURING FOOTER */}
      <footer className="mt-auto border-t border-surface-3/70 bg-white/70 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-bold text-primary text-xs">
            <Lock size={13} className="text-emerald-600" />
            <span>{lang === 'te' ? 'మీ సమాచారం పూర్తిగా గోప్యంగా ఉంటుంది' : 'Your Information Is Safe With Us'}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {lang === 'te'
              ? 'మీరు అనామకంగా ఉండాలనుకుంటే మీ పేరు లేదా ఫోన్ నంబర్ ఏ అధికారిక సంస్థకూ ఇవ్వబడదు.'
              : 'If you choose to stay anonymous, your name and phone number are never shared.'}
          </p>
        </div>
      </footer>

      {/* STATUS LOOKUP MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-surface-3 rounded-3xl p-6 space-y-4 shadow-xl animate-slide-up">
            
            <div className="flex items-center justify-between pb-2 border-b border-surface-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Search size={16} className="text-primary" />
                <span>{lang === 'te' ? 'ఫిర్యాదు స్థితి చూడండి' : 'Check Report Status'}</span>
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setLookupResult(null);
                  setTrackingCode('');
                }}
                className="p-1 text-slate-500 hover:text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!lookupResult ? (
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  {lang === 'te'
                    ? 'మీకు వచ్చిన కోడ్ ఇక్కడ టైప్ చేయండి (ఉదా: CD-IN-2026-00005):'
                    : 'Enter the code you received (e.g. CD-IN-2026-00005):'}
                </p>

                <input
                  type="text"
                  required
                  placeholder="CD-IN-2026-XXXXX"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full p-2.5 bg-background border border-surface-3 rounded-xl text-xs font-mono font-bold text-primary placeholder:text-slate-500 focus:outline-none focus:border-primary uppercase"
                />

                <button
                  type="submit"
                  disabled={isSearching || !trackingCode.trim()}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSearching
                    ? (lang === 'te' ? 'వెతుకుతున్నాము...' : 'Checking...')
                    : (lang === 'te' ? 'స్థితిని చూపించు →' : 'Check Status →')}
                </button>
              </form>
            ) : lookupResult.error ? (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">
                    {lang === 'te' ? 'ఫిర్యాదు కనిపించలేదు' : 'Report Not Found'}
                  </span>
                  <div className="text-xs font-semibold text-rose-950 mt-1">
                    {lang === 'te'
                      ? 'ఈ కోడ్‌తో ఫిర్యాదు కనిపించలేదు. సరైన కోడ్ వేయండి.'
                      : lookupResult.message}
                  </div>
                  <div className="text-[10px] font-mono text-rose-700 mt-1 font-bold">
                    {lookupResult.ref}
                  </div>
                </div>
                <button
                  onClick={() => setLookupResult(null)}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-primary cursor-pointer"
                >
                  {lang === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Try another code'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    {lang === 'te' ? 'ప్రస్తుత స్థితి' : 'Current Status'}
                  </span>
                  <div className="text-xs font-bold text-emerald-950 mt-0.5">
                    {lookupResult.status}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                    {lookupResult.ref}
                  </div>
                </div>

                <div className="space-y-1.5">
                  {lookupResult.steps.map((st: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-background">
                      {st.done ? (
                        <Check size={13} className="text-emerald-600 shrink-0 font-bold" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={st.done ? 'text-primary font-semibold' : 'text-slate-500'}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setLookupResult(null)}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-primary cursor-pointer"
                >
                  {lang === 'te' ? 'మరొక కోడ్ చూడండి' : 'Check another code'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
