'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  FileText,
  Image as ImageIcon,
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
} from 'lucide-react';

interface EndpointData {
  slug: string;
  title: string;
  description: string | null;
  requireContact: boolean;
  allowAnonymous: boolean;
  allowVoice: boolean;
  allowAttachments: boolean;
  workspaceName?: string;
}

interface CitizenSubmissionPortalProps {
  endpoint?: EndpointData;
  creatorSlug?: string;
}

const CATEGORIES = [
  { id: 'Healthcare', en: 'Healthcare & Hospitals', te: 'వైద్యం & ఆసుపత్రులు' },
  { id: 'Government Services', en: 'Government Services & Welfare', te: 'ప్రభుత్వ సేవలు & సంక్షేమం' },
  { id: 'Education', en: 'Schools & Education', te: 'పాఠశాలలు & విద్య' },
  { id: 'Land / Property', en: 'Land Encroachment & Property', te: 'భూ ఆక్రమణలు & ఆస్తులు' },
  { id: 'Corruption & Bribery', en: 'Corruption & Bribery', te: 'అవినీతి & లంచాలు' },
  { id: 'Civic Infrastructure', en: 'Roads, Water & Infrastructure', te: 'రహదారులు, నీరు & మౌలిక వసతులు' },
  { id: 'Environment & Land', en: 'Environment & Pollution', te: 'పర్యావరణం & కాలుష్యం' },
  { id: 'Consumer', en: 'Consumer Rights & Fraud', te: 'వినియోగదారుల హక్కులు & మోసాలు' },
  { id: 'Other', en: 'Other Issue', te: 'ఇతర అంశం' },
];

export default function CitizenSubmissionPortal({
  endpoint,
  creatorSlug,
}: CitizenSubmissionPortalProps) {
  // Language toggle: 'en' | 'te'
  const [lang, setLang] = useState<'en' | 'te'>('en');

  // Step state: 1 (Intro) to 7 (Confirmation)
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync language with preferred language
  useEffect(() => {
    setPreferredLanguage(lang === 'te' ? 'Telugu' : 'English');
  }, [lang]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlobObj = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlobObj);
        const url = URL.createObjectURL(audioBlobObj);
        setAudioUrl(url);

        // Also add to files list
        const voiceFile = new File([audioBlobObj], `voice-recording-${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        setFiles((prev) => [...prev, voiceFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Microphone access is needed to record voice. Please allow microphone permission in your browser or type your story.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setRecordingSeconds(0);
    // Remove voice file from files
    setFiles((prev) => prev.filter((f) => !f.name.startsWith('voice-recording-')));
  };

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
      if (creatorSlug) formData.append('slug', creatorSlug);
      else if (endpoint?.slug) formData.append('slug', endpoint.slug);

      formData.append('story', story);
      if (district) formData.append('district', district);
      if (town) formData.append('town', town);
      if (address) formData.append('address', address);
      if (incidentDate) formData.append('incidentDate', incidentDate);
      if (category) formData.append('category', category);

      formData.append('senderName', senderName);
      formData.append('senderPhone', senderPhone);
      formData.append('senderEmail', senderEmail);
      formData.append('preferredLanguage', preferredLanguage);
      formData.append('isAnonymous', String(isAnonymous));

      formData.append('consentAccuracy', String(consentAccuracy));
      formData.append('consentContact', String(consentContact));
      formData.append('consentNoGuarantee', String(consentNoGuarantee));
      formData.append('consentToPublish', consentToPublish);

      // Append files
      files.forEach((file) => {
        formData.append('files', file);
      });

      const endpointUrl = creatorSlug ? `/api/submit/${creatorSlug}` : '/api/submit';
      const res = await fetch(endpointUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setReferenceNumber(data.referenceNumber);
      setStep(7); // Jump to confirmation screen
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'An error occurred while submitting your story. Please try again.');
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

  // Helper translations
  const t = {
    tellUsStory: lang === 'te' ? 'మీ కథ చెప్పండి' : 'Tell Us Your Story',
    introHeadline:
      lang === 'te' ? 'మీ ప్రాంతంలో ప్రజా సమస్య ఉందా?' : 'Have an issue that deserves attention?',
    introSub:
      lang === 'te'
        ? 'ఏం జరిగిందో మాకు చెప్పండి. మీ వద్ద ఉన్న సమాచారం లేదా ఆధారాలను అందించండి. మా పరిశోధనా బృందం మీ కథను పరిశీలిస్తుంది.'
        : 'Tell us what happened. Provide whatever information or evidence you have. Our team will review your submission.',
    startCta: lang === 'te' ? 'సమర్పణ ప్రారంభించండి →' : 'Start a Submission →',
    describeLabel: lang === 'te' ? 'సమస్యను వివరంగా చెప్పండి' : 'Describe your issue',
    describePlaceholder:
      lang === 'te'
        ? 'ఏం జరిగిందో మీ మాటల్లో చెప్పండి. మీరు తెలుగులో లేదా ఇంగ్లీషులో రాయవచ్చు...'
        : 'Tell us what happened in your own words. You can write in Telugu or English...',
    recordVoice: lang === 'te' ? 'వాయిస్ సందేశం రికార్డ్ చేయండి' : 'Record / Upload Voice',
    recordingActive: lang === 'te' ? 'వాయిస్ రికార్డ్ అవుతోంది...' : 'Recording your voice...',
    stopRecord: lang === 'te' ? 'రికార్డింగ్ ఆపండి' : 'Stop Recording',
    deleteRecord: lang === 'te' ? 'రద్దు చేయి' : 'Discard',
    whereLabel: lang === 'te' ? 'ఇది ఎక్కడ జరిగింది?' : 'Where did this happen?',
    districtLabel: lang === 'te' ? 'జిల్లా' : 'District',
    townLabel: lang === 'te' ? 'పట్టణం / గ్రామం / మండలం' : 'Town / Village / Mandal',
    addressLabel: lang === 'te' ? 'చిరునామా / ల్యాండ్‌మార్క్ (ఐచ్ఛికం)' : 'Street / Landmark (Optional)',
    whenLabel: lang === 'te' ? 'ఇది ఎప్పుడు జరిగింది?' : 'When did this happen?',
    whenPlaceholder: lang === 'te' ? 'తేదీ లేదా సుమారు సమయం (ఉదా. గత వారం, సెప్టెంబర్ 12)' : 'Date or approximate time (e.g. Last week, Sep 12)',
    categoryLabel: lang === 'te' ? 'సమస్య ఏ విభాగానికి చెందినది?' : 'What kind of issue is this?',
    evidenceLabel: lang === 'te' ? 'మీ నివేదికకు మద్దతు ఇచ్చే ఆధారాలు ఏమైనా ఉన్నాయా?' : 'Do you have anything that supports your report?',
    evidenceReassurance:
      lang === 'te'
        ? 'గమనిక: నివేదికను సమర్పించడానికి మీ వద్ద పత్రాలు లేదా ఆధారాలు తప్పనిసరిగా ఉండాల్సిన అవసరం లేదు.'
        : "You don't need to have evidence to submit a report. We review every legitimate story.",
    uploadDoc: lang === 'te' ? 'ఫోటోలు, పత్రాలు లేదా వీడియోలు అప్‌లోడ్ చేయండి' : 'Upload Photos, Documents, Audio or Videos',
    aboutYouLabel: lang === 'te' ? 'మేము మిమ్మల్ని ఎలా సంప్రదించాలి?' : 'How can we contact you?',
    nameLabel: lang === 'te' ? 'మీ పేరు' : 'Your Name',
    phoneLabel: lang === 'te' ? 'ఫోన్ నంబర్ / WhatsApp' : 'Phone / WhatsApp Number',
    emailLabel: lang === 'te' ? 'ఈమెయిల్ (ఐచ్ఛికం)' : 'Email Address (Optional)',
    prefLangLabel: lang === 'te' ? 'మాట్లాడే భాష' : 'Preferred Language',
    anonymousToggle: lang === 'te' ? 'నేను అనామకంగా ఉండాలనుకుంటున్నాను' : 'I prefer to remain anonymous',
    anonymousNotice:
      lang === 'te'
        ? 'మేము అదనపు వివరాల కోసం మిమ్మల్ని సంప్రదించవచ్చు. సంప్రదింపు వివరాలు ఇవ్వడం వల్ల కథ ప్రచురించబడుతుందని హామీ ఉండదు.'
        : 'We may contact you for additional information. Providing contact details does not guarantee publication or action.',
    consentHeader: lang === 'te' ? 'సమ్మతి & అనుమతులు' : 'Consent & Transparency',
    consent1:
      lang === 'te'
        ? 'నేను అందించిన సమాచారం నాకు తెలిసినంత వరకు నిజమని ధృవీకరిస్తున్నాను.'
        : 'I confirm that the information I have provided is accurate to the best of my knowledge.',
    consent2:
      lang === 'te'
        ? 'ఈ సమర్పణకు సంబంధించి కేస్‌డెస్క్ జర్నలిస్టులు నన్ను సంప్రదించడానికి అంగీకరిస్తున్నాను.'
        : 'I agree that the CaseDesk creator/team may contact me regarding this submission.',
    consent3:
      lang === 'te'
        ? 'ఈ నివేదికను సమర్పించడం వల్ల తప్పనిసరిగా కథ ప్రచురించబడుతుందని హామీ లేదని నేను అర్థం చేసుకున్నాను.'
        : 'I understand that submitting this report does not guarantee publication.',
    consentPublishQ:
      lang === 'te'
        ? 'మీ కథను బహిరంగ రిపోర్టింగ్‌గా ప్రచురించడానికి అంగీకరిస్తున్నారా?'
        : 'Do you consent to your story being considered for public reporting?',
    publishYes: lang === 'te' ? 'అవును — బహిరంగ ప్రచురణకు అంగీకరిస్తున్నాను' : 'Yes — I consent to public reporting',
    publishDiscuss: lang === 'te' ? 'ప్రచురించే ముందు నాతో మాట్లాడండి' : 'Discuss with me first before publishing',
    publishNo: lang === 'te' ? 'కాదు — కేవలం సమాచారం కొరకు మాత్రమే, ప్రచురించవద్దు' : 'No — Background investigation only; do not publish',
    submitButton: lang === 'te' ? 'కథను సమర్పించండి →' : 'Submit Story →',
    submittingBtn: lang === 'te' ? 'సమర్పిస్తున్నాము...' : 'Submitting report...',
    backBtn: lang === 'te' ? '← వెనుకకు' : '← Back',
    continueBtn: lang === 'te' ? 'కొనసాగించండి →' : 'Continue →',
  };

  return (
    <div className="space-y-6">
      {/* Step Header & Language Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-border-light">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="text-electric-blue font-extrabold">
            {step < 7 ? `Step ${step} of 6` : 'Complete'}
          </span>
          {step < 7 && (
            <span className="hidden sm:inline text-slate-400">
              • {step === 1 && (lang === 'te' ? 'పరిచయం' : 'Introduction')}
              {step === 2 && (lang === 'te' ? 'సమస్య వివరణ' : 'Your Story')}
              {step === 3 && (lang === 'te' ? 'స్థలం & సమయం' : 'Location & Time')}
              {step === 4 && (lang === 'te' ? 'ఆధారాలు' : 'Evidence')}
              {step === 5 && (lang === 'te' ? 'మీ వివరాలు' : 'Contact Info')}
              {step === 6 && (lang === 'te' ? 'సమ్మతి' : 'Consent')}
            </span>
          )}
        </div>

        {/* Multilingual Switcher */}
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
            <span>{endpoint?.workspaceName || 'Investigation Desk'}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-navy leading-tight">
              {t.introHeadline}
            </h1>
            <p className="text-sm sm:text-base text-slate leading-relaxed">
              {t.introSub}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-off-white border border-border-light/70 space-y-2 text-xs text-slate-600">
            <div className="font-bold text-navy flex items-center gap-1.5">
              <Shield size={14} className="text-emerald-600" />
              <span>{lang === 'te' ? 'పారదర్శక ప్రక్రియ' : 'What we look for:'}</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 leading-relaxed text-slate-600">
              <li>
                {lang === 'te'
                  ? 'ప్రజారోగ్యం, ప్రభుత్వ నిధుల దుర్వినియోగం, విద్యా లోపాలు, అక్రమ తవ్వకాలు లేదా అన్యాయాలు'
                  : 'Healthcare failures, welfare siphoning, public contract fraud, pollution, or administrative inaction'}
              </li>
              <li>
                {lang === 'te'
                  ? 'మీరు తెలుగులో లేదా ఇంగ్లీషులో టైప్ చేయవచ్చు లేదా మాట్లాడవచ్చు'
                  : 'You can write in Telugu or English, or simply speak via voice note'}
              </li>
              <li>
                {lang === 'te'
                  ? 'మీ గుర్తింపును పూర్తిగా గోప్యంగా ఉంచే అవకాశం ఉంది'
                  : 'Full confidentiality and anonymous submission option available'}
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-8 py-3.5 bg-navy hover:bg-navy/90 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>{t.startCta}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: WHAT HAPPENED (TEXT & VOICE) */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.describeLabel}</h2>
            <p className="text-xs text-slate mt-1">
              {lang === 'te'
                ? 'ఏం జరిగింది? ఎవరికి నష్టం వాటిల్లింది? ఎవరు బాధ్యులు? వివరంగా రాయండి.'
                : 'What occurred? Who was affected? Who is responsible? Speak or write naturally.'}
            </p>
          </div>

          {/* Large Text Area */}
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
              {lang === 'te'
                ? 'రాయడం కష్టంగా ఉంటే, మైక్రోఫోన్ ఆన్ చేసి మీ సమస్యను మాట్లాడి రికార్డ్ చేయండి.'
                : 'Prefer speaking? Record a voice message in Telugu or English directly from your phone or computer.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {!isRecording && !audioUrl && (
                <button
                  onClick={startRecording}
                  type="button"
                  className="px-4 py-2.5 bg-electric-blue hover:bg-electric-blue/90 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer active:scale-95"
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
                  alert(
                    lang === 'te'
                      ? 'దయచేసి మీ సమస్యను టైప్ చేయండి లేదా వాయిస్ రికార్డ్ చేయండి.'
                      : 'Please enter details in the text box or record a voice note to continue.'
                  );
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

      {/* STEP 3: BASIC INFORMATION (LOCATION & TIME) */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.whereLabel}</h2>
            <p className="text-xs text-slate mt-1">
              {lang === 'te'
                ? 'ఘటన జరిగిన ప్రాంతాన్ని గుర్తించడం మాకు పరిశోధనలో సహాయపడుతుంది.'
                : 'Help our ground reporters locate the issue accurately.'}
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
                placeholder="e.g. Ward No. 4, Near Rythu Bharosa Kendram"
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

          {/* Category Chips */}
          <div className="pt-2 border-t border-border-light">
            <label className="block text-xs font-bold text-navy mb-2">{t.categoryLabel}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
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
            <p className="text-xs text-slate mt-1">
              {lang === 'te'
                ? 'ఫోటోలు, సర్క్యులర్లు, ఆసుపత్రి స్లిప్పులు, రశీదులు, లేదా వీడియో క్లిప్పులు జోడించండి.'
                : 'Attach documents, receipts, hospital slips, photos, or video clips.'}
            </p>
          </div>

          {/* Prominent Empathetic Reassurance Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed font-medium">
              <strong>{t.evidenceReassurance}</strong>
              <p className="text-emerald-800/80 text-[11px] mt-0.5">
                {lang === 'te'
                  ? 'మీరు కేవలం సమాచారం అందించినా సరిపోతుంది. ఆధారాలు సేకరించే బాధ్యత మా రిపోర్టర్లు చూసుకుంటారు.'
                  : 'Our journalistic field team verifies claims through ground visits, official RTI applications, and interviews.'}
              </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-border-light hover:border-electric-blue/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-off-white/40 group">
            <div className="w-12 h-12 rounded-full bg-electric-blue/10 text-electric-blue flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload size={20} />
            </div>
            <div className="text-xs font-bold text-navy">{t.uploadDoc}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Supports PDF, JPG, PNG, MP4, MP3, DOCX (Max 25MB each)
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Files List Preview */}
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

      {/* STEP 5: ABOUT YOU & ANONYMITY */}
      {step === 5 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.aboutYouLabel}</h2>
            <p className="text-xs text-slate mt-1">{t.anonymousNotice}</p>
          </div>

          {/* Anonymous Toggle Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label htmlFor="anon-toggle" className="text-xs font-bold text-amber-950 cursor-pointer">
                {t.anonymousToggle}
              </label>
              <div className="text-[11px] text-amber-900/80 leading-relaxed">
                {lang === 'te'
                  ? 'మీ పేరు లేదా వివరాలు కథలో లేదా బహిరంగంగా ప్రస్తావించబడవు.'
                  : 'Your personal details will never be published or shared with third parties.'}
              </div>
            </div>
            <input
              id="anon-toggle"
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 accent-navy rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Contact Input Fields */}
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

      {/* STEP 6: CONSENT & PUBLICATION PERMISSIONS */}
      {step === 6 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-light shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">{t.consentHeader}</h2>
            <p className="text-xs text-slate mt-1">
              {lang === 'te'
                ? 'దయచేసి క్రింది నిబంధనలను పరిశీలించి అంగీకారం తెలపండి.'
                : 'Please review and confirm permissions before final submission.'}
            </p>
          </div>

          {/* Unbundled Checkboxes */}
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
                    name="consentPublish"
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
                    name="consentPublish"
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
                    name="consentPublish"
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

      {/* STEP 7: AFTER SUBMISSION / CONFIRMATION RECEIPT */}
      {step === 7 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-light shadow-sm space-y-8">
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 size={32} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
              {lang === 'te' ? 'మీ నివేదిక స్వీకరించబడింది' : 'Submission Received'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {lang === 'te'
                ? 'ధన్యవాదాలు. మీ నివేదిక విజయవంతంగా అందింది. మా పరిశోధనా బృందం దీనిని పరిశీలిస్తుంది.'
                : 'Thank you. Your report has been received and will be reviewed by the investigation team.'}
            </p>

            {/* Reference Badge Pill */}
            {referenceNumber && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Reference Code
                    </div>
                    <div className="font-mono text-base font-black text-navy tracking-tight">
                      {referenceNumber}
                    </div>
                  </div>
                  <button
                    onClick={copyReferenceCode}
                    type="button"
                    className="p-2 bg-white hover:bg-slate-50 text-navy rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    title="Copy Code"
                  >
                    {copiedCode ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Visual Milestone Progression: What happens next? */}
          <div className="p-6 rounded-2xl bg-off-white/80 border border-border-light/70 space-y-4 max-w-xl mx-auto">
            <div className="font-bold text-xs uppercase tracking-wider text-navy flex items-center gap-2">
              <Clock size={14} className="text-electric-blue" />
              <span>{lang === 'te' ? 'తదుపరి ఏమి జరుగుతుంది?' : 'What happens next?'}</span>
            </div>

            <div className="space-y-3.5 relative pl-4 border-l-2 border-emerald-500/30">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 -ml-[25px]">
                  ✓
                </span>
                <div>
                  <div className="text-xs font-bold text-navy">
                    {lang === 'te' ? 'సమర్పణ స్వీకరించబడింది' : 'Submission received'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'te' ? 'నివేదిక కేస్‌డెస్క్ ఇన్‌బాక్స్‌లో నమోదైంది.' : 'Report logged into CaseDesk Intake Inbox with audit trail.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border-2 border-electric-blue text-electric-blue flex items-center justify-center text-[10px] font-bold shrink-0 -ml-[25px]">
                  ○
                </span>
                <div>
                  <div className="text-xs font-bold text-navy">
                    {lang === 'te' ? 'జర్నలిస్టుల ప్రారంభ సమీక్ష' : 'Initial review'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'te' ? 'ప్రజా ప్రాముఖ్యత మరియు ఆధారాల ప్రాథమిక పరిశీలన.' : 'Journalists assess public impact, safety risks, and factual merit.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 -ml-[25px]">
                  ○
                </span>
                <div>
                  <div className="text-xs font-bold text-navy">
                    {lang === 'te' ? 'అదనపు వివరాల విచారణ (అవసరమైతే)' : 'Additional information, if required'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'te' ? 'మరింత సమాచారం లేదా ఫోటోల కోసం రిపోర్టర్ మిమ్మల్ని సంప్రదించవచ్చు.' : 'Team may reach out with specific checklist questions.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 -ml-[25px]">
                  ○
                </span>
                <div>
                  <div className="text-xs font-bold text-navy">
                    {lang === 'te' ? 'పరిశోధన (ఎంపికైనచో)' : 'Investigation, if selected'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'te' ? 'గ్రౌండ్ వెరిఫికేషన్, సమాచార హక్కు (RTI), మరియు సాక్ష్యాల సేకరణ.' : 'Field verification, RTI petitions, and right-of-reply notices to authorities.'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white border-2 border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 -ml-[25px]">
                  ○
                </span>
                <div>
                  <div className="text-xs font-bold text-navy">
                    {lang === 'te' ? 'సాధ్యమయ్యే బహిరంగ ప్రసారం' : 'Possible public reporting'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {lang === 'te' ? 'వీడియో నివేదిక, వార్తా కథనం లేదా సామాజిక మాధ్యమ కథనం.' : 'Documentary report, video broadcast, or investigative article.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setStep(1);
                setStory('');
                setFiles([]);
                setAudioBlob(null);
                setAudioUrl(null);
                setReferenceNumber(null);
              }}
              type="button"
              className="px-6 py-2.5 bg-off-white hover:bg-slate-200/70 text-navy font-semibold text-xs rounded-xl border border-border-light transition-colors cursor-pointer"
            >
              {lang === 'te' ? 'మరొక నివేదికను సమర్పించండి' : 'Submit Another Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
