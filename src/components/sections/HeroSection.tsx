'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import DashboardMockup from '@/components/sections/DashboardMockup';
import { ArrowRight, Play } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden" id="product">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <AnimateOnScroll animation="fade-in-up">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary mb-5">
                The case desk for public-interest creators
              </span>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in-up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight text-primary">
                Turn messages
                <br />
                into cases.
                <br />
                <span className="text-primary">Cases into action.</span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in-up" delay={200}>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-md">
                Collect complaints, organize evidence, verify claims, create content, and track what
                happens next — all from one workspace.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in-up" delay={300}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#cta" size="lg">
                  Join the Waitlist
                  <ArrowRight size={16} />
                </Button>
                <Button href="#how-it-works" variant="secondary" size="lg">
                  <Play size={14} />
                  See How It Works
                </Button>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Right — Dashboard Mockup */}
          <AnimateOnScroll animation="scale-in" delay={200} className="lg:pl-4">
            <DashboardMockup />
          </AnimateOnScroll>
        </div>
      </div>

      {/* Background subtle gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/[0.03] to-transparent -z-10 pointer-events-none" />
    </section>
  );
}
