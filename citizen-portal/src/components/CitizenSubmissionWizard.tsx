'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  ShieldCheck,
  Globe,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Lock,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';

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

type Language = 'en' | 'te';

interface SubmissionResult {
  referenceNumber: string;
  intakeId: string;
  triageCategory?: string;
  urgency?: string;
  receivedAt: string;
  endpointTitle: string;
  whatNext: Array<{ step: number; title: string; completed: boolean }>;
}

export function CitizenSubmissionWizard({ endpoint, apiBaseUrl = 'http://localhost:3000' }: Props) {
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Form State
  const [story, setStory] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [category, setCategory] = useState('Civic Infrastructure');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');

  // Unbundled Consent
  const [consentAccuracy, setConsentAccuracy] = useState(false);
  const [consentContact, setConsentContact] = useState(true);
  const [consentNoGuarantee, setConsentNoGuarantee] = useState(false);
  const [consentToPublish, setConsentToPublish] = useState<'YES' | 'DISCUSS_FIRST' | 'NO'>('DISCUSS_FIRST');

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // Attachments State
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError(lang === 'te' ? 'మైక్రోఫోన్ అనుమతి లభించలేదు.' : 'Microphone access was denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const removeVoiceNote = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Handler
  const handleSubmit = async () => {
    setError(null);

    if (!consentAccuracy || !consentNoGuarantee) {
      setError(
        lang === 'te'
          ? 'దయచేసి తప్పనిసరి అంగీకార చెక్‌బాక్స్‌లను గుర్తించండి.'
          : 'Please accept all mandatory consent declarations before submitting.'
      );
      return;
    }

    if (!story.trim() && !audioBlob) {
      setError(
        lang === 'te'
          ? 'దయచేసి మీ కథనాన్ని రాయండి లేదా వాయిస్ రికార్డ్ చేయండి.'
          : 'Please describe your story or record a voice message.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('slug', endpoint.slug);
      formData.append('story', story || (audioBlob ? 'Voice dispatch submitted via Citizen Portal' : ''));
      formData.append('preferredLanguage', lang === 'te' ? 'Telugu' : 'English');
      formData.append('category', category);
      if (district) formData.append('district', district);
      if (town) formData.append('town', town);
      if (address) formData.append('address', address);
      if (incidentDate) formData.append('incidentDate', incidentDate);

      formData.append('isAnonymous', String(isAnonymous));
      if (!isAnonymous) {
        if (senderName) formData.append('senderName', senderName);
        if (senderPhone) formData.append('senderPhone', senderPhone);
        if (senderEmail) formData.append('senderEmail', senderEmail);
      }

      formData.append('consentAccuracy', String(consentAccuracy));
      formData.append('consentContact', String(consentContact));
      formData.append('consentNoGuarantee', String(consentNoGuarantee));
      formData.append('consentToPublish', consentToPublish);

      // Add voice note if present
      if (audioBlob) {
        formData.append('files', audioBlob, `voice-note-${Date.now()}.webm`);
      }

      // Add files
      for (const f of files) {
        formData.append('files', f);
      }

      const res = await fetch(`${apiBaseUrl}/api/submit/${endpoint.slug}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setResult(data);
      setStep(6); // Step 6 is Receipt
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferenceCode = () => {
    if (result?.referenceNumber) {
      navigator.clipboard.writeText(result.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Bilingual UI dictionary
  const dict = {
    en: {
      portalTitle: endpoint.title || 'Citizen Story Portal',
      introTitle: 'Report an Issue to Investigative Journalists',
      introDesc:
        endpoint.description ||
        'We investigate public fund corruption, hospital failures, civic neglect, and government service denial. Share your story with complete confidentiality.',
      step0Title: 'Introduction & Scope',
      step1Title: 'What Happened?',
      step2Title: 'Where & When?',
      step3Title: 'Supporting Evidence',
      step4Title: 'About You',
      step5Title: 'Consent & Safety',
      step6Title: 'Receipt & Next Steps',
      startBtn: 'Start Your Story',
      nextBtn: 'Next Step',
      prevBtn: 'Back',
      submitBtn: 'Submit Story for Investigation',
      storyPlaceholder: 'Describe what happened in detail. Include who was involved, what was promised, and how people are being affected...',
      voiceNoteHeader: 'Prefer to speak? Record a voice note',
      recordStart: 'Record Voice Note',
      recordingNow: 'Recording...',
      recordStop: 'Finish Recording',
      voiceNoteReady: 'Voice note recorded successfully',
      evidencePrompt: "You don't need evidence to submit a report",
      evidenceSub: 'Share any documents, photos, or videos you have. Even if you only have your word, we will investigate.',
      anonToggle: 'I prefer to remain completely anonymous',
      anonSub: 'Your name, phone, and IP address will never be stored or published.',
      accuracyLabel: 'I confirm the facts provided in this report are true to the best of my knowledge.',
      contactLabel: 'The newsroom may contact me to verify facts or ask clarifying questions.',
      noGuaranteeLabel: 'I understand submitting a report does not guarantee public coverage.',
      publishHeader: 'Public Reporting & Attribution Preference',
      publishYes: 'Yes, you may use my name in public reports if verified',
      publishDiscuss: 'Discuss with me first before using any identifying details (Recommended)',
      publishNo: 'No, keep my identity strictly confidential at all times',
      refCodeHeader: 'Your Confidential Reference Code',
      refCodeSub: 'Save this reference code. Use it whenever you communicate with our newsroom.',
      milestonesHeader: 'What Happens Next?',
    },
    te: {
      portalTitle: 'ప్రజా ఫిర్యాదుల & పరిశోధనాత్మక పోర్టల్',
      introTitle: 'జర్నలిస్టులకు మీ సమస్యను నేరుగా తెలపండి',
      introDesc:
        endpoint.description ||
        'ప్రజాధనం దుర్వినియోగం, ఆసుపత్రులలో నిర్లక్ష్యం, ప్రభుత్వ సేవల లోపాలు మరియు పర్యావరణ సమస్యలపై మేము దర్యాప్తు చేస్తాము. పూర్తి గోప్యతతో మీ సమస్యను పంచుకోండి.',
      step0Title: 'పరిచయం & విధివిధానాలు',
      step1Title: 'ఏమి జరిగింది?',
      step2Title: 'ఎక్కడ & ఎప్పుడు?',
      step3Title: 'ఆధారాలు & పత్రాలు',
      step4Title: 'మీ వివరాలు',
      step5Title: 'అంగీకారం & భద్రత',
      step6Title: 'రసీదు & తదుపరి చర్యలు',
      startBtn: 'ప్రారంభించండి',
      nextBtn: 'తదుపరి అడుగు',
      prevBtn: 'వెనుకకు',
      submitBtn: 'విచారణ కొరకు సమర్పించండి',
      storyPlaceholder: 'ఏమి జరిగిందో వివరంగా రాయండి. ఎవరి ప్రమేయం ఉంది, అధికారులు ఏం చేశారు లేదా నిర్లక్ష్యం చేశారు, ప్రజలు ఎలా ఇబ్బంది పడుతున్నారు...',
      voiceNoteHeader: 'రాయడం కష్టంగా ఉందా? వాయిస్ రికార్డ్ చేయండి',
      recordStart: 'వాయిస్ రికార్డ్ చేయండి',
      recordingNow: 'రికార్డ్ అవుతోంది...',
      recordStop: 'రికార్డింగ్ ఆపండి',
      voiceNoteReady: 'వాయిస్ సందేశం సిద్ధంగా ఉంది',
      evidencePrompt: 'ఫిర్యాదు చేయడానికి ఆధారాలు తప్పనిసరి కాదు',
      evidenceSub: 'మీ వద్ద ఏవైనా ఫొటోలు, పత్రాలు లేదా రశీదులు ఉంటే జతచేయండి. ఏమీ లేకపోయినా మీ అనుభవం ఆధారంగా మేము విచారణ చేస్తాము.',
      anonToggle: 'నా వివరాలు పూర్తిగా రహస్యంగా (అనామకంగా) ఉంచండి',
      anonSub: 'మీ పేరు, ఫోన్ నంబర్ లేదా గుర్తింపు వివరాలు బయటకు రావు.',
      accuracyLabel: 'ఈ నివేదికలో అందించిన వివరాలు నాకు తెలిసినంతవరకు నిజమైనవని ధృవీకరిస్తున్నాను.',
      contactLabel: 'సమస్యను పరిశీలించడానికి జర్నలిస్టులు నన్ను సంప్రదించవచ్చు.',
      noGuaranteeLabel: 'ఫిర్యాదు చేసిన ప్రతి అంశం తప్పనిసరిగా ప్రచురితం కాకపోవచ్చని నేను అర్థం చేసుకున్నాను.',
      publishHeader: 'పబ్లిక్ రిపోర్టింగ్ లో మీ పేరు ప్రస్తావన',
      publishYes: 'అవును, విచారణ పూర్తయిన తర్వాత నా పేరు ఉపయోగించవచ్చు',
      publishDiscuss: 'నా పేరు లేదా వివరాలు వాడేముందు నాతో మాట్లాడండి (సిఫార్సు చేయబడినది)',
      publishNo: 'వద్దు, ఎట్టి పరిస్థితుల్లోనూ నా గుర్తింపు బయటకు రాకూడదు',
      refCodeHeader: 'మీ రహస్య రిఫరెన్స్ నంబర్',
      refCodeSub: 'ఈ కోడ్‌ను భద్రపరుచుకోండి. మా బృందంతో మాట్లాడేటప్పుడు దీనిని తెలియజేయండి.',
      milestonesHeader: 'తదుపరి ఏమి జరుగుతుంది?',
    },
  };

  const t = dict[lang];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 w-full">
      {/* Top Header & Language Switcher */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
            {endpoint.workspaceName || 'Independent Investigative Journalism'}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{t.portalTitle}</h1>
        </div>

        <button
          onClick={() => setLang((prev) => (prev === 'en' ? 'te' : 'en'))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-sm font-medium text-slate-200 hover:text-white transition shadow-sm"
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>{lang === 'en' ? 'తెలుగులోకి మార్చండి' : 'Switch to English'}</span>
        </button>
      </div>

      {/* Progress Stepper */}
      {step > 0 && step < 6 && (
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>
              {lang === 'te' ? `అడుగు ${step} లో 5` : `Step ${step} of 5`}
            </span>
            <span className="text-slate-300">
              {step === 1 && t.step1Title}
              {step === 2 && t.step2Title}
              {step === 3 && t.step3Title}
              {step === 4 && t.step4Title}
              {step === 5 && t.step5Title}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 flex items-start gap-3 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* STEP 0: Introduction */}
      {step === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{t.introTitle}</h2>
            <p className="text-slate-300 mt-2 leading-relaxed text-sm sm:text-base">{t.introDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">
                {lang === 'te' ? 'పూర్తి గోప్యత' : 'Source Protection'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'te'
                  ? 'మీ అంగీకారం లేకుండా మీ పేరు ఎక్కడా ప్రస్తావించబడదు.'
                  : 'Your identity is strictly protected under journalistic ethics.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <Mic className="w-6 h-6 text-blue-400" />
              <h3 className="font-semibold text-white text-sm">
                {lang === 'te' ? 'మాటల్లో చెప్పవచ్చు' : 'Voice or Text'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'te'
                  ? 'రాయడం కష్టంగా ఉంటే మీ ఫోన్ లో నేరుగా మాట్లాడవచ్చు.'
                  : 'Record in your own language directly through your browser.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <Clock className="w-6 h-6 text-amber-400" />
              <h3 className="font-semibold text-white text-sm">
                {lang === 'te' ? 'స్పష్టమైన ట్రాకింగ్' : 'Transparent Process'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'te'
                  ? 'మీ నివేదిక ఏ దశలో ఉందో రిఫరెన్స్ కోడ్ తో తెలుసుకోవచ్చు.'
                  : 'Receive a unique reference code to track the investigation.'}
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setStep(1)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
            >
              <span>{t.startBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: What Happened? */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">{t.step1Title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'te'
                ? 'ఏమి జరిగిందో మీ మాటల్లో చెప్పండి. వాయిస్ రికార్డ్ కూడా చేయవచ్చు.'
                : 'Share the key facts in writing, or record a voice note in your preferred language.'}
            </p>
          </div>

          {/* Voice Recorder Card */}
          {endpoint.allowVoice && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-blue-400" />
                  {t.voiceNoteHeader}
                </span>
                {isRecording && (
                  <span className="text-xs text-red-400 font-mono animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                    {formatSeconds(recordingDuration)}
                  </span>
                )}
              </div>

              {!audioBlob && !isRecording && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition border border-slate-700"
                >
                  <Mic className="w-4 h-4 text-blue-400" />
                  {t.recordStart}
                </button>
              )}

              {isRecording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-2 transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  {t.recordStop}
                </button>
              )}

              {audioBlob && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.voiceNoteReady} ({formatSeconds(recordingDuration)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeVoiceNote}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Story Area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              {lang === 'te' ? 'కథనం వివరాలు (వచన రూపంలో)' : 'Detailed Description'}
            </label>
            <textarea
              rows={6}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder={t.storyPlaceholder}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition leading-relaxed resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(0)}
              className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              {t.prevBtn}
            </button>
            <button
              onClick={() => {
                if (!story.trim() && !audioBlob) {
                  setError(
                    lang === 'te'
                      ? 'దయచేసి మీ కథనాన్ని రాయండి లేదా వాయిస్ రికార్డ్ చేయండి.'
                      : 'Please describe what happened or record a voice note.'
                  );
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition shadow-md shadow-blue-600/20"
            >
              <span>{t.nextBtn}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Where and When? */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">{t.step2Title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'te'
                ? 'సంఘటన జరిగిన ప్రదేశం మరియు సమయం పరిశోధనకు చాలా ముఖ్యం.'
                : 'Pinpointing where and when the event took place allows journalists to cross-verify local official records.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {lang === 'te' ? 'జిల్లా' : 'District'} *
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={lang === 'te' ? 'ఉదా: గుంటూరు, నల్గొండ' : 'e.g. Guntur, Nalgonda'}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {lang === 'te' ? 'మండలం / పట్టణం / గ్రామం' : 'Mandal / Town / Village'} *
              </label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder={lang === 'te' ? 'ఉదా: తెనాలి, మునుగోడు' : 'e.g. Tenali, Munugode'}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {lang === 'te' ? 'నిర్దిష్ట ప్రదేశం / ల్యాండ్‌మార్క్' : 'Landmark / Specific Location'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === 'te' ? 'ఉదా: ప్రభుత్వ ఆసుపత్రి ఎదురుగా' : 'e.g. Near Primary Health Centre'}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {lang === 'te' ? 'సంఘటన జరిగిన తేదీ' : 'Incident Date (Approximate)'}
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              {lang === 'te' ? 'సమస్య విభాగం' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="Healthcare">{lang === 'te' ? 'వైద్యం & ఆరోగ్య రంగం' : 'Healthcare & Hospitals'}</option>
              <option value="Civic Infrastructure">{lang === 'te' ? 'రోడ్లు, నీరు & పౌర సదుపాయాలు' : 'Civic Infrastructure & Roads'}</option>
              <option value="Government Services">{lang === 'te' ? 'ప్రభుత్వ సేవలు & పింఛన్లు' : 'Government Services & Welfare'}</option>
              <option value="Environment">{lang === 'te' ? 'పర్యావరణం & కాలుష్యం' : 'Environment & Pollution'}</option>
              <option value="Education">{lang === 'te' ? 'పాఠశాలలు & విద్య' : 'Education & Schools'}</option>
              <option value="Police / Law Enforcement">{lang === 'te' ? 'పోలీస్ & చట్ట అమలు' : 'Police & Law Enforcement'}</option>
              <option value="Other">{lang === 'te' ? 'ఇతర సమస్య' : 'Other Issue'}</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              {t.prevBtn}
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition shadow-md shadow-blue-600/20"
            >
              <span>{t.nextBtn}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Supporting Evidence */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">{t.step3Title}</h2>
            <div className="mt-2 p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-blue-200 block">{t.evidencePrompt}</span>
                <span className="text-xs text-blue-300/80 leading-relaxed block mt-0.5">{t.evidenceSub}</span>
              </div>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          {endpoint.allowAttachments && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition">
                <UploadCloud className="w-8 h-8 text-slate-400" />
                <div className="text-center">
                  <span className="text-sm font-medium text-slate-200 block">
                    {lang === 'te' ? 'ఫైళ్లను ఇక్కడ వేయండి లేదా ఎంచుకోండి' : 'Click to select photos, videos, or PDFs'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Supports JPG, PNG, PDF, MP4, MP3 (Max 50MB)
                  </span>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {files.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {lang === 'te' ? `జతచేసిన ఫైళ్లు (${files.length})` : `Attached Files (${files.length})`}
                  </span>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              {t.prevBtn}
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition shadow-md shadow-blue-600/20"
            >
              <span>{t.nextBtn}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: About You */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">{t.step4Title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'te'
                ? 'మీరు అనామకంగా ఉండాలనుకుంటే కింద ఉన్న స్విచ్ ఆన్ చేయండి.'
                : 'Choose whether you want to share your contact details for follow-up verification.'}
            </p>
          </div>

          {/* Anonymity Switch */}
          {endpoint.allowAnonymous && (
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-white block">{t.anonToggle}</span>
                <span className="text-xs text-slate-400 block mt-0.5">{t.anonSub}</span>
              </div>
            </label>
          )}

          {!isAnonymous && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {lang === 'te' ? 'మీ పేరు' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder={lang === 'te' ? 'ఉదా: వెంకటేశ్వర్లు' : 'e.g. Venkateswarlu'}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {lang === 'te' ? 'ఫోన్ నంబర్ / వాట్సాప్' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="+91 98480 22338"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    {lang === 'te' ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              {t.prevBtn}
            </button>
            <button
              onClick={() => setStep(5)}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition shadow-md shadow-blue-600/20"
            >
              <span>{t.nextBtn}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Consent & Declarations */}
      {step === 5 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white">{t.step5Title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'te'
                ? 'చట్టపరమైన రక్షణ మరియు సరైన విచారణ కొరకు కింది అంశాలను నిర్ధారించండి.'
                : 'Please review and confirm each legal declaration separately before transmitting your dispatch.'}
            </p>
          </div>

          {/* Unbundled Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={consentAccuracy}
                onChange={(e) => setConsentAccuracy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-xs sm:text-sm text-slate-200">{t.accuracyLabel} *</span>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={consentContact}
                onChange={(e) => setConsentContact(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-xs sm:text-sm text-slate-200">{t.contactLabel}</span>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={consentNoGuarantee}
                onChange={(e) => setConsentNoGuarantee(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span className="text-xs sm:text-sm text-slate-200">{t.noGuaranteeLabel} *</span>
            </label>
          </div>

          {/* Public Attribution 3-Choice Radio */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              {t.publishHeader}
            </span>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="attribution"
                  checked={consentToPublish === 'DISCUSS_FIRST'}
                  onChange={() => setConsentToPublish('DISCUSS_FIRST')}
                  className="mt-1 text-blue-600 focus:ring-0"
                />
                <span className="text-xs sm:text-sm text-slate-200 font-medium">
                  {t.publishDiscuss}
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="attribution"
                  checked={consentToPublish === 'NO'}
                  onChange={() => setConsentToPublish('NO')}
                  className="mt-1 text-blue-600 focus:ring-0"
                />
                <span className="text-xs sm:text-sm text-slate-200">{t.publishNo}</span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="attribution"
                  checked={consentToPublish === 'YES'}
                  onChange={() => setConsentToPublish('YES')}
                  className="mt-1 text-blue-600 focus:ring-0"
                />
                <span className="text-xs sm:text-sm text-slate-200">{t.publishYes}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
            >
              {t.prevBtn}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{lang === 'te' ? 'సమర్పిస్తున్నాము...' : 'Transmitting Dispatch...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.submitBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation Receipt & Milestones Tracker */}
      {step === 6 && result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
          {/* Success Banner */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {lang === 'te' ? 'మీ ఫిర్యాదు స్వీకరించబడింది' : 'Report Received Successfully'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {lang === 'te'
                ? 'జర్నలిస్టుల బృందం మీ నివేదికను పరిశీలిస్తుంది.'
                : 'Your report has been securely routed to the investigative newsroom triage desk.'}
            </p>
          </div>

          {/* Reference Number Card */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-blue-900/40 text-center space-y-3">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest block">
              {t.refCodeHeader}
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
                {result.referenceNumber}
              </span>
              <button
                onClick={copyReferenceCode}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Copy Reference Code"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{t.refCodeSub}</p>
          </div>

          {/* 5-Stage Transparency Milestones */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              {t.milestonesHeader}
            </h3>

            <div className="space-y-3">
              {result.whatNext.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border ${
                    item.completed
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                      : idx === 1
                      ? 'bg-blue-950/30 border-blue-800/40 text-blue-200'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="shrink-0">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : idx === 1 ? (
                      <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-xs font-mono text-slate-400">
                        {item.step}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm font-medium">
                    {item.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return button */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => {
                setStep(0);
                setStory('');
                setFiles([]);
                setAudioBlob(null);
                setResult(null);
              }}
              className="px-6 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
            >
              {lang === 'te' ? 'మరో నివేదికను సమర్పించండి' : 'Submit Another Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
