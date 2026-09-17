'use client';

import React, { useState } from 'react';
import {
  Bot,
  FileText,
  ShieldCheck,
  Lock,
  Languages,
  Mic,
  Shield,
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
  initialLang?: Language;
}

type Mode = 'select' | 'chat' | 'form';
type Language = 'en' | 'te';

export function CitizenPortalHub({ endpoint, initialLang = 'en' }: Props) {
  const [mode, setMode] = useState<Mode>('select');
  const [lang, setLang] = useState<Language>(initialLang);

  const TruncatedHeader = ({ onBack }: { onBack?: () => void }) => (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-border shadow-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between h-13 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button onClick={onBack} className="text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer">
              ←
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
            <ShieldCheck size={16} />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-xs text-primary block">
              {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
            </span>
            <span className="text-[9px] text-muted-foreground font-medium">
              {lang === 'te' ? 'ప్రజా సహాయ కేంద్రం' : 'Public Helpdesk'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'chat' ? 'form' : 'chat')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/30 transition cursor-pointer"
          >
            {mode === 'chat' ? <FileText size={13} /> : <Bot size={13} />}
            <span className="hidden sm:inline">
              {mode === 'chat' ? (lang === 'te' ? 'ఫారమ్' : 'Form') : (lang === 'te' ? 'AI చాట్' : 'AI Chat')}
            </span>
          </button>

          <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-xs font-bold border border-border">
            <button onClick={() => setLang('en')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
            <button onClick={() => setLang('te')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-success-subtle border border-success/20 text-[10px] font-bold text-success">
            <Lock size={10} />
            <span>{lang === 'te' ? 'గోప్యం' : 'Encrypted'}</span>
          </div>
        </div>
      </div>
    </header>
  );

  if (mode === 'chat') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TruncatedHeader onBack={() => setMode('select')} />
        <div className="flex-1">
          <AICitizenChat
            endpoint={endpoint}
            lang={lang}
            setLang={setLang}
            onSwitchToForm={() => setMode('form')}
            onBackToSelect={() => setMode('select')}
          />
        </div>
      </div>
    );
  }

  if (mode === 'form') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TruncatedHeader onBack={() => setMode('select')} />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col">
          <CitizenSubmissionForm
            endpoint={endpoint}
            lang={lang}
            setLang={setLang}
            onSwitchToChat={() => setMode('chat')}
            onBackToSelect={() => setMode('select')}
          />
        </main>
        <footer className="mt-auto border-t border-border bg-surface/50 py-5 px-4 text-center text-xs text-muted-foreground">
          <div className="max-w-2xl mx-auto space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 font-bold text-primary text-[11px]">
              <ShieldCheck size={12} />
              <span>{lang === 'te' ? 'మీ భద్రతే ముఖ్యం' : 'Your Safety Comes First'}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {lang === 'te'
                ? 'మీ సమాచారం జర్నలిస్టులకు మాత్రమే. గోప్యత కాపాడబడుతుంది.'
                : 'Information is only seen by journalists. Privacy protected.'}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // MODE SELECTION
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-border shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-13 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={16} />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-xs text-primary block">
                {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
              </span>
              <span className="text-[9px] text-muted-foreground font-medium">
                {lang === 'te' ? 'ప్రజా సహాయ కేంద్రం' : 'Public Helpdesk'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-success-subtle border border-success/20 text-[10px] font-bold text-success">
              <Lock size={10} />
              <span>{lang === 'te' ? 'గోప్యం' : 'Encrypted'}</span>
            </div>

            <div className="flex items-center gap-0.5 p-0.5 bg-surface rounded-lg text-xs font-bold border border-border">
              <button onClick={() => setLang('en')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'en' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>EN</button>
              <button onClick={() => setLang('te')} className={`px-1.5 py-0.5 rounded-md transition cursor-pointer ${lang === 'te' ? 'bg-primary text-white' : 'text-muted-foreground'}`}>తె</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 sm:py-16 flex flex-col justify-center">
        <div className="space-y-8 animate-fade-in">

          <div className="text-center space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary leading-tight">
              {lang === 'te' ? 'మీకు ఏది సులభం?' : 'How would you like to proceed?'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {lang === 'te'
                ? 'ఏది ఎంచుకున్నా మీ వివరాలు 100% గోప్యంగా ఉంటాయి.'
                : 'Either way, your information stays 100% private.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">

            {/* AI CHAT */}
            <button
              onClick={() => setMode('chat')}
              className="group relative p-6 rounded-2xl bg-card border-2 border-primary/20 hover:border-primary shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all text-left cursor-pointer"
            >
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-success-subtle text-success text-[9px] font-bold uppercase tracking-wider border border-success/20">
                {lang === 'te' ? 'సులభం' : 'Easiest'}
              </div>

              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot size={24} />
              </div>

              <h2 className="text-base sm:text-lg font-black text-primary mb-1">
                {lang === 'te' ? 'AI తో మాట్లాడండి' : 'Talk to AI'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {lang === 'te'
                  ? 'వాట్సాప్ లాగా తెలుగు, Tenglish లేదా English లో మాట్లాడండి. మైక్ నొక్కి చెప్పవచ్చు.'
                  : 'Like WhatsApp — speak or type in Telugu, Tenglish, or English. Voice supported.'}
              </p>

              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Mic size={14} />
                <span>{lang === 'te' ? 'ప్రారంభించండి →' : 'Start Talking →'}</span>
              </div>
            </button>

            {/* FORM */}
            <button
              onClick={() => setMode('form')}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-2 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>

              <h2 className="text-base sm:text-lg font-black text-primary mb-1">
                {lang === 'te' ? 'ఫారమ్ పూరించండి' : 'Fill a Form'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {lang === 'te'
                  ? 'సింపుల్ ప్రశ్నలకు దశల వారీగా సమాధానం ఇవ్వండి. ఫోటోలు, వీడియోలు జత చేయండి.'
                  : 'Answer simple questions step-by-step. Add photos or documents if you have them.'}
              </p>

              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <span>{lang === 'te' ? 'ఫారమ్ తెరవండి →' : 'Open Form →'}</span>
              </div>
            </button>

          </div>

          {/* REASSURANCE */}
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-card border border-border text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 font-bold text-primary text-xs">
              <Shield size={14} />
              <span>{lang === 'te' ? 'మీ భద్రతే ముఖ్యం' : 'Your Safety First'}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {lang === 'te'
                ? 'మీరు ఏది ఎంచుకున్నా, మీ వివరాలు 100% గోప్యంగా ఉంచబడతాయి. సమర్పణ తర్వాత ట్రాక్ కోడ్ వస్తుంది.'
                : 'Whichever you choose, your details stay 100% private. You get a tracking code after submitting.'}
            </p>
          </div>

        </div>
      </main>

      <footer className="mt-auto border-t border-border bg-surface/50 py-5 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-2xl mx-auto space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 font-bold text-primary text-[11px]">
            <ShieldCheck size={12} />
            <span>{lang === 'te' ? 'మీ భద్రతే ముఖ్యం' : 'Your Safety Comes First'}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {lang === 'te'
              ? 'మీ సమాచారం జర్నలిస్టులకు మాత్రమే. అనామకంగా ఉండవచ్చు.'
              : 'Information is only seen by journalists. You can stay anonymous.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
