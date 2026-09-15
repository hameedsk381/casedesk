'use client';

import React from 'react';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { Telescope, Network, ArrowUpRight } from 'lucide-react';

export default function FutureVisionSection() {
  return (
    <section className="py-20 lg:py-28 bg-white border-t border-border-light">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-teal mb-5">
              <Telescope size={14} />
              Our Long-Term Vision
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-navy">
              From creator tool
              <br />
              <span className="text-teal">to public-interest network.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate max-w-2xl mx-auto">
              Today, CaseDesk helps individual creators manage the issues their audiences bring to them.
              Tomorrow, cases could move across creators, researchers, regions, and organizations —
              creating a connected infrastructure for public-interest investigation and accountability.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200}>
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3 px-5 py-4 bg-off-white rounded-xl border border-border-light">
                <div className="w-10 h-10 rounded-xl bg-teal-subtle flex items-center justify-center text-teal">
                  <Network size={20} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-navy block">Connected Cases</span>
                  <span className="text-xs text-slate-light">Across creators and regions</span>
                </div>
              </div>
              <ArrowUpRight size={20} className="text-slate-light rotate-0 sm:rotate-0 hidden sm:block" />
              <div className="flex items-center gap-3 px-5 py-4 bg-off-white rounded-xl border border-border-light">
                <div className="w-10 h-10 rounded-xl bg-teal-subtle flex items-center justify-center text-teal">
                  <Telescope size={20} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-navy block">Public Accountability</span>
                  <span className="text-xs text-slate-light">Transparent investigation tracking</span>
                </div>
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={300}>
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-subtle border border-teal/10 rounded-full">
              <Telescope size={12} className="text-teal" />
              <span className="text-xs text-teal font-medium">
                This represents our long-term vision, not a currently available feature.
              </span>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
