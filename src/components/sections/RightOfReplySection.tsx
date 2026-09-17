'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { Building2, Send, Clock, FileCheck, ArrowRight, ShieldCheck } from 'lucide-react';

const steps = [
  { icon: <Building2 size={16} />, label: 'Authority identified', color: 'bg-primary-subtle text-primary' },
  { icon: <Send size={16} />, label: 'Response requested', color: 'bg-success-subtle text-success' },
  { icon: <Clock size={16} />, label: 'Deadline tracked', color: 'bg-warning-subtle text-warning' },
  { icon: <FileCheck size={16} />, label: 'Response received', color: 'bg-success-subtle text-success' },
  { icon: <ShieldCheck size={16} />, label: 'Added to case', color: 'bg-warning-subtle text-warning' },
];

export default function RightOfReplySection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Right of Reply"
            headline="Give every side a place in the record."
            body="Request responses from organizations and authorities, track communication, attach replies, and preserve the investigation timeline."
          />
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {steps.map((step, i) => (
                <React.Fragment key={step.label}>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-surface-3 bg-white ${i === steps.length - 1 ? 'ring-1 ring-green/20' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${step.color}`}>
                      {step.icon}
                    </div>
                    <span className="text-sm font-medium text-primary">{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight size={16} className="text-secondary hidden sm:block flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground italic">
                Built for responsible public-interest reporting.
              </p>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
