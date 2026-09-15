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
  apiBaseUrl?: string;
}

type ViewState = 'landing' | 'submit_hub';
type Language = 'en' | 'te';

export function CitizenLandingPage({ endpoint, apiBaseUrl = 'http://localhost:3000' }: Props) {
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
        <div className="bg-navy text-white px-4 py-2 text-xs flex items-center justify-between">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-1.5 hover:text-slate-300 font-bold transition cursor-pointer"
          >
            ← {lang === 'te' ? 'హోమ్ పేజీకి వెళ్ళండి' : 'Back to Home'}
          </button>
          <span className="text-slate-300 text-[11px]">
            {lang === 'te' ? 'రహస్య ఫిర్యాదుల విభాగం' : 'Confidential Public Helpdesk'}
          </span>
        </div>
        <div className="flex-1">
          <CitizenPortalHub endpoint={endpoint} apiBaseUrl={apiBaseUrl} initialLang={lang} />
        </div>
      </div>
    );
  }

  // Handle tracking search
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setLookupResult({
        ref: trackingCode.trim().toUpperCase(),
        status: lang === 'te' ? 'జర్నలిస్టుల పరిశీలనలో ఉంది' : 'Under Review by Journalists',
        steps: [
          { title: lang === 'te' ? '1. ఫిర్యాదు అందింది' : '1. Report Received', done: true },
          { title: lang === 'te' ? '2. వివరాలు పరిశీలిస్తున్నారు' : '2. Details Under Review', done: true },
          { title: lang === 'te' ? '3. క్షేత్రస్థాయి విచారణ' : '3. Ground Verification', done: false },
          { title: lang === 'te' ? '4. అధికారులను నిలదీయడం' : '4. Action with Authorities', done: false },
        ]
      });
      setIsSearching(false);
    }, 500);
  };

  const simpleCategories = [
    {
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-50',
      title: lang === 'te' ? 'వైద్యం & ఆసుపత్రులు' : 'Hospitals & Healthcare',
      desc: lang === 'te' ? 'డాక్టర్లు లేకపోవడం, మందుల కొరత, నిర్లక్ష్యం.' : 'No doctors, medicine shortage, poor medical care.',
    },
    {
      icon: Droplets,
      color: 'text-sky-600 bg-sky-50',
      title: lang === 'te' ? 'రోడ్లు & తాగునీరు' : 'Roads & Drinking Water',
      desc: lang === 'te' ? 'గుంతల రోడ్లు, తాగునీటి సమస్య, మురుగు కాలువలు.' : 'Broken roads, contaminated water, dirty drains.',
    },
    {
      icon: Users,
      color: 'text-amber-600 bg-amber-50',
      title: lang === 'te' ? 'ఫించన్లు & రేషన్' : 'Pensions & Ration Schemes',
      desc: lang === 'te' ? 'రావాల్సిన పథకాలు రాకపోవడం, అర్హులను తొలగించడం.' : 'Delayed pensions, ration issues, welfare siphoning.',
    },
    {
      icon: Scale,
      color: 'text-emerald-600 bg-emerald-50',
      title: lang === 'te' ? 'లంచాలు & అవినీతి' : 'Bribes & Corruption',
      desc: lang === 'te' ? 'ప్రభుత్వ పనులకు అధికారులు లంచం డిమాండ్ చేయడం.' : 'Officials demanding bribes for public certificates or work.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-slate-50 via-off-white to-slate-100 text-navy font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
      
      {/* 1. SIMPLE CLEAN HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border-light shadow-2xs py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm shadow-2xs">
              CD
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-navy block leading-none">
                {endpoint.workspaceName || 'CaseDesk'}
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-off-white hover:bg-slate-100 border border-border-light text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <Search size={13} className="text-slate-500" />
              <span className="hidden sm:inline">{lang === 'te' ? 'ఫిర్యాదు స్థితి' : 'Track Status'}</span>
            </button>

            {/* Language Pill Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white border border-border-light rounded-xl text-xs font-bold shadow-2xs">
              <button
                onClick={() => setLang('te')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  lang === 'te' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
                }`}
              >
                తెలుగు
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
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

          <h1 className="text-2xl sm:text-4xl font-black text-navy leading-tight tracking-tight">
            {lang === 'te' ? (
              <>
                మీ ఊరిలో సమస్య ఉందా? <br />
                <span className="text-electric-blue">మా జర్నలిస్టులకు చెప్పండి.</span>
              </>
            ) : (
              <>
                Facing a public issue? <br />
                <span className="text-electric-blue">Tell our investigative reporters.</span>
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
              className="w-full sm:w-auto px-8 py-4 bg-navy hover:bg-navy/90 text-white font-black text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Mic size={18} className="text-electric-blue" />
              <span>{lang === 'te' ? 'సమస్యను చెప్పండి (వాయిస్ / మెసేజ్) →' : 'Report an Issue (Voice or Text) →'}</span>
            </button>
          </div>

          {/* 4 SIMPLE REASSURANCES */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'మీ పేరు ఎవరికీ చెప్పము' : 'Keep name 100% private'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'నోటి మాటతో చెప్పవచ్చు' : 'Speak via voice note'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'తెలుగు, Tenglish & English' : 'Telugu, Tenglish & English'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>{lang === 'te' ? 'రిపోర్టర్లు పరిశీలిస్తారు' : 'Reporters follow up'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TWO EASY CHOICES (CHAT OR FORM) */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-bold text-navy">
            {lang === 'te' ? 'మీకు ఏది సులభంగా అనిపిస్తే అది ఎంచుకోండి:' : 'Choose how you want to report:'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Choice 1: AI Chat */}
          <div
            onClick={() => setView('submit_hub')}
            className="p-5 rounded-3xl bg-white border-2 border-electric-blue/30 hover:border-electric-blue shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Bot size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[10px] font-bold">
                  {lang === 'te' ? 'చాలా సులభం' : 'Easiest • Voice'}
                </span>
              </div>

              <h3 className="font-black text-sm sm:text-base text-navy group-hover:text-electric-blue transition">
                {lang === 'te' ? 'AI సహాయకుడితో మాట్లాడండి' : 'Chat with AI Assistant'}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'te'
                  ? 'వాట్సాప్‌లో మాట్లాడినట్లుగా మైక్‌తో మాట్లాడండి. సహాయకుడు ప్రశ్నలు అడుగుతూ మీ వివరాలు నమోదు చేస్తాడు.'
                  : 'Talk naturally like in WhatsApp. Use voice notes or type. AI guides you with simple questions.'}
              </p>
            </div>

            <div className="pt-4 flex items-center text-xs font-bold text-electric-blue">
              <span>{lang === 'te' ? 'చాట్ ప్రారంభించండి →' : 'Start Chat →'}</span>
            </div>
          </div>

          {/* Choice 2: Simple Form */}
          <div
            onClick={() => setView('submit_hub')}
            className="p-5 rounded-3xl bg-white border border-border-light hover:border-slate-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <FileText size={20} />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {lang === 'te' ? 'దశల వారీగా' : 'Step-by-Step'}
                </span>
              </div>

              <h3 className="font-black text-sm sm:text-base text-navy group-hover:text-navy/80 transition">
                {lang === 'te' ? 'ఫారమ్ పూరించండి' : 'Fill Out a Form'}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'te'
                  ? 'ఏం జరిగింది, ఎక్కడ జరిగింది, ఫోటోలు లాంటి వివరాలను మీ స్వంత వేగంతో ఫారమ్‌లో రాయండి.'
                  : 'Fill in details, location, and attach photos or documents step-by-step at your own pace.'}
              </p>
            </div>

            <div className="pt-4 flex items-center text-xs font-bold text-navy">
              <span>{lang === 'te' ? 'ఫారమ్ తెరవండి →' : 'Open Form →'}</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. COMMON PROBLEMS WE SOLVE */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="p-6 rounded-3xl bg-white border border-border-light shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-navy">
            {lang === 'te' ? 'సాధారణంగా ప్రజలు చెప్పే సమస్యలు:' : 'Common issues reported by citizens:'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {simpleCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="p-3 rounded-2xl bg-off-white/70 border border-border-light flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-navy block truncate">
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
          <h2 className="text-base sm:text-lg font-bold text-navy">
            {lang === 'te' ? 'మీ ఫిర్యాదు తర్వాత ఏం జరుగుతుంది?' : 'How does it work?'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-border-light space-y-1.5 text-center shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-electric-blue text-white font-bold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-bold text-xs text-navy">
              {lang === 'te' ? 'మీరు చెబుతారు' : '1. You Report'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              {lang === 'te' ? 'వాయిస్ లేదా ఫారమ్ ద్వారా మీ సమస్యను మాకు అందిస్తారు.' : 'Tell what happened via voice or text safely.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-border-light space-y-1.5 text-center shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-electric-blue text-white font-bold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-bold text-xs text-navy">
              {lang === 'te' ? 'జర్నలిస్టులు పరిశీలిస్తారు' : '2. Reporters Check'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              {lang === 'te' ? 'మా రిపోర్టర్లు వాస్తవాలను, సాక్ష్యాలను నిర్ధారిస్తారు.' : 'Journalists verify facts and ground situation.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-border-light space-y-1.5 text-center shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-bold text-xs text-navy">
              {lang === 'te' ? 'అధికారులను ప్రశ్నిస్తారు' : '3. Action Taken'}
            </h3>
            <p className="text-[11px] text-slate-500 leading-snug">
              {lang === 'te' ? 'పరిష్కారం కోసం అధికారుల వివరణ కోరి ప్రశ్నిస్తారు.' : 'Authorities are questioned to resolve the issue.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM PROMINENT CTA */}
      <section className="px-4 py-8 max-w-3xl mx-auto w-full text-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-navy text-white space-y-4 shadow-md">
          <h2 className="text-lg sm:text-2xl font-black">
            {lang === 'te' ? 'సమస్యను దాచవద్దు. ధైర్యంగా చెప్పండి.' : 'Do not stay silent. Report your problem.'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            {lang === 'te'
              ? 'మీ పేరు ఎవరికీ చెప్పము. పూర్తిగా ఉచితం మరియు సురక్షితం.'
              : 'Your identity is strictly confidential. Free and secure.'}
          </p>
          <button
            onClick={() => setView('submit_hub')}
            className="px-8 py-3.5 bg-electric-blue hover:bg-electric-blue-dark text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            {lang === 'te' ? 'ఇప్పుడే సమస్యను నమోదు చేయండి →' : 'Submit Your Report Now →'}
          </button>
        </div>
      </section>

      {/* 7. REASSURING FOOTER */}
      <footer className="mt-auto border-t border-border-light/70 bg-white/70 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-bold text-navy text-xs">
            <Lock size={13} className="text-emerald-600" />
            <span>{lang === 'te' ? 'మీ సమాచారం పూర్తిగా గోప్యంగా ఉంటుంది' : 'Your Information Is Kept Strictly Confidential'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {lang === 'te'
              ? 'మీరు అనామకంగా ఉండాలనుకుంటే మీ పేరు లేదా ఫోన్ నంబర్ ఏ అధికారిక సంస్థకూ ఇవ్వబడదు.'
              : 'If you choose to be anonymous, your identity will never be shared with any authority.'}
          </p>
        </div>
      </footer>

      {/* STATUS LOOKUP MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white border border-border-light rounded-3xl p-6 space-y-4 shadow-xl animate-slide-up">
            
            <div className="flex items-center justify-between pb-2 border-b border-border-light">
              <div className="flex items-center gap-2 text-navy font-bold text-sm">
                <Search size={16} className="text-electric-blue" />
                <span>{lang === 'te' ? 'ఫిర్యాదు స్థితిని చూడండి' : 'Check Report Status'}</span>
              </div>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setLookupResult(null);
                  setTrackingCode('');
                }}
                className="p-1 text-slate-400 hover:text-navy cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!lookupResult ? (
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <p className="text-xs text-slate-600">
                  {lang === 'te'
                    ? 'మీకు వచ్చిన రిఫరెన్స్ కోడ్‌ను (ఉదా. CD-IN-2026-00005) ఇక్కడ రాయండి:'
                    : 'Enter the reference code you received (e.g. CD-IN-2026-00005):'}
                </p>

                <input
                  type="text"
                  required
                  placeholder="CD-IN-2026-XXXXX"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full p-2.5 bg-off-white border border-border-light rounded-xl text-xs font-mono font-bold text-navy placeholder:text-slate-400 focus:outline-none focus:border-electric-blue uppercase"
                />

                <button
                  type="submit"
                  disabled={isSearching || !trackingCode.trim()}
                  className="w-full py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSearching
                    ? (lang === 'te' ? 'వెతుకుతున్నాము...' : 'Checking...')
                    : (lang === 'te' ? 'స్థితిని చూపించు →' : 'Check Status →')}
                </button>
              </form>
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
                    <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-off-white">
                      {st.done ? (
                        <Check size={13} className="text-emerald-600 shrink-0 font-bold" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className={st.done ? 'text-navy font-semibold' : 'text-slate-400'}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setLookupResult(null)}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-navy cursor-pointer"
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
