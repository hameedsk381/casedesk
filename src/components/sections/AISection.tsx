'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Badge from '@/components/ui/Badge';
import {
  MessageSquare,
  ArrowRight,
  MapPin,
  AlertTriangle,
  FileText,
  HelpCircle,
  Bot,
  User,
} from 'lucide-react';

export default function AISection() {
  return (
    <section className="py-20 lg:py-28" id="features">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="AI-Powered"
            headline={
              <>
                AI handles the busywork.
                <br />
                <span className="text-slate">You handle the judgment.</span>
              </>
            }
            body="CaseDesk uses AI to structure and summarize information, identify gaps, organize evidence, and prepare investigation briefs — while keeping the creator in control of verification and publication."
          />
        </AnimateOnScroll>

        {/* Before / After */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Before — Raw message */}
          <AnimateOnScroll animation="slide-in-left">
            <div className="bg-white rounded-xl border border-border-light p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center">
                  <MessageSquare size={16} className="text-slate" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-navy">Citizen Message</span>
                  <span className="block text-[10px] text-slate-light">via WhatsApp</span>
                </div>
              </div>
              <div className="bg-off-white rounded-lg p-4 border border-border-light">
                <p className="text-sm leading-relaxed text-navy/80 italic">
                  &quot;Sir please help. My father died in the government hospital and nobody is
                  responding to our complaint. We have documents.&quot;
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-light">
                <User size={12} />
                <span>Unstructured citizen complaint</span>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Arrow (desktop only) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            {/* Handled by gap */}
          </div>

          {/* After — AI-generated case */}
          <AnimateOnScroll animation="slide-in-right">
            <div className="bg-white rounded-xl border border-electric-blue/20 p-6 h-full ring-1 ring-electric-blue/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-electric-blue-subtle flex items-center justify-center">
                    <Bot size={16} className="text-electric-blue" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-navy">AI-Generated Case</span>
                    <span className="block text-[10px] text-electric-blue">Structured automatically</span>
                  </div>
                </div>
                <Badge variant="blue" dot>Draft</Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-navy">Government Hospital Complaint</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-light uppercase tracking-wider mt-0.5">Category</span>
                    <Badge variant="teal">Healthcare</Badge>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-light uppercase tracking-wider mt-0.5">Location</span>
                    <span className="flex items-center gap-1 text-xs text-navy">
                      <MapPin size={11} className="text-slate-light" /> Guntur
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-light uppercase tracking-wider mt-0.5">Priority</span>
                    <Badge variant="red" dot>High</Badge>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-slate-light uppercase tracking-wider mt-0.5">Evidence</span>
                    <span className="flex items-center gap-1 text-xs text-navy">
                      <FileText size={11} className="text-slate-light" /> Documents mentioned
                    </span>
                  </div>
                </div>

                <div className="bg-coral-subtle rounded-lg p-3 border border-coral/10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <HelpCircle size={12} className="text-coral" />
                    <span className="text-[10px] font-semibold text-coral uppercase tracking-wider">Missing Information</span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-xs text-navy/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-coral" /> Hospital name
                    </li>
                    <li className="text-xs text-navy/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-coral" /> Complaint number
                    </li>
                    <li className="text-xs text-navy/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-coral" /> Date of incident
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-yellow" />
                  <span className="text-xs text-slate">Status: Needs Verification</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between">
                <span className="text-[10px] font-medium text-electric-blue flex items-center gap-1">
                  <Bot size={10} /> AI-assisted. Human verified.
                </span>
                <button className="text-[10px] font-semibold text-electric-blue flex items-center gap-1 hover:underline">
                  Review Case <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
