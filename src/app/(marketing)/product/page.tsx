import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ShieldCheck, FileCheck, Layers, Cpu, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Product — CaseDesk Investigation Workspace',
  description: 'The end-to-end case management and newsroom investigation desk designed for public-interest creators.',
};

export default function ProductPage() {
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-5 sm:px-8">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-electric-blue/10 text-electric-blue border border-electric-blue/20 mb-6">
          CaseDesk Suite
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-navy leading-tight">
          A newsroom investigation desk built for the creator era.
        </h1>
        <p className="mt-6 text-lg text-slate leading-relaxed">
          CaseDesk replaces messy WhatsApp group notes, lost email attachments, and unverified allegations with a rigorous, verifiable editorial workflow.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="/app">Enter Investigation Desk</Button>
          <Button href="/signup" variant="secondary">Create Workspace</Button>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-8">
        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center mb-6">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">AI-Assisted Intake</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Extract claims, locations, people, timeline entities, and suggested priority from raw citizen complaints with editable AI suggestions.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-6">
            <FileCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">Verification & Right of Reply</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Distinguish between unverified claims and verified documents. Track formal letters and deadlines sent to statutory authorities.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-border-light shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-coral/10 text-coral flex items-center justify-center mb-6">
            <Layers size={24} />
          </div>
          <h3 className="text-xl font-bold text-navy">Content Studio & Safety</h3>
          <p className="mt-3 text-sm text-slate leading-relaxed">
            Convert complex case dossiers into Instagram Reels, YouTube Shorts, Carousels, and Articles with pre-publication safety warnings.
          </p>
        </div>
      </div>
    </div>
  );
}
