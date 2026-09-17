'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import {
  Download,
  Brain,
  ShieldCheck,
  FolderSearch,
  PenTool,
  RefreshCw,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Capture',
    description: 'Bring complaints and reports into one place.',
    icon: <Download size={20} />,
    color: 'bg-primary-subtle text-primary',
  },
  {
    number: '02',
    title: 'Understand',
    description: 'AI extracts the issue, people, location, timeline, and missing information.',
    icon: <Brain size={20} />,
    color: 'bg-success-subtle text-success',
  },
  {
    number: '03',
    title: 'Verify',
    description: 'Separate claims from evidence and verified information.',
    icon: <ShieldCheck size={20} />,
    color: 'bg-success-subtle text-success',
  },
  {
    number: '04',
    title: 'Investigate',
    description: 'Organize documents, contacts, notes, tasks, and responses.',
    icon: <FolderSearch size={20} />,
    color: 'bg-warning-subtle text-warning',
  },
  {
    number: '05',
    title: 'Create',
    description: 'Turn the investigation into responsible content.',
    icon: <PenTool size={20} />,
    color: 'bg-warning-subtle text-warning',
  },
  {
    number: '06',
    title: 'Follow Up',
    description: 'Track responses, developments, and resolution.',
    icon: <RefreshCw size={20} />,
    color: 'bg-primary-subtle text-primary',
  },
];

export default function SolutionSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="How it works"
            headline="One case desk for the entire journey."
          />
        </AnimateOnScroll>

        <div className="mt-16 max-w-2xl mx-auto">
          {steps.map((step, i) => (
            <AnimateOnScroll key={step.number} animation="fade-in-up" delay={i * 100}>
              <div className="relative flex gap-6 pb-12 last:pb-0 group">
                {/* Connecting line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-surface-3 group-hover:bg-primary/20 transition-colors duration-500" />
                )}

                {/* Step indicator */}
                <div className="flex-shrink-0 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-baseline gap-3 mb-1.5">
                    <span className="text-xs font-bold tracking-wider text-secondary">
                      {step.number}
                    </span>
                    <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
