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
  apiBaseUrl?: string;
  initialLang?: Language;
}

type Mode = 'select' | 'chat' | 'form';
type Language = 'en' | 'te';

export function CitizenPortalHub({ endpoint, apiBaseUrl = 'http://localhost:3000', initialLang = 'en' }: Props) {
  const [mode, setMode] = useState<Mode>('select');
  const [lang, setLang] = useState<Language>(initialLang);

  // If user selected Chat Mode
  if (mode === 'chat') {
    return (
      <AICitizenChat
        endpoint={endpoint}
        apiBaseUrl={apiBaseUrl}
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
      <div className="min-h-screen flex flex-col bg-linear-to-b from-slate-50 via-off-white to-slate-100 text-navy font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
        {/* Creator Portal Trust Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border-light shadow-xs py-3.5 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
                CD
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-navy">
                    CaseDesk
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 rounded">
                    Citizen Portal
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {endpoint.workspaceName || 'Public Civic Investigation Desk'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <button
                onClick={() => setMode('chat')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/15 text-electric-blue text-xs font-bold transition cursor-pointer"
                title={lang === 'te' ? 'AI చాట్‌కు మారండి' : 'Switch to AI Chat'}
              >
                <Bot size={14} />
                <span className="hidden sm:inline">{lang === 'te' ? 'AI చాట్‌కు మారండి' : 'Switch to AI Chat'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
                <Lock size={12} className="text-emerald-600" />
                <span>{lang === 'te' ? 'ఎన్‌క్రిప్టెడ్ & గోప్యమైనది' : 'Encrypted & Confidential'}</span>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-white border border-border-light rounded-xl text-xs font-semibold shadow-2xs">
                <Languages size={13} className="text-slate-400 ml-1.5" />
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
            apiBaseUrl={apiBaseUrl}
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
              <span>{lang === 'te' ? 'జర్నలిస్టిక్ మూలాల రక్షణ హామీ' : 'Journalistic Whistleblower & Source Protection Guarantee'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {lang === 'te'
                ? 'మీ భద్రత మరియు గోప్యత గౌరవించబడతాయి. ప్రజల హక్కుల కోసం పరిశోధనాత్మక జర్నలిస్టులకు సమాచారం చేరుతుంది.'
                : 'Your safety and privacy are respected. Information shared here is received by accredited journalists for public-interest reporting.'}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // DEFAULT: MODE SELECTION SCREEN AT THE BEGINNING
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-slate-50 via-off-white to-slate-100 text-navy font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
      {/* Creator Portal Trust Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border-light shadow-xs py-3.5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
              CD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-navy">
                  CaseDesk
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 rounded">
                  Citizen Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {endpoint.workspaceName || 'Public Civic Investigation Desk'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="hidden sm:flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
              <Lock size={12} className="text-emerald-600" />
              <span>{lang === 'te' ? 'ఎన్‌క్రిప్టెడ్ & గోప్యమైనది' : 'Encrypted & Confidential'}</span>
            </div>

            {/* Multilingual Switcher matching creator portal */}
            <div className="flex items-center gap-1.5 p-1 bg-white border border-border-light rounded-xl text-xs font-semibold shadow-2xs">
              <Languages size={13} className="text-slate-400 ml-1.5" />
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
                ? 'సమస్యను ఎలా చెప్పాలనుకుంటున్నారు?'
                : 'How would you like to report?'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'te'
                ? 'మీకు అనువైన పద్ధతిని ఎంచుకోండి. మీ పేరు మరియు వివరాలు పూర్తిగా రహస్యంగా ఉంటాయి.'
                : 'Choose what feels easiest for you. Your identity remains 100% confidential.'}
            </p>
          </div>

          {/* TWO MAIN OPTIONS SIDE-BY-SIDE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            
            {/* OPTION 1: AI CHAT ASSISTANT */}
            <div className="bg-white rounded-3xl p-6 border-2 border-electric-blue/30 hover:border-electric-blue shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[10px] font-bold uppercase">
                {lang === 'te' ? 'చాలా సులభం' : 'Voice • Easiest'}
              </div>

              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-electric-blue/10 text-electric-blue flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Bot size={22} />
                </div>

                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-navy group-hover:text-electric-blue transition">
                    {lang === 'te' ? 'AI సహాయకుడితో చాట్' : 'Chat with AI Assistant'}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'te'
                      ? 'వాట్సాప్ లాగా తెలుగు, Tenglish లేదా English లో మాట్లాడండి లేదా రాయండి. మైక్‌తో వాయిస్ నోట్ కూడా పంపవచ్చు.'
                      : 'Talk naturally using voice notes or text in English, Telugu, or Tenglish. AI asks simple questions to help you.'}
                  </p>
                </div>
              </div>

              <div className="pt-5">
                <button
                  onClick={() => setMode('chat')}
                  className="w-full py-3 px-4 bg-electric-blue hover:bg-electric-blue-dark text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Mic size={15} />
                  <span>{lang === 'te' ? 'వాయిస్ / చాట్ ప్రారంభించండి →' : 'Start Voice / Chat →'}</span>
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
                    {lang === 'te' ? 'సాధారణ ఫారమ్ పూరించండి' : 'Fill Out a Form'}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'te'
                      ? 'ఏం జరిగింది, ఎక్కడ జరిగింది, ఫోటోలు మీ స్వంత వేగంతో ఫారమ్‌లో నింపండి.'
                      : 'Fill in details, location, and attach photos step-by-step at your own pace.'}
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

          {/* Reassurance Notice Card (Exact Creator Portal Step 1 Notice) */}
          <div className="max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl bg-white border border-border-light/80 space-y-2 text-xs text-slate-600 shadow-2xs">
            <div className="font-bold text-navy flex items-center gap-2">
              <Shield size={16} className="text-emerald-600" />
              <span>{lang === 'te' ? 'జర్నలిస్టిక్ ప్రమాణాలు & రక్షణ హామీ' : 'Public Whistleblower & Protection Guarantee:'}</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500">
              {lang === 'te'
                ? 'మీరు చాట్ ఎంచుకున్నా లేదా ఫారమ్ ఎంచుకున్నా, మీ వివరాలు జర్నలిస్టిక్ నిబంధనల ప్రకారం 100% గోప్యంగా ఉంచబడతాయి. సమర్పించిన తర్వాత మీకు పరిశోధనను ట్రాక్ చేయడానికి రహస్య రిఫరెన్స్ కోడ్ లభిస్తుంది.'
                : 'Whether you choose AI Chat or the structured form, your submission is encrypted and strictly protected under journalistic source confidentiality. You will receive an official reference code to track your case.'}
            </p>
          </div>

        </div>
      </main>

      {/* Creator Portal Whistleblower Footer Guarantee */}
      <footer className="mt-auto border-t border-border-light/70 bg-white/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-navy font-semibold text-xs">
            <ShieldCheck size={14} className="text-electric-blue" />
            <span>{lang === 'te' ? 'జర్నలిస్టిక్ మూలాల రక్షణ హామీ' : 'Journalistic Whistleblower & Source Protection Guarantee'}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {lang === 'te'
              ? 'మీ భద్రత మరియు గోప్యత గౌరవించబడతాయి. ప్రజల హక్కుల కోసం పరిశోధనాత్మక జర్నలిస్టులకు సమాచారం చేరుతుంది. మీరు అనామకంగా ఉండడాన్ని ఎంచుకోవచ్చు.'
              : 'Your safety and privacy are respected. Information shared here is received by accredited journalists for public-interest reporting. You retain full control over anonymity and contact preferences.'}
          </p>
          <div className="pt-1 text-[10px] text-slate-400">
            CaseDesk Open Journalism Desk • Protected by end-to-end data encryption
          </div>
        </div>
      </footer>
    </div>
  );
}
