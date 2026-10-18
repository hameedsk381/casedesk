'use client';

import React, { useEffect, useState } from 'react';
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
  X,
  Lock,
  MapPin,
  Search,
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
  initialWard?: string;
  initialMunicipality?: string;
}

type PublishChoice = 'YES' | 'DISCUSS_FIRST' | 'NO';
type FieldErrors = Partial<Record<'story' | 'district' | 'town' | 'contact' | 'email' | 'consent', string>>;

// Text the citizen has typed is kept for this browser tab only, so an accidental
// reload or a phone switching apps does not lose a long report. Contact details,
// files and recordings are never stored.
const DRAFT_KEY = 'complianbox-draft-v1';
type Draft = Partial<Record<'story' | 'district' | 'town' | 'ward' | 'municipality' | 'address' | 'incidentDate' | 'category', string>>;

function readDraft(): Draft {
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(DRAFT_KEY) : null;
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

export function CitizenSubmissionForm({ endpoint, lang, onBackToSelect, initialWard, initialMunicipality }: Props) {
  const te = lang === 'te';
  const t = (en: string, tel: string) => (te ? tel : en);

  const allowAnonymous = endpoint.allowAnonymous !== false;
  const allowVoice = endpoint.allowVoice !== false;
  const allowAttachments = endpoint.allowAttachments !== false;
  const mustShareContact = !allowAnonymous || Boolean(endpoint.requireContact);

  // The form only mounts after the citizen taps "report", never during server
  // rendering, so reading the saved draft in the initialisers is safe.
  const [draft] = useState<Draft>(readDraft);
  const [story, setStory] = useState(draft.story || '');
  const [district, setDistrict] = useState(draft.district || '');
  const [town, setTown] = useState(draft.town || '');
  const [ward, setWard] = useState(initialWard || draft.ward || '');
  const [municipality, setMunicipality] = useState(initialMunicipality || draft.municipality || '');
  const [address, setAddress] = useState(draft.address || '');
  const [incidentDate, setIncidentDate] = useState(draft.incidentDate || '');
  const [category, setCategory] = useState(draft.category || '');

  const [shareContact, setShareContact] = useState(mustShareContact);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentToPublish, setConsentToPublish] = useState<PublishChoice>('NO');

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    isRecording,
    recordingSeconds,
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

  // Save the typed text as a per-tab draft.
  useEffect(() => {
    if (referenceNumber) return;
    try {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ story, district, town, ward, municipality, address, incidentDate, category })
      );
    } catch {
      // storage unavailable (private mode) — the form still works
    }
  }, [story, district, town, ward, municipality, address, incidentDate, category, referenceNumber]);

  // --- Ward auto-detect (offered only when the server has ward boundaries) ---
  const [wardLookupAvailable, setWardLookupAvailable] = useState(false);
  const [locating, setLocating] = useState(false);
  const [wardNote, setWardNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/submit/ward')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.available && 'geolocation' in navigator) setWardLookupAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const detectWard = () => {
    setWardNote(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Coordinates go in the POST body (never the URL) and are not stored.
          const res = await fetch('/api/submit/ward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: position.coords.latitude, lng: position.coords.longitude }),
          });
          const data = res.ok ? await res.json() : null;
          if (data?.ward) {
            setWard(String(data.ward));
            setMunicipality(typeof data.municipality === 'string' ? data.municipality : '');
            const place = data.municipality ? `${data.municipality}, ` : '';
            setWardNote(
              t(
                `Detected ${place}ward ${data.ward}. Please change it if this is wrong.`,
                `${place}వార్డు ${data.ward} గుర్తించాము. తప్పయితే మార్చండి.`
              )
            );
          } else {
            setWardNote(t('We could not match this location to a ward. Please enter it yourself.', 'ఈ ప్రదేశానికి వార్డు కనుగొనలేకపోయాము. దయచేసి నమోదు చేయండి.'));
          }
        } catch {
          setWardNote(t('Could not detect the ward. Please enter it yourself.', 'వార్డు గుర్తించలేకపోయాము. దయచేసి నమోదు చేయండి.'));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setWardNote(
          err.code === err.PERMISSION_DENIED
            ? t('Location permission was not given. You can enter the ward number yourself.', 'లొకేషన్ అనుమతి ఇవ్వలేదు. వార్డు నంబర్ మీరే నమోదు చేయవచ్చు.')
            : t('Could not get your location. Please enter the ward number yourself.', 'లొకేషన్ దొరకలేదు. వార్డు నంబర్ మీరే నమోదు చేయండి.')
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  // --- Files ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const nextFiles = [...files, ...selected];
    const totalSize = nextFiles.reduce((total, file) => total + file.size, 0);
    if (nextFiles.length > 10 || selected.some((file) => file.size > 10 * 1024 * 1024) || totalSize > 30 * 1024 * 1024) {
      setFileError(
        t(
          'You can attach up to 10 files, 10 MB each, with a 30 MB total limit.',
          'గరిష్టంగా 10 ఫైళ్లు, ఒక్కో ఫైలు 10 MB మరియు మొత్తం 30 MB వరకు మాత్రమే జతచేయవచ్చు.'
        )
      );
    } else {
      setFileError(null);
      setFiles((prev) => [...prev, ...selected]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const removed = files[index];
    if (removed?.name.startsWith('voice-recording-')) hookDiscard();
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSeconds = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  // --- Validation and submit ---
  const hasStory = Boolean(story.trim() || audioUrl);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!hasStory) next.story = t('Please record your voice or write what happened.', 'దయచేసి వాయిస్ రికార్డ్ చేయండి లేదా ఏం జరిగిందో రాయండి.');
    if (!district.trim()) next.district = t('Enter the district.', 'జిల్లా నమోదు చేయండి.');
    if (!town.trim()) next.town = t('Enter the town or village.', 'ఊరు / పట్టణం నమోదు చేయండి.');
    if (shareContact) {
      const digits = senderPhone.replace(/\D/g, '');
      const hasPhone = digits.length >= 7;
      const hasEmail = senderEmail.trim().length > 0;
      if (senderPhone.trim() && !hasPhone) next.contact = t('That phone number looks too short.', 'ఫోన్ నంబర్ చాలా చిన్నదిగా ఉంది.');
      else if (mustShareContact && !hasPhone && !hasEmail) next.contact = t('Add a phone number or an email so we can reach you.', 'మేము సంప్రదించడానికి ఫోన్ నంబర్ లేదా ఈమెయిల్ ఇవ్వండి.');
      if (hasEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(senderEmail.trim())) next.email = t('That email address does not look right.', 'ఈమెయిల్ చిరునామా సరిగా లేదు.');
    }
    if (!consent) next.consent = t('Please tick the box to confirm.', 'ధృవీకరించడానికి బాక్స్ టిక్ చేయండి.');
    return next;
  };

  const FIELD_IDS: Record<keyof FieldErrors, string> = {
    story: 'f-story',
    district: 'f-district',
    town: 'f-town',
    contact: 'f-phone',
    email: 'f-email',
    consent: 'f-consent',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    const found = validate();
    setErrors(found);
    const firstKey = (Object.keys(FIELD_IDS) as Array<keyof FieldErrors>).find((key) => found[key]);
    if (firstKey) {
      const el = document.getElementById(FIELD_IDS[firstKey]);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement | null)?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('slug', endpoint.slug);
      formData.append('story', story);
      formData.append('district', district.trim());
      formData.append('town', town.trim());
      if (ward.trim()) formData.append('ward', ward.trim());
      if (ward.trim() && municipality.trim()) formData.append('municipality', municipality.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (incidentDate.trim()) formData.append('incidentDate', incidentDate.trim());
      if (category) formData.append('category', category);

      if (shareContact) {
        if (senderName.trim()) formData.append('senderName', senderName.trim());
        if (senderPhone.trim()) formData.append('senderPhone', senderPhone.trim());
        if (senderEmail.trim()) formData.append('senderEmail', senderEmail.trim());
      }
      formData.append('preferredLanguage', te ? 'Telugu' : 'English');
      formData.append('isAnonymous', String(!shareContact));
      // One tick confirms both statements the server requires.
      formData.append('consentAccuracy', 'true');
      formData.append('consentNoGuarantee', 'true');
      // Only someone who shared contact details can be contacted.
      formData.append('consentContact', String(shareContact));
      formData.append('consentToPublish', !shareContact && consentToPublish === 'DISCUSS_FIRST' ? 'NO' : consentToPublish);
      files.forEach((file) => formData.append('files', file));

      const res = await fetch(`/api/submit/${endpoint.slug}`, { method: 'POST', body: formData });
      let data: { referenceNumber?: string; error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        // non-JSON error body
      }
      if (!res.ok || !data) {
        throw new Error(data?.error || t('Something went wrong. Please try again.', 'ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.'));
      }
      try {
        window.sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      setReferenceNumber(data.referenceNumber || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : t('Something went wrong. Please try again.', 'ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి.'));
    } finally {
      setSubmitting(false);
    }
  };

  const copyReferenceCode = () => {
    if (!referenceNumber) return;
    navigator.clipboard.writeText(referenceNumber).then(
      () => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      },
      () => {}
    );
  };

  const inputClass = (hasError?: boolean) =>
    `w-full p-3.5 text-base bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground font-medium placeholder:text-muted-foreground transition-colors ${
      hasError ? 'border-destructive' : 'border-border'
    }`;

  const sectionClass = 'bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 space-y-4';
  const labelClass = 'block text-sm font-bold text-primary mb-1.5';
  const hintClass = 'text-xs text-muted-foreground';

  const fieldError = (key: keyof FieldErrors) =>
    errors[key] ? (
      <p id={`${FIELD_IDS[key]}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-destructive" role="alert">
        <AlertCircle size={13} className="shrink-0" /> {errors[key]}
      </p>
    ) : null;

  const sectionTitle = (n: number, title: string, optional = false) => (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">{n}</span>
      <h2 className="text-lg font-bold text-primary leading-tight">
        {title}
        {optional && <span className="ml-2 text-xs font-semibold text-muted-foreground">{t('optional', 'ఐచ్ఛికం')}</span>}
      </h2>
    </div>
  );

  // ───────────────────────── Success screen ─────────────────────────
  if (referenceNumber !== null) {
    return (
      <div className="bg-card rounded-2xl p-6 sm:p-10 border border-border shadow-sm space-y-6 animate-slide-up" aria-live="polite">
        <div className="text-center space-y-3 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-success-subtle text-success flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary">{t('Thank you — we have your report', 'ధన్యవాదాలు — మీ ఫిర్యాదు అందింది')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('Keep this code. You can use it to check progress at any time.', 'ఈ కోడ్‌ను భద్రపరచండి. పురోగతి చూడటానికి ఎప్పుడైనా వాడవచ్చు.')}
          </p>

          {referenceNumber && (
            <div className="pt-1">
              <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
                <div className="text-left">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t('Reference code', 'రిఫరెన్స్ కోడ్')}</div>
                  <div className="font-mono text-base font-black text-primary tracking-tight">{referenceNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={copyReferenceCode}
                  className="touch-target p-2 rounded-lg bg-background border border-border hover:bg-surface text-muted-foreground transition cursor-pointer"
                  aria-label={t('Copy the reference code', 'కోడ్ కాపీ చేయండి')}
                >
                  {copiedCode ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <ol className="max-w-md mx-auto space-y-3">
          {[
            [t('Our journalists review your report', 'మా జర్నలిస్టులు మీ ఫిర్యాదును పరిశీలిస్తారు'), t('We check the details and may ask for more.', 'వివరాలు పరిశీలించి, అవసరమైతే మరింత సమాచారం అడుగుతాము.')],
            [t('We ask the responsible department', 'సంబంధిత శాఖను అడుగుతాము'), t('When the issue is verified. We cannot promise an outcome.', 'విషయం ధృవీకరించిన తర్వాత. ఫలితానికి హామీ ఇవ్వలేము.')],
            [t('You can follow it', 'మీరు పురోగతి చూడవచ్చు'), t('Use the code on the home page under "Track a report".', 'హోమ్ పేజీలో "స్థితి చూడండి" లో ఈ కోడ్ వాడండి.')],
          ].map(([title, body], i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
              <div>
                <div className="text-sm font-bold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{body}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="text-center">
          <button type="button" onClick={onBackToSelect} className="touch-target text-sm font-bold text-primary hover:text-primary-hover cursor-pointer">
            {t('Back to home →', 'హోమ్ కు తిరిగి →')}
          </button>
        </div>
      </div>
    );
  }

  // ───────────────────────── The form ─────────────────────────
  const missing: string[] = [];
  if (!hasStory) missing.push(t('your story', 'మీ కథనం'));
  if (!district.trim() || !town.trim()) missing.push(t('the location', 'ప్రదేశం'));
  if (!consent) missing.push(t('the confirmation', 'ధృవీకరణ'));

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 animate-fade-in pb-2">
      <div className="px-1">
        <h1 className="text-2xl font-black text-primary leading-tight">{t('Report a problem', 'సమస్యను తెలియజేయండి')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('One page, about two minutes. Only the first two parts are required.', 'ఒకే పేజీ, సుమారు రెండు నిమిషాలు. మొదటి రెండు భాగాలు మాత్రమే తప్పనిసరి.')}
        </p>
      </div>

      {/* 1 ─ What happened */}
      <section className={sectionClass} aria-labelledby="s1">
        <div id="s1">{sectionTitle(1, t('What happened?', 'ఏం జరిగింది?'))}</div>

        {allowVoice && (
          <div className="rounded-xl bg-gradient-to-br from-primary/[0.06] to-secondary/10 border border-border p-4">
            {!isRecording && !audioUrl && (
              <button
                type="button"
                onClick={startRecording}
                className="touch-target w-full flex items-center gap-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25">
                  <Mic size={26} />
                </span>
                <span>
                  <span className="block text-base font-bold text-primary">{t('Tap to speak', 'మాట్లాడటానికి నొక్కండి')}</span>
                  <span className="block text-xs text-muted-foreground">{t('Easier than typing — in Telugu or English', 'టైప్ చేయడం కంటే సులభం — తెలుగు లేదా English లో')}</span>
                </span>
              </button>
            )}

            {isRecording && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={stopRecording}
                  className="touch-target flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive text-white shadow-lg animate-pulse cursor-pointer"
                  aria-label={t('Stop recording', 'రికార్డింగ్ ఆపండి')}
                >
                  <Square size={22} />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-base font-bold text-destructive">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                    <span className="font-mono">{formatSeconds(recordingSeconds)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{t('Recording… tap the square when you are done', 'రికార్డ్ అవుతోంది… పూర్తయ్యాక చతురస్రం నొక్కండి')}</div>
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-background p-2.5 border border-border">
                  <audio src={audioUrl} controls className="h-9 flex-1 min-w-0" />
                  <button
                    type="button"
                    onClick={discardRecording}
                    className="touch-target shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                    aria-label={t('Delete the recording and record again', 'రికార్డింగ్ తొలగించి మళ్లీ రికార్డ్ చేయండి')}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-success">
                  <CheckCircle2 size={13} /> {t('Recording saved. You can add more in writing below.', 'రికార్డింగ్ సేవ్ అయింది. కింద రాతపూర్వకంగా మరింత జోడించవచ్చు.')}
                </p>
              </div>
            )}
            {recorderError && <p className="mt-2 text-xs font-semibold text-destructive" role="alert">{recorderError}</p>}
          </div>
        )}

        <div>
          <label htmlFor="f-story" className={labelClass}>
            {allowVoice ? t('Or write it here', 'లేదా ఇక్కడ రాయండి') : t('Describe what happened', 'ఏం జరిగిందో వివరించండి')}
          </label>
          <textarea
            id="f-story"
            value={story}
            onChange={(e) => {
              setStory(e.target.value);
              if (errors.story) setErrors((prev) => ({ ...prev, story: undefined }));
            }}
            rows={5}
            maxLength={20000}
            aria-invalid={Boolean(errors.story)}
            aria-describedby={errors.story ? 'f-story-error' : undefined}
            placeholder={t('What is the problem, where, and since when? Any details help.', 'సమస్య ఏమిటి, ఎక్కడ, ఎప్పటి నుంచి? ఏ వివరమైనా సహాయపడుతుంది.')}
            className={`${inputClass(Boolean(errors.story))} leading-relaxed resize-y`}
          />
          {fieldError('story')}
        </div>

        <div>
          <div className={labelClass}>
            {t('Type of problem', 'సమస్య రకం')} <span className="text-xs font-semibold text-muted-foreground">{t('optional', 'ఐచ్ఛికం')}</span>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('Type of problem', 'సమస్య రకం')}>
            {CIVIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                aria-pressed={category === cat.id}
                onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                className={`touch-target px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  category === cat.id ? 'bg-primary text-white shadow-xs' : 'bg-surface text-muted-foreground hover:bg-surface-2 border border-border'
                }`}
              >
                {te ? cat.te : cat.en}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2 ─ Where */}
      <section className={sectionClass} aria-labelledby="s2">
        <div id="s2">{sectionTitle(2, t('Where is it?', 'ఇది ఎక్కడ ఉంది?'))}</div>

        {wardLookupAvailable && (
          <div className="rounded-xl bg-surface border border-border p-3.5 space-y-2">
            <button
              type="button"
              onClick={detectWard}
              disabled={locating}
              className="touch-target inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
            >
              <MapPin size={16} />
              {locating ? t('Detecting…', 'గుర్తిస్తున్నాము…') : t('Find my ward from my location', 'నా లొకేషన్ నుంచి వార్డు కనుగొనండి')}
            </button>
            <p className="text-[11px] leading-snug text-muted-foreground">
              {t('Your location is used only to find the ward. It is not stored.', 'మీ లొకేషన్ వార్డు కనుగొనడానికి మాత్రమే వాడతాము; నిల్వ చేయము.')}
            </p>
            {wardNote && <p className="text-xs font-semibold text-foreground" role="status">{wardNote}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="f-district" className={labelClass}>
              {t('District', 'జిల్లా')} <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="f-district"
              type="text"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                if (errors.district) setErrors((prev) => ({ ...prev, district: undefined }));
              }}
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.district)}
              aria-describedby={errors.district ? 'f-district-error' : undefined}
              placeholder="Guntur, Kurnool, Visakhapatnam"
              className={inputClass(Boolean(errors.district))}
            />
            {fieldError('district')}
          </div>
          <div>
            <label htmlFor="f-town" className={labelClass}>
              {t('Town / Village', 'ఊరు / పట్టణం')} <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="f-town"
              type="text"
              value={town}
              onChange={(e) => {
                setTown(e.target.value);
                if (errors.town) setErrors((prev) => ({ ...prev, town: undefined }));
              }}
              autoComplete="address-level3"
              aria-invalid={Boolean(errors.town)}
              aria-describedby={errors.town ? 'f-town-error' : undefined}
              placeholder="Tenali, Narasaraopet"
              className={inputClass(Boolean(errors.town))}
            />
            {fieldError('town')}
          </div>
          <div>
            <label htmlFor="f-ward" className={labelClass}>
              {t('Ward / Division no.', 'వార్డు / డివిజన్ నంబర్')} <span className="text-xs font-semibold text-muted-foreground">{t('optional', 'ఐచ్ఛికం')}</span>
            </label>
            <input
              id="f-ward"
              type="text"
              inputMode="numeric"
              value={ward}
              onChange={(e) => {
                setWard(e.target.value);
                setMunicipality('');
              }}
              maxLength={50}
              placeholder="12"
              className={inputClass()}
            />
          </div>
          <div>
            <label htmlFor="f-date" className={labelClass}>
              {t('When did it happen?', 'ఎప్పుడు జరిగింది?')} <span className="text-xs font-semibold text-muted-foreground">{t('optional', 'ఐచ్ఛికం')}</span>
            </label>
            <input
              id="f-date"
              type="text"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              maxLength={100}
              placeholder={t('A date, or "last week"', 'తేదీ లేదా "గత వారం"')}
              className={inputClass()}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="f-address" className={labelClass}>
              {t('Street or landmark', 'వీధి లేదా గుర్తు')} <span className="text-xs font-semibold text-muted-foreground">{t('optional', 'ఐచ్ఛికం')}</span>
            </label>
            <input
              id="f-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              placeholder={t('Near the primary school, main road', 'ప్రాథమిక పాఠశాల దగ్గర, ప్రధాన రహదారి')}
              className={inputClass()}
            />
          </div>
        </div>
      </section>

      {/* 3 ─ Photos and documents */}
      {allowAttachments && (
        <section className={sectionClass} aria-labelledby="s3">
          <div id="s3">{sectionTitle(3, t('Photos or documents', 'ఫోటోలు లేదా పత్రాలు'), true)}</div>
          <p className={hintClass}>{t('Not needed — gathering proof is our job. Add what you have.', 'అవసరం లేదు — ఆధారాలు సేకరించడం మా పని. మీ దగ్గర ఉన్నవి జతచేయండి.')}</p>
          <label className="border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-background/50 group focus-within:border-primary">
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Upload size={18} />
            </span>
            <span className="text-sm font-bold text-primary">{t('Choose photos, videos or documents', 'ఫోటోలు, వీడియోలు లేదా పత్రాలు ఎంచుకోండి')}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">PDF, JPG, PNG, WEBP, MP4, MP3, WAV, DOCX · {t('up to 10 MB each, 30 MB in total', 'ఒక్కోటి 10 MB, మొత్తం 30 MB వరకు')}</span>
            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.mp3,.wav,.webm,.ogg,.mp4,.m4a,.mov" onChange={handleFileChange} className="sr-only" />
          </label>
          {fileError && <p className="flex items-center gap-1.5 text-xs font-semibold text-destructive" role="alert"><AlertCircle size={13} className="shrink-0" /> {fileError}</p>}
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((f, idx) => (
                <li key={`${f.name}-${idx}`} className="p-2.5 bg-background rounded-xl border border-border flex items-center justify-between text-xs gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-primary shrink-0" />
                    <span className="font-semibold text-foreground truncate">{f.name.startsWith('voice-recording-') ? t('Voice recording', 'వాయిస్ రికార్డింగ్') : f.name}</span>
                  </span>
                  <button type="button" onClick={() => removeFile(idx)} className="touch-target flex items-center justify-center text-muted-foreground hover:text-destructive cursor-pointer" aria-label={t('Remove this file', 'ఈ ఫైల్ తొలగించండి')}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 4 ─ About you */}
      <section className={sectionClass} aria-labelledby="s4">
        <div id="s4">{sectionTitle(allowAttachments ? 4 : 3, t('About you', 'మీ గురించి'), true)}</div>

        {!mustShareContact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('How should we treat your identity?', 'మీ గుర్తింపును ఎలా పరిగణించాలి?')}>
            {[
              { value: false, icon: Lock, title: t('Stay anonymous', 'అనామకంగా ఉండండి'), body: t('We do not save your name, phone or email.', 'మీ పేరు, ఫోన్, ఈమెయిల్ సేవ్ చేయము.') },
              { value: true, icon: Shield, title: t('Share my contact', 'నా వివరాలు ఇస్తాను'), body: t('Lets us ask you questions. Never published.', 'మేము ప్రశ్నలు అడగవచ్చు. ఎప్పుడూ ప్రచురించము.') },
            ].map((opt) => {
              const Icon = opt.icon;
              const selected = shareContact === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setShareContact(opt.value);
                    if (!opt.value && consentToPublish === 'DISCUSS_FIRST') setConsentToPublish('NO');
                  }}
                  className={`touch-target text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                    selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:bg-surface'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-primary"><Icon size={15} /> {opt.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground leading-snug">{opt.body}</span>
                </button>
              );
            })}
          </div>
        )}

        {shareContact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="f-name" className={labelClass}>{t('Your name', 'మీ పేరు')}</label>
              <input id="f-name" type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} autoComplete="name" maxLength={200} placeholder="Ramesh Reddy" className={inputClass()} />
            </div>
            <div>
              <label htmlFor="f-phone" className={labelClass}>{t('Phone / WhatsApp', 'ఫోన్ / WhatsApp')}</label>
              <input
                id="f-phone"
                type="tel"
                value={senderPhone}
                onChange={(e) => {
                  setSenderPhone(e.target.value);
                  if (errors.contact) setErrors((prev) => ({ ...prev, contact: undefined }));
                }}
                autoComplete="tel"
                maxLength={50}
                aria-invalid={Boolean(errors.contact)}
                aria-describedby={errors.contact ? 'f-phone-error' : undefined}
                placeholder="+91 98480 12345"
                className={inputClass(Boolean(errors.contact))}
              />
              {fieldError('contact')}
            </div>
            <div>
              <label htmlFor="f-email" className={labelClass}>{t('Email', 'ఈమెయిల్')}</label>
              <input
                id="f-email"
                type="email"
                value={senderEmail}
                onChange={(e) => {
                  setSenderEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                autoComplete="email"
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'f-email-error' : undefined}
                placeholder="yourname@gmail.com"
                className={inputClass(Boolean(errors.email))}
              />
              {fieldError('email')}
            </div>
          </div>
        )}

        <div>
          <div className={labelClass}>{t('May we publish your report, after our review?', 'మా పరిశీలన తర్వాత మీ ఫిర్యాదును ప్రచురించవచ్చా?')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label={t('Publication choice', 'ప్రచురణ ఎంపిక')}>
            {([
              { val: 'YES', label: t('Yes', 'అవును'), desc: t('Without your name or contact', 'మీ పేరు, వివరాలు లేకుండా') },
              { val: 'DISCUSS_FIRST', label: t('Ask me first', 'ముందు అడగండి'), desc: shareContact ? t('We contact you before publishing', 'ప్రచురణకు ముందు మిమ్మల్ని సంప్రదిస్తాము') : t('Needs your contact details', 'మీ వివరాలు అవసరం') },
              { val: 'NO', label: t('No', 'కాదు'), desc: t('Only for our review', 'మా పరిశీలనకు మాత్రమే') },
            ] as const).map((opt) => {
              const disabled = opt.val === 'DISCUSS_FIRST' && !shareContact;
              const selected = consentToPublish === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => setConsentToPublish(opt.val)}
                  className={`touch-target text-left rounded-xl border p-3 transition-all ${
                    disabled ? 'opacity-50 cursor-not-allowed border-border bg-background' : 'cursor-pointer'
                  } ${selected && !disabled ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-background hover:bg-surface'}`}
                >
                  <span className="block text-sm font-bold text-primary">{opt.label}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground leading-snug">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Confirmation */}
      <section className={sectionClass} aria-label={t('Confirmation', 'ధృవీకరణ')}>
        <label className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${errors.consent ? 'border-destructive bg-destructive/5' : 'border-border bg-background hover:bg-surface'}`}>
          <input
            id="f-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }));
            }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? 'f-consent-error' : undefined}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary"
          />
          <span className="text-sm leading-relaxed text-foreground font-medium">
            {t(
              'I confirm this is true to the best of my knowledge, and I understand it may not be published or lead to action.',
              'ఇది నాకు తెలిసినంతవరకు నిజమని ధృవీకరిస్తున్నాను; ఇది ప్రచురించబడకపోవచ్చని లేదా చర్యకు దారితీయకపోవచ్చని అర్థం చేసుకున్నాను.'
            )}
          </span>
        </label>
        {fieldError('consent')}
        <p className="text-xs leading-snug text-muted-foreground">
          {t('See how we use your information in the ', 'మేము మీ సమాచారాన్ని ఎలా వాడతామో ')}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">
            {t('privacy notice', 'గోప్యతా ప్రకటన')}
          </a>
          {t('.', ' లో చూడండి.')}
        </p>
      </section>

      {submitError && (
        <div className="p-3.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Sticky send bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur safe-area-bottom">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="min-w-0 flex-1 text-xs text-muted-foreground leading-snug">
            {missing.length > 0 ? (
              <span>{t('Still needed: ', 'ఇంకా కావాలి: ')}<strong className="text-foreground">{missing.join(', ')}</strong></span>
            ) : (
              <span className="flex items-center gap-1.5 text-success font-semibold"><CheckCircle2 size={14} /> {t('Ready to send', 'పంపడానికి సిద్ధం')}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="touch-target shrink-0 rounded-xl bg-primary px-6 py-3 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-60 cursor-pointer inline-flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('Sending…', 'పంపుతోంది…')}
              </>
            ) : (
              t('Send report', 'పంపండి')
            )}
          </button>
        </div>
      </div>

      <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
        <Search size={13} className="mt-0.5 shrink-0" />
        <span>{t('After sending you get a reference code to track your report.', 'పంపిన తర్వాత మీ ఫిర్యాదును ట్రాక్ చేయడానికి రిఫరెన్స్ కోడ్ వస్తుంది.')}</span>
      </p>
    </form>
  );
}
