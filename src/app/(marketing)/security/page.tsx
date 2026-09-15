import React from 'react';
import Button from '@/components/ui/Button';
import { Shield, Lock, EyeOff, FileText, Server } from 'lucide-react';

export const metadata = {
  title: 'Security & Privacy — CaseDesk',
  description: 'How CaseDesk protects source confidentiality, sensitive documents, and investigative evidence.',
};

export default function SecurityPage() {
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-5 sm:px-8">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy/10 text-navy border border-navy/20 mb-6">
          Security & Privacy
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-navy leading-tight">
          Source safety and data sovereignty built-in by design.
        </h1>
        <p className="mt-6 text-lg text-slate leading-relaxed">
          Journalism and civic communication involve real human risks. CaseDesk ensures that anonymous sources stay protected and files never leak.
        </p>
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-5xl">
        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center mb-6">
            <EyeOff size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">Explicit Consent & Redaction</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Separate flags for consent-to-contact and consent-to-publish. Pre-publication checks prevent inadvertent naming of off-the-record complainants.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-6">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">Isolated Local Filesystem</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Evidence vault files are stored in workspace-scoped directories with strict session-authenticated streaming endpoints—no public URLs.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-coral/10 text-coral flex items-center justify-center mb-6">
            <Shield size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">Role-Based Access Control</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Granular permissions across Owner, Admin, Researcher, Editor, and Viewer ensure sensitive case notes are only visible to authorized team members.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-navy/10 text-navy flex items-center justify-center mb-6">
            <Server size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">Audit Logging</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Every critical action—case creation, evidence uploads, status transitions, and right-of-reply dispatch—is captured in an immutable activity log.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <Button href="/app">Go to App</Button>
      </div>
    </div>
  );
}
