'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import {
  Shield,
  Lock,
  History,
  UserCheck,
  ScanEye,
  Share,
  FileCheck,
} from 'lucide-react';

const features = [
  { icon: <UserCheck size={20} />, title: 'Role-based access', description: 'Control who sees what at every level.' },
  { icon: <Lock size={20} />, title: 'Secure evidence storage', description: 'Documents and media protected at rest.' },
  { icon: <History size={20} />, title: 'Audit history', description: 'Full trail of every case action and change.' },
  { icon: <Shield size={20} />, title: 'Consent tracking', description: 'Record and respect complainant preferences.' },
  { icon: <ScanEye size={20} />, title: 'PII detection', description: 'Identify sensitive personal information.' },
  { icon: <Share size={20} />, title: 'Controlled sharing', description: 'Share selectively with full access control.' },
  { icon: <FileCheck size={20} />, title: 'Publication review', description: 'Review gates before any content goes live.' },
];

export default function SecuritySection() {
  return (
    <section className="py-20 lg:py-28" id="security">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Security & Privacy"
            headline={
              <>
                Sensitive cases deserve
                <br />
                <span className="text-muted-foreground">serious protection.</span>
              </>
            }
            body="Citizen complaints can contain deeply personal information. CaseDesk is designed around controlled access, responsible handling, and deliberate publication."
          />
        </AnimateOnScroll>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <AnimateOnScroll key={feature.title} animation="fade-in-up" delay={i * 80}>
              <div className="group bg-white rounded-xl border border-surface-3 p-5 hover:border-border hover:shadow-sm transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-primary mb-1">{feature.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
