'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Trash2,
  Edit2,
  ShieldAlert,
} from 'lucide-react';

const CLAIM_STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  UNVERIFIED: {
    label: 'Unverified Allegation',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  PARTIALLY_SUPPORTED: {
    label: 'Partially Supported',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  SUPPORTED: {
    label: 'Supported by Evidence',
    bg: 'bg-success-50',
    text: 'text-success-800',
    border: 'border-success-200',
  },
  DISPUTED: {
    label: 'Disputed by Authority/Witness',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

export default function CaseClaimsPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newStatus, setNewStatus] = useState('UNVERIFIED');
  const [adding, setAdding] = useState(false);

  const fetchCase = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setClaims(data.claims || []);
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const handleAddClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setAdding(true);
    try {
      await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          text: newText.trim(),
          source: newSource.trim() || 'Complainant statement',
          status: newStatus,
        }),
      });

      setNewText('');
      setNewSource('');
      setShowAddModal(false);
      fetchCase();
      router.refresh();
    } catch (err) {
      console.error('Failed to add claim:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (claimId: string, status: string) => {
    try {
      await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status } : c))
      );
      router.refresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteClaim = async (claimId: string) => {
    if (!confirm('Are you sure you want to remove this claim?')) return;
    try {
      await fetch(`/api/claims/${claimId}`, { method: 'DELETE' });
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      router.refresh();
    } catch (err) {
      console.error('Failed to delete claim:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-3 p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Principle Banner */}
      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
        <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Editorial Standard Notice:</strong> A <em>Claim</em> represents an allegation made by a complainant, witness, or document. Claim statuses (Unverified, Partially Supported, Supported, Disputed) are internal editorial workflow states to guide journalistic inquiry, not legal declarations of guilt or liability.
        </div>
      </div>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">Recorded Claims & Allegations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test each claim against primary documentary evidence and authority response.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-3.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Claim</span>
        </button>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-surface-3 text-center">
            <HelpCircle size={28} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-primary">No claims logged for this case</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Add individual factual allegations made by the complainant to track corroboration.
            </p>
          </div>
        ) : (
          claims.map((claim) => {
            const config = CLAIM_STATUS_MAP[claim.status] || CLAIM_STATUS_MAP.UNVERIFIED;

            return (
              <div
                key={claim.id}
                className="bg-white p-5 rounded-2xl border border-surface-3 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${config.bg} ${config.text} ${config.border} self-start`}
                  >
                    {config.label}
                  </span>

                  {/* Status switcher dropdown */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={claim.status}
                      onChange={(e) => handleUpdateStatus(claim.id, e.target.value)}
                      className="text-xs bg-background border border-surface-3 rounded-lg px-2.5 py-1 text-primary font-semibold focus:outline-none cursor-pointer"
                    >
                      <option value="UNVERIFIED">Mark Unverified</option>
                      <option value="PARTIALLY_SUPPORTED">Mark Partially Supported</option>
                      <option value="SUPPORTED">Mark Supported</option>
                      <option value="DISPUTED">Mark Disputed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteClaim(claim.id)}
                      className="p-1.5 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title="Delete claim"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-sm font-semibold text-primary leading-relaxed">
                  &ldquo;{claim.text}&rdquo;
                </div>

                {claim.source && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-surface-3/60">
                    Source attribution: <strong className="text-primary">{claim.source}</strong>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Claim Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-surface-3 p-6 space-y-4">
            <h3 className="text-base font-bold text-primary">Record New Claim</h3>

            <form onSubmit={handleAddClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Allegation Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="e.g. Power was out for 45 minutes and backup generator failed to engage..."
                  className="w-full p-3 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Source / Attribution
                </label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. Complainant WhatsApp voice note & prescription timestamp"
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                  Initial Editorial Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                >
                  <option value="UNVERIFIED">Unverified Allegation</option>
                  <option value="PARTIALLY_SUPPORTED">Partially Supported</option>
                  <option value="SUPPORTED">Supported by Evidence</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {adding ? 'Saving...' : 'Add Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
