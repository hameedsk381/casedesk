'use client';

import React, { useState } from 'react';
import { HelpCircle, CheckSquare, X, Send, Loader2 } from 'lucide-react';

interface RequestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  intakeItem: any;
  onSuccess: () => void;
}

const CHECKLIST_ITEMS = [
  { id: 'Incident date', label: 'Incident date or timeline' },
  { id: 'Location', label: 'Precise location / village / ward coordinates' },
  { id: 'Complaint/reference number', label: 'Official complaint or application reference number' },
  { id: 'Supporting document', label: 'Supporting document, photo, or receipt copy' },
  { id: 'Contact number', label: 'Alternative phone / WhatsApp contact number' },
  { id: 'More details', label: 'Detailed chronological sequence of events' },
];

export default function RequestInfoModal({
  isOpen,
  onClose,
  intakeItem,
  onSuccess,
}: RequestInfoModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'Incident date',
    'Supporting document',
  ]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !intakeItem) return null;

  const toggleField = (id: string) => {
    if (selectedFields.includes(id)) {
      setSelectedFields(selectedFields.filter((f) => f !== id));
    } else {
      setSelectedFields([...selectedFields, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFields.length === 0) {
      setError('Please select at least one piece of information needed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/intake/${intakeItem.id}/request-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedFields: selectedFields,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to request information');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border-light overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border-light flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-navy">Request Missing Information</h3>
              <p className="text-[11px] text-slate-500">
                Identify what is required from {intakeItem.senderName} before turning this into a case.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:text-navy cursor-pointer">
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
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
              What information is needed?
            </label>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const checked = selectedFields.includes(item.id);
                return (
                  <label
                    key={item.id}
                    onClick={() => toggleField(item.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      checked
                        ? 'bg-amber-50/60 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-off-white/40 border-border-light text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Internal Notes / Message Draft for Source
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Complainant provided verbal claim but needs to furnish official ration card photocopy..."
              className="w-full p-3 bg-off-white border border-border-light rounded-xl text-xs text-navy focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="pt-3 border-t border-border-light flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Marking Needs Info...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Record & Set Needs Info</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
