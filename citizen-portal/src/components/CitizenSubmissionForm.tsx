'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  Clock,
  MapPin,
  Calendar,
  X,
  Sparkles,
  Info,
  Lock,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { CIVIC_CATEGORIES } from '../lib/contracts/intake';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface EndpointData {
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
  endpoint: EndpointData;
  lang: 'en' | 'te';
  setLang: (lang: 'en' | 'te') => void;
  onSwitchToChat?: () => void;
  onBackToSelect?: () => void;
}

export function CitizenSubmissionForm({
  endpoint,
  lang,
  setLang,
  onSwitchToChat,
  onBackToSelect,
}: Props) {
  const [step, setStep] = useState<number>(1);

  const [story, setStory] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [category, setCategory] = useState('');

  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [consentAccuracy, setConsentAccuracy] = useState(true);
  const [consentContact, setConsentContact] = useState(true);
  const [consentNoGuarantee, setConsentNoGuarantee] = useState(true);
  const [consentToPublish, setConsentToPublish] = useState<'YES' | 'DISCUSS_FIRST' | 'NO'>('DISCUSS_FIRST');

  const [files, setFiles] = useState<File[]>([]);
  const {
    isRecording,
    recordingSeconds,
    audioBlob,
    audioUrl,
    error: recorderError,
    startRecording,
    stopRecording,
    discardRecording: hookDiscard,
  } = useAudioRecorder((voiceFile) => {
    setFiles((prev) => [...prev, voiceFile]);
  });

  const discardRecording = () => {
    hookDiscard();
    setFiles((prev) => prev.filter((f) => !f.name.startsWith('voice-recording-')));
  };

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setPreferredLanguage(lang === 'te' ? 'Telugu' : 'English');
  }, [lang]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('slug', endpoint.slug);
      formData.append('story', story);
      if (district) formData.append('district', district);
      if (town) formData.append('town', town);
      if (address) formData.append('address', address);
      if (incidentDate) formData.append('incidentDate', incidentDate);
      if (category) formData.append('category', category);

      if (!isAnonymous) {
        if (senderName) formData.append('senderName', senderName);
        if (senderPhone) formData.append('senderPhone', senderPhone);
        if (senderEmail) formData.append('senderEmail', senderEmail);
      }
      formData.append('preferredLanguage', preferredLanguage);
      formData.append('isAnonymous', String(isAnonymous));
      formData.append('consentAccuracy', String(consentAccuracy));
      formData.append('consentContact', String(consentContact));
      formData.append('consentNoGuarantee', String(consentNoGuarantee));
      formData.append('consentToPublish', consentToPublish);

      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch(`/api/submit/${endpoint.slug}`, {
        method: 'POST',
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}
      if (!res.ok || !data) {
        throw new Error(data?.error || 'Something went wrong. Please try again.');
      }

      setReferenceNumber(data.referenceNumber);
      setStep(7);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferenceCode = () => {
    if (referenceNumber) {
      navigator.clipboard.writeText(referenceNumber);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const t = {
    districtLabel: lang === 'te' ? 'జిల్లా' : 'District',
    townLabel: lang === 'te' ? 'ఊరు / పట్టణం' : 'Town / Village',
    addressLabel: lang === 'te' ? 'చిరునామా (ఐచ్ఛికం)' : 'Street / Landmark (Optional)',
    whenLabel: lang === 'te' ? 'ఎప్పుడు జరిగింది?' : 'When did this happen?',
    whenPlaceholder: lang === 'te' ? 'తేదీ లేదా సుమారుగా' : 'Date or approximate time',
    categoryLabel: lang === 'te' ? 'ఏ రకమైన సమస్య?' : 'What type of problem?',
    uploadDoc: lang === 'te' ? 'ఫోటోలు, పత్రాలు జతచేయండి' : 'Upload Photos, Documents, Audio or Videos',
    nameLabel: lang === 'te' ? 'మీ పేరు' : 'Your Name',
    phoneLabel: lang === 'te' ? 'ఫోన్ / WhatsApp' : 'Phone / WhatsApp Number',
    emailLabel: lang === 'te' ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email Address (Optional)',
    anonymousToggle: lang === 'te' ? 'నేను అనామకంగా ఉండాలనుకుంటున్నాను' : 'I want to stay anonymous',
    anonymousNotice: lang === 'te' ? 'సంప్రదింపు వివరాలు ఇవ్వడం వల్ల కథ ప్రచురించబడుతుందని హామీ ఉండదు.' : 'Sharing contact info does not guarantee publication.',
    consent1: lang === 'te' ? 'నేను చెప్పినది నిజమని ధృవీకరిస్తున్నాను.' : 'I confirm this information is true to the best of my knowledge.',
    consent2: lang === 'te' ? 'మా జర్నలిస్టులు నన్ను సంప్రదించవచ్చు.' : 'Our journalists may contact me about this.',
    consent3: lang === 'te' ? 'ప్రచురణ హామీ లేదని అర్థం చేసుకున్నాను.' : 'I understand this may not be published immediately.',
    consentPublishQ: lang === 'te' ? 'మీ కథను ప్రచురించవచ్చా?' : 'Can we publish your report?',
    publishYes: lang === 'te' ? 'అవును, ప్రచురించవచ్చు' : 'Yes, you can publish',
    publishDiscuss: lang === 'te' ? 'ముందు నాతో మాట్లాడండి' : 'Talk to me first',
    publishNo: lang === 'te' ? 'వద్దు, పరిశోధన మాత్రమే' : 'No — investigate only',
  };

  const STEPS = [
    { num: 1, label: lang === 'te' ? 'ప్రారంభం' : 'Intro' },
    { num: 2, label: lang === 'te' ? 'వివరాలు' : 'Details' },
    { num: 3, label: lang === 'te' ? 'చోటు' : 'Location' },
    { num: 4, label: lang === 'te' ? 'ఆధారాలు' : 'Evidence' },
    { num: 5, label: lang === 'te' ? 'సంప్రదింపు' : 'Contact' },
    { num: 6, label: lang === 'te' ? 'ధృవీకరణ' : 'Confirm' },
  ];

  const StepIndicator = () => (
    <div className="flex items-center gap-1.5 sm:gap-2 mb-6">
      {STEPS.map((s, i) => {
        const isActive = step === s.num;
        const isCompleted = step > s.num;
        return (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isActive
                    ? 'bg-primary text-white ring-4 ring-primary/15'
                    : 'bg-surface text-muted-foreground border border-border'
                }`}
              >
                {isCompleted ? <Check size={14} /> : s.num}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-bold hidden sm:block ${
                  isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 rounded-full mt-0 sm:-mt-5 ${
                  step > s.num ? 'bg-success' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const InputField = ({
    label,
    required,
    children,
  }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-primary flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );

  const inputClass =
    'w-full p-3.5 text-base bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-medium placeholder:text-muted-foreground transition-colors';

  return (
    <div className="space-y-4 animate-fade-in">
      {step < 7 && <StepIndicator />}

      {/* STEP 1: INTRO */}
      {step === 1 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            <span>{endpoint.workspaceName || endpoint.title || 'Helpdesk'}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary leading-tight">
              {lang === 'te' ? 'మీ సమస్య చెప్పండి' : "Tell Us What Happened"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'te'
                ? 'ఏం జరిగిందో మాకు చెప్పండి. సమాచారం లేదా ఆధారాలు ఇవ్వండి. మా టీమ్ పరిశీలిస్తుంది.'
                : 'Tell us what happened. Share any info or evidence. Our team will look into it.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs text-muted-foreground">
            <div className="font-bold text-primary flex items-center gap-1.5">
              <Shield size={13} className="text-success" />
              <span>{lang === 'te' ? 'మీకు తెలియజేద్దాము:' : 'Good to know:'}</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 leading-relaxed">
              <li>{lang === 'te' ? 'ఆసుపత్రి, రోడ్లు, పింఛను, లంచాలు — ఏదైనా చెప్పవచ్చు' : 'Hospitals, roads, pensions, bribes — report anything'}</li>
              <li>{lang === 'te' ? 'తెలుగు లేదా English లో టైప్ లేదా వాయిస్' : 'Type or speak in Telugu or English'}</li>
              <li>{lang === 'te' ? 'మీ పేరు దాగి ఉంచవచ్చు' : 'You can stay anonymous'}</li>
            </ul>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
          >
            <span>{lang === 'te' ? 'ప్రారంభించండి →' : 'Start Reporting →'}</span>
          </button>
        </div>
      )}

      {/* STEP 2: WHAT HAPPENED */}
      {step === 2 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'ఏం జరిగింది?' : 'What Happened?'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'te' ? 'ఏం జరిగింది? ఎవరికి నష్టం? ఎవరు బాధ్యులు?' : 'What happened? Who was affected? Who is responsible?'}
            </p>
          </div>

          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={7}
            placeholder={lang === 'te' ? 'మీ మాటల్లో చెప్పండి...' : 'Write what happened in your own words...'}
            className="w-full p-4 text-base bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed text-foreground placeholder:text-muted-foreground resize-none"
          />

          {/* Voice Recording */}
          <div className="p-4 rounded-xl bg-primary/[0.03] border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={14} className="text-primary" />
                <span className="text-xs font-bold text-primary">
                  {lang === 'te' ? 'వాయిస్ రికార్డ్' : 'Voice Note'}
                </span>
              </div>
              {isRecording && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-destructive animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="font-mono">{formatSeconds(recordingSeconds)}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {lang === 'te' ? 'రాయడం కష్టమైతే మైక్ నొక్కి మాట్లాడండి.' : 'Hard to type? Tap the mic and speak.'}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {!isRecording && !audioUrl && (
                <button
                  onClick={startRecording}
                  type="button"
                  className="touch-target px-5 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Mic size={13} />
                  <span>{lang === 'te' ? 'రికార్డ్ ప్రారంభించు' : 'Start Recording'}</span>
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  type="button"
                  className="touch-target px-5 py-3 bg-destructive hover:bg-destructive/90 text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Square size={13} />
                  <span>{lang === 'te' ? 'ఆపు' : 'Stop'}</span>
                </button>
              )}

              {audioUrl && (
                <div className="flex items-center gap-2 w-full bg-background p-2.5 rounded-xl border border-border">
                  <audio src={audioUrl} controls className="h-8 flex-1" />
                  <button
                    onClick={discardRecording}
                    type="button"
                    className="touch-target p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(1)} type="button" className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <button
              onClick={() => {
                if (!story.trim() && !audioUrl) {
                  alert(lang === 'te' ? 'దయచేసి వివరాలు రాయండి లేదా వాయిస్ రికార్డ్ చేయండి.' : 'Please type or record your voice to continue.');
                  return;
                }
                setStep(3);
              }}
              type="button"
              className="touch-target px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              {lang === 'te' ? 'తరువాత →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION */}
      {step === 3 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'ఎక్కడ జరిగింది?' : 'Where did this happen?'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'te' ? 'ఖచ్చితమైన చోటు చెప్పితే సులభంగా అర్థమవుతుంది.' : 'The more specific, the easier for our team.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label={t.districtLabel} required>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Guntur, Kurnool, Visakhapatnam" className={inputClass} />
            </InputField>
            <InputField label={t.townLabel} required>
              <input type="text" value={town} onChange={(e) => setTown(e.target.value)} placeholder="Tenali, Narasaraopet" className={inputClass} />
            </InputField>
            <div className="sm:col-span-2">
              <InputField label={t.addressLabel}>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ward No. 4, Near Primary School" className={inputClass} />
              </InputField>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <InputField label={t.whenLabel}>
              <input type="text" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} placeholder={t.whenPlaceholder} className={inputClass} />
            </InputField>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <label className="text-xs font-bold text-primary">
              {t.categoryLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {CIVIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`touch-target flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-muted-foreground hover:bg-surface-2 border border-border'
                  }`}
                >
                  {lang === 'te' ? cat.te : cat.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(2)} type="button" className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <button onClick={() => setStep(4)} type="button" className="touch-target px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-95">
              {lang === 'te' ? 'తరువాత →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: EVIDENCE */}
      {step === 4 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'ఆధారాలు ఉన్నాయా?' : 'Do you have evidence?'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'te' ? 'ఫోటోలు, పత్రాలు ఉంటే జతచేయండి. లేకపోయినా సరే.' : 'Photos, documents, receipts — no problem if you don\'t have any.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-success-subtle border border-success/20 text-xs text-success font-medium">
            <strong>{lang === 'te' ? 'గమనిక:' : 'Note:'}</strong>{' '}
            {lang === 'te' ? 'ఆధారాలు లేకపోయినా ఫిర్యాదు చేయవచ్చు. సేకరించే పని మాది.' : 'No evidence needed. Collecting proof is our job.'}
          </div>

          <label className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-background/50 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Upload size={18} />
            </div>
            <div className="text-xs font-bold text-primary">{t.uploadDoc}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              PDF, JPG, PNG, MP4, MP3, DOCX (max 25MB each)
            </div>
            <input type="file" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {lang === 'te' ? 'జతచేసిన ఫైలు' : 'Attached'} ({files.length})
              </div>
              <div className="space-y-1.5">
                {files.map((f, idx) => (
                  <div key={idx} className="p-2.5 bg-background rounded-xl border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={13} className="text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">{f.name}</span>
                    </div>
                    <button onClick={() => removeFile(idx)} type="button" className="touch-target flex items-center justify-center text-muted-foreground hover:text-destructive cursor-pointer">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(3)} type="button" className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <button onClick={() => setStep(5)} type="button" className="touch-target px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-95">
              {lang === 'te' ? 'తరువాత →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONTACT */}
      {step === 5 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'మిమ్మల్ని ఎలా సంప్రదించాలి?' : 'How can we reach you?'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{t.anonymousNotice}</p>
          </div>

          <div className="p-3 rounded-xl bg-warning-subtle border border-warning/20 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label htmlFor="anon-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                {t.anonymousToggle}
              </label>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                {lang === 'te' ? 'మీ పేరు బహిరంగంగా ప్రస్తావించబడదు.' : 'Your name will never be shown publicly.'}
              </div>
            </div>
            <input
              id="anon-toggle"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-6 h-6 accent-primary rounded cursor-pointer shrink-0"
            />
          </div>

          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label={t.nameLabel}>
                <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ramesh Reddy" className={inputClass} />
              </InputField>
              <InputField label={t.phoneLabel}>
                <input type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="+91 98480 12345" className={inputClass} />
              </InputField>
              <div className="sm:col-span-2">
                <InputField label={t.emailLabel}>
                  <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="yourname@gmail.com" className={inputClass} />
                </InputField>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(4)} type="button" className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <button onClick={() => setStep(6)} type="button" className="touch-target px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-95">
              {lang === 'te' ? 'తరువాత →' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CONFIRM */}
      {step === 6 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'ధృవీకరించి పంపండి' : 'Confirm & Submit'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'te' ? 'క్రిందివి చెక్ చేసి పంపండి.' : 'Review and send.'}
            </p>
          </div>

          <div className="space-y-2">
            {[
              { checked: consentAccuracy, set: setConsentAccuracy, text: t.consent1 },
              { checked: consentContact, set: setConsentContact, text: t.consent2 },
              { checked: consentNoGuarantee, set: setConsentNoGuarantee, text: t.consent3 },
            ].map((c, i) => (
              <label key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={c.checked} onChange={(e) => c.set(e.target.checked)} className="w-5 h-5 accent-primary rounded mt-0.5 shrink-0 cursor-pointer" />
                <span className="text-sm text-foreground leading-relaxed font-medium">{c.text}</span>
              </label>
            ))}
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <label className="text-xs font-bold text-primary">{t.consentPublishQ}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                { val: 'YES', label: lang === 'te' ? 'అవును' : 'Yes', desc: t.publishYes },
                { val: 'DISCUSS_FIRST', label: lang === 'te' ? 'మాట్లాడండి' : 'Discuss first', desc: t.publishDiscuss },
                { val: 'NO', label: lang === 'te' ? 'కాదు' : 'No', desc: t.publishNo },
              ] as const).map((opt) => (
                <label
                  key={opt.val}
                  className={`touch-target p-3.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                    consentToPublish === opt.val
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <input type="radio" name="consentPub" checked={consentToPublish === opt.val} onChange={() => setConsentToPublish(opt.val)} className="accent-primary" />
                    <span>{opt.label}</span>
                  </div>
                  <p className="text-[10px] font-normal text-muted-foreground leading-snug">{opt.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(5)} type="button" disabled={submitting} className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer disabled:opacity-50">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              disabled={submitting || !consentAccuracy || !consentNoGuarantee}
              className="touch-target px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'te' ? 'పంపుతోంది...' : 'Sending...'}</span>
                </>
              ) : (
                <span>{lang === 'te' ? 'పంపండి →' : 'Send Report →'}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: RECEIPT */}
      {step === 7 && (
        <div className="bg-card rounded-2xl p-6 sm:p-10 border border-border shadow-sm space-y-6 animate-slide-up">
          <div className="text-center space-y-3 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-full bg-success-subtle text-success flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary">
              {lang === 'te' ? 'మీ ఫిర్యాదు అందింది!' : 'Report Received!'}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'te' ? 'ధన్యవాదాలు. మా టీమ్ పరిశీలిస్తుంది.' : 'Thank you. Our team will review your report.'}
            </p>

            {referenceNumber && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-border">
                  <div className="text-left">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      {lang === 'te' ? 'రిఫరెన్స్ కోడ్' : 'Reference Code'}
                    </div>
                    <div className="font-mono text-sm font-black text-primary tracking-tight">
                      {referenceNumber}
                    </div>
                  </div>
                  <button
                    onClick={copyReferenceCode}
                    className="p-1.5 rounded-lg bg-background border border-border hover:bg-surface text-muted-foreground transition cursor-pointer"
                    title={lang === 'te' ? 'కాపీ' : 'Copy'}
                  >
                    {copiedCode ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onBackToSelect}
              className="touch-target text-sm font-bold text-primary hover:text-primary-hover cursor-pointer pt-2"
            >
              {lang === 'te' ? 'హోమ్ కు తిరిగి →' : 'Back to Home →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
