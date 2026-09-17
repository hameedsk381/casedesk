'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/app');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-baseline gap-2 mb-4 group">
          <span className="text-2xl font-bold tracking-tight text-navy">CaseDesk</span>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-electric-blue">
            Open Vaartha
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-navy">
          Create Creator Workspace
        </h2>
        <p className="mt-2 text-sm text-slate">
          Set up a local-first case management workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-border-light sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 bg-off-white/50 border border-border-light rounded-xl text-sm text-navy focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@newsroom.local"
                  className="w-full pl-10 pr-4 py-2.5 bg-off-white/50 border border-border-light rounded-xl text-sm text-navy focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-off-white/50 border border-border-light rounded-xl text-sm text-navy focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Initialize Workspace'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-electric-blue hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
