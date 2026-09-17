'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  FileText,
  Shield,
  ShieldCheck,
  Lock,
  Languages,
  ArrowRight,
  Mic,
  CheckCircle2,
  HelpCircle
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

  // If user selected Chat Mode
  if (mode === 'chat') {
    return (
      <AICitizenChat
        endpoint={endpoint}
        lang={lang}
        setLang={setLang}
        onSwitchToForm={() => setMode('form')}
        onBackToSelect={() => setMode('select')}
      />
    );
  }

  // If user selected Form Mode
  if (mode === 'form') {
    return (
      <div className="min-h-screen flex flex-col bg-linear-to-b from-warm-white via-off-white to-cream text-foreground font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
        {/* Creator Portal Trust Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border-light shadow-xs py-3.5 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center shadow-xs">
                <ShieldCheck size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-navy">
                    {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 rounded">
                    {lang === 'te' ? 'సహాయ కేంద్రం' : 'Helpdesk'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {lang === 'te' ? 'ప్రజా సహాయ కేంద్రం' : 'Public Helpdesk'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <button
                onClick={() => setMode('chat')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/15 text-electric-blue text-xs font-bold transition cursor-pointer"
                title={lang === 'te' ? 'AI సహాయకుడితో మాట్లాడండి' : 'Talk to AI Assistant'}
              >
                <Bot size={14} />
                <span className="hidden sm:inline">{lang === 'te' ? 'AI సహాయకుడితో మాట్లాడండి' : 'Talk to AI Assistant'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
                <Lock size={12} className="text-emerald-600" />
                <span>{lang === 'te' ? 'గోప్యం & భద్రం' : 'Private & Secure'}</span>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-white border border-border-light rounded-xl text-xs font-semibold shadow-2xs">
                <Languages size={13} className="text-slate-500 ml-1.5" />
                <button
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    lang === 'en' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('te')}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    lang === 'te' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
                  }`}
                >
                  తెలుగు
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Form Container */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col">
          <CitizenSubmissionForm
            endpoint={endpoint}
            lang={lang}
            setLang={setLang}
            onSwitchToChat={() => setMode('chat')}
            onBackToSelect={() => setMode('select')}
          />
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border-light/70 bg-white/60 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-2xl mx-auto space-y-2">
            <div className="flex items-center justify-center gap-2 text-navy font-semibold text-xs">
              <ShieldCheck size={14} className="text-electric-blue" />
              <span>{lang === 'te' ? 'మీ భద్రతే ముఖ్యం' : 'Your Safety Comes First'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {lang === 'te'
                ? 'మీ సమాచారం మా జర్నలిస్టులకు మాత్రమే అందుతుంది. మీ భద్రత మరియు గోప్యత మాకు ముఖ్యం.'
                : 'Your information is only seen by our journalists. Your safety and privacy matter to us.'}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // DEFAULT: MODE SELECTION SCREEN AT THE BEGINNING
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-warm-white via-off-white to-cream text-foreground font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
      {/* Creator Portal Trust Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border-light shadow-xs py-3.5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-navy">
                  {endpoint.workspaceName || endpoint.title || 'Citizen Helpdesk'}
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 rounded">
                  {lang === 'te' ? 'సహాయ కేంద్రం' : 'Helpdesk'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {lang === 'te' ? 'ప్రజా సహాయ కేంద్రం' : 'Public Helpdesk'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="hidden sm:flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
              <Lock size={12} className="text-emerald-600" />
              <span>{lang === 'te' ? 'గోప్యం & భద్రం' : 'Private & Secure'}</span>
            </div>

            {/* Multilingual Switcher matching creator portal */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-border-light rounded-xl text-xs font-semibold shadow-2xs">
              <Languages size={13} className="text-slate-500 ml-1.5" />
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('te')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  lang === 'te' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
                }`}
              >
                తెలుగు
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Mode Selection Card Box */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="space-y-8 animate-fade-in">
          
          {/* Headline & Overview */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy leading-tight">
              {lang === 'te'
                ? 'మీకు ఏది సులభంగా అనిపిస్తే అది ఎంచుకోండి'
                : 'How would you like to tell us?'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'te'
                ? 'మీకు ఎలా సౌకర్యంగా ఉంటే అలా చెప్పండి. మీ పేరు మరియు వివరాలు పూర్తిగా గోప్యంగా ఉంటాయి.'
                : 'Choose what feels easiest for you. Your identity stays 100% private.'}
            </p>
          </div>

          {/* TWO MAIN OPTIONS SIDE-BY-SIDE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            
            {/* OPTION 1: AI CHAT ASSISTANT */}
            <div className="bg-white rounded-3xl p-6 border-2 border-electric-blue/30 hover:border-electric-blue shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[10px] font-bold uppercase">
                {lang === 'te' ? 'చాలా సులభం' : 'Easiest • Voice'}
              </div>

              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Bot size={22} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-navy group-hover:text-electric-blue transition">
                    {lang === 'te' ? 'AI సహాయకుడితో మాట్లాడండి' : 'Talk to AI Assistant'}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'te'
                      ? 'వాట్సాప్ లాగా తెలుగు, Tenglish లేదా English లో మాట్లాడండి. మైక్ నొక్కి చెప్పవచ్చు.'
                      : 'Just like WhatsApp — speak or type in Telugu, Tenglish, or English. The assistant asks simple questions.'}
                  </p>
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={() => setMode('chat')}
                  className="w-full py-3 px-4 bg-electric-blue hover:bg-electric-blue-dark text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Mic size={15} />
                  <span>{lang === 'te' ? 'మాట్లాడండి / టైప్ చేయండి →' : 'Start Talking →'}</span>
                </button>
              </div>
            </div>

            {/* OPTION 2: STRUCTURED 6-STEP FORM */}
            <div className="bg-white rounded-3xl p-6 border border-border-light hover:border-slate-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-navy flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <FileText size={22} />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {lang === 'te' ? 'దశల వారీగా' : 'Step-by-Step'}
                </span>
              </div>

              <div className="space-y-3 mt-3">
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-navy group-hover:text-navy/80 transition">
                    {lang === 'te' ? 'ఫారమ్ నింపండి' : 'Fill Out a Form'}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'te'
                      ? 'సింపుల్ ప్రశ్నలకు సమాధానం ఇవ్వండి. ఫోటోలు ఉంటే జతచేయండి.'
                      : 'Answer a few simple questions step by step. Add photos or documents if you have them.'}
                  </p>
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={() => setMode('form')}
                  className="w-full py-3 px-4 bg-navy hover:bg-navy/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{lang === 'te' ? 'ఫారమ్ తెరవండి →' : 'Open Form →'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Reassurance Notice Card */}
          <div className="max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl bg-white border border-border-light/80 space-y-2 text-xs text-slate-600 shadow-2xs">
            <div className="font-bold text-navy flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              <span>{lang === 'te' ? 'మీ భద్రతే ముఖ్యం' : 'Your Safety Comes First'}</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500">
              {lang === 'te'
                ? 'మీరు చాట్ ఎంచుకున్నా లేదా ఫారమ్ ఎంచుకున్నా, మీ వివరాలు 100% గోప్యంగా ఉంచబడతాయి. సమర్పించిన తర్వాత మీకు ట్రాక్ చేయడానికి కోడ్ వస్తుంది.'
                : 'Whether you choose chat or the form, your information is 100% private. After submitting, you get a code to track your report.'}
            </p>
          </div>

        </div>
      </main>

      {/* Creator Portal Footer */}
      <footer className="mt-auto border-t border-border-light/70 bg-white/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-navy font-semibold text-xs">
            <ShieldCheck size={14} className="text-electric-blue" />
            <span>{lang === 'te' ? 'మీ భద్రతే ముఖ్యం' : 'Your Safety Comes First'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            {lang === 'te'
              ? 'మీ సమాచారం మా జర్నలిస్టులకు మాత్రమే అందుతుంది. మీరు అనామకంగా ఉండవచ్చు.'
              : 'Your information is only seen by our journalists. You can stay anonymous if you prefer.'}
          </p>
          <div className="pt-1 text-[10px] text-slate-500">
            {endpoint.workspaceName || 'Citizen Helpdesk'} • {lang === 'te' ? 'డేటా భద్రత తో రక్షించబడింది' : 'Protected by data encryption'}
          </div>
        </div>
      </footer>
    </div>
  );
}
