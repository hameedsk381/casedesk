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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
          CaseDesk Suite
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-primary leading-tight">
          A newsroom investigation desk built for the creator era.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          CaseDesk replaces messy WhatsApp group notes, lost email attachments, and unverified allegations with a rigorous, verifiable editorial workflow.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="/app">Enter Investigation Desk</Button>
          <Button href="/signup" variant="secondary">Create Workspace</Button>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-8">
        <div className="p-8 bg-white rounded-2xl border border-surface-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
            <Cpu size={24} />
          </div>
          <h3 className="text-xl font-bold text-primary">AI-Assisted Intake</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Extract claims, locations, people, timeline entities, and suggested priority from raw citizen complaints with editable AI suggestions.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-surface-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-6">
            <FileCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-primary">Verification & Right of Reply</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Distinguish between unverified claims and verified documents. Track formal letters and deadlines sent to statutory authorities.
          </p>
        </div>

        <div className="p-8 bg-white rounded-2xl border border-surface-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-6">
            <Layers size={24} />
          </div>
          <h3 className="text-xl font-bold text-primary">Content Studio & Safety</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Convert complex case dossiers into Instagram Reels, YouTube Shorts, Carousels, and Articles with pre-publication safety warnings.
          </p>
        </div>
      </div>
    </div>
  );
}
