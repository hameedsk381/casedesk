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
  Shield,
  Clock,
  X,
  Sparkles,
  Lock,
  MapPin,
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
  onBackToSelect?: () => void;
}

export function CitizenSubmissionForm({
  endpoint,
  lang,
  setLang,
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
  const [isAnonymous, setIsAnonymous] = useState(true);

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
      setStep(6);
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

  const inputClass =
    'w-full p-3.5 text-base bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-medium placeholder:text-muted-foreground transition-colors';

  const hasContent = story.trim() || audioUrl;

  return (
    <div className="space-y-4 animate-fade-in">

      {/* STEP 1: TELL US — Voice first */}
      {step === 1 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Hero mic area */}
          <div className="relative bg-gradient-to-br from-primary/[0.06] to-secondary/10 px-6 pt-8 pb-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mic size={28} className="text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-primary leading-tight">
                {lang === 'te' ? 'మీ మాటల్లో చెప్పండి' : 'Tell us in your words'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lang === 'te' ? 'మైక్ నొక్కి మాట్లాడండి లేదా టైప్ చేయండి' : 'Tap the mic to speak or type below'}
              </p>
            </div>

            {/* Big mic button */}
            <div className="pt-2">
              {!isRecording && !audioUrl && (
                <button
                  onClick={startRecording}
                  type="button"
                  className="touch-target w-20 h-20 rounded-full bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 mx-auto"
                >
                  <Mic size={32} />
                </button>
              )}

              {isRecording && (
                <div className="space-y-3">
                  <div className="w-20 h-20 rounded-full bg-destructive text-white shadow-lg shadow-destructive/25 flex items-center justify-center mx-auto animate-pulse">
                    <Square size={28} />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-destructive">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                    <span className="font-mono">{formatSeconds(recordingSeconds)}</span>
                  </div>
                  <button
                    onClick={stopRecording}
                    type="button"
                    className="touch-target px-8 py-3 bg-destructive hover:bg-destructive/90 text-white font-bold text-sm rounded-xl transition-all shadow-xs mx-auto flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Square size={14} />
                    <span>{lang === 'te' ? 'ఆపు' : 'Stop Recording'}</span>
                  </button>
                </div>
              )}

              {audioUrl && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-background p-3 rounded-xl border border-border max-w-sm mx-auto">
                    <audio src={audioUrl} controls className="h-9 flex-1" />
                    <button
                      onClick={discardRecording}
                      type="button"
                      className="touch-target p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-success font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>{lang === 'te' ? 'రికార్డింగ్ సిద్ధం' : 'Recording captured'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text input below */}
          <div className="p-5 space-y-4">
            <div className="text-center text-xs text-muted-foreground font-medium">
              {lang === 'te' ? 'లేదా ఇక్కడ టైప్ చేయండి' : 'Or type here'}
            </div>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={4}
              placeholder={lang === 'te' ? 'ఏం జరిగిందో వివరంగా రాయండి...' : 'Describe what happened in detail...'}
              className="w-full p-4 text-base bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed text-foreground placeholder:text-muted-foreground resize-none"
            />

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary flex items-center gap-1">
                {lang === 'te' ? 'ఏ రకమైన సమస్య?' : 'What type of problem?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {CIVIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`touch-target px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
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

            {/* Privacy badge */}
            <div className="p-3 rounded-xl bg-success-subtle border border-success/20 flex items-start gap-2">
              <Shield size={14} className="text-success shrink-0 mt-0.5" />
              <span className="text-xs text-success leading-relaxed">
                {lang === 'te'
                  ? 'మీ పేరు ఎప్పటికీ బహిర్గతం కాదు. మీ గుర్తింపు రహస్యంగా ఉంచబడుతుంది.'
                  : 'Your identity is always protected. We never reveal your name publicly.'}
              </span>
            </div>

            <button
              onClick={() => {
                if (!hasContent) {
                  alert(lang === 'te' ? 'దయచేసి వాయిస్ రికార్డ్ చేయండి లేదా టైప్ చేయండి.' : 'Please record your voice or type to continue.');
                  return;
                }
                setStep(2);
              }}
              type="button"
              className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold text-base rounded-xl shadow-sm transition-all cursor-pointer active:scale-[0.97] flex items-center justify-center gap-2"
            >
              <span>{lang === 'te' ? 'తరువాత →' : 'Next →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WHERE */}
      {step === 2 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">
                {lang === 'te' ? 'ఎక్కడ జరిగింది?' : 'Where did this happen?'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'te' ? 'ఖచ్చితమైన చోటు చెప్పితే సులభంగా అర్థమవుతుంది.' : 'The more specific, the easier for our team.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary flex items-center gap-1">
                {lang === 'te' ? 'జిల్లా' : 'District'}
                <span className="text-destructive">*</span>
              </label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Guntur, Kurnool, Visakhapatnam" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary flex items-center gap-1">
                {lang === 'te' ? 'ఊరు / పట్టణం' : 'Town / Village'}
                <span className="text-destructive">*</span>
              </label>
              <input type="text" value={town} onChange={(e) => setTown(e.target.value)} placeholder="Tenali, Narasaraopet" className={inputClass} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-primary">
                {lang === 'te' ? 'చిరునామా (ఐచ్ఛికం)' : 'Street / Landmark (Optional)'}
              </label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ward No. 4, Near Primary School" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-primary">
              {lang === 'te' ? 'ఎప్పుడు జరిగింది?' : 'When did this happen?'}
            </label>
            <input type="text" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} placeholder={lang === 'te' ? 'తేదీ లేదా సుమారుగా' : 'Date or approximate time'} className={inputClass} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(1)} type="button" className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <button
              onClick={() => {
                if (!district.trim() || !town.trim()) {
                  alert(lang === 'te' ? 'దయచేసి జిల్లా & ఊరు నమోదు చేయండి.' : 'Please enter district and town.');
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

      {/* STEP 3: EVIDENCE (optional) */}
      {step === 3 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'ఆధారాలు ఉన్నాయా?' : 'Do you have evidence?'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'te' ? 'ఫోటోలు, పత్రాలు ఉంటే జతచేయండి. లేకపోయినా సరే.' : 'Photos, documents, receipts — skip if you don\'t have any.'}
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
            <div className="text-xs font-bold text-primary">
              {lang === 'te' ? 'ఫోటోలు, పత్రాలు జతచేయండి' : 'Upload Photos, Documents, Audio or Videos'}
            </div>
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
            <button onClick={() => setStep(2)} type="button" className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer">
              {lang === 'te' ? '← వెనుక' : '← Back'}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(4)} type="button" className="touch-target px-5 py-3 bg-surface hover:bg-surface-2 text-muted-foreground font-bold text-sm rounded-xl border border-border transition-all cursor-pointer">
                {lang === 'te' ? 'దాటవేయి' : 'Skip'}
              </button>
              <button onClick={() => setStep(4)} type="button" className="touch-target px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer active:scale-95">
                {lang === 'te' ? 'తరువాత →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: CONTACT + SUBMIT */}
      {step === 4 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-primary">
              {lang === 'te' ? 'సమర్పించండి' : 'Submit Report'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'te' ? 'మీ ఫిర్యాదు ఎలా ఉందో సమీక్షించి పంపండి.' : 'Review your report and send.'}
            </p>
          </div>

          {/* Summary */}
          <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1.5">
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {lang === 'te' ? 'మీ ఫిర్యాదు' : 'Your Report'}
            </div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              {story || (audioUrl ? `🎤 ${lang === 'te' ? 'వాయిస్ రికార్డింగ్' : 'Voice recording'}` : '')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {category && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {CIVIC_CATEGORIES.find((c) => c.id === category)?.[lang === 'te' ? 'te' : 'en']}
                </span>
              )}
              {district && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface text-muted-foreground border border-border">
                  {district}{town ? `, ${town}` : ''}
                </span>
              )}
              {audioUrl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-subtle text-success border border-success/20">
                  🎤 {lang === 'te' ? 'వాయిస్' : 'Voice'}
                </span>
              )}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="p-3.5 rounded-xl bg-warning-subtle border border-warning/20 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label htmlFor="anon-toggle" className="text-xs font-bold text-foreground cursor-pointer">
                {lang === 'te' ? 'నేను అనామకంగా ఉండాలనుకుంటున్నాను' : 'I want to stay anonymous'}
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary">{lang === 'te' ? 'మీ పేరు' : 'Your Name'}</label>
                <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ramesh Reddy" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary">{lang === 'te' ? 'ఫోన్ / WhatsApp' : 'Phone / WhatsApp Number'}</label>
                <input type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="+91 98480 12345" className={inputClass} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-primary">{lang === 'te' ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email Address (Optional)'}</label>
                <input type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="yourname@gmail.com" className={inputClass} />
              </div>
            </div>
          )}

          {/* Consent checkboxes */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-primary">{lang === 'te' ? 'ధృవీకరణ' : 'Confirm'}</div>
            {[
              { checked: consentAccuracy, set: setConsentAccuracy, text: lang === 'te' ? 'నేను చెప్పినది నిజమని ధృవీకరిస్తున్నాను.' : 'I confirm this information is true to the best of my knowledge.' },
              { checked: consentContact, set: setConsentContact, text: lang === 'te' ? 'మా జర్నలిస్టులు నన్ను సంప్రదించవచ్చు.' : 'Our journalists may contact me about this.' },
              { checked: consentNoGuarantee, set: setConsentNoGuarantee, text: lang === 'te' ? 'ప్రచురణ హామీ లేదని అర్థం చేసుకున్నాను.' : 'I understand this may not be published immediately.' },
            ].map((c, i) => (
              <label key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border cursor-pointer hover:bg-surface transition-colors">
                <input type="checkbox" checked={c.checked} onChange={(e) => c.set(e.target.checked)} className="w-5 h-5 accent-primary rounded mt-0.5 shrink-0 cursor-pointer" />
                <span className="text-xs text-foreground leading-relaxed font-medium">{c.text}</span>
              </label>
            ))}
          </div>

          {/* Publish preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary">
              {lang === 'te' ? 'మీ కథను ప్రచురించవచ్చా?' : 'Can we publish your report?'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {([
                { val: 'YES', label: lang === 'te' ? 'అవును' : 'Yes', desc: lang === 'te' ? 'ప్రచురించవచ్చు' : 'You can publish' },
                { val: 'DISCUSS_FIRST', label: lang === 'te' ? 'మాట్లాడండి' : 'Discuss first', desc: lang === 'te' ? 'ముందు నాతో మాట్లాడండి' : 'Talk to me first' },
                { val: 'NO', label: lang === 'te' ? 'కాదు' : 'No', desc: lang === 'te' ? 'పరిశోధన మాత్రమే' : 'Investigate only' },
              ] as const).map((opt) => (
                <label
                  key={opt.val}
                  className={`touch-target p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                    consentToPublish === opt.val
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <input type="radio" name="consentPub" checked={consentToPublish === opt.val} onChange={() => setConsentToPublish(opt.val)} className="accent-primary" />
                    <span className="text-xs">{opt.label}</span>
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
            <button onClick={() => setStep(3)} type="button" disabled={submitting} className="touch-target flex items-center text-sm font-semibold text-muted-foreground hover:text-primary cursor-pointer disabled:opacity-50">
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

      {/* STEP 5: SUCCESS */}
      {step === 6 && (
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
