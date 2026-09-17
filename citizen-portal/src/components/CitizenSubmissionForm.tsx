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
  Languages,
  Sparkles,
  Info,
  Lock,
  Bot
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
  apiBaseUrl?: string;
  lang: 'en' | 'te';
  setLang: (lang: 'en' | 'te') => void;
  onSwitchToChat?: () => void;
  onBackToSelect?: () => void;
}

export function CitizenSubmissionForm({
  endpoint,
  apiBaseUrl = 'http://localhost:3000',
  lang,
  setLang,
  onSwitchToChat,
  onBackToSelect,
}: Props) {
  // Step state: 1 to 7
  const [step, setStep] = useState<number>(1);

  // Form fields
  const [story, setStory] = useState('');
  const [district, setDistrict] = useState('');
  const [town, setTown] = useState('');
  const [address, setAddress] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [category, setCategory] = useState('');

  // Contact
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Consents
  const [consentAccuracy, setConsentAccuracy] = useState(true);
  const [consentContact, setConsentContact] = useState(true);
  const [consentNoGuarantee, setConsentNoGuarantee] = useState(true);
  const [consentToPublish, setConsentToPublish] = useState<'YES' | 'DISCUSS_FIRST' | 'NO'>('DISCUSS_FIRST');

  // Files & Voice recording
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

  // Submission State
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

      const res = await fetch(`${apiBaseUrl}/api/submit/${endpoint.slug}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
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
    tellUsStory: lang === 'te' ? 'మీ సమస్య చెప్పండి' : 'Tell Us What Happened',
    introHeadline: lang === 'te' ? 'మీ ఏరియాలో ఏదైనా సమస్య ఉందా?' : 'Got a problem that needs attention?',
    introSub: lang === 'te' ? 'ఏం జరిగిందో మాకు చెప్పండి. మీ వద్ద ఉన్న సమాచారం లేదా ఆధారాలు ఇవ్వండి. మా టీమ్ పరిశీలిస్తుంది.' : 'Tell us what happened. Share whatever info or evidence you have. Our team will look into it.',
    startCta: lang === 'te' ? 'స్టార్ట్ చేయండి →' : 'Start Reporting →',
    describeLabel: lang === 'te' ? 'ఏం జరిగిందో చెప్పండి' : 'What Happened?',
    describePlaceholder: lang === 'te' ? 'మీ మాటల్లో చెప్పండి. తెలుగు లేదా English లో రాయవచ్చు...' : 'Write what happened in your own words. Telugu or English is fine...',
    recordVoice: lang === 'te' ? 'వాయిస్ రికార్డ్ చేయండి' : 'Record Your Voice',
    stopRecord: lang === 'te' ? 'ఆపండి' : 'Stop',
    deleteRecord: lang === 'te' ? 'తీసివేయండి' : 'Delete',
    whereLabel: lang === 'te' ? 'ఎక్కడ జరిగింది?' : 'Where did this happen?',
    districtLabel: lang === 'te' ? 'జిల్లా' : 'District',
    townLabel: lang === 'te' ? 'ఊరు / పట్టణం / మండలం' : 'Town / Village / Mandal',
    addressLabel: lang === 'te' ? 'చిరునామా (ఐచ్ఛికం)' : 'Street / Landmark (Optional)',
    whenLabel: lang === 'te' ? 'ఎప్పుడు జరిగింది?' : 'When did this happen?',
    whenPlaceholder: lang === 'te' ? 'తేదీ లేదా సుమారుగా (ఉదా: గత వారం, సెప్టెంబర్ 12)' : 'Date or approximate time (e.g. Last week, Sep 12)',
    categoryLabel: lang === 'te' ? 'ఏ రకమైన సమస్య?' : 'What type of problem?',
    evidenceLabel: lang === 'te' ? 'ఆధారాలు ఉన్నాయా?' : 'Do you have any evidence?',
    evidenceReassurance: lang === 'te' ? 'గమనిక: ఆధారాలు లేకపోయినా ఫిర్యాదు చేయవచ్చు.' : 'No evidence needed — you can still report.',
    uploadDoc: lang === 'te' ? 'ఫోటోలు, పత్రాలు జతచేయండి' : 'Upload Photos, Documents, Audio or Videos',
    aboutYouLabel: lang === 'te' ? 'మిమ్మల్ని ఎలా సంప్రదించాలి?' : 'How can we reach you?',
    nameLabel: lang === 'te' ? 'మీ పేరు' : 'Your Name',
    phoneLabel: lang === 'te' ? 'ఫోన్ / WhatsApp' : 'Phone / WhatsApp Number',
    emailLabel: lang === 'te' ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email Address (Optional)',
    anonymousToggle: lang === 'te' ? 'నేను అనామకంగా ఉండాలనుకుంటున్నాను' : 'I want to stay anonymous',
    anonymousNotice: lang === 'te' ? 'అదనపు వివరాల కోసం మిమ్మల్ని సంప్రదించవచ్చు. సంప్రదింపు వివరాలు ఇవ్వడం వల్ల కథ ప్రచురించబడుతుందని హామీ ఉండదు.' : 'We may reach out for more details. Sharing contact info does not guarantee publication.',
    consentHeader: lang === 'te' ? 'ధృవీకరణ' : 'Confirm & Submit',
    consent1: lang === 'te' ? 'నేను చెప్పినది నిజమని ధృవీకరిస్తున్నాను.' : 'I confirm this information is true to the best of my knowledge.',
    consent2: lang === 'te' ? 'కేస్‌డెస్క్ జర్నలిస్టులు నన్ను సంప్రదించవచ్చు.' : 'CaseDesk journalists may contact me about this.',
    consent3: lang === 'te' ? 'ప్రచురణ హామీ లేదని అర్థం చేసుకున్నాను.' : 'I understand this may not be published immediately.',
    consentPublishQ: lang === 'te' ? 'మీ కథను ప్రచురించవచ్చా?' : 'Can we publish your report?',
    publishYes: lang === 'te' ? 'అవును, ప్రచురించవచ్చు' : 'Yes, you can publish',
    publishDiscuss: lang === 'te' ? 'ముందు నాతో మాట్లాడండి' : 'Talk to me first',
    publishNo: lang === 'te' ? 'వద్దు, పరిశోధన మాత్రమే' : 'No — investigate only, don\'t publish',
    submitButton: lang === 'te' ? 'పంపండి →' : 'Send Report →',
    submittingBtn: lang === 'te' ? 'పంపుతోంది...' : 'Sending...',
    backBtn: lang === 'te' ? '← వెనుకకు' : '← Back',
    continueBtn: lang === 'te' ? 'తరువాత →' : 'Next →',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls Bar inside Form */}
      <div className="flex items-center justify-between pb-3 border-b border-border-light">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          {onBackToSelect && (
            <button
              onClick={onBackToSelect}
              className="text-slate-500 hover:text-navy mr-2 font-medium cursor-pointer"
            >
              ← {lang === 'te' ? 'మార్చుకోండి' : 'Change Mode'}
            </button>
          )}
          <span className="text-electric-blue font-extrabold">
            {step < 7 ? `Step ${step} of 6` : 'Done'}
          </span>
          {step < 7 && (
            <span className="hidden sm:inline text-slate-400">
              • {step === 1 && (lang === 'te' ? 'స్టార్ట్' : 'Start')}
              {step === 2 && (lang === 'te' ? 'ఏం జరిగింది' : 'What Happened')}
              {step === 3 && (lang === 'te' ? 'ఎక్కడ & ఎప్పుడు' : 'Where & When')}
              {step === 4 && (lang === 'te' ? 'ఆధారాలు' : 'Evidence')}
              {step === 5 && (lang === 'te' ? 'మీ వివరాలు' : 'Your Details')}
              {step === 6 && (lang === 'te' ? 'ధృవీకరణ' : 'Confirm')}
            </span>
          )}
        </div>

        {/* Switch to Chat & Language Toggle */}
        <div className="flex items-center gap-2">
          {onSwitchToChat && (
            <button
              onClick={onSwitchToChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-electric-blue/10 hover:bg-electric-blue/15 text-electric-blue text-xs font-bold transition cursor-pointer"
            >
              <Bot size={14} />
              <span className="hidden sm:inline">{lang === 'te' ? 'AI సహాయకుడితో మాట్లాడండి' : 'Talk to AI Instead'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-white border border-border-light rounded-xl text-xs font-semibold shadow-2xs">
            <Languages size={13} className="text-slate-400 ml-1" />
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                lang === 'en' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('te')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                lang === 'te' ? 'bg-navy text-white' : 'text-slate-600 hover:text-navy'
              }`}
            >
              తె
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar (Steps 1 to 6) */}
      {step < 7 && (
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-electric-blue h-full transition-all duration-300"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          />
        </div>
      )}

      {/* STEP 1: INTRODUCTION */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-light shadow-sm space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-blue/10 text-electric-blue text-xs font-bold">
            <Sparkles size={13} />
            <span>{endpoint.workspaceName || endpoint.title || 'Investigation Desk'}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-navy leading-tight">
              {t.introHeadline}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {t.introSub}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-off-white border border-border-light/70 space-y-2 text-xs text-slate-600">
            <div className="font-bold text-navy flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-600" />
              <span>{lang === 'te' ? 'మీకు తెలియజేద్దాము:' : 'Good to know:'}</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed text-slate-600">
              <li>{lang === 'te' ? 'ఆసుపత్రి, రోడ్లు, ఫించన్, లంచాలు — ఏదైనా చెప్పవచ్చు' : 'Hospitals, roads, pensions, bribes — report anything'}</li>
              <li>{lang === 'te' ? 'తెలుగు లేదా English లో టైప్ చేయవచ్చు లేదా మాట్లాడవచ్చు' : 'Type or speak in Telugu or English'}</li>
              <li>{lang === 'te' ? 'మీ పేరు దాగి ఉంచవచ్చు' : 'You can keep your name hidden'}</li>
            </ul>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-8 py-3.5 bg-navy hover:bg-navy/90 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{t.startCta}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WHAT HAPPENED */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.describeLabel}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'te' ? 'ఏం జరిగింది? ఎవరికి నష్టం? ఎవరు బాధ్యులు? వివరంగా రాయండి.' : 'What happened? Who was affected? Who is responsible? Write as much as you know.'}
            </p>
          </div>

          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={7}
            placeholder={t.describePlaceholder}
            className="w-full p-4 text-sm bg-off-white border border-border-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-electric-blue/40 focus:border-electric-blue leading-relaxed text-navy"
          />

          {/* Voice Recording Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-electric-blue" />
                <span className="text-xs font-bold text-navy">{t.recordVoice}</span>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                  <span>{formatSeconds(recordingSeconds)}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'te' ? 'రాయడం కష్టమైతే, మైక్ నొక్కి మాట్లాడి రికార్డ్ చేయండి.' : 'Hard to type? Tap the mic and just speak.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {!isRecording && !audioUrl && (
                <button
                  onClick={startRecording}
                  type="button"
                  className="px-4 py-2.5 bg-electric-blue hover:bg-electric-blue-dark text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Mic size={14} />
                  <span>{lang === 'te' ? 'వాయిస్ రికార్డింగ్ ప్రారంభించండి' : 'Record Voice Note'}</span>
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  type="button"
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95 animate-pulse"
                >
                  <Square size={14} />
                  <span>{t.stopRecord}</span>
                </button>
              )}

              {audioUrl && (
                <div className="flex items-center gap-3 w-full bg-white p-3 rounded-xl border border-blue-200">
                  <audio src={audioUrl} controls className="h-8 flex-1" />
                  <button
                    onClick={discardRecording}
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title={t.deleteRecord}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              type="button"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
            >
              {t.backBtn}
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
              className="px-6 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {t.continueBtn}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LOCATION & TIME */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.whereLabel}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'te' ? 'ఖచ్చితమైన చోటు చెప్పితే మా టీమ్ కి సులభంగా అర్థమవుతుంది.' : 'The more specific the location, the easier for our team to find it.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">{t.districtLabel} *</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Guntur, Kurnool, Visakhapatnam"
                className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">{t.townLabel} *</label>
              <input
                type="text"
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Tenali, Narasaraopet, Pedakakani"
                className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-navy mb-1.5">{t.addressLabel}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Ward No. 4, Near Primary School"
                className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border-light">
            <label className="block text-xs font-bold text-navy mb-1.5">{t.whenLabel}</label>
            <input
              type="text"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              placeholder={t.whenPlaceholder}
              className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
            />
          </div>

          <div className="pt-2 border-t border-border-light">
            <label className="block text-xs font-bold text-navy mb-2">{t.categoryLabel}</label>
            <div className="flex flex-wrap gap-2">
              {CIVIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-electric-blue text-white shadow-xs'
                      : 'bg-off-white text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {lang === 'te' ? cat.te : cat.en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              type="button"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
            >
              {t.backBtn}
            </button>
            <button
              onClick={() => setStep(4)}
              type="button"
              className="px-6 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {t.continueBtn}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: EVIDENCE UPLOADS */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.evidenceLabel}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'te' ? 'ఫోటోలు, పత్రాలు, రశీదులు ఉంటే జతచేయండి. లేకపోయినా సరే.' : 'Attach photos, documents, or receipts if you have them. No problem if you don\'t.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed font-medium">
              <strong>{t.evidenceReassurance}</strong>
              <p className="text-emerald-800/80 text-[11px] mt-0.5">
                {lang === 'te' ? 'మీరు కేవలం సమాచారం ఇస్తే చాలు. ఆధారాలు సేకరించే పని మాది.' : 'Just sharing info is enough. Collecting evidence is our job.'}
              </p>
            </div>
          </div>

          <label className="border-2 border-dashed border-border-light hover:border-electric-blue/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-off-white/40 group">
            <div className="w-12 h-12 rounded-full bg-electric-blue/10 text-electric-blue flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload size={20} />
            </div>
            <div className="text-xs font-bold text-navy">{t.uploadDoc}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Supports PDF, JPG, PNG, MP4, MP3, DOCX (Max 25MB each)
            </div>
            <input type="file" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-navy uppercase tracking-wider">
                Attached Files ({files.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-off-white rounded-xl border border-border-light flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-electric-blue shrink-0" />
                      <span className="font-semibold text-navy truncate">{f.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      type="button"
                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              type="button"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
            >
              {t.backBtn}
            </button>
            <button
              onClick={() => setStep(5)}
              type="button"
              className="px-6 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {t.continueBtn}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: ABOUT YOU */}
      {step === 5 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.aboutYouLabel}</h2>
            <p className="text-xs text-slate-500 mt-1">{t.anonymousNotice}</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label htmlFor="anon-toggle-form" className="text-xs font-bold text-amber-950 cursor-pointer">
                {t.anonymousToggle}
              </label>
              <div className="text-[11px] text-amber-900/80 leading-relaxed">
                {lang === 'te' ? 'మీ పేరు లేదా వివరాలు బహిరంగంగా ప్రస్తావించబడవు.' : 'Your name and details will never be shown publicly.'}
              </div>
            </div>
            <input
              id="anon-toggle-form"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 accent-navy rounded cursor-pointer shrink-0"
            />
          </div>

          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">{t.nameLabel}</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1.5">{t.phoneLabel}</label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="e.g. +91 98480 12345"
                  className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-navy mb-1.5">{t.emailLabel}</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full p-3 text-xs bg-off-white border border-border-light rounded-xl focus:outline-none focus:border-electric-blue text-navy font-medium"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(4)}
              type="button"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
            >
              {t.backBtn}
            </button>
            <button
              onClick={() => setStep(6)}
              type="button"
              className="px-6 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {t.continueBtn}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CONSENT & SUBMIT */}
      {step === 6 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.consentHeader}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'te' ? 'క్రిందివి చెక్ చేసి పంపండి.' : 'Check the boxes below and send.'}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-off-white border border-border-light cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={consentAccuracy}
                onChange={(e) => setConsentAccuracy(e.target.checked)}
                className="w-4 h-4 accent-navy rounded mt-0.5 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                {t.consent1}
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-off-white border border-border-light cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={consentContact}
                onChange={(e) => setConsentContact(e.target.checked)}
                className="w-4 h-4 accent-navy rounded mt-0.5 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                {t.consent2}
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-off-white border border-border-light cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={consentNoGuarantee}
                onChange={(e) => setConsentNoGuarantee(e.target.checked)}
                className="w-4 h-4 accent-navy rounded mt-0.5 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                {t.consent3}
              </span>
            </label>
          </div>

          {/* Public Reporting Consent Question */}
          <div className="pt-3 border-t border-border-light space-y-3">
            <label className="block text-xs font-bold text-navy">
              {t.consentPublishQ}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col justify-between ${
                  consentToPublish === 'YES'
                    ? 'border-electric-blue bg-electric-blue/5 text-electric-blue ring-1 ring-electric-blue'
                    : 'border-border-light bg-off-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="consentPublishForm"
                    checked={consentToPublish === 'YES'}
                    onChange={() => setConsentToPublish('YES')}
                    className="accent-electric-blue"
                  />
                  <span>{lang === 'te' ? 'అవును' : 'Yes'}</span>
                </div>
                <p className="text-[11px] font-normal text-slate-500 leading-snug">
                  {t.publishYes}
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col justify-between ${
                  consentToPublish === 'DISCUSS_FIRST'
                    ? 'border-electric-blue bg-electric-blue/5 text-electric-blue ring-1 ring-electric-blue'
                    : 'border-border-light bg-off-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="consentPublishForm"
                    checked={consentToPublish === 'DISCUSS_FIRST'}
                    onChange={() => setConsentToPublish('DISCUSS_FIRST')}
                    className="accent-electric-blue"
                  />
                  <span>{lang === 'te' ? 'నాతో మాట్లాడండి' : 'Discuss first'}</span>
                </div>
                <p className="text-[11px] font-normal text-slate-500 leading-snug">
                  {t.publishDiscuss}
                </p>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col justify-between ${
                  consentToPublish === 'NO'
                    ? 'border-electric-blue bg-electric-blue/5 text-electric-blue ring-1 ring-electric-blue'
                    : 'border-border-light bg-off-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="consentPublishForm"
                    checked={consentToPublish === 'NO'}
                    onChange={() => setConsentToPublish('NO')}
                    className="accent-electric-blue"
                  />
                  <span>{lang === 'te' ? 'కాదు' : 'No'}</span>
                </div>
                <p className="text-[11px] font-normal text-slate-500 leading-snug">
                  {t.publishNo}
                </p>
              </label>
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(5)}
              type="button"
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer disabled:opacity-50"
            >
              {t.backBtn}
            </button>
            <button
              onClick={handleSubmit}
              type="button"
              disabled={submitting || !consentAccuracy || !consentNoGuarantee}
              className="px-8 py-3 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.submittingBtn}</span>
                </>
              ) : (
                <span>{t.submitButton}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: RECEIPT */}
      {step === 7 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-light shadow-sm space-y-8 animate-slide-up">
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 size={32} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
              {lang === 'te' ? 'మీ ఫిర్యాదు అందింది!' : 'We Got Your Report!'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'te' ? 'ధన్యవాదాలు. మా టీమ్ దీనిని పరిశీలిస్తుంది.' : 'Thank you. Our team will review your report.'}
            </p>

            {referenceNumber && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {lang === 'te' ? 'రిఫరెన్స్ కోడ్' : 'Reference Code'}
                    </div>
                    <div className="font-mono text-base font-black text-navy tracking-tight">
                      {referenceNumber}
                    </div>
                  </div>
                  <button
                    onClick={copyReferenceCode}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                    title={lang === 'te' ? 'కాపీ చేయండి' : 'Copy Code'}
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
