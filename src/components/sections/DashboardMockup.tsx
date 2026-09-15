'use client';

import React from 'react';
import Badge from '@/components/ui/Badge';
import {
  AlertTriangle,
  FileText,
  Users,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';

const stats = [
  { label: 'New Cases', value: '12', color: 'blue' as const },
  { label: 'Urgent', value: '4', color: 'red' as const },
  { label: 'Under Investigation', value: '8', color: 'yellow' as const },
  { label: 'Content Ready', value: '3', color: 'green' as const },
  { label: 'Follow-ups', value: '6', color: 'coral' as const },
];

const cases = [
  {
    id: 'CD-1247',
    title: 'Government Hospital Complaint',
    category: 'Healthcare',
    location: 'Guntur',
    priority: 'High',
    priorityColor: 'red' as const,
    status: 'Under Investigation',
    statusColor: 'yellow' as const,
    date: '12 Sep',
    evidence: 3,
    tasks: 2,
  },
  {
    id: 'CD-1246',
    title: 'Land Acquisition Dispute',
    category: 'Revenue',
    location: 'Vijayawada',
    priority: 'High',
    priorityColor: 'red' as const,
    status: 'Needs Verification',
    statusColor: 'coral' as const,
    date: '11 Sep',
    evidence: 5,
    tasks: 4,
  },
  {
    id: 'CD-1245',
    title: 'Delayed Pension Case',
    category: 'Social Welfare',
    location: 'Tirupati',
    priority: 'Medium',
    priorityColor: 'yellow' as const,
    status: 'Content Ready',
    statusColor: 'green' as const,
    date: '10 Sep',
    evidence: 2,
    tasks: 1,
  },
  {
    id: 'CD-1244',
    title: 'Consumer Fraud Complaint',
    category: 'Consumer',
    location: 'Hyderabad',
    priority: 'Medium',
    priorityColor: 'yellow' as const,
    status: 'New',
    statusColor: 'blue' as const,
    date: '10 Sep',
    evidence: 1,
    tasks: 0,
  },
];

export default function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto lg:mx-0">
      {/* Outer browser chrome */}
      <div className="bg-white rounded-xl border border-border shadow-xl shadow-navy/5 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-cream/60 border-b border-border-light">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green/40" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-0.5 bg-white rounded text-[10px] text-slate-light border border-border-light">
              app.casedesk.io
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4">
          {/* Dashboard header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-navy">Case Dashboard</h3>
              <p className="text-[11px] text-slate-light mt-0.5">September 2026</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-electric-blue-subtle flex items-center justify-center">
                <Users size={12} className="text-electric-blue" />
              </div>
              <div className="w-6 h-6 rounded-full bg-cream flex items-center justify-center">
                <span className="text-[10px] font-semibold text-navy">SK</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-off-white rounded-lg p-2 text-center border border-border-light"
              >
                <div className="text-base font-bold text-navy">{stat.value}</div>
                <div className="text-[9px] text-slate-light mt-0.5 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Case list */}
          <div className="space-y-2">
            {cases.map((c, i) => (
              <div
                key={c.id}
                className={`group flex items-start gap-3 p-3 rounded-lg border border-border-light bg-white hover:bg-cream/40 transition-all duration-200 cursor-pointer ${
                  i === 0 ? 'ring-1 ring-electric-blue/20 border-electric-blue/30' : ''
                }`}
              >
                {/* Priority indicator */}
                <div className="mt-1 flex-shrink-0">
                  {c.priority === 'High' ? (
                    <AlertTriangle size={14} className="text-red" />
                  ) : (
                    <FileText size={14} className="text-slate-light" />
                  )}
                </div>

                {/* Case info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-light">{c.id}</span>
                    <Badge variant={c.statusColor} className="!text-[9px] !px-1.5 !py-0.5">
                      {c.status}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-navy truncate">{c.title}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-slate-light">
                      <MapPin size={10} /> {c.location}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-light">
                      <FileText size={10} /> {c.evidence}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-light">
                      <CheckCircle size={10} /> {c.tasks}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-light">
                      <Clock size={10} /> {c.date}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight
                  size={14}
                  className="text-slate-light mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -inset-4 bg-electric-blue/5 rounded-2xl -z-10 blur-2xl" />
    </div>
  );
}
