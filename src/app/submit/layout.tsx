import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Open Vaartha — Citizen Helpdesk',
  description: 'Report civic issues, government failures, and public problems to the Open Vaartha investigative team.',
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-warm-white via-off-white to-cream text-foreground font-sans antialiased selection:bg-electric-blue/15 selection:text-electric-blue">
      {/* Trust Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border-light shadow-xs py-3.5 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center font-black text-sm tracking-tight shadow-xs">
              OV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-navy">Open Vaartha</span>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 rounded">
                  Citizen Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Public Civic Investigation Desk</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="hidden sm:flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60">
              <Lock size={12} className="text-emerald-600" />
              <span>Encrypted & Confidential</span>
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-slate-400 hover:text-navy transition-colors p-1"
              title="Learn more about Open Vaartha"
            >
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {children}
      </main>

      {/* Reassuring Footer */}
      <footer className="mt-auto border-t border-border-light/70 bg-white/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-navy font-semibold text-xs">
            <ShieldCheck size={14} className="text-electric-blue" />
            <span>Journalistic Whistleblower & Source Protection Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Your safety and privacy are respected. Information shared here is received by accredited journalists for public-interest reporting. You retain full control over anonymity and contact preferences.
          </p>
          <div className="pt-2 text-[10px] text-slate-400">
            <a
              href="https://openvaartha.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-navy transition-colors"
            >
              Open Vaartha
            </a>{' '}
            • Protected by end-to-end data encryption
          </div>
        </div>
      </footer>
    </div>
  );
}
