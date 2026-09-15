'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const DEMO_USERS = [
  { name: 'Sarah Khan', email: 'sarah@casedesk.local', role: 'OWNER / Lead Investigator' },
  { name: 'Arun Verma', email: 'arun@casedesk.local', role: 'ADMIN / Senior Researcher' },
  { name: 'Priya Nair', email: 'priya@casedesk.local', role: 'EDITOR / Content Lead' },
  { name: 'Rajesh Sharma', email: 'raj@casedesk.local', role: 'VIEWER / Legal Advisor' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('sarah@casedesk.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/app');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-baseline gap-2 mb-4 group">
          <span className="text-2xl font-bold tracking-tight text-navy">CaseDesk</span>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-electric-blue">
            for creators
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-navy">
          Sign in to your Case Desk
        </h2>
        <p className="mt-2 text-sm text-slate">
          Access your cases, evidence vault, and newsroom workflows.
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
                Work Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@casedesk.local"
                  className="w-full pl-10 pr-4 py-2.5 bg-off-white/50 border border-border-light rounded-xl text-sm text-navy focus:outline-none focus:ring-2 focus:ring-electric-blue/30 focus:border-electric-blue transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-navy uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-slate-400">Default: password123</span>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
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
              {loading ? 'Authenticating...' : 'Enter Investigation Desk'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-border-light">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-teal" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate">
                Pilot Test Personas (Click to fill)
              </span>
            </div>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleSelectDemoUser(u.email)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                    email === u.email
                      ? 'border-electric-blue bg-electric-blue/5 text-navy font-semibold'
                      : 'border-border-light hover:bg-off-white text-slate'
                  }`}
                >
                  <div>
                    <div className="font-medium text-navy">{u.name}</div>
                    <div className="text-[11px] text-slate-500">{u.role}</div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate">
          Need a fresh account?{' '}
          <Link href="/signup" className="font-semibold text-electric-blue hover:underline">
            Register workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
