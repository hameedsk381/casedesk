'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Video,
  FileText,
  Film,
  Play,
  Layers,
  Send,
  Loader2,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';

const FORMATS = [
  { id: 'INSTAGRAM_REEL', name: 'Instagram Reel', icon: Film, duration: '60s script' },
  { id: 'YOUTUBE_SHORT', name: 'YouTube Short', icon: Play, duration: '60s script' },
  { id: 'INSTAGRAM_CAROUSEL', name: 'Instagram Carousel', icon: Layers, duration: '5 slides' },
  { id: 'YOUTUBE_VIDEO', name: 'YouTube Explainer', icon: Video, duration: '4-6 min script' },
  { id: 'ARTICLE', name: 'Investigative Article', icon: FileText, duration: 'Longform' },
  { id: 'SOCIAL_POST', name: 'Social Post', icon: Share2, duration: 'Thread' },
];

export default function CaseContentStudioPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseRecord, setCaseRecord] = useState<any | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('INSTAGRAM_REEL');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [existingContents, setExistingContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Safety checks state
  const [safetyCheck, setSafetyCheck] = useState<any | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [approving, setApproving] = useState(false);

  const fetchCase = async () => {
    try {
      const [caseRes, safetyRes] = await Promise.all([
        fetch(`/api/cases/${caseId}`),
        fetch(`/api/content/safety-check?caseId=${caseId}`),
      ]);

      const caseData = await caseRes.json();
      const safetyData = await safetyRes.json();

      setCaseRecord(caseData);
      setExistingContents(caseData.contents || []);
      setSafetyCheck(safetyData);

      if (caseData.contents && caseData.contents.length > 0) {
        const latest = caseData.contents[0];
        setContentTitle(latest.title);
        setContentBody(latest.body);
        setSelectedFormat(latest.type);
      }
    } catch (err) {
      console.error('Failed to load content studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const handleGenerateDraft = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          format: selectedFormat,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setContentTitle(data.title);
      setContentBody(data.script);
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async (statusToSave: string = 'DRAFT') => {
    if (!contentTitle.trim() || !contentBody.trim()) {
      alert('Please provide both title and script before saving.');
      return;
    }

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          type: selectedFormat,
          title: contentTitle.trim(),
          body: contentBody.trim(),
          status: statusToSave,
        }),
      });

      if (!res.ok) throw new Error('Failed to save content');

      fetchCase();
      router.refresh();
      alert(`Content draft successfully saved as ${statusToSave}!`);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(`${contentTitle}\n\n${contentBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-electric-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Format Selection */}
      <div className="bg-white p-6 rounded-2xl border border-border-light shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-navy">Content Studio & Publisher</h2>
            <p className="text-xs text-slate mt-0.5">
              Turn verified case dossiers into responsible public-interest content formats.
            </p>
          </div>

          <button
            onClick={handleGenerateDraft}
            disabled={generating}
            className="py-2 px-4 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Compiling Facts...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-teal" />
                <span>Generate Script Draft</span>
              </>
            )}
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = selectedFormat === fmt.id;

            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-electric-blue bg-electric-blue/5 shadow-2xs'
                    : 'border-border-light hover:bg-off-white/60 text-slate-600'
                }`}
              >
                <Icon
                  size={18}
                  className={`mb-2 ${isSelected ? 'text-electric-blue' : 'text-slate-400'}`}
                />
                <div
                  className={`text-xs font-bold truncate ${
                    isSelected ? 'text-navy' : 'text-slate-700'
                  }`}
                >
                  {fmt.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{fmt.duration}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Script Editor Area */}
      <div className="bg-white p-6 rounded-2xl border border-border-light shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Script & Content Body
          </label>
          <button
            onClick={handleCopyScript}
            className="p-1.5 rounded-lg border border-border-light text-slate-600 hover:text-navy hover:bg-slate-100 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>

        <div>
          <input
            type="text"
            value={contentTitle}
            onChange={(e) => setContentTitle(e.target.value)}
            placeholder="Content Headline / Hook..."
            className="w-full px-4 py-2.5 bg-off-white/50 border border-border-light rounded-xl text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue"
          />
        </div>

        <div>
          <textarea
            rows={14}
            value={contentBody}
            onChange={(e) => setContentBody(e.target.value)}
            placeholder="Type or generate your investigative script here with hook, verified evidence callouts, and right of reply remarks..."
            className="w-full p-4 bg-off-white/40 border border-border-light rounded-2xl text-xs text-navy font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue"
          />
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border-light">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveDraft('DRAFT')}
              className="py-2 px-4 bg-off-white hover:bg-slate-100 text-navy font-semibold rounded-xl text-xs border border-border-light transition-colors cursor-pointer"
            >
              Save as Draft
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSafetyModal(true)}
              className="py-2.5 px-5 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert size={14} className="text-coral" />
              <span>Review Publication Safety & Approve</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Publication Safety Review Modal (Section 29) */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border-light p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy">Pre-Publication Editorial Review</h3>
                <p className="text-xs text-slate mt-0.5">
                  Automated checklist to prevent defamation, unverified allegations, and source harm.
                </p>
              </div>
            </div>

            {/* Warnings list */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {safetyCheck?.warnings?.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-teal/10 text-teal text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>All core checks passed! Claims are corroborated and right of reply is recorded.</span>
                </div>
              ) : (
                safetyCheck?.warnings?.map((warn: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5"
                  >
                    <AlertTriangle size={15} className="text-coral shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{warn}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-off-white/70 border border-border-light text-xs space-y-1 text-slate-500">
              <div className="font-bold text-navy">Creator Override Protocol</div>
              <p className="text-[11px] leading-relaxed">
                As the editorial lead, you may proceed if all allegations are carefully qualified as claims in the script.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-light">
              <button
                onClick={() => setShowSafetyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
              >
                Return to Script
              </button>
              <button
                onClick={async () => {
                  setShowSafetyModal(false);
                  await handleSaveDraft('APPROVED');
                }}
                className="px-4 py-2.5 bg-navy text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} className="text-teal" />
                <span>Confirm & Mark Approved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
