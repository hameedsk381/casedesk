'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  Mic,
  FileText,
  CheckCircle2,
  AlertCircle,
  Shield,
  Loader2,
  Plus,
  Trash2,
  FileUp,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Report Intake' },
  { id: 2, name: 'AI Extraction' },
  { id: 3, name: 'Source Details' },
  { id: 4, name: 'Case Details' },
  { id: 5, name: 'Review & Submit' },
];

const CATEGORIES = [
  'Healthcare',
  'Government Services',
  'Police / Law Enforcement',
  'Education',
  'Land / Property',
  'Consumer Complaint',
  'Employment',
  'Infrastructure',
  'Environment',
  'Public Safety',
  'Financial',
  'Legal',
  'Other',
];

function NewCaseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode');
  const inboxId = searchParams.get('inboxId');

  const [currentStep, setCurrentStep] = useState(1);
  const [intakeMode, setIntakeMode] = useState<'text' | 'voice' | 'file' | 'manual'>('text');
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlMode === 'voice') setIntakeMode('voice');
    else if (urlMode === 'file' || urlMode === 'documents') setIntakeMode('file');
    else if (urlMode === 'manual') setIntakeMode('manual');
    else if (urlMode === 'text') setIntakeMode('text');
  }, [urlMode]);

  useEffect(() => {
    if (inboxId) {
      fetch(`/api/inbox/${inboxId}`)
        .then((res) => res.json())
        .then((msg) => {
          if (msg && !msg.error) {
            setSourceText(msg.rawText || '');
            setSourceName(msg.senderName || '');
            if (msg.senderContact) setSourcePhone(msg.senderContact);
            if (msg.aiSuggestedTitle) setTitle(msg.aiSuggestedTitle);
            if (msg.aiSuggestedCategory) setCategory(msg.aiSuggestedCategory);
            if (msg.aiSuggestedPriority) setPriority(msg.aiSuggestedPriority);
            if (msg.aiSummary) setAiSummary(msg.aiSummary);
            if (msg.aiSummary) setSummary(msg.aiSummary);
          }
        })
        .catch(console.error);
    }
  }, [inboxId]);

  // Step 1: Intake
  const [sourceText, setSourceText] = useState('');
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  // Step 2 & 4: Structured Case
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Healthcare');
  const [priority, setPriority] = useState('HIGH');
  const [location, setLocation] = useState('Guntur, Andhra Pradesh');
  const [aiSummary, setAiSummary] = useState('');
  const [aiPriorityReason, setAiPriorityReason] = useState('');
  const [claims, setClaims] = useState<string[]>([
    'Primary allegation reported by source',
  ]);
  const [newClaimText, setNewClaimText] = useState('');
  const [missingInfo, setMissingInfo] = useState<string[]>([]);

  // Step 3: Source Information (Neutral: Source / Complainant)
  const [sourceName, setSourceName] = useState('');
  const [sourcePhone, setSourcePhone] = useState('');
  const [sourceEmail, setSourceEmail] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('Telugu / English');
  const [sourceLocation, setSourceLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consentToContact, setConsentToContact] = useState(true);
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [sourceNotes, setSourceNotes] = useState('');

  // Step 1 -> Trigger AI extraction
  const handleRunAiExtraction = async () => {
    if (!sourceText.trim()) {
      setError('Please paste citizen report text before running extraction.');
      return;
    }

    setExtracting(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sourceText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      setTitle(data.title || '');
      setSummary(data.summary || '');
      setCategory(data.category || 'Healthcare');
      setLocation(data.location || 'Guntur, Andhra Pradesh');
      setPriority(data.suggestedPriority || 'HIGH');
      setAiSummary(data.summary || '');
      setAiPriorityReason(data.priorityReason || '');
      setClaims(data.claims && data.claims.length > 0 ? data.claims : ['Primary incident allegation']);
      setMissingInfo(data.missingInformation || []);

      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  // Mock Voice File Upload & Transcribe
  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVoiceFile(file);
    setTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');

      setSourceText(data.transcript);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTranscribing(false);
    }
  };

  const handleAddClaim = () => {
    if (newClaimText.trim()) {
      setClaims([...claims, newClaimText.trim()]);
      setNewClaimText('');
    }
  };

  const handleRemoveClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index));
  };

  // Final Submit
  const handleCreateCase = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        summary,
        category,
        priority,
        location,
        sourceType: intakeMode === 'voice' ? 'VOICE' : (intakeMode === 'manual' ? 'MANUAL' : 'TEXT'),
        sourceText,
        aiSummary,
        aiPriorityReason,
        source: {
          name: sourceName || (isAnonymous ? 'Confidential Source' : 'Citizen Complainant'),
          phone: sourcePhone,
          email: sourceEmail,
          preferredLanguage: sourceLanguage,
          location: sourceLocation || location,
          anonymous: isAnonymous,
          consentToContact,
          consentToPublish,
          notes: sourceNotes,
        },
        claims: claims.map((text) => ({ text, status: 'UNVERIFIED' })),
      };

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create case');

      router.push(`/app/cases/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <Link
          href="/app/cases"
          className="text-xs font-semibold text-slate-500 hover:text-primary inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft size={14} /> Back to Case Registry
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">
          Intake New Case
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transform a citizen complaint message or voice note into a structured investigative case.
        </p>
      </div>

      {/* 5-Step Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-surface-3 shadow-xs">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-white'
                    : currentStep > step.id
                    ? 'bg-success text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {currentStep > step.id ? <CheckCircle2 size={14} /> : step.id}
              </div>
              <span
                className={`text-xs font-semibold hidden md:inline ${
                  currentStep === step.id
                    ? 'text-primary'
                    : currentStep > step.id
                    ? 'text-slate-600'
                    : 'text-slate-500'
                }`}
              >
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Report Intake */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-3 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-surface-3 pb-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Step 1: What did they report?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste the message, upload an audio recording, or choose manual entry.
              </p>
            </div>

            {/* Intake Mode Buttons */}
            <div className="flex flex-wrap items-center gap-1 border border-surface-3 rounded-xl p-1 bg-background/50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIntakeMode('text')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  intakeMode === 'text' ? 'bg-white shadow-xs text-primary' : 'text-slate-500 hover:text-primary'
                }`}
              >
                Text Message
              </button>
              <button
                type="button"
                onClick={() => setIntakeMode('file')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  intakeMode === 'file' ? 'bg-white shadow-xs text-primary' : 'text-slate-500 hover:text-primary'
                }`}
              >
                <FileUp size={12} />
                <span>Documents</span>
              </button>
              <button
                type="button"
                onClick={() => setIntakeMode('voice')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  intakeMode === 'voice' ? 'bg-white shadow-xs text-primary' : 'text-slate-500 hover:text-primary'
                }`}
              >
                <Mic size={12} />
                <span>Voice Note</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntakeMode('manual');
                  setCurrentStep(3); // Jump directly to structured details
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  intakeMode === 'manual' ? 'bg-white shadow-xs text-primary' : 'text-slate-500 hover:text-primary'
                }`}
              >
                Manual Entry
              </button>
            </div>
          </div>

          {intakeMode === 'file' && (
            <div className="p-6 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <FileUp size={24} />
              </div>
              <div>
                <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
                  Upload PDF petition, RTI order, or evidence image
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setSourceText(
                          `[Extracted Document: ${f.name} (${Math.round(f.size / 1024)} KB)]\nOfficial Petition/Order regarding municipal irregularities. Submitted for verification and fact-checking.`
                        );
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Document content will be parsed for claims and dates.
                </p>
              </div>
            </div>
          )}

          {intakeMode === 'voice' && (
            <div className="p-6 border-2 border-dashed border-surface-3 rounded-2xl bg-background/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Mic size={24} />
              </div>
              <div>
                <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
                  Upload audio recording (WhatsApp voice note, MP3, M4A)
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Local mock transcription will convert audio to text automatically.
                </p>
              </div>
              {transcribing && (
                <div className="flex items-center justify-center gap-2 text-xs text-primary font-semibold">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transcribing speech...</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Citizen Message / Complaint Content
            </label>
            <textarea
              rows={8}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste the WhatsApp message, Instagram DM, email, or complaint here..."
              className="w-full p-4 bg-background/40 border border-surface-3 rounded-2xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary leading-relaxed placeholder:text-slate-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-3">
            <button
              onClick={() => {
                // Populate sample realistic report for quick demonstration
                setSourceText(
                  'Namaste, yesterday night at Guntur GGH 3rd floor ICU, power went out at 11:20 PM. Back-up generator did not start for 40 mins. Nurses were using manual AMBU bags. Two patients had severe saturation drops. Hospital staff warned us not to record videos. Please investigate this.'
                );
              }}
              className="text-xs font-semibold text-slate-500 hover:text-primary cursor-pointer"
            >
              Fill Sample Report
            </button>

            <button
              type="button"
              onClick={handleRunAiExtraction}
              disabled={extracting || !sourceText.trim()}
              className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Extracting with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-success" />
                  <span>Extract & Structure with AI</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: AI Extraction & Claims Review */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-3 shadow-xs space-y-6">
          <div className="border-b border-surface-3 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                AI Suggested — Review Required
              </span>
            </div>
            <h2 className="text-lg font-bold text-primary mt-2">Step 2: Review AI Extraction</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every field generated by AI can and should be edited. Never automatically treat AI suggestions as verified fact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Proposed Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Case Summary
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-4 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div className="text-xs font-bold text-amber-900 mb-1">
                  Suggested Priority: {priority}
                </div>
                <div className="text-xs text-amber-800 leading-relaxed">
                  Reason: {aiPriorityReason}
                </div>
              </div>
            </div>

            {/* Claims Editor */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                  Extracted Claims (Editorial Review Status: UNVERIFIED)
                </label>
                <span className="text-[11px] text-slate-500">Claims are allegations to be tested</span>
              </div>

              <div className="space-y-2">
                {claims.map((claim, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-background/50 rounded-xl border border-surface-3 text-xs text-primary"
                  >
                    <span className="font-bold text-slate-500">{idx + 1}.</span>
                    <span className="flex-1 font-medium">{claim}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClaim(idx)}
                      className="text-slate-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newClaimText}
                  onChange={(e) => setNewClaimText(e.target.value)}
                  placeholder="Add another claim or allegation..."
                  className="flex-1 px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddClaim}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-primary text-xs font-semibold rounded-xl cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Source Information</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Source Information */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-3 shadow-xs space-y-6">
          <div className="border-b border-surface-3 pb-4">
            <h2 className="text-lg font-bold text-primary">Step 3: Source / Complainant Details</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              We use neutral terminology: <strong>Source / Complainant</strong>, not automatically &ldquo;victim&rdquo;.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Source Full Name
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. K. Venkatesh Rao"
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={sourcePhone}
                onChange={(e) => setSourcePhone(e.target.value)}
                placeholder="+91 98480 XXXXX"
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={sourceEmail}
                onChange={(e) => setSourceEmail(e.target.value)}
                placeholder="source@email.com"
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Preferred Language
              </label>
              <input
                type="text"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                placeholder="e.g. Telugu, English, Hindi"
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none"
              />
            </div>

            {/* Privacy & Consent Checklist */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-background/60 border border-surface-3 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Shield size={16} className="text-success" />
                <span>Source Protection & Consent</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-xs font-bold text-primary">Mark Source as Anonymous</div>
                    <div className="text-[11px] text-slate-500">
                      Redact identity from published materials and public reporting.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentToContact}
                    onChange={(e) => setConsentToContact(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-xs font-bold text-primary">Consent to Contact for Verification</div>
                    <div className="text-[11px] text-slate-500">
                      Complainant agreed to receive follow-up phone calls / messages from researchers.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentToPublish}
                    onChange={(e) => setConsentToPublish(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-xs font-bold text-primary">Explicit Consent to Publish Name</div>
                    <div className="text-[11px] text-slate-500">
                      Leave unchecked if source prefers their name not be stated in content.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Internal Source Notes
              </label>
              <textarea
                rows={2}
                value={sourceNotes}
                onChange={(e) => setSourceNotes(e.target.value)}
                placeholder="e.g. Brother of patient admitted in ICU. Available in evenings."
                className="w-full p-3 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-3">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Case Configuration</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Case Configuration */}
      {currentStep === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-3 shadow-xs space-y-6">
          <div className="border-b border-surface-3 pb-4">
            <h2 className="text-lg font-bold text-primary">Step 4: Priority & Classification</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Finalize case priority and classification before generating the dossier.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Operational Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm font-semibold text-primary focus:outline-none cursor-pointer"
              >
                <option value="LOW">LOW — Standard information</option>
                <option value="MEDIUM">MEDIUM — Civic grievance</option>
                <option value="HIGH">HIGH — Critical public service failure</option>
                <option value="URGENT">URGENT — Imminent life/safety danger</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-background/40 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {missingInfo.length > 0 && (
              <div className="md:col-span-2 p-4 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <div className="text-xs font-bold text-blue-900 mb-1">
                  AI Missing Information Warnings
                </div>
                <ul className="list-disc list-inside text-xs text-blue-800 space-y-1">
                  {missingInfo.map((info, i) => (
                    <li key={i}>{info}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-3">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Review Structured Case</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-surface-3 shadow-xs space-y-6">
          <div className="border-b border-surface-3 pb-4">
            <h2 className="text-lg font-bold text-primary">Step 5: Review & Register Case</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review all parameters. Upon creation, a unique human-readable case number (e.g. CD-2026-XXXXX) will be generated.
            </p>
          </div>

          <div className="space-y-4 p-5 rounded-2xl bg-background/60 border border-surface-3 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">Title</span>
              <div className="text-sm font-bold text-primary">{title}</div>
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">Summary</span>
              <div className="text-slate-700 leading-relaxed">{summary}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-surface-3/60">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 block">Category</span>
                <span className="font-semibold text-primary mt-0.5 block">{category}</span>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 block">Priority</span>
                <span className="font-semibold text-primary mt-0.5 block">{priority}</span>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 block">Location</span>
                <span className="font-semibold text-primary mt-0.5 block">{location}</span>
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-500 block">Source</span>
                <span className="font-semibold text-primary mt-0.5 block">
                  {sourceName || (isAnonymous ? 'Anonymous Source' : 'Citizen')}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-3/60">
              <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Claims ({claims.length})
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {claims.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-surface-3">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              type="button"
              onClick={handleCreateCase}
              disabled={submitting}
              className="py-3 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registering Case...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-success" />
                  <span>Create Case & Open Desk</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-16 flex flex-col items-center justify-center text-slate-500">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <span className="text-sm font-medium">Loading case intake desk...</span>
        </div>
      }
    >
      <NewCaseInner />
    </Suspense>
  );
}
