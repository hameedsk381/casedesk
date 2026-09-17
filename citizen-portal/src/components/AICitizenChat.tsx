'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Send,
  Paperclip,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  FileText,
  UserCheck,
  Trash2,
  Sparkles,
  Lock,
  ArrowRight,
  X,
  Shield,
} from 'lucide-react';
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

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [consentAccuracy, setConsentAccuracy] = useState(true);
  const [consentContact, setConsentContact] = useState(true);
  const [consentNoGuarantee, setConsentNoGuarantee] = useState(true);
  const [consentToPublish, setConsentToPublish] = useState<'DISCUSS_FIRST' | 'NO' | 'YES'>('DISCUSS_FIRST');
  const [submittingDossier, setSubmittingDossier] = useState(false);
  const [readyToSubmit, setReadyToSubmit] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const greetingText =
      lang === 'te'
        ? `నమస్కారం! నేను ${endpoint.title || 'సిటిజన్ హెల్ప్‌డెస్క్'} AI సహాయకుడిని.\n\nమీ సమస్యను తెలుగు, Tenglish లేదా English లో చెప్పండి. మైక్ నొక్కి మాట్లాడవచ్చు.`
        : `Hello! I'm the AI assistant for ${endpoint.title || 'Citizen Helpdesk'}.\n\nTell us what happened in English, Telugu, or Tenglish. Tap the mic to speak.`;

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

  const categoryChips = [
    {
      label: lang === 'te' ? 'ఆసుపత్రి & వైద్యం' : 'Hospitals & Health',
      desc: lang === 'te' ? 'డాక్టర్లు లేరు, మందులు లేవు' : 'No doctors, missing medicines',
      prompt: lang === 'te' ? 'మా ప్రాంతంలోని ప్రభుత్వ ఆసుపత్రిలో డాక్టర్లు మరియు మందులు అందుబాటులో లేక రోగులు ఇబ్బంది పడుతున్నారు.' : 'Our local hospital has no doctors and essential medicines are missing.',
    },
    {
      label: lang === 'te' ? 'రోడ్లు & తాగునీరు' : 'Roads & Water',
      desc: lang === 'te' ? 'గుంతల రోడ్లు, నీటి సమస్య' : 'Potholes, water crisis',
      prompt: lang === 'te' ? 'గత నెలలుగా మా ప్రాంతంలో సురక్షిత తాగునీరు రావడం లేదు, రోడ్లు గోతులతో ప్రమాదకరంగా ఉన్నాయి.' : 'No safe drinking water for months and the roads are full of potholes.',
    },
    {
      label: lang === 'te' ? 'ఫించన్లు & సంక్షేమం' : 'Pensions & Welfare',
      desc: lang === 'te' ? 'ఫించన్ రావడం లేదు' : 'Pension delays',
      prompt: lang === 'te' ? 'ప్రభుత్వ సంక్షేమ పథకాలు మరియు పెన్షన్లు అర్హులైన పేదలకు అందడం లేదు.' : 'Government welfare schemes and pensions are not reaching eligible people.',
    },
    {
      label: lang === 'te' ? 'లంచాలు & అవినీతి' : 'Bribes & Corruption',
      desc: lang === 'te' ? 'అధికారులు లంచం అడగడం' : 'Officials demanding bribes',
      prompt: lang === 'te' ? 'ప్రభుత్వ సేవలు లేదా డాక్యుమెంట్ల కోసం అధికారులు లంచాలు డిమాండ్ చేస్తున్నారు.' : 'Officials are demanding bribes to process govt documents and applications.',
    },
  ];

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

          const transRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
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
      alert(lang === 'te' ? 'మైక్రోఫోన్ అనుమతి లభించలేదు.' : 'Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(audioTimerRef.current);
    }
  };

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

      const voiceMessages = messages.filter((m) => m.type === 'voice' && m.audioBlob);
      voiceMessages.forEach((vm, idx) => {
        if (vm.audioBlob) {
          formData.append('files', vm.audioBlob, `voice-dispatch-${idx + 1}.webm`);
        }
      });

      attachedFiles.forEach((f) => {
        formData.append('files', f);
      });

      const res = await fetch(`/api/submit/${endpoint.slug}`, { method: 'POST', body: formData });

      let data: any = null;
      try { data = await res.json(); } catch {}
      if (!res.ok || !data) throw new Error(data?.error || 'Submission failed.');

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
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
        {/* Welcome Banner */}
        {isInitialState && (
          <div className="space-y-4 animate-fade-in my-2">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={11} />
                <span>{endpoint.title || 'Helpdesk'}</span>
              </div>

              <h1 className="text-lg sm:text-xl font-black tracking-tight text-primary leading-snug">
                {lang === 'te' ? 'మీ సమస్య చెప్పండి' : 'Tell Us What Happened'}
              </h1>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'te'
                  ? 'తెలుగు, Tenglish లేదా English లో చెప్పవచ్చు. మైక్ నొక్కి మాట్లాడవచ్చు.'
                  : 'Write or speak in English, Telugu, or Tenglish. Tap the mic to speak.'}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={startRecording}
                  className="px-5 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
                >
                  <Mic size={15} />
                  <span>{lang === 'te' ? 'మైక్ నొక్కి మాట్లాడండి' : 'Tap Mic to Speak'}</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <Lock size={12} className="text-success" />
                  <span>{lang === 'te' ? '100% గోప్యం' : '100% Private'}</span>
                </div>
              </div>
            </div>

            {/* Category Chips */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {lang === 'te' ? 'త్వరిత ఎంపికలు:' : 'Quick options:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="p-3 rounded-xl bg-card hover:bg-surface border border-border hover:border-primary/30 text-left transition-all shadow-xs flex flex-col gap-0.5 group active:scale-[0.99] cursor-pointer"
                  >
                    <span className="font-bold text-xs text-primary">{chip.label}</span>
                    <span className="text-[10px] text-muted-foreground">{chip.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col animate-slide-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[80%]">
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-black text-[9px] shrink-0 mb-0.5">
                  AI
                </div>
              )}

              <div
                className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md shadow-xs'
                    : 'bg-card border border-border text-foreground rounded-bl-md'
                }`}
              >
                {msg.type === 'voice' && (
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/20 text-[10px]">
                    <Mic size={12} className="animate-pulse" />
                    <span className="font-semibold">
                      {lang === 'te' ? 'వాయిస్' : 'Voice'} ({formatSeconds(msg.audioDuration || 0)})
                    </span>
                  </div>
                )}

                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-foreground text-xs sm:text-sm">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-black text-primary">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded bg-surface font-mono text-[11px] text-primary font-semibold">{children}</code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}

                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-white/20 space-y-0.5">
                    {msg.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[10px] opacity-80 truncate">
                        <FileText size={11} className="shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <span className={`text-[9px] block mt-1 ${msg.role === 'user' ? 'text-white/50 text-right' : 'text-muted-foreground text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>

            {/* Receipt Card */}
            {msg.type === 'receipt' && submissionResult && (
              <div className="w-full mt-3 p-5 rounded-2xl bg-success-subtle border border-success/20 text-center space-y-3 animate-slide-up">
                <CheckCircle2 size={32} className="text-success mx-auto" />

                <div className="space-y-1">
                  <h3 className="text-base font-black text-primary">
                    {lang === 'te' ? 'మీ ఫిర్యాదు అందింది!' : 'Report Received!'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === 'te' ? 'మా బృందం పరిశీలిస్తుంది.' : 'Our team will review your report.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border max-w-xs mx-auto space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {lang === 'te' ? 'రిఫరెన్స్ కోడ్' : 'Reference Code'}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-base font-mono font-black text-primary tracking-tight">
                      {submissionResult.referenceNumber}
                    </span>
                    <button onClick={copyRefCode} className="p-1 rounded-md bg-surface hover:bg-surface-2 border border-border text-muted-foreground transition cursor-pointer">
                      {copiedRef ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="max-w-xs mx-auto space-y-1.5 text-left">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-center">
                    {lang === 'te' ? 'తదుపరి దశలు' : 'What Happens Next'}
                  </span>
                  {submissionResult.whatNext.map((st, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-lg text-[11px] ${
                        st.completed
                          ? 'bg-success/10 text-success font-bold border border-success/20'
                          : idx === 1
                          ? 'bg-primary/5 text-primary font-semibold border border-primary/20'
                          : 'text-muted-foreground bg-card border border-border'
                      }`}
                    >
                      {st.completed ? (
                        <CheckCircle2 size={13} className="text-success shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center text-[9px] font-bold shrink-0">{st.step}</div>
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
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-card border border-border text-muted-foreground w-fit animate-fade-in">
            <Sparkles size={13} className="text-primary animate-spin" />
            <span className="text-[11px] font-medium">{lang === 'te' ? 'స్పందిస్తోంది...' : 'Thinking...'}</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" />
              <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ready to Submit Banner */}
      {readyToSubmit && !submissionResult && (
        <div className="px-4 py-2.5 bg-success-subtle border-t border-success/20 flex items-center justify-between gap-3 z-10 animate-slide-up">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <span className="text-[11px] text-success font-bold truncate">
              {lang === 'te' ? 'సిద్ధం — సమర్పించండి' : 'Ready to submit'}
            </span>
          </div>
          <button
            onClick={() => setShowConsentModal(true)}
            className="touch-target px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <UserCheck size={12} />
            <span>{lang === 'te' ? 'సమర్పించు' : 'Submit'}</span>
            <ArrowRight size={11} />
          </button>
        </div>
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div className="px-3 py-2 bg-surface border-t border-border flex items-center gap-1.5 overflow-x-auto">
          {attachedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] text-primary shrink-0">
              <FileText size={11} />
              <span className="truncate max-w-[100px] font-medium">{file.name}</span>
              <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className="touch-target flex items-center justify-center text-muted-foreground hover:text-destructive cursor-pointer">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-card border-t border-border shrink-0 safe-area-bottom">
        {isRecording ? (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary/[0.05] border border-primary/20 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-mono font-bold text-primary">{formatSeconds(recordingDuration)}</span>
              <span className="hidden sm:inline text-[11px] text-muted-foreground">
                {lang === 'te' ? 'మాట్లాడండి...' : 'Recording...'}
              </span>
            </div>
            <button onClick={stopRecording} className="touch-target px-4 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-sm font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer">
              <Square size={11} className="fill-white" />
              <span>{lang === 'te' ? 'ఆపు' : 'Stop'}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
            <input type="file" multiple ref={fileInputRef} onChange={(e) => { if (e.target.files) setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="touch-target flex items-center justify-center p-3 rounded-xl bg-surface hover:bg-surface-2 border border-border text-muted-foreground transition shrink-0 active:scale-95 cursor-pointer">
              <Paperclip size={18} />
            </button>
            <button type="button" onClick={startRecording} className="touch-target flex items-center justify-center p-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition shrink-0 shadow-xs active:scale-95 cursor-pointer">
              <Mic size={18} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={lang === 'te' ? 'మీ మాటల్లో రాయండి...' : 'Type in English, Telugu, or Tenglish...'}
              className="flex-1 bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none transition"
            />
            <button type="submit" disabled={!inputValue.trim() && attachedFiles.length === 0} className="touch-target flex items-center justify-center p-3 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-bold transition shrink-0 shadow-xs active:scale-95 cursor-pointer">
              <Send size={15} />
            </button>
          </form>
        )}
      </div>

      {/* Consent Modal — Bottom Sheet */}
      {showConsentModal && (
        <>
          <div className="bottom-sheet-backdrop" onClick={() => setShowConsentModal(false)} />
          <div className="bottom-sheet">
            <div className="bottom-sheet-content p-5 sm:p-6 space-y-4">
              {/* Drag handle */}
              <div className="flex justify-center pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-primary font-bold text-base">
                  <UserCheck size={18} />
                  <span>{lang === 'te' ? 'వివరాలు & సమ్మతి' : 'Contact & Consent'}</span>
                </div>
                <button onClick={() => setShowConsentModal(false)} className="touch-target flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="mt-0.5 w-5 h-5 accent-primary rounded" />
                  <div>
                    <span className="font-bold text-sm text-foreground block">{lang === 'te' ? 'అనామకంగా' : 'Stay anonymous'}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">{lang === 'te' ? 'మీ పేరు బహిరంగంగా ప్రస్తావించబడదు.' : 'Your name will not be shown publicly.'}</span>
                  </div>
                </label>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 gap-3 pt-3 border-t border-border animate-fade-in">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{lang === 'te' ? 'పేరు' : 'Name'}</label>
                      <input type="text" placeholder="Full Name" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{lang === 'te' ? 'ఫోన్' : 'Phone'}</label>
                      <input type="tel" placeholder="Phone Number" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className="w-full rounded-xl bg-background border border-border px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentAccuracy} onChange={(e) => setConsentAccuracy(e.target.checked)} className="mt-0.5 w-5 h-5 accent-primary rounded" />
                  <span className="leading-relaxed">{lang === 'te' ? 'నేను చెప్పినది నిజమని ధృవీకరిస్తున్నాను.' : 'I confirm this information is accurate.'}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentNoGuarantee} onChange={(e) => setConsentNoGuarantee(e.target.checked)} className="mt-0.5 w-5 h-5 accent-primary rounded" />
                  <span className="leading-relaxed">{lang === 'te' ? 'ప్రచురణ హామీ లేదని అర్థం చేసుకున్నాను.' : 'I understand submission does not guarantee publication.'}</span>
                </label>
              </div>

              <button
                onClick={handleFinalSubmit}
                disabled={submittingDossier || !consentAccuracy || !consentNoGuarantee}
                className="touch-target w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-base rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
              >
              {submittingDossier ? (
                <>
                  <Clock size={15} className="animate-spin" />
                  <span>{lang === 'te' ? 'పంపుతోంది...' : 'Sending...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  <span>{lang === 'te' ? 'సమర్పించండి →' : 'Submit Report →'}</span>
                </>
              )}
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
