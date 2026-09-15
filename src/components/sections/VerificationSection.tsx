'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Badge from '@/components/ui/Badge';
import { CheckCircle, Circle, Loader } from 'lucide-react';

const categories = [
  {
    label: 'CLAIM',
    description: 'What the complainant says happened.',
    color: 'bg-coral-subtle text-coral border-coral/20',
  },
  {
    label: 'EVIDENCE',
    description: 'Documents, media, records, and other supporting material.',
    color: 'bg-electric-blue-subtle text-electric-blue border-electric-blue/20',
  },
  {
    label: 'VERIFIED',
    description: 'Information independently established by the creator.',
    color: 'bg-green-subtle text-green border-green/20',
  },
  {
    label: 'RESPONSE',
    description: 'What the relevant person, organization, or authority says.',
    color: 'bg-teal-subtle text-teal border-teal/20',
  },
];

const verificationItems = [
  { label: 'Complaint document received', status: 'verified' },
  { label: 'Complaint number confirmed', status: 'verified' },
  { label: 'Date confirmed', status: 'verified' },
  { label: 'Authority identified', status: 'verified' },
  { label: 'Authority contacted', status: 'partial' },
  { label: 'Official response pending', status: 'pending' },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'verified') return <CheckCircle size={14} className="text-green flex-shrink-0" />;
  if (status === 'partial') return <Loader size={14} className="text-yellow flex-shrink-0" />;
  return <Circle size={14} className="text-slate-light flex-shrink-0" />;
}

export default function VerificationSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Verification"
            headline={
              <>
                Know what you know.
                <br />
                <span className="text-slate">Know what you don&apos;t.</span>
              </>
            }
          />
        </AnimateOnScroll>

        {/* Category badges */}
        <AnimateOnScroll delay={200}>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <div
                key={cat.label}
                className={`rounded-xl p-5 border ${cat.color} text-center`}
              >
                <span className="text-xs font-bold tracking-[0.15em] uppercase">{cat.label}</span>
                <p className="mt-2 text-xs leading-relaxed opacity-80">{cat.description}</p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Verification panel */}
        <AnimateOnScroll delay={300}>
          <div className="mt-12 max-w-lg mx-auto bg-white rounded-xl border border-border-light p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-navy">Verification Panel</h3>
              <Badge variant="blue">CD-1247</Badge>
            </div>

            <div className="mb-4 p-3 bg-coral-subtle rounded-lg border border-coral/10">
              <span className="text-[10px] font-bold tracking-wider uppercase text-coral">Claim</span>
              <p className="mt-1 text-sm text-navy/80">&quot;Complaint was ignored.&quot;</p>
            </div>

            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-light mb-3 block">
                Verification Status
              </span>
              <div className="space-y-2.5">
                {verificationItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <StatusIcon status={item.status} />
                    <span
                      className={`text-sm ${
                        item.status === 'verified'
                          ? 'text-navy'
                          : item.status === 'partial'
                          ? 'text-navy/70'
                          : 'text-slate-light'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border-light">
              <div className="flex items-center gap-4 text-xs text-slate-light">
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-green" /> 4 Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <Loader size={11} className="text-yellow" /> 1 In Progress
                </span>
                <span className="flex items-center gap-1.5">
                  <Circle size={11} /> 1 Pending
                </span>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
