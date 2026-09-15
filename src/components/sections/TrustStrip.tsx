'use client';

import React from 'react';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import {
  MessageCircle,
  AtSign,
  Mic,
  FileText,
  Camera,
  Video,
  Mail,
  ArrowDown,
} from 'lucide-react';

const sources = [
  { icon: <MessageCircle size={18} />, label: 'WhatsApp', color: 'text-green' },
  { icon: <AtSign size={18} />, label: 'Instagram DMs', color: 'text-coral' },
  { icon: <Mic size={18} />, label: 'Voice Notes', color: 'text-teal' },
  { icon: <FileText size={18} />, label: 'Documents', color: 'text-electric-blue' },
  { icon: <Camera size={18} />, label: 'Photos', color: 'text-yellow' },
  { icon: <Video size={18} />, label: 'Videos', color: 'text-red' },
  { icon: <Mail size={18} />, label: 'Emails', color: 'text-slate' },
];

export default function TrustStrip() {
  return (
    <section className="py-16 lg:py-20 border-t border-border-light">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <p className="text-center text-lg sm:text-xl font-medium text-navy/80 max-w-2xl mx-auto">
            When your inbox becomes your case desk,{' '}
            <span className="text-navy font-semibold">important stories get lost.</span>
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            {sources.map((source, i) => (
              <div
                key={source.label}
                className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-border-light hover:border-border hover:shadow-sm transition-all duration-200"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className={source.color}>{source.icon}</span>
                <span className="text-sm font-medium text-navy">{source.label}</span>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={400}>
          <div className="mt-10 flex flex-col items-center gap-3">
            <ArrowDown size={20} className="text-electric-blue animate-pulse-subtle" />
            <p className="text-base font-semibold text-electric-blue">
              CaseDesk brings them together.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
