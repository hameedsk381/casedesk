'use client';

import React, { useState } from 'react';
import { Archive, X, Loader2 } from 'lucide-react';

interface ArchiveReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  intakeItem: any;
  onSuccess: () => void;
}

const REASONS = [
  { id: 'SPAM', label: 'Spam or Promotional Noise', desc: 'Commercial solicitation, bots, backlink sellers, cryptocurrency' },
  { id: 'OUT_OF_SCOPE', label: 'Out of Scope', desc: 'Personal civil disputes or non-public interest requests' },
  { id: 'DUPLICATE', label: 'Duplicate Noise', desc: 'Identical copy already tracked or resolved elsewhere' },
  { id: 'INSUFFICIENT_INFORMATION', label: 'Insufficient Information', desc: 'Vague rumor without actionable dates, locations, or identity' },
  { id: 'NOT_RELEVANT', label: 'Not Relevant', desc: 'General commentary or messages requiring no investigative action' },
  { id: 'OTHER', label: 'Other Editorial Reason', desc: 'Other newsroom determination' },
];

export default function ArchiveReasonModal({
  isOpen,
  onClose,
  intakeItem,
  onSuccess,
}: ArchiveReasonModalProps) {
  const [reason, setReason] = useState('SPAM');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !intakeItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/intake/${intakeItem.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive item');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-surface-3 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-surface-3 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
              <Archive size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary">Archive Intake Report</h3>
              <p className="text-[11px] text-slate-500">
                Preserve the record while removing it from active review queues.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:text-primary cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Select Archival Reason (Mandatory)
            </label>
            <div className="space-y-2">
              {REASONS.map((r) => {
                const selected = reason === r.id;
                return (
                  <label
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`block p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      selected
                        ? 'bg-slate-100 border-primary text-primary font-bold'
                        : 'bg-background/40 border-surface-3 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{r.label}</span>
                      <input
                        type="radio"
                        name="archive_reason"
                        checked={selected}
                        onChange={() => setReason(r.id)}
                        className="text-primary focus:ring-primary"
                      />
                    </div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      {r.desc}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-surface-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Archiving...</span>
                </>
              ) : (
                <>
                  <Archive size={14} />
                  <span>Confirm Archive</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
