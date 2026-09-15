'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Badge from '@/components/ui/Badge';
import { Circle } from 'lucide-react';

const timelineEntries = [
  { date: '12 Sep', event: 'Complaint received', dotColor: 'bg-electric-blue' },
  { date: '13 Sep', event: 'Additional information requested', dotColor: 'bg-electric-blue' },
  { date: '14 Sep', event: 'Documents uploaded', dotColor: 'bg-teal' },
  { date: '16 Sep', event: 'Evidence reviewed', dotColor: 'bg-teal' },
  { date: '18 Sep', event: 'Authority contacted', dotColor: 'bg-yellow' },
  { date: '21 Sep', event: 'Response received', dotColor: 'bg-green' },
  { date: '23 Sep', event: 'Content published', dotColor: 'bg-coral' },
  { date: '30 Sep', event: 'Follow-up', dotColor: 'bg-electric-blue' },
];

const statuses = [
  { label: 'Open', color: 'blue' as const },
  { label: 'Investigating', color: 'yellow' as const },
  { label: 'Published', color: 'coral' as const },
  { label: 'Monitoring', color: 'teal' as const },
  { label: 'Resolved', color: 'green' as const },
];

export default function CaseTimelineSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Case Timeline"
            headline={
              <>
                The story doesn&apos;t end
                <br />
                <span className="text-slate">when the video goes live.</span>
              </>
            }
          />
        </AnimateOnScroll>

        {/* Timeline */}
        <AnimateOnScroll delay={200}>
          <div className="mt-14 max-w-lg mx-auto">
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

              {timelineEntries.map((entry, i) => (
                <div key={entry.date + entry.event} className="relative pb-6 last:pb-0 group">
                  {/* Dot */}
                  <div
                    className={`absolute left-[-25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${entry.dotColor} shadow-sm`}
                  />

                  {/* Content */}
                  <div className="flex items-baseline gap-4">
                    <span className="text-xs font-mono font-medium text-slate-light w-12 flex-shrink-0">
                      {entry.date}
                    </span>
                    <span className="text-sm text-navy group-hover:text-electric-blue transition-colors">
                      {entry.event}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>

        {/* Status progression */}
        <AnimateOnScroll delay={300}>
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {statuses.map((status, i) => (
                <React.Fragment key={status.label}>
                  <Badge variant={status.color} dot>{status.label}</Badge>
                  {i < statuses.length - 1 && (
                    <span className="text-slate-light text-xs hidden sm:inline">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
