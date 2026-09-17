'use client';

import React from 'react';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Button from '@/components/ui/Button';
import { ArrowRight, MessageCircle } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-primary text-white relative overflow-hidden" id="cta">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-success/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <AnimateOnScroll>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
              Your next important case
              <br />
              shouldn&apos;t get lost in your inbox.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-secondary max-w-xl mx-auto">
              CaseDesk gives public-interest creators one place to organize, investigate, create, and follow through.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="!bg-white !text-primary hover:!bg-surface">
                Join the Waitlist
                <ArrowRight size={16} />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="!text-white/80 hover:!text-white hover:!bg-white/10 border border-white/20"
              >
                <MessageCircle size={16} />
                Talk to Us
              </Button>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
