'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Send,
  Paperclip,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  FileText,
  UserCheck,
  Trash2,
  Sparkles,
  Lock,
  ExternalLink,
  Shield,
  ArrowRight,
  X,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

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
  lang?: Language;
  setLang?: (lang: Language) => void;
  onSwitchToForm?: () => void;
  onBackToSelect?: () => void;
}

type Language = 'en' | 'te';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  type?: 'text' | 'voice' | 'card' | 'receipt';
  audioBlob?: Blob;
  audioDuration?: number;
  files?: Array<{ name: string; size: number; url?: string }>;
  timestamp: string;
}

interface SubmissionResult {
  referenceNumber: string;
  intakeId: string;
  triageCategory?: string;
  urgency?: string;
  receivedAt: string;
  endpointTitle: string;
  whatNext: Array<{ step: number; title: string; completed: boolean }>;
}

export function AICitizenChat({
  endpoint,
  apiBaseUrl = 'http://localhost:3000',
  lang: externalLang,
  setLang: externalSetLang,
  onSwitchToForm,
  onBackToSelect,
}: Props) {
  const [internalLang, setInternalLang] = useState<Language>('en');
  const lang = externalLang || internalLang;
  const setLang = externalSetLang || setInternalLang;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Submitter preferences state
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [consentAccuracy, setConsentAccuracy] = useState(true);
  const [consentContact, setConsentContact] = useState(true);
  const [consentNoGuarantee, setConsentNoGuarantee] = useState(true);
  const [consentToPublish, setConsentToPublish] = useState<'DISCUSS_FIRST' | 'NO' | 'YES'>('DISCUSS_FIRST');
  const [submittingDossier, setSubmittingDossier] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bilingual initial greeting
  useEffect(() => {
    const greetingText =
      lang === 'te'
        ? `నమస్కారం! నేను ${endpoint.title || 'కేస్‌డెస్క్'} AI పరిశోధనా సహాయకుడిని.\n\nప్రజా సమస్యలు, ఆసుపత్రుల నిర్లక్ష్యం, రోడ్లు/తాగునీటి కొరత లేదా లంచాల సమస్యలను నాతో పంచుకోండి.\n\n✨ మీరు తెలుగులో అయినా, Tenglish (ఇంగ్లీష్ అక్షరాలతో, ఉదా: "Maa oori hospital lo...") అయినా, లేదా English లో అయినా టైప్ చేయవచ్చు లేదా మైక్ నొక్కి మాట్లాడవచ్చు.`
        : `Hello! I am the AI intake assistant for ${endpoint.title || 'Citizen Helpdesk'}.\n\nTell us what happened regarding healthcare failures, public works, civic emergencies, or government inaction.\n\n✨ You can write in English, Telugu, or Tenglish (Telugu phonetically in English letters, e.g. "Maa oori lo..."), or tap the microphone to speak naturally.`;

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: greetingText,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [lang, endpoint.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Common Issue Categories (aligned with CaseDesk creator portal categories)
  const categoryChips = [
    {
      label: lang === 'te' ? 'ఆసుపత్రి & వైద్యం' : 'Hospitals & Health',
      desc: lang === 'te' ? 'డాక్టర్లు లేరు, మందులు లేవు' : 'No doctors, missing medicines',
      prompt: lang === 'te' ? 'మా ప్రాంతంలోని ప్రభుత్వ ఆసుపత్రిలో డాక్టర్లు మరియు మందులు అందుబాటులో లేక రోగులు ఇబ్బంది పడుతున్నారు.' : 'Our local hospital has no doctors and essential medicines are missing.'
    },
    {
      label: lang === 'te' ? 'రోడ్లు & తాగునీరు' : 'Roads & Water',
      desc: lang === 'te' ? 'గుంతల రోడ్లు, నీటి సమస్య' : 'Potholes, water crisis',
      prompt: lang === 'te' ? 'గత నెలలుగా మా ప్రాంతంలో సురక్షిత తాగునీరు రావడం లేదు, రోడ్లు గోతులతో ప్రమాదకరంగా ఉన్నాయి.' : 'No safe drinking water for months and the roads are full of potholes.'
    },
    {
      label: lang === 'te' ? 'ఫించన్లు & సంక్షేమం' : 'Pensions & Welfare',
      desc: lang === 'te' ? 'ఫించన్ రావడం లేదు, పథకాలు ఆగాయి' : 'Pension delays, schemes blocked',
      prompt: lang === 'te' ? 'ప్రభుత్వ సంక్షేమ పథకాలు మరియు పెన్షన్లు అర్హులైన పేదలకు అందడం లేదు.' : 'Government welfare schemes and pensions are not reaching eligible people.'
    },
    {
      label: lang === 'te' ? 'లంచాలు & అవినీతి' : 'Bribes & Corruption',
      desc: lang === 'te' ? 'అధికారులు లంచం అడగడం' : 'Officials demanding bribes',
      prompt: lang === 'te' ? 'ప్రభుత్వ సేవలు లేదా డాక్యుమెంట్ల కోసం అధికారులు లంచాలు డిమాండ్ చేస్తున్నారు.' : 'Officials are demanding bribes to process govt documents and applications.'
    },
  ];

  // Send text message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text && attachedFiles.length === 0) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      type: 'text',
      files: attachedFiles.map((f) => ({ name: f.name, size: f.size })),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setAttachedFiles([]);
    setIsTyping(true);

    if (updatedMessages.filter((m) => m.role === 'user').length >= 1) {
      setReadyToSubmit(true);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          language: lang,
          endpointTitle: endpoint.title,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            role: 'assistant',
            content: data.reply,
            type: 'text',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        const audioMsgId = String(Date.now());
        const userAudioMsg: ChatMessage = {
          id: audioMsgId,
          role: 'user',
          content: lang === 'te' ? '🎙️ వాయిస్ (ట్రాన్స్‌క్రిప్షన్ అవుతోంది...)' : '🎙️ Voice note (Transcribing...)',
          type: 'voice',
          audioBlob,
          audioDuration: recordingDuration,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userAudioMsg]);
        setIsTyping(true);
        setReadyToSubmit(true);

        try {
          const formData = new FormData();
          formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
          formData.append('language', lang);

          const transRes = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const transData = await transRes.json();
          const transcribedText = transData.text || '';

          setMessages((prev) =>
            prev.map((m) =>
              m.id === audioMsgId
                ? {
                    ...m,
                    content: transcribedText
                      ? `"${transcribedText}"`
                      : (lang === 'te' ? '🎙️ వాయిస్ రికార్డింగ్' : '🎙️ Voice Note'),
                  }
                : m
            )
          );

          const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                ...messages.map((m) => ({ role: m.role, content: m.content })),
                { role: 'user', content: transcribedText || 'Citizen recorded a voice report.' },
              ],
              language: lang,
              endpointTitle: endpoint.title,
            }),
          });

          const chatData = await chatRes.json();
          if (chatData.reply) {
            setMessages((prev) => [
              ...prev,
              {
                id: String(Date.now() + 1),
                role: 'assistant',
                content: chatData.reply,
                type: 'text',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        } catch (err) {
          console.error('Transcription error:', err);
        } finally {
          setIsTyping(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      audioTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert(lang === 'te' ? 'మైక్రోఫోన్ అనుమతి లభించలేదు. దయచేసి అనుమతి ఇవ్వండి.' : 'Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(audioTimerRef.current);
    }
  };

  // Submit dossier to CaseDesk backend
  const handleFinalSubmit = async () => {
    setSubmittingDossier(true);

    try {
      const userStories = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('\n\n');

      const formData = new FormData();
      formData.append('slug', endpoint.slug);
      formData.append('story', userStories || 'Conversational citizen report');
      formData.append('preferredLanguage', lang === 'te' ? 'Telugu' : 'English');
      formData.append('isAnonymous', String(isAnonymous));

      if (!isAnonymous) {
        if (senderName) formData.append('senderName', senderName);
        if (senderPhone) formData.append('senderPhone', senderPhone);
      }

      formData.append('consentAccuracy', String(consentAccuracy));
      formData.append('consentContact', String(consentContact));
      formData.append('consentNoGuarantee', String(consentNoGuarantee));
      formData.append('consentToPublish', consentToPublish);

      // Collect audio recordings
      const voiceMessages = messages.filter((m) => m.type === 'voice' && m.audioBlob);
      voiceMessages.forEach((vm, idx) => {
        if (vm.audioBlob) {
          formData.append('files', vm.audioBlob, `voice-dispatch-${idx + 1}.webm`);
        }
      });

      // Collect attached files
      attachedFiles.forEach((f) => {
        formData.append('files', f);
      });

      const res = await fetch(`${apiBaseUrl}/api/submit/${endpoint.slug}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubmissionResult(data);
      setShowConsentModal(false);

      setMessages((prev) => [
        ...prev,
        {
          id: 'receipt',
          role: 'assistant',
          content: lang === 'te' ? 'మీ ఫిర్యాదు విజయవంతంగా పంపబడింది!' : 'Your report has been sent successfully!',
          type: 'receipt',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmittingDossier(false);
    }
  };

  const copyRefCode = () => {
    if (submissionResult?.referenceNumber) {
      navigator.clipboard.writeText(submissionResult.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const userMessagesCount = messages.filter((m) => m.role === 'user').length;
  const isInitialState = userMessagesCount === 0;

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
                  Citizen Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {endpoint.title || 'Public Civic Investigation Desk'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            {onSwitchToForm && (
              <button
                onClick={onSwitchToForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-navy text-xs font-bold transition cursor-pointer border border-border-light shadow-2xs"
                title={lang === 'te' ? 'ఫారమ్ నింపండి' : 'Fill a Form Instead'}
              >
                <FileText size={13} className="text-electric-blue" />
                <span className="hidden sm:inline">{lang === 'te' ? 'ఫారమ్ నింపండి' : 'Fill a Form Instead'}</span>
              </button>
            )}

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

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col">
        
        {/* Chat Card Box matching Creator Portal */}
        <div className="bg-white rounded-3xl border border-border-light shadow-sm flex flex-col flex-1 h-[78vh] sm:h-[82vh] overflow-hidden relative">
          
          {/* Internal Chat Header Bar */}
          <div className="px-5 py-3 border-b border-border-light/80 bg-off-white/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBackToSelect && (
                <button
                  onClick={onBackToSelect}
                  className="text-xs font-semibold text-slate-500 hover:text-navy mr-1 cursor-pointer flex items-center gap-1"
                >
                  ← <span className="hidden sm:inline">{lang === 'te' ? 'వెనుకకు' : 'Back'}</span>
                </button>
              )}
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-navy">
                {lang === 'te' ? 'సహాయకుడు' : 'AI Assistant'}
              </span>
              <span className="text-[10px] text-slate-500">• Online</span>
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-cream text-navy border border-border-light text-[10px] font-bold ml-1">
                <Languages size={11} className="text-electric-blue" />
                <span>తెలుగు • Tenglish • English</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield size={13} className="text-emerald-600" />
              <span className="text-[11px] font-medium hidden sm:inline">
                {lang === 'te' ? 'జర్నలిస్టిక్ రక్షణ వర్తిస్తుంది' : 'Journalistic Privilege Applies'}
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
            
            {/* Initial Welcome Banner (Matching Step 1 of Creator Portal) */}
            {isInitialState && (
              <div className="space-y-5 animate-fade-in my-2">
                <div className="p-5 sm:p-6 rounded-2xl bg-off-white border border-border-light/80 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-xs font-bold">
                    <Sparkles size={12} />
                    <span>{endpoint.title || 'Citizen Helpdesk'}</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-navy leading-snug">
                    {lang === 'te' ? 'మీ ఏరియాలో ఏదైనా సమస్య ఉందా?' : 'Got a problem that needs attention?'}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {lang === 'te'
                      ? 'ఏం జరిగిందో మాకు చెప్పండి. మీరు తెలుగు, Tenglish (English అక్షరాలతో, e.g. "Maa oori hospital lo...") లేదా English లో చెప్పవచ్చు. మా బృందం మీ కథను పరిశీలిస్తుంది.'
                      : 'Tell us what happened. You can write or speak in English, Telugu, or Tenglish (Telugu phonetically in English letters, e.g. "Maa oori lo..."). Our newsroom will review your submission.'}
                  </p>

                  {/* Primary Voice Recording Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={startRecording}
                      className="px-6 py-3 bg-navy hover:bg-navy/90 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Mic size={16} />
                      <span>{lang === 'te' ? 'మైక్ నొక్కి మాట్లాడండి' : 'Tap Mic to Speak'}</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                      <Lock size={13} className="text-emerald-600" />
                      <span>{lang === 'te' ? '100% గోప్యం & భద్రం' : '100% Private & Safe'}</span>
                    </div>
                  </div>
                </div>

                {/* Common Issue Category Chips (Matching Creator Portal categories) */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'te' ? 'త్వరిత ఎంపికలు:' : 'Quick options:'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categoryChips.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(chip.prompt)}
                        className="p-3.5 rounded-2xl bg-white hover:bg-off-white border border-border-light hover:border-slate-300 text-left transition-all shadow-2xs flex flex-col gap-1 group active:scale-[0.99] cursor-pointer"
                      >
                        <span className="font-bold text-xs sm:text-sm text-navy group-hover:text-electric-blue transition">
                          {chip.label}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {chip.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col animate-slide-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2.5 max-w-[88%] sm:max-w-[80%]">
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-navy text-white flex items-center justify-center font-black text-[10px] shrink-0 mb-1 shadow-2xs">
                      CD
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-navy text-white rounded-br-xs shadow-xs'
                        : 'bg-off-white border border-border-light text-navy rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {/* Voice header */}
                    {msg.type === 'voice' && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/20 text-xs text-blue-200">
                        <Mic size={14} className="animate-pulse" />
                        <span className="font-semibold">
                          {lang === 'te' ? 'వాయిస్ నోట్' : 'Voice Dispatch'} ({formatSeconds(msg.audioDuration || 0)})
                        </span>
                      </div>
                    )}

                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-navy text-xs sm:text-sm">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-black text-navy">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            h1: ({ children }) => <h1 className="text-base font-bold text-navy my-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold text-navy my-1.5">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-bold text-navy my-1">{children}</h3>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-electric-blue/50 pl-3 py-1 my-2 text-slate-600 bg-cream/70 rounded-r-lg">
                                {children}
                              </blockquote>
                            ),
                            code: ({ children }) => (
                              <code className="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-xs text-navy font-semibold">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{msg.content}</p>
                    )}

                    {/* Attached files */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1">
                        {msg.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                            <FileText size={13} className="shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <span
                      className={`text-[10px] block mt-1.5 ${
                        msg.role === 'user' ? 'text-slate-500 text-right' : 'text-slate-500 text-left'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* Receipt Card when report is submitted (Matching Step 7 of Creator Portal) */}
                {msg.type === 'receipt' && submissionResult && (
                  <div className="w-full mt-4 p-6 sm:p-8 rounded-3xl bg-emerald-50/40 border border-emerald-200/80 text-center space-y-4 shadow-sm animate-slide-up">
                    <CheckCircle2 size={40} className="text-emerald-600 mx-auto" />
                    
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-navy">
                        {lang === 'te' ? 'మీ ఫిర్యాదు అందింది!' : 'Report Received!'}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {lang === 'te'
                          ? 'మా పరిశోధనా బృందం మీ నివేదికను పరిశీలిస్తుంది.'
                          : 'Our investigative journalism team will review your report and evidence.'}
                      </p>
                    </div>

                    {/* Reference Number Box */}
                    <div className="p-4 rounded-2xl bg-white border border-border-light max-w-sm mx-auto space-y-1.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        {lang === 'te' ? 'రిఫరెన్స్ కోడ్' : 'Reference Number'}
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl sm:text-2xl font-mono font-black text-navy tracking-wider">
                          {submissionResult.referenceNumber}
                        </span>
                        <button
                          onClick={copyRefCode}
                          className="p-1.5 rounded-lg bg-off-white hover:bg-slate-100 border border-border-light text-slate-600 transition cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedRef ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'te' ? 'భవిష్యత్తు సమాచారం కోసం ఈ కోడ్‌ను భద్రపరుచుకోండి.' : 'Save this number to follow up on your story.'}
                      </p>
                    </div>

                    {/* 5-Stage Milestone Timeline */}
                    <div className="max-w-md mx-auto space-y-2 pt-2 text-left">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">
                        {lang === 'te' ? 'తదుపరి పరిశోధన దశలు' : 'What Happens Next'}
                      </span>
                      {submissionResult.whatNext.map((st, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs ${
                            st.completed
                              ? 'bg-emerald-100/60 text-emerald-900 font-bold border border-emerald-200'
                              : idx === 1
                              ? 'bg-electric-blue-subtle text-navy font-semibold border border-border'
                              : 'text-slate-500 bg-white border border-border-light/60'
                          }`}
                        >
                          {st.completed ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {st.step}
                            </div>
                          )}
                          <span>{st.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-off-white border border-border-light text-slate-500 w-fit animate-fade-in">
                <Sparkles size={14} className="text-electric-blue animate-spin" />
                <span className="text-xs font-medium">
                  {lang === 'te' ? 'AI స్పందిస్తోంది...' : 'Reviewing report...'}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sticky Floating Ready-To-Submit Banner */}
          {readyToSubmit && !submissionResult && (
            <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-200/80 flex items-center justify-between gap-3 shadow-sm z-10 animate-slide-up">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                <span className="text-xs text-emerald-950 font-bold truncate">
                  {lang === 'te' ? 'వివరాలు సిద్ధమయ్యాయి — డెస్క్‌కు సమర్పించండి' : 'Story details ready — submit to newsroom'}
                </span>
              </div>
              <button
                onClick={() => setShowConsentModal(true)}
                className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <UserCheck size={14} />
                <span>{lang === 'te' ? 'సమీక్షించి సమర్పించండి' : 'Review & Submit'}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Attached Files Preview Bar */}
          {attachedFiles.length > 0 && (
            <div className="px-4 py-2 bg-off-white border-t border-border-light flex items-center gap-2 overflow-x-auto">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-border-light text-xs text-navy shrink-0 shadow-2xs"
                >
                  <FileText size={13} className="text-electric-blue" />
                  <span className="truncate max-w-[130px] font-medium">{file.name}</span>
                  <button
                    onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-500 ml-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Interactive Input Bar */}
          <div className="p-3.5 sm:p-4 bg-white/95 backdrop-blur-md border-t border-border-light shrink-0">
            {isRecording ? (
              /* Voice Recording Active Bar (matching Creator Portal style) */
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-electric-blue-subtle/70 border border-border animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red animate-pulse"></div>
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1 bg-electric-blue rounded-full wave-bar-1"></span>
                    <span className="w-1 bg-electric-blue rounded-full wave-bar-2"></span>
                    <span className="w-1 bg-electric-blue rounded-full wave-bar-3"></span>
                    <span className="w-1 bg-electric-blue rounded-full wave-bar-4"></span>
                    <span className="w-1 bg-electric-blue rounded-full wave-bar-5"></span>
                  </div>
                  <span className="text-xs font-mono font-bold text-navy">
                    {formatSeconds(recordingDuration)}
                  </span>
                  <span className="hidden sm:inline text-xs text-slate-500">
                    {lang === 'te' ? 'మీ మాటల్లో స్పష్టంగా చెప్పండి...' : 'Recording your story...'}
                  </span>
                </div>

                <button
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-xl bg-red hover:bg-red/90 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                >
                  <Square size={13} className="fill-white" />
                  <span>{lang === 'te' ? 'ఆపండి & పంపండి' : 'Stop & Send'}</span>
                </button>
              </div>
            ) : (
              /* Standard Input Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 sm:gap-2.5"
              >
                {/* File Attachment Button */}
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 sm:p-3 rounded-xl bg-off-white hover:bg-slate-100 border border-border-light text-slate-600 transition shrink-0 active:scale-95 cursor-pointer"
                  title="Attach photos or documents"
                >
                  <Paperclip size={16} />
                </button>

                {/* Mic CTA Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-2.5 sm:p-3 rounded-xl bg-electric-blue hover:bg-electric-blue-dark text-white font-bold transition shrink-0 shadow-xs active:scale-95 cursor-pointer"
                  title="Record voice note"
                >
                  <Mic size={16} />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    lang === 'te'
                      ? 'Maa oori lo... లేదా మీ మాటల్లో రాయండి / మైక్ నొక్కండి...'
                      : 'Type in English, Telugu, or Tenglish (e.g., Maa oori lo...)...'
                  }
                  className="flex-1 bg-off-white border border-border-light focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/20 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-navy placeholder:text-slate-500 focus:outline-none transition"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() && attachedFiles.length === 0}
                  className="p-2.5 sm:p-3 rounded-xl bg-navy hover:bg-navy/90 disabled:opacity-40 text-white font-bold transition shrink-0 shadow-xs active:scale-95 cursor-pointer"
                  title="Send Message"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
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
          <p className="text-[11px] leading-relaxed text-slate-500">
            {lang === 'te'
              ? 'మీ భద్రత మరియు గోప్యత గౌరవించబడతాయి. ప్రజల హక్కుల కోసం పరిశోధనాత్మక జర్నలిస్టులకు సమాచారం చేరుతుంది. మీరు అనామకంగా ఉండడాన్ని ఎంచుకోవచ్చు.'
              : 'Your safety and privacy are respected. Information shared here is received by accredited journalists for public-interest reporting. You retain full control over anonymity and contact preferences.'}
          </p>
          <div className="pt-1 text-[10px] text-slate-500">
            {endpoint.workspaceName || 'Citizen Helpdesk'} • Protected by end-to-end data encryption
          </div>
        </div>
      </footer>

      {/* Review & Consent Modal (Matching Creator Portal Step 5 & 6) */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white border border-border-light rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center gap-2 text-navy font-bold text-base">
                <UserCheck size={18} className="text-electric-blue" />
                <span>{lang === 'te' ? 'వివరాలు & సమ్మతి' : 'Contact & Consent'}</span>
              </div>
              <button
                onClick={() => setShowConsentModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-navy cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Anonymity Checkbox Box matching Creator Portal */}
            <div className="p-4 rounded-2xl bg-off-white border border-border-light space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-electric-blue border-border accent-navy"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-navy block">
                    {lang === 'te' ? 'నేను అనామకంగా ఉండాలనుకుంటున్నాను' : 'I prefer to remain anonymous'}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    {lang === 'te'
                      ? 'మీ పేరు లేదా ఫోన్ నంబర్ ఎవరికీ వెల్లడించబడదు.'
                      : 'We will not share your personal identification with authorities or the public.'}
                  </span>
                </div>
              </label>

              {/* Contact fields if not anonymous */}
              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border-light animate-fade-in">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {lang === 'te' ? 'మీ పేరు' : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'te' ? 'పూర్తి పేరు' : 'Full Name'}
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs text-navy placeholder:text-slate-500 focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      {lang === 'te' ? 'ఫోన్ నంబర్ / WhatsApp' : 'Phone / WhatsApp'}
                    </label>
                    <input
                      type="tel"
                      placeholder={lang === 'te' ? 'నంబర్' : 'Phone Number'}
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full rounded-xl bg-white border border-border-light px-3 py-2 text-xs text-navy placeholder:text-slate-500 focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Consents matching Creator Portal Step 6 */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccuracy}
                  onChange={(e) => setConsentAccuracy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-electric-blue accent-navy"
                />
                <span className="text-[11px] leading-relaxed">
                  {lang === 'te'
                    ? 'నేను అందించిన సమాచారం నాకు తెలిసినంత వరకు నిజమని ధృవీకరిస్తున్నాను.'
                    : 'I confirm that the information I have provided is accurate to the best of my knowledge.'}
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentNoGuarantee}
                  onChange={(e) => setConsentNoGuarantee(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-electric-blue accent-navy"
                />
                <span className="text-[11px] leading-relaxed">
                  {lang === 'te'
                    ? 'ఈ నివేదికను సమర్పించడం వల్ల తప్పనిసరిగా కథ ప్రచురించబడుతుందని హామీ లేదని అర్థం చేసుకున్నాను.'
                    : 'I understand that submitting this report does not guarantee publication.'}
                </span>
              </label>
            </div>

            {/* Final Transmit Button */}
            <button
              onClick={handleFinalSubmit}
              disabled={submittingDossier || !consentAccuracy || !consentNoGuarantee}
              className="w-full py-3.5 bg-navy hover:bg-navy/90 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {submittingDossier ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  <span>{lang === 'te' ? 'సమర్పిస్తున్నాము...' : 'Transmitting Report...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>{lang === 'te' ? 'కథను సమర్పించండి →' : 'Submit Story →'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
