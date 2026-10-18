'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';

interface EraseCaseButtonProps {
  caseId: string;
  caseNumber: string;
}

/**
 * "Danger zone" for privacy/deletion requests. Permanently erases the case, the
 * citizen reports linked to it and every stored file. The user must type the case
 * number to confirm, and the server checks it again.
 */
export default function EraseCaseButton({ caseId, caseNumber }: EraseCaseButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = typed.trim() === caseNumber;

  const erase = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: caseNumber }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not erase the case.');
      router.push('/app/cases');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not erase the case.');
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-red-700">Erase this case permanently</h2>
          <p className="text-xs leading-relaxed text-red-700/90">
            Use this for a citizen&apos;s deletion request. It removes the case, the citizen reports linked to it, and every
            attachment and evidence file. This cannot be undone.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 cursor-pointer"
        >
          <Trash2 size={14} /> Erase case…
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-red-800">
            Type <span className="font-mono">{caseNumber}</span> to confirm
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 block w-full max-w-xs rounded-xl border border-red-300 bg-white px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-red-500"
            />
          </label>
          {error && <p className="rounded-xl border border-red-200 bg-white p-3 text-xs text-red-700" role="alert">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={erase}
              disabled={!matches || busy}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 size={14} /> {busy ? 'Erasing…' : 'Erase permanently'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped('');
                setError(null);
              }}
              disabled={busy}
              className="rounded-xl px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
