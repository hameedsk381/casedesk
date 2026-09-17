'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import FeatureCard from '@/components/ui/FeatureCard';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import { Inbox, Layers, Search, RotateCcw } from 'lucide-react';

const problems = [
  {
    icon: <Inbox size={20} />,
    title: 'Lost in the inbox',
    description: 'Important complaints disappear among hundreds of messages.',
  },
  {
    icon: <Layers size={20} />,
    title: 'Scattered evidence',
    description: 'Documents, photos, videos, and conversations live across different platforms.',
  },
  {
    icon: <Search size={20} />,
    title: 'Manual verification',
    description:
      'Creators spend hours asking the same questions and organizing information.',
  },
  {
    icon: <RotateCcw size={20} />,
    title: 'No follow-through',
    description:
      'After a story is published, there is often no structured way to track what happened next.',
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            headline={
              <>
                The problem isn&apos;t a lack of stories.
                <br />
                <span className="text-muted-foreground">It&apos;s too many of them.</span>
              </>
            }
            body="Creators who speak about public issues often receive a constant stream of complaints and requests for help. The challenge is separating urgent cases from noise, collecting evidence, verifying claims, coordinating investigation, and remembering to follow up."
          />
        </AnimateOnScroll>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((problem, i) => (
            <AnimateOnScroll key={problem.title} animation="fade-in-up" delay={i * 100}>
              <FeatureCard
                icon={problem.icon}
                title={problem.title}
                description={problem.description}
              />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
