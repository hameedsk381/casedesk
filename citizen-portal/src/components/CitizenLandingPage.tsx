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
  Check,
  Languages,
} from 'lucide-react';
import { AICitizenChat } from './AICitizenChat';
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

type ViewState = 'landing' | 'chat' | 'form';
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
      setLookupResult({
        error: true,
        ref: code,
        message: lang === 'te' ? 'నెట్‌వర్క్ సమస్య.' : 'Unable to connect.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (view === 'chat') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
          <button onClick={() => setView('landing')} className="text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">← {lang === 'te' ? 'హోమ్' : 'Home'}</button>
          <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-[11px] font-bold border border-border">
            <button onClick={() => setLang('en')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
            <button onClick={() => setLang('te')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
          </div>
        </div>
        <div className="flex-1">
          <AICitizenChat endpoint={endpoint} lang={lang} setLang={setLang} />
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
          <button onClick={() => setView('landing')} className="text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">← {lang === 'te' ? 'హోమ్' : 'Home'}</button>
          <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-[11px] font-bold border border-border">
            <button onClick={() => setLang('en')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
            <button onClick={() => setLang('te')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
          </div>
        </div>
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col">
          <CitizenSubmissionForm
            endpoint={endpoint}
            lang={lang}
            setLang={setLang}
            onSwitchToChat={() => setView('chat')}
            onBackToSelect={() => setView('landing')}
          />
        </main>
      </div>
    );
  }

  const categories = [
    { icon: HeartPulse, color: 'bg-rose-100 text-rose-600', title: lang === 'te' ? 'వైద్యం' : 'Health', desc: lang === 'te' ? 'ఆసుపత్రులు, మందులు' : 'Hospitals, medicines' },
    { icon: Users, color: 'bg-amber-100 text-amber-600', title: lang === 'te' ? 'పింఛను & రేషన్' : 'Welfare', desc: lang === 'te' ? 'పింఛను, రేషన్ కార్డు' : 'Pensions, ration cards' },
    { icon: Scale, color: 'bg-emerald-100 text-emerald-600', title: lang === 'te' ? 'అవినీతి' : 'Corruption', desc: lang === 'te' ? 'లంచాలు, మోసాలు' : 'Bribes, fraud' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/15 selection:text-primary">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-border shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
            <span className="font-extrabold text-xs text-primary">
              {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowStatusModal(true)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary transition cursor-pointer">
              <Search size={12} />
              <span className="hidden sm:inline">{lang === 'te' ? 'స్థితి' : 'Track'}</span>
            </button>
            <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-[11px] font-bold border border-border">
              <button onClick={() => setLang('te')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
              <button onClick={() => setLang('en')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-8 sm:pt-16 sm:pb-10 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-subtle border border-success/20 text-success text-[10px] font-bold">
          <ShieldCheck size={12} />
          <span>{lang === 'te' ? '100% ఉచితం & రహస్యం' : '100% Free & Confidential'}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-primary leading-tight max-w-lg mx-auto">
          {lang === 'te' ? 'మీ ఊరిలో సమస్య ఉందా?' : 'Something wrong in your area?'}
        </h1>

        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {lang === 'te'
            ? 'తెలుగు, Tenglish లేదా English లో టైప్ చేయండి లేదా మైక్ నొక్కి చెప్పండి.'
            : 'Type or speak in English, Telugu, or Tenglish. Our team investigates.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setView('chat')}
            className="w-full sm:w-auto group px-7 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
          >
            <Mic size={17} />
            <span>{lang === 'te' ? 'మాట్లాడండి' : 'Talk to AI'}</span>
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => setView('form')}
            className="w-full sm:w-auto px-7 py-3.5 bg-card hover:bg-surface border border-border text-primary font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText size={17} />
            <span>{lang === 'te' ? 'ఫారమ్ పూరించండి' : 'Fill a Form'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 text-[11px] font-medium text-muted-foreground">
          {[
            lang === 'te' ? 'మీ పేరు దాగి ఉంటుంది' : 'Identity protected',
            lang === 'te' ? 'మైక్ నొక్కి చెప్పవచ్చు' : 'Voice supported',
            lang === 'te' ? 'తెలుగు & English' : 'Telugu & English',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-success" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-4 pb-8 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-3.5 rounded-xl bg-card border border-border flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[11px] text-primary block">{cat.title}</span>
                  <span className="text-[10px] text-muted-foreground block leading-tight">{cat.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-border py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock size={10} />
          <span>{lang === 'te' ? 'మీ సమాచారం సురక్షితం' : 'Data encrypted & protected'}</span>
        </div>
      </footer>

      {/* STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-3 shadow-xl animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                <Search size={14} />
                <span>{lang === 'te' ? 'స్థితి చూడండి' : 'Track Status'}</span>
              </div>
              <button onClick={() => { setShowStatusModal(false); setLookupResult(null); setTrackingCode(''); }} className="p-1 text-muted-foreground hover:text-primary cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {!lookupResult ? (
              <form onSubmit={handleTrackSubmit} className="space-y-2.5">
                <input type="text" required placeholder="CD-IN-2026-XXXXX" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} className="w-full p-2.5 bg-background border border-border rounded-lg text-xs font-mono font-bold text-primary placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring uppercase" />
                <button type="submit" disabled={isSearching || !trackingCode.trim()} className="w-full py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50">
                  {isSearching ? '...' : (lang === 'te' ? 'చూపించు' : 'Check')}
                </button>
              </form>
            ) : lookupResult.error ? (
              <div className="space-y-2 text-center">
                <div className="text-xs text-destructive font-bold">{lookupResult.message}</div>
                <button onClick={() => setLookupResult(null)} className="text-[11px] font-bold text-muted-foreground hover:text-primary cursor-pointer">{lang === 'te' ? 'మళ్లీ' : 'Try again'}</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-success-subtle border border-success/20 text-center">
                  <div className="text-[9px] font-bold text-success uppercase">{lang === 'te' ? 'స్థితి' : 'Status'}</div>
                  <div className="text-xs font-bold text-foreground">{lookupResult.status}</div>
                  <div className="text-[9px] font-mono text-muted-foreground">{lookupResult.ref}</div>
                </div>
                <div className="space-y-1">
                  {lookupResult.steps.map((st: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] p-1.5 rounded-md bg-background">
                      {st.done ? <Check size={12} className="text-success shrink-0" /> : <div className="w-3 h-3 rounded-full border border-border shrink-0" />}
                      <span className={st.done ? 'text-primary font-semibold' : 'text-muted-foreground'}>{st.title}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setLookupResult(null)} className="w-full text-[11px] font-bold text-muted-foreground hover:text-primary cursor-pointer">{lang === 'te' ? 'మరొకటి' : 'Check another'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
