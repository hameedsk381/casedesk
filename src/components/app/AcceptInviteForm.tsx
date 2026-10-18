'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Lock, User } from 'lucide-react';

interface AcceptInviteFormProps {
  token: string;
  email: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  hasAccount: boolean;
}

const inputClass =
  'w-full pl-10 pr-4 py-2.5 bg-background/50 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

export default function AcceptInviteForm({ token, email, workspaceName, inviterName, role, hasAccount }: AcceptInviteFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/team/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, ...(hasAccount ? {} : { name }) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not accept the invitation.');
      router.push('/app');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not accept the invitation.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-surface-3 sm:px-10 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-primary">Join {workspaceName}</h2>
        <p className="text-sm text-muted-foreground">
          {inviterName} invited <span className="font-mono">{email}</span> as <strong>{role.toLowerCase()}</strong>.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3" role="alert">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={submit}>
        {!hasAccount && (
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2" htmlFor="invite-name">Full name</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input id="invite-name" type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2" htmlFor="invite-password">
            {hasAccount ? 'Your existing password' : 'Choose a password'}
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              id="invite-password"
              type="password"
              required
              minLength={hasAccount ? 1 : 10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={hasAccount ? 'current-password' : 'new-password'}
              className={inputClass}
            />
          </div>
          {!hasAccount && <p className="mt-1.5 text-[11px] text-muted-foreground">At least 10 characters, with a letter and a number.</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? 'Joining…' : hasAccount ? 'Sign in and join' : 'Create account and join'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>
    </div>
  );
}
