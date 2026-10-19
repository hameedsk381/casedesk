'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  Copy,
  Check,
  ShieldAlert,
  Send,
  XCircle,
} from 'lucide-react';

const FORMATS = [
  { id: 'INSTAGRAM_REEL', name: 'Instagram Reel', icon: Film, duration: '60s script' },
  { id: 'YOUTUBE_SHORT', name: 'YouTube Short', icon: Play, duration: '60s script' },
  { id: 'INSTAGRAM_CAROUSEL', name: 'Instagram Carousel', icon: Layers, duration: '5 slides' },
  { id: 'YOUTUBE_VIDEO', name: 'YouTube Explainer', icon: Video, duration: '4-6 min script' },
  { id: 'ARTICLE', name: 'Investigative Article', icon: FileText, duration: 'Longform' },
  { id: 'SOCIAL_POST', name: 'Social Post', icon: Share2, duration: 'Thread' },
];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUBLISHED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function CaseContentStudioPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [selectedFormat, setSelectedFormat] = useState('INSTAGRAM_REEL');
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [existingContents, setExistingContents] = useState<any[]>([]);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Safety checks state
  const [safetyCheck, setSafetyCheck] = useState<any | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const hasLoaded = useRef(false);

  const loadContentIntoEditor = (content: any | null) => {
    if (content) {
      setSelectedFormat(content.type);
      setCurrentContentId(content.id);
      setCurrentStatus(content.status || 'DRAFT');
      setContentTitle(content.title || '');
      setContentBody(content.body || '');
    }
  };

  const fetchCase = async () => {
    try {
      const [caseRes, safetyRes] = await Promise.all([
        fetch(`/api/cases/${caseId}`),
        fetch(`/api/content/safety-check?caseId=${caseId}`),
      ]);

      const caseData = await caseRes.json();
      const safetyData = await safetyRes.json();

      setSafetyCheck(safetyData);

      const contents: any[] = caseData.contents || [];
      setExistingContents(contents);

      if (!hasLoaded.current && contents.length > 0) {
        // First load: open the most recent content, whatever its format.
        loadContentIntoEditor(contents[0]);
      } else {
        const match = contents.find((c) => c.type === selectedFormat);
        if (match) {
          setCurrentContentId(match.id);
          setCurrentStatus(match.status || 'DRAFT');
        } else if (currentContentId && !contents.some((c) => c.id === currentContentId)) {
          // The open draft was removed server-side.
          setCurrentContentId(null);
          setCurrentStatus('DRAFT');
        }
      }
      hasLoaded.current = true;
    } catch (err) {
      console.error('Failed to load content studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleSelectFormat = (fmtId: string) => {
    setSelectedFormat(fmtId);
    const match = existingContents.find((c) => c.type === fmtId);
    if (match) {
      loadContentIntoEditor(match);
    } else {
      // Keep the current script text, but save it as a new draft of the new format.
      setCurrentContentId(null);
      setCurrentStatus('DRAFT');
    }
  };

  const handleGenerateDraft = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, format: selectedFormat }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setContentTitle(data.title);
      setContentBody(data.script);
    } catch (err: any) {
      alert(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Creates the content draft if it does not exist yet, otherwise updates it in
   * place. Returns the content id, or null when the fields are incomplete.
   */
  const persistContent = async (): Promise<string | null> => {
    if (!contentTitle.trim() || !contentBody.trim()) {
      alert('Please provide both a title and a script before saving.');
      return null;
    }

    const payload = {
      type: selectedFormat,
      title: contentTitle.trim(),
      body: contentBody.trim(),
    };

    if (currentContentId) {
      const res = await fetch(`/api/content/${currentContentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save content');
      }
      return currentContentId;
    }

    const res = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, ...payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create content');
    }
    const created = await res.json();
    setCurrentContentId(created.id);
    setCurrentStatus(created.status || 'DRAFT');
    return created.id;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const id = await persistContent();
      if (!id) return;
      await fetchCase();
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (status: 'APPROVED' | 'PUBLISHED') => {
    setSaving(true);
    try {
      const id = await persistContent();
      if (!id) return;
      const res = await fetch(`/api/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to mark content ${status.toLowerCase()}`);
      }
      setCurrentStatus(status);
      setShowSafetyModal(false);
      await fetchCase();
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(`${contentTitle}\n\n${contentBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const blockers: string[] = safetyCheck?.blockers || [];
  const warnings: string[] = safetyCheck?.warnings || [];
  const isSafe = blockers.length === 0;
  const canCreate = safetyCheck?.can?.createContent ?? true;
  const canApprove = safetyCheck?.can?.approveContent ?? true;
  const canPublish = safetyCheck?.can?.publishContent ?? true;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-3 p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Format Selection */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-primary">Content Studio & Publisher</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Turn verified case dossiers into responsible public-interest content formats.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                STATUS_STYLES[currentStatus] || STATUS_STYLES.DRAFT
              }`}
            >
              {currentStatus.replace(/_/g, ' ')}
            </span>
            <button
              onClick={handleGenerateDraft}
              disabled={generating || !canCreate}
              title={canCreate ? undefined : 'Your role cannot create content'}
              className="py-2 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Compiling Facts...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-success" />
                  <span>Generate Script Draft</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Format Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = selectedFormat === fmt.id;

            return (
              <button
                key={fmt.id}
                onClick={() => handleSelectFormat(fmt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-2xs'
                    : 'border-surface-3 hover:bg-background/60 text-slate-600'
                }`}
              >
                <Icon
                  size={18}
                  className={`mb-2 ${isSelected ? 'text-primary' : 'text-slate-500'}`}
                />
                <div
                  className={`text-xs font-bold truncate ${
                    isSelected ? 'text-primary' : 'text-slate-700'
                  }`}
                >
                  {fmt.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{fmt.duration}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Script Editor Area */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Script & Content Body
          </label>
          <button
            onClick={handleCopyScript}
            className="p-1.5 rounded-lg border border-surface-3 text-slate-600 hover:text-primary hover:bg-slate-100 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
        </div>

        <div>
          <input
            type="text"
            value={contentTitle}
            onChange={(e) => setContentTitle(e.target.value)}
            placeholder="Content Headline / Hook..."
            className="w-full px-4 py-2.5 bg-background/50 border border-surface-3 rounded-xl text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <textarea
            rows={14}
            value={contentBody}
            onChange={(e) => setContentBody(e.target.value)}
            placeholder="Type or generate your investigative script here with hook, verified evidence callouts, and right of reply remarks..."
            className="w-full p-4 bg-background/40 border border-surface-3 rounded-2xl text-xs text-primary font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving || !canCreate}
              title={canCreate ? undefined : 'Your role cannot create content'}
              className="py-2 px-4 bg-background hover:bg-slate-100 text-primary font-semibold rounded-xl text-xs border border-surface-3 transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {currentStatus === 'APPROVED' && canPublish && (
              <button
                onClick={() => handleTransition('PUBLISHED')}
                disabled={saving}
                className="py-2 px-4 bg-success hover:bg-success/90 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={13} />
                <span>Publish</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSafetyModal(true)}
              className="py-2.5 px-5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert size={14} className="text-warning" />
              <span>Review Publication Safety & Approve</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Publication Safety Review Modal (Section 29) */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-surface-3 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">Pre-Publication Editorial Review</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated checklist to prevent defamation, unverified allegations, and source harm.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {isSafe && warnings.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-success/10 text-success text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>All core checks passed! Claims are corroborated and right of reply is recorded.</span>
                </div>
              ) : (
                <>
                  {blockers.map((block, i) => (
                    <div
                      key={`blocker-${i}`}
                      className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5"
                    >
                      <XCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                          Blocking
                        </span>
                        {block}
                      </div>
                    </div>
                  ))}

                  {warnings.map((warn: string, i) => (
                    <div
                      key={`warn-${i}`}
                      className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5"
                    >
                      <AlertTriangle size={15} className="text-warning shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{warn}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-background/70 border border-surface-3 text-xs space-y-1 text-slate-500">
              <div className="font-bold text-primary">
                {!canApprove ? 'Approval Permission Required' : isSafe ? 'Approval Readiness' : 'Approval Blocked'}
              </div>
              <p className="text-[11px] leading-relaxed">
                {!canApprove
                  ? 'Your role can draft content but not approve it. Ask an editor or workspace admin to review and approve.'
                  : isSafe
                  ? 'Address the advisory notes where possible, then approve the content for publication.'
                  : 'Clear every blocking item above, then re-run this review. You can still save the draft in the meantime.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-3">
              <button
                onClick={() => setShowSafetyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
              >
                Return to Script
              </button>
              <button
                onClick={() => handleTransition('APPROVED')}
                disabled={!isSafe || saving || !canApprove}
                title={
                  !canApprove
                    ? 'Your role cannot approve content'
                    : isSafe
                    ? undefined
                    : 'Resolve blocking items before approving'
                }
                className="px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCircle2 size={14} className="text-success" />
                <span>Confirm & Mark Approved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
