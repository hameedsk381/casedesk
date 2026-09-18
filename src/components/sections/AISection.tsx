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
                <span className="text-muted-foreground">You handle the judgment.</span>
              </>
            }
            body="CaseDesk uses AI to structure and summarize information, identify gaps, organize evidence, and prepare investigation briefs — while keeping the creator in control of verification and publication."
          />
        </AnimateOnScroll>

        {/* Before / After */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Before — Raw message */}
          <AnimateOnScroll animation="slide-in-left">
            <div className="bg-white rounded-xl border border-surface-3 p-6 h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                  <MessageSquare size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary">Citizen Message</span>
                  <span className="block text-[10px] text-muted-foreground">via WhatsApp</span>
                </div>
              </div>
              <div className="bg-background rounded-lg p-4 border border-surface-3">
                <p className="text-sm leading-relaxed text-primary/80 italic">
                  &quot;Sir please help. My father died in the government hospital and nobody is
                  responding to our complaint. We have documents.&quot;
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
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
            <div className="bg-white rounded-xl border border-primary/20 p-6 h-full ring-1 ring-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary">AI-Generated Case</span>
                    <span className="block text-[10px] text-primary">Structured automatically</span>
                  </div>
                </div>
                <Badge variant="blue" dot>Draft</Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-primary">Government Hospital Complaint</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Category</span>
                    <Badge variant="success">Healthcare</Badge>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Location</span>
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <MapPin size={11} className="text-muted-foreground" /> Guntur
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Priority</span>
                    <Badge variant="destructive" dot>High</Badge>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Evidence</span>
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <FileText size={11} className="text-muted-foreground" /> Documents mentioned
                    </span>
                  </div>
                </div>

                <div className="bg-warning-subtle rounded-lg p-3 border border-warning/10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <HelpCircle size={12} className="text-warning" />
                    <span className="text-[10px] font-semibold text-warning uppercase tracking-wider">Missing Information</span>
                  </div>
                  <ul className="space-y-1">
                    <li className="text-xs text-primary/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-warning" /> Hospital name
                    </li>
                    <li className="text-xs text-primary/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-warning" /> Complaint number
                    </li>
                    <li className="text-xs text-primary/70 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-warning" /> Date of incident
                    </li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-warning" />
                  <span className="text-xs text-muted-foreground">Status: Needs Verification</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-3 flex items-center justify-between">
                <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                  <Bot size={10} /> AI-assisted. Human verified.
                </span>
                <button className="text-[10px] font-semibold text-primary flex items-center gap-1 hover:underline">
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
