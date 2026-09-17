'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { Mic, FileText, Layers, User, ArrowDown, Globe, Languages } from 'lucide-react';

const flow = [
  { icon: <Mic size={18} />, label: 'Telugu Voice Note', sublabel: 'Audio message received', color: 'bg-warning-subtle text-warning' },
  { icon: <FileText size={18} />, label: 'Transcription', sublabel: 'Speech-to-text processing', color: 'bg-primary-subtle text-primary' },
  { icon: <Layers size={18} />, label: 'Structured Case', sublabel: 'AI-organized information', color: 'bg-success-subtle text-success' },
  { icon: <User size={18} />, label: 'Creator Review', sublabel: 'Human verification step', color: 'bg-success-subtle text-success' },
];

const features = [
  { icon: '🎙', label: 'Telugu voice notes' },
  { icon: '📝', label: 'Speech-to-text' },
  { icon: '📄', label: 'Document extraction' },
  { icon: '🌐', label: 'Telugu + English' },
];

export default function VoiceFirstSection() {
  return (
    <section className="py-20 lg:py-28 bg-primary text-white relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <AnimateOnScroll>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-primary-bright mb-5">
              <Languages size={14} />
              Voice-First · Regional Language
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight">
              People shouldn&apos;t need perfect paperwork to be heard.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-secondary max-w-2xl mx-auto">
              CaseDesk is designed for real-world citizen communication — including voice notes and regional languages.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Features */}
        <AnimateOnScroll delay={200}>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {features.map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm"
              >
                <span className="text-base">{feature.icon}</span>
                <span className="text-sm font-medium text-white/90">{feature.label}</span>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Flow */}
        <AnimateOnScroll delay={300}>
          <div className="mt-14 max-w-md mx-auto">
            {flow.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.color}`}>
                    {step.icon}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">{step.label}</span>
                    <span className="text-xs text-secondary">{step.sublabel}</span>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown size={16} className="text-white/30" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={400}>
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <Globe size={14} className="text-primary-bright" />
              <span className="text-xs text-secondary">
                Communicating our future vision — regional language support is in development.
              </span>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
