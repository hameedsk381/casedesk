'use client';

import React from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimateOnScroll from '@/components/ui/AnimateOnScroll';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Users,
  Search,
  PenTool,
  Scale,
  Share2,
  CheckCircle,
  MessageSquare,
  Clock,
  ListTodo,
} from 'lucide-react';

const roles = [
  { icon: <Search size={14} />, label: 'Researchers' },
  { icon: <Users size={14} />, label: 'Reporters' },
  { icon: <PenTool size={14} />, label: 'Editors' },
  { icon: <Scale size={14} />, label: 'Legal Reviewers' },
  { icon: <Share2 size={14} />, label: 'Social Media Managers' },
];

const activities = [
  { icon: <CheckCircle size={12} className="text-green" />, action: 'Editor verified complaint document', time: '2h ago' },
  { icon: <MessageSquare size={12} className="text-primary" />, action: 'Researcher added internal note', time: '3h ago' },
  { icon: <ListTodo size={12} className="text-warning" />, action: 'Task assigned to investigator', time: '5h ago' },
  { icon: <Clock size={12} className="text-yellow" />, action: 'Deadline updated for response', time: '1d ago' },
];

export default function TeamSection() {
  return (
    <section className="py-20 lg:py-28" id="teams">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="For Teams"
            headline={
              <>
                Built for creators.
                <br />
                <span className="text-muted-foreground">Ready for teams.</span>
              </>
            }
            body="Professional creators may work with researchers, reporters, editors, legal reviewers, and social media managers."
          />
        </AnimateOnScroll>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Roles */}
          <AnimateOnScroll animation="slide-in-left" delay={100}>
            <div className="bg-white rounded-xl border border-surface-3 p-6">
              <h3 className="text-sm font-semibold text-primary mb-4">Team Roles</h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.label}
                    className="flex items-center gap-3 px-4 py-3 bg-background rounded-lg border border-surface-3 hover:border-border transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary-subtle flex items-center justify-center text-primary">
                      {role.icon}
                    </div>
                    <span className="text-sm font-medium text-primary">{role.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>

          {/* Activity */}
          <AnimateOnScroll animation="slide-in-right" delay={200}>
            <div className="bg-white rounded-xl border border-surface-3 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-primary">Activity History</h3>
                <Badge variant="blue">CD-1247</Badge>
              </div>
              <div className="space-y-3">
                {activities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-background rounded-lg border border-surface-3"
                  >
                    <div className="mt-0.5">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-primary block">{activity.action}</span>
                      <span className="text-[11px] text-secondary">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button href="#cta" variant="outline" size="sm" className="w-full">
                  Build your case team
                </Button>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
