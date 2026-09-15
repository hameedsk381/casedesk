import React from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'How It Works — The CaseDesk Editorial Workflow',
  description: 'From raw citizen message to verified content: learn how the CaseDesk investigation cycle works.',
};

const steps = [
  {
    num: '01',
    title: 'Intake & AI Structuring',
    desc: 'Paste citizen text messages, voice recordings, or documents. The AI parses entities and builds a draft case with review required.',
  },
  {
    num: '02',
    title: 'Source Consent & Verification',
    desc: 'Record complainant preferences (confidentiality, consent to contact, consent to publish). Separate verified documents from unproven claims.',
  },
  {
    num: '03',
    title: 'Investigation Tasks & Right of Reply',
    desc: 'Assign research tasks across team members. Identify authorities, issue formal inquiry notices, and log responses and contradictions.',
  },
  {
    num: '04',
    title: 'Responsible Content Generation',
    desc: 'Draft Reels, YouTube explainers, or carousels. Automated checks flag unverified allegations or missing responses before publication.',
  },
  {
    num: '05',
    title: 'Follow-up & Real-world Impact',
    desc: 'Track citizen outcomes, follow-up RTI responses, administrative actions, and mark cases partially resolved or closed.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-5 sm:px-8">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal/10 text-teal border border-teal/20 mb-6">
          The Workflow
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-navy leading-tight">
          How citizen messages become responsible public investigations.
        </h1>
        <p className="mt-6 text-lg text-slate leading-relaxed">
          CaseDesk transforms chaotic citizen intake into a disciplined, multi-stage editorial pipeline trusted by newsrooms and public creators.
        </p>
      </div>

      <div className="mt-16 space-y-6 max-w-4xl">
        {steps.map((step) => (
          <div key={step.num} className="p-6 sm:p-8 bg-white rounded-2xl border border-border-light shadow-xs flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-electric-blue/10 text-electric-blue font-mono font-extrabold text-xl flex items-center justify-center">
              {step.num}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-slate text-sm leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Button href="/app">
          Experience the Workspace <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
