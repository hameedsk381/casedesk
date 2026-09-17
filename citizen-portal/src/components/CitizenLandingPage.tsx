'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mic,
  Bot,
  FileText,
  ArrowRight,
  CheckCircle2,
  Search,
  HeartPulse,
  Scale,
  Users,
  X,
  ChevronRight,
  Check,
  MessageCircle,
  ChevronDown,
  Sparkles,
  Shield,
  Zap,
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
  const [lang, setLang] = useState<Language>('en');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (view === 'submit_hub') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-primary text-white px-4 py-2.5 text-xs flex items-center justify-between">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-1.5 hover:text-white/70 font-bold transition cursor-pointer"
          >
            ← {lang === 'te' ? 'హోమ్' : 'Home'}
          </button>
          <div className="flex items-center gap-1.5 text-white/70">
            <Lock size={11} />
            <span>{lang === 'te' ? 'గోప్యం' : 'Encrypted'}</span>
          </div>
        </div>
        <div className="flex-1">
          <CitizenPortalHub endpoint={endpoint} initialLang={lang} />
        </div>
      </div>
    );
  }

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
      setLookupResult({
        error: true,
        ref: code,
        message: lang === 'te' ? 'నెట్‌వర్క్ సమస్య.' : 'Unable to connect.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const categories = [
    {
      icon: HeartPulse,
      color: 'bg-rose-100 text-rose-600',
      title: lang === 'te' ? 'వైద్యం' : 'Health',
      desc: lang === 'te' ? 'ఆసుపత్రులు, మందులు, వైద్యం' : 'Hospitals, medicines, treatment',
    },
    {
      icon: Users,
      color: 'bg-amber-100 text-amber-600',
      title: lang === 'te' ? 'పింఛను & రేషన్' : 'Welfare',
      desc: lang === 'te' ? 'పింఛను, రేషన్ కార్డు, సంక్షేమం' : 'Pensions, ration cards, schemes',
    },
    {
      icon: Scale,
      color: 'bg-emerald-100 text-emerald-600',
      title: lang === 'te' ? 'అవినీతి' : 'Corruption',
      desc: lang === 'te' ? 'లంచాలు, అవినీతి, మోసాలు' : 'Bribes, fraud, misconduct',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/15 selection:text-primary">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-border shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm text-primary block">
                {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                {lang === 'te' ? 'ప్రజా సమస్యల పోర్టల్' : 'Public Investigation Desk'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-surface border border-border text-xs font-semibold text-muted-foreground hover:text-primary transition cursor-pointer"
            >
              <Search size={13} />
              <span className="hidden sm:inline">{lang === 'te' ? 'స్థితి' : 'Track'}</span>
            </button>

            <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-xs font-bold border border-border">
              <button
                onClick={() => setLang('te')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                తెలుగు
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-primary'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/20" />
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-14 sm:pt-20 sm:pb-20 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-subtle border border-success/20 text-success text-xs font-bold">
            <ShieldCheck size={14} />
            <span>{lang === 'te' ? '100% ఉచితం & రహస్యం' : '100% Free & Confidential'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-primary leading-[1.05] tracking-tight max-w-2xl mx-auto">
            {lang === 'te' ? (
              <>మీ ఊరిలో సమస్య ఉందా?<br /><span className="text-primary/70">మాకు చెప్పండి.</span></>
            ) : (
              <>Something wrong in your area?<br /><span className="text-primary/70">Tell our reporters.</span></>
            )}
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            {lang === 'te'
              ? 'తెలుగు, Tenglish లేదా English లో టైప్ చేయండి లేదా మైక్ నొక్కి చెప్పండి. మా జర్నలిస్టులు పరిశీలిస్తారు.'
              : 'Type in English, Telugu, or Tenglish — or just speak into the mic. Our investigative team follows up.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setView('submit_hub')}
              className="w-full sm:w-auto group px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.97]"
            >
              <Mic size={18} />
              <span>{lang === 'te' ? 'మీ సమస్య చెప్పండి' : 'Tell Us What Happened'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-4 text-xs font-medium text-muted-foreground">
            {[
              lang === 'te' ? 'మీ పేరు దాగి ఉంటుంది' : 'Identity protected',
              lang === 'te' ? 'మైక్ నొక్కి చెప్పవచ్చు' : 'Voice supported',
              lang === 'te' ? 'తెలుగు & English' : 'Telugu & English',
              lang === 'te' ? 'మేము పరిశీలిస్తాము' : 'We investigate',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODE CARDS */}
      <section className="px-4 pb-12 max-w-3xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-primary">
            {lang === 'te' ? 'మీకు ఏది సులభం?' : 'Choose your way:'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setView('submit_hub')}
            className="group p-6 rounded-2xl bg-card border-2 border-primary/20 hover:border-primary shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all text-left cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bot size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                {lang === 'te' ? 'సులభం' : 'Easiest'}
              </span>
            </div>
            <h3 className="font-bold text-base text-primary mb-1">
              {lang === 'te' ? 'AI తో మాట్లాడండి' : 'Chat with AI'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {lang === 'te'
                ? 'వాట్సాప్ లాగా మాట్లాడండి. మైక్ లేదా టైప్.'
                : 'Talk like WhatsApp. Voice or type. AI guides you.'}
            </p>
            <div className="flex items-center gap-1 text-xs font-bold text-primary">
              <span>{lang === 'te' ? 'ప్రారంభించండి' : 'Start'}</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => setView('submit_hub')}
            className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all text-left cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                {lang === 'te' ? 'దశలు' : 'Steps'}
              </span>
            </div>
            <h3 className="font-bold text-base text-primary mb-1">
              {lang === 'te' ? 'ఫారమ్ పూరించండి' : 'Fill a Form'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {lang === 'te'
                ? 'మీ స్వంత వేగంతో దశల వారీగా వివరాలు నమోదు చేయండి.'
                : 'Step-by-step. Add details, location, photos at your pace.'}
            </p>
            <div className="flex items-center gap-1 text-xs font-bold text-primary">
              <span>{lang === 'te' ? 'తెరవండి' : 'Open'}</span>
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-4 pb-12 max-w-3xl mx-auto w-full">
        <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="text-sm font-bold text-primary">
            {lang === 'te' ? 'సాధారణ సమస్యలు:' : 'Common issues:'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className="p-3 rounded-xl bg-background border border-border flex items-center gap-3 hover:border-primary/30 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-primary block">{cat.title}</span>
                    <span className="text-[11px] text-muted-foreground block leading-tight">{cat.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 pb-12 max-w-3xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-primary">
            {lang === 'te' ? 'ఏం జరుగుతుంది?' : 'How it works'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              n: '1',
              t: lang === 'te' ? 'మీరు చెబుతారు' : 'You tell us',
              d: lang === 'te' ? 'వాయిస్ లేదా టైప్ చేసి చెప్పండి.' : 'Speak or type what happened.',
              c: 'bg-primary text-white',
            },
            {
              n: '2',
              t: lang === 'te' ? 'మేము పరిశీలిస్తాము' : 'We investigate',
              d: lang === 'te' ? 'మా రిపోర్టర్లు నిజం చేసి చూస్తారు.' : 'Reporters verify the facts.',
              c: 'bg-primary text-white',
            },
            {
              n: '3',
              t: lang === 'te' ? 'సమస్య పరిష్కారం' : 'Problem solved',
              d: lang === 'te' ? 'అధికారులను ప్రశ్నించి పరిష్కారం కోరతారు.' : 'Authorities are questioned to fix it.',
              c: 'bg-success text-white',
            },
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-2xl bg-card border border-border text-center space-y-2">
              <div className={`w-8 h-8 rounded-full ${s.c} font-bold text-sm flex items-center justify-center mx-auto`}>
                {s.n}
              </div>
              <h3 className="font-bold text-sm text-primary">{s.t}</h3>
              <p className="text-xs text-muted-foreground leading-snug">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="px-4 pb-12 max-w-3xl mx-auto w-full">
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-primary text-white text-center space-y-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="relative space-y-3">
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              {lang === 'te' ? 'సమస్యను దాచవద్దు.' : "Don't stay silent."}
            </h2>
            <p className="text-sm text-white/70 max-w-md mx-auto">
              {lang === 'te'
                ? 'మీ పేరు ఎవరికీ చెప్పము. ఉచితం మరియు సురక్షితం.'
                : 'Your identity is protected. Free and safe.'}
            </p>
            <button
              onClick={() => setView('submit_hub')}
              className="px-8 py-3.5 bg-white text-primary hover:bg-white/90 font-bold text-sm rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              {lang === 'te' ? 'ఇప్పుడే చెప్పండి →' : 'Report Now →'}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-border bg-surface/50 py-6 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1.5 font-bold text-primary text-xs">
            <Lock size={13} />
            <span>{lang === 'te' ? 'మీ సమాచారం సురక్షితం' : 'Your data is safe'}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'te'
              ? 'అనామకంగా ఉండవచ్చు. సమాచారం ఎవరికీ బహిర్గతం చేయబడదు.'
              : 'Stay anonymous if you prefer. Data is never shared with third parties.'}
          </p>
        </div>
      </footer>

      {/* STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Search size={16} />
                <span>{lang === 'te' ? 'స్థితి చూడండి' : 'Track Status'}</span>
              </div>
              <button
                onClick={() => { setShowStatusModal(false); setLookupResult(null); setTrackingCode(''); }}
                className="p-1 text-muted-foreground hover:text-primary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {!lookupResult ? (
              <form onSubmit={handleTrackSubmit} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {lang === 'te' ? 'మీ కోడ్ ఇక్కడ వేయండి:' : 'Enter your reference code:'}
                </p>
                <input
                  type="text"
                  required
                  placeholder="CD-IN-2026-XXXXX"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full p-3 bg-background border border-border rounded-xl text-sm font-mono font-bold text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                />
                <button
                  type="submit"
                  disabled={isSearching || !trackingCode.trim()}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? (lang === 'te' ? 'వెతుకుతున్నాము...' : 'Checking...') : (lang === 'te' ? 'చూపించు' : 'Check Status')}
                </button>
              </form>
            ) : lookupResult.error ? (
              <div className="space-y-3 animate-fade-in">
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                  <span className="text-[10px] font-bold text-destructive uppercase block">
                    {lang === 'te' ? 'కనిపించలేదు' : 'Not Found'}
                  </span>
                  <div className="text-xs font-semibold text-foreground mt-1">{lookupResult.message}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1 font-bold">{lookupResult.ref}</div>
                </div>
                <button onClick={() => setLookupResult(null)} className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">
                  {lang === 'te' ? 'మళ్లీ ప్రయత్నించండి' : 'Try again'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="p-4 rounded-xl bg-success-subtle border border-success/20 text-center">
                  <span className="text-[10px] font-bold text-success uppercase block">
                    {lang === 'te' ? 'ప్రస్తుత స్థితి' : 'Current Status'}
                  </span>
                  <div className="text-sm font-bold text-foreground mt-0.5">{lookupResult.status}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{lookupResult.ref}</div>
                </div>
                <div className="space-y-1.5">
                  {lookupResult.steps.map((st: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs p-2 rounded-lg bg-background">
                      {st.done ? (
                        <Check size={14} className="text-success shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-border shrink-0" />
                      )}
                      <span className={st.done ? 'text-primary font-semibold' : 'text-muted-foreground'}>{st.title}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setLookupResult(null)} className="w-full py-2 text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">
                  {lang === 'te' ? 'మరొక కోడ్' : 'Check another'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
