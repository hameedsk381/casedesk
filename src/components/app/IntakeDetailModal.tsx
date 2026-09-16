'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  FileCheck2,
  GitMerge,
  HelpCircle,
  Archive,
  Play,
  Pause,
  Volume2,
  Paperclip,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Edit3,
  Save,
  Loader2,
  Clock,
  MessageSquare,
  Mic,
  Tag,
  Plus,
  Trash2,
  Download,
} from 'lucide-react';
import PriorityBadge from '@/components/app/PriorityBadge';
import RequestInfoModal from './RequestInfoModal';
import ArchiveReasonModal from './ArchiveReasonModal';
import ReactMarkdown from 'react-markdown';

interface IntakeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  intakeItem: any;
  onUpdated: () => void;
  existingCases?: Array<{ id: string; caseNumber: string; title: string }>;
}

export default function IntakeDetailModal({
  isOpen,
  onClose,
  intakeItem,
  onUpdated,
  existingCases = [],
}: IntakeDetailModalProps) {
  const router = useRouter();

  // Modals for Actions
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedMergeCaseId, setSelectedMergeCaseId] = useState<string>(
    intakeItem?.duplicateCaseId || ''
  );

  // Audio Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Human Edit / Override State
  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState(intakeItem?.aiCategory || 'Civic Infrastructure');
  const [editPriority, setEditPriority] = useState(intakeItem?.aiPriority || 'MEDIUM');
  const [editPriorityReason, setEditPriorityReason] = useState(intakeItem?.aiPriorityReason || '');
  const [editLocation, setEditLocation] = useState(intakeItem?.aiLocation || 'Andhra Pradesh');
  const [editSummary, setEditSummary] = useState(intakeItem?.aiSummary || '');

  let initialClaims: string[] = [];
  try {
    if (intakeItem?.aiClaims) initialClaims = JSON.parse(intakeItem.aiClaims);
  } catch {
    initialClaims = [];
  }
  const [editClaims, setEditClaims] = useState<string[]>(initialClaims);
  const [newClaimInput, setNewClaimInput] = useState('');

  let initialMissing: string[] = [];
  try {
    if (intakeItem?.aiMissingInformation) initialMissing = JSON.parse(intakeItem.aiMissingInformation);
  } catch {
    initialMissing = [];
  }
  const [editMissing, setEditMissing] = useState<string[]>(initialMissing);

  let sensitiveItems: any[] = [];
  try {
    if (intakeItem?.sensitiveInfoDetected) sensitiveItems = JSON.parse(intakeItem.sensitiveInfoDetected);
  } catch {
    sensitiveItems = [];
  }

  const [savingEdits, setSavingEdits] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !intakeItem) return null;

  // Save creator edits as authoritative
  const handleSaveEdits = async () => {
    setSavingEdits(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/intake/${intakeItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiCategory: editCategory,
          aiPriority: editPriority,
          aiPriorityReason: editPriorityReason,
          aiLocation: editLocation,
          aiSummary: editSummary,
          aiClaims: editClaims,
          aiMissingInformation: editMissing,
        }),
      });
      if (!res.ok) throw new Error('Failed to save review edits');
      setIsEditing(false);
      onUpdated();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingEdits(false);
    }
  };

  // 1. CREATE CASE Action
  const handleCreateCase = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/intake/${intakeItem.id}/create-case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editSummary.slice(0, 80) || `Case from ${intakeItem.senderName}`,
          summary: editSummary || intakeItem.rawText,
          category: editCategory,
          priority: editPriority,
          location: editLocation,
        }),
      });

      const newCase = await res.json();
      if (!res.ok) throw new Error(newCase.error || 'Failed to create case');

      onClose();
      router.push(`/app/cases/${newCase.id}`);
    } catch (err: any) {
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  // 2. MERGE WITH CASE Action
  const handleExecuteMerge = async (targetCaseId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/intake/${intakeItem.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCaseId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to merge intake item');

      setIsMergeModalOpen(false);
      onUpdated();
      onClose();
      router.push(`/app/cases/${targetCaseId}`);
    } catch (err: any) {
      setActionError(err.message);
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy/70 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-border-light flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Command Bar */}
          <div className="px-6 py-4 border-b border-border-light flex flex-wrap items-center justify-between gap-4 bg-off-white/40">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-electric-blue">
                INTAKE #{intakeItem.id.slice(-6).toUpperCase()}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-navy/5 text-navy border border-navy/10">
                {intakeItem.sourceType}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={12} />
                {new Date(intakeItem.createdAt).toLocaleString()}
              </span>
            </div>

            {/* 4 Core Decision Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateCase}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-navy hover:bg-navy/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileCheck2 size={14} className="text-teal" />
                <span>Create Case</span>
              </button>

              <button
                onClick={() => setIsMergeModalOpen(true)}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-off-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-border-light transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <GitMerge size={14} className="text-electric-blue" />
                <span>Merge with Case</span>
              </button>

              <button
                onClick={() => setIsRequestInfoOpen(true)}
                disabled={actionLoading}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-xl border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle size={14} className="text-amber-600" />
                <span>Request Info</span>
              </button>

              <button
                onClick={() => setIsArchiveOpen(true)}
                disabled={actionLoading}
                className="px-3 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Archive size={14} />
                <span>Archive</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-full transition-colors ml-1 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Action Error Alert */}
          {actionError && (
            <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{actionError}</span>
            </div>
          )}

          {/* 2-Column Body Workspace */}
          <div className="flex-1 overflow-y-auto grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-light">
            {/* LEFT COLUMN: Original Message as Received */}
            <div className="p-6 sm:p-7 space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-navy uppercase tracking-wider">
                    Original Citizen Message
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Raw Immutable Source
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Language: <span className="font-bold text-navy">{intakeItem.preferredLanguage}</span>
                </div>
              </div>

              {/* Sensitive Information Detection Banner */}
              {sensitiveItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <ShieldAlert size={16} className="text-amber-600" />
                      <span>Sensitive Information Detected</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Redaction Recommended for Content
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sensitiveItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-amber-200 text-[11px] font-semibold text-amber-900"
                      >
                        ⚠ {item.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-700/80">
                    Original source material is permanently preserved for legal evidence. Redactions apply only to published media.
                  </p>
                </div>
              )}

              {/* Voice Message Player if Voice Note */}
              {intakeItem.sourceType === 'VOICE' && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                      <Mic size={16} className="text-purple-600" />
                      <span>🎙 Audio Voice Dispatch</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-700">02:34</span>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-purple-200">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-purple-700"
                    >
                      {isPlayingAudio ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-purple-600 rounded-full transition-all duration-300 ${
                            isPlayingAudio ? 'w-2/3 animate-pulse' : 'w-0'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{isPlayingAudio ? '01:42' : '00:00'}</span>
                        <span>02:34</span>
                      </div>
                    </div>
                  </div>

                  {/* Transcript */}
                  {intakeItem.transcription && (
                    <div className="p-3 bg-white/80 rounded-xl border border-purple-100 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                        Automated Audio Transcript
                      </div>
                      <p className="text-xs text-navy leading-relaxed whitespace-pre-wrap font-sans">
                        &ldquo;{intakeItem.transcription}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Message Box */}
              <div className="p-4 rounded-2xl bg-off-white/80 border border-border-light text-xs text-navy leading-relaxed font-sans whitespace-pre-wrap shadow-2xs">
                &ldquo;{intakeItem.rawText}&rdquo;
              </div>

              {/* Attachments Section */}
              {intakeItem.attachments && intakeItem.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Paperclip size={14} className="text-slate-400" />
                    <span>Attached Evidence / Files ({intakeItem.attachments.length})</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {intakeItem.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-xl bg-off-white border border-border-light text-xs flex items-center justify-between"
                      >
                        <div className="truncate mr-2">
                          <div className="font-semibold text-navy truncate">{att.fileName}</div>
                          <div className="text-[10px] text-slate-400">{Math.round(att.size / 1024)} KB · {att.type}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                            {att.mimeType?.split('/')[1] || 'FILE'}
                          </span>
                          <a
                            href={`/api/intake/attachments/${att.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-navy transition-colors"
                            title="Download Attachment"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complainant Profile Card */}
              <div className="p-4 rounded-2xl bg-white border border-border-light space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Citizen Source Profile
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-slate-400" />
                    <span className="font-bold text-navy">{intakeItem.senderName}</span>
                  </div>
                  {intakeItem.senderPhone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400" />
                      <span className="text-slate-600 font-medium">{intakeItem.senderPhone}</span>
                    </div>
                  )}
                  {intakeItem.senderEmail && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400" />
                      <span className="text-slate-600 font-medium">{intakeItem.senderEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400" />
                    <span className="text-slate-600">{intakeItem.aiLocation || 'Location Pending'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI Triage & Authoritative Human Review */}
            <div className="p-6 sm:p-7 space-y-6 overflow-y-auto bg-slate-50/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-electric-blue" />
                  <h3 className="text-sm font-black text-navy uppercase tracking-wider">
                    AI Triage & Review
                  </h3>
                </div>

                {isEditing ? (
                  <button
                    onClick={handleSaveEdits}
                    disabled={savingEdits}
                    className="px-3 py-1 bg-navy text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {savingEdits ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    <span>Save Edits</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-navy hover:bg-white rounded-lg border border-border-light transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit Values</span>
                  </button>
                )}
              </div>

              {/* Potential Duplicate Box if candidate detected */}
              {intakeItem.duplicateCandidate && intakeItem.duplicateCaseId && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <AlertTriangle size={16} className="text-amber-600" />
                      <span>Potential Duplicate Detected</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                      High Similarity Match
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    This report appears to address the same incident as registered case:
                  </p>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs">
                    <Link
                      href={`/app/cases/${intakeItem.duplicateCaseId}`}
                      target="_blank"
                      className="font-bold text-navy hover:text-electric-blue flex items-center gap-1"
                    >
                      <span>
                        {intakeItem.mergedCase
                          ? `${intakeItem.mergedCase.caseNumber} — ${intakeItem.mergedCase.title}`
                          : 'View Related Registered Case'}
                      </span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleExecuteMerge(intakeItem.duplicateCaseId)}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <GitMerge size={12} />
                      <span>Merge with this Case</span>
                    </button>
                    <button
                      onClick={() => {
                        // Dismiss duplicate flag
                        fetch(`/api/intake/${intakeItem.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ duplicateCandidate: false }),
                        }).then(() => onUpdated());
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-navy cursor-pointer"
                    >
                      Not Related
                    </button>
                  </div>
                </div>
              )}

              {/* Triage Form / Review Display */}
              <div className="space-y-4">
                {/* Category & Priority Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Category
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full p-2 bg-white border border-border-light rounded-xl text-xs font-semibold text-navy focus:outline-none"
                      />
                    ) : (
                      <div className="p-2.5 bg-white rounded-xl border border-border-light text-xs font-bold text-navy">
                        {editCategory}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Priority
                    </label>
                    {isEditing ? (
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full p-2 bg-white border border-border-light rounded-xl text-xs font-semibold text-navy focus:outline-none"
                      >
                        <option value="URGENT">🔴 URGENT</option>
                        <option value="HIGH">🟠 HIGH</option>
                        <option value="MEDIUM">🟡 MEDIUM</option>
                        <option value="LOW">⚪ LOW</option>
                      </select>
                    ) : (
                      <div className="p-2.5 bg-white rounded-xl border border-border-light">
                        <PriorityBadge priority={editPriority} size="sm" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Reason */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Priority Justification
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editPriorityReason}
                      onChange={(e) => setEditPriorityReason(e.target.value)}
                      className="w-full p-2 bg-white border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs text-slate-600 p-2.5 bg-white rounded-xl border border-border-light leading-relaxed">
                      {editPriorityReason || 'Standard editorial review applied.'}
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Intake Summary
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      className="w-full p-2.5 bg-white border border-border-light rounded-xl text-xs text-navy focus:outline-none leading-relaxed"
                    />
                  ) : (
                    <div className="text-xs text-navy p-3 bg-white rounded-xl border border-border-light leading-relaxed font-medium">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-navy">{children}</strong>,
                          ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        }}
                      >
                        {editSummary || 'No summary available.'}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Claims Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Possible Factual Claims
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    {editClaims.map((claim, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-xl border border-border-light text-xs text-navy flex items-start justify-between gap-2"
                      >
                        <span>• {claim}</span>
                        {isEditing && (
                          <button
                            onClick={() => setEditClaims(editClaims.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}

                    {isEditing && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newClaimInput}
                          onChange={(e) => setNewClaimInput(e.target.value)}
                          placeholder="Add new claim..."
                          className="flex-1 p-2 bg-white border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newClaimInput.trim()) {
                              setEditClaims([...editClaims, newClaimInput.trim()]);
                              setNewClaimInput('');
                            }
                          }}
                          className="p-2 bg-navy text-white rounded-xl cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Missing Information Items */}
                {editMissing.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Identified Missing Information
                    </label>
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1">
                      {editMissing.map((item, idx) => (
                        <div key={idx} className="text-xs text-amber-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Info Modal */}
      <RequestInfoModal
        isOpen={isRequestInfoOpen}
        onClose={() => setIsRequestInfoOpen(false)}
        intakeItem={intakeItem}
        onSuccess={() => {
          onUpdated();
          onClose();
        }}
      />

      {/* Archive Reason Modal */}
      <ArchiveReasonModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        intakeItem={intakeItem}
        onSuccess={() => {
          onUpdated();
          onClose();
        }}
      />

      {/* Merge with Case Selector Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border-light p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <GitMerge size={16} className="text-electric-blue" />
                <span>Merge Report into Existing Case</span>
              </h3>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="text-slate-400 hover:text-navy cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select which case this report belongs to. The original intake message, attachments, and complainant data will be permanently linked to the case provenance.
            </p>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                Target Case
              </label>
              <select
                value={selectedMergeCaseId}
                onChange={(e) => setSelectedMergeCaseId(e.target.value)}
                className="w-full p-2.5 bg-off-white border border-border-light rounded-xl text-xs font-semibold text-navy focus:outline-none"
              >
                <option value="">-- Choose active case --</option>
                {existingCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteMerge(selectedMergeCaseId)}
                disabled={!selectedMergeCaseId || actionLoading}
                className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
