'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Badge from '@/components/ui/Badge';
import {
  Film,
  PlayCircle,
  LayoutGrid,
  FileText,
  MessageCircle,
  CheckCircle,
  User,
  Send,
  Scissors,
} from 'lucide-react';

const formats = [
  { icon: <Film size={16} />, label: 'Instagram Reel' },
  { icon: <PlayCircle size={16} />, label: 'YouTube Video' },
  { icon: <Scissors size={16} />, label: 'YouTube Short' },
  { icon: <LayoutGrid size={16} />, label: 'Carousel' },
  { icon: <FileText size={16} />, label: 'Article' },
  { icon: <MessageCircle size={16} />, label: 'Social Post' },
];

const contentPreview = [
  { label: 'HOOK', content: '"What happened to this family?"' },
  { label: 'WHAT WE VERIFIED', content: 'Complaint filed, documents confirmed, date established.' },
  { label: 'WHAT THE FAMILY ALLEGES', content: 'Hospital negligence, no response to complaints.' },
  { label: 'AUTHORITY RESPONSE', content: 'Official statement requested, awaiting reply.' },
  { label: 'WHAT HAPPENS NEXT', content: 'Follow-up scheduled, monitoring response.' },
];

export default function ContentStudioSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Content Studio"
            headline="From investigation to content."
            body="When the case is ready, turn your structured investigation into content without starting from scratch."
          />
        </AnimateOnScroll>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Format selection */}
          <AnimateOnScroll animation="slide-in-left" delay={100}>
            <div className="bg-white rounded-xl border border-surface-3 p-6">
              <h3 className="text-sm font-semibold text-primary mb-4">Choose Format</h3>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((format, i) => (
                  <button
                    key={format.label}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      i === 0
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-background text-muted-foreground hover:bg-surface hover:text-primary border border-surface-3'
                    }`}
                  >
                    {format.icon}
                    {format.label}
                  </button>
                ))}
              </div>

              {/* Publication flow */}
              <div className="mt-6 pt-5 border-t border-surface-3">
                <span className="text-[10px] font-bold tracking-wider uppercase text-secondary mb-3 block">
                  Publication Flow
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-lg text-xs font-medium text-primary">
                    <User size={12} /> Creator reviews
                  </div>
                  <span className="text-secondary text-xs">→</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-subtle rounded-lg text-xs font-medium text-success">
                    <CheckCircle size={12} /> Creator approves
                  </div>
                  <span className="text-secondary text-xs">→</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-subtle rounded-lg text-xs font-medium text-primary">
                    <Send size={12} /> Publish
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Content preview */}
          <AnimateOnScroll animation="slide-in-right" delay={200}>
            <div className="bg-white rounded-xl border border-surface-3 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">Content Preview</h3>
                <Badge variant="blue">Instagram Reel</Badge>
              </div>
              <div className="space-y-3">
                {contentPreview.map((item) => (
                  <div key={item.label} className="bg-background rounded-lg p-3 border border-surface-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary block mb-1">
                      {item.label}
                    </span>
                    <p className="text-xs leading-relaxed text-primary/80">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
