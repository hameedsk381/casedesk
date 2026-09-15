'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FolderPlus,
  Inbox,
  ChevronRight,
  Sparkles,
  X,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Filter,
} from 'lucide-react';
import CaseStatusBadge from '@/components/app/CaseStatusBadge';
import PriorityBadge from '@/components/app/PriorityBadge';
import CaseHealthBadge from '@/components/app/CaseHealthBadge';
import IntakeChoiceModal from '@/components/app/IntakeChoiceModal';

interface DashboardClientProps {
  cases: any[];
  urgentCases: any[];
  blockedCases: any[];
  needsAttentionCases: any[];
  dueTodayCases: any[];
  inboxUnprocessedCount: number;
  recentActivities: any[];
}

export default function DashboardClient({
  cases,
  urgentCases,
  blockedCases,
  needsAttentionCases,
  dueTodayCases,
  inboxUnprocessedCount,
  recentActivities,
}: DashboardClientProps) {
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('casedesk_onboarding_dismissed');
    if (dismissed === 'true') {
      setShowOnboarding(false);
    }
  }, []);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('casedesk_onboarding_dismissed', 'true');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Intelligent Intake Modal */}
      <IntakeChoiceModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
      />

      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-border-light shadow-xs bg-radial from-slate-50 to-white">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Live Investigation Ops
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
            Your Investigation Desk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate max-w-2xl leading-relaxed">
            Organize citizen complaints, verify core claims, manage evidence, and follow every case through to real public impact.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/app/inbox"
            className="px-4 py-2.5 bg-off-white hover:bg-slate-100 text-navy font-bold text-xs rounded-xl border border-border-light transition-colors flex items-center gap-2"
          >
            <Inbox size={15} className="text-electric-blue" />
            <span>Intake Inbox</span>
            {inboxUnprocessedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-electric-blue text-white text-[10px] font-bold">
                {inboxUnprocessedCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsIntakeModalOpen(true)}
            className="px-4 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-md active:scale-95"
          >
            <FolderPlus size={15} />
            <span>＋ New Case</span>
          </button>
        </div>
      </div>

      {/* Dismissible Onboarding Quick Guide */}
      {showOnboarding && (
        <div className="p-5 sm:p-6 bg-navy text-white rounded-3xl relative overflow-hidden shadow-lg border border-navy/30">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-electric-blue/15 blur-2xl pointer-events-none" />

          <button
            onClick={handleDismissOnboarding}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss guide"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
              Creator Workflow Guide
            </span>
            <span className="text-xs text-slate-300 font-medium">
              4 Steps from Complaint to Published Impact
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal">
                Step 1: Intake
              </div>
              <div className="text-xs font-bold text-white">Bring in a complaint</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Paste WhatsApp forwards, DMs, or audio grievances into the inbox buffer.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-electric-blue">
                Step 2: AI Triage
              </div>
              <div className="text-xs font-bold text-white">Review AI brief</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Review suggested claims, locations, and missing pieces. Edit with editorial judgment.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Step 3: Verification
              </div>
              <div className="text-xs font-bold text-white">Investigate & verify</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cross-check records, send formal right-of-reply requests, and attach primary evidence.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Step 4: Editorial
              </div>
              <div className="text-xs font-bold text-white">Create & follow up</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Draft reels or carousels in Content Studio and monitor official remedial responses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Section — "Needs Your Attention" Action Center */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight text-navy">
              Needs Your Attention
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-coral">
              High-Urgency Action Items
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Prioritized by overdue deadlines & blocked states
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Blocked Cases */}
          <Link
            href="/app/cases"
            className="p-5 bg-white rounded-3xl border border-red-200/90 shadow-xs hover:border-red-400 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Blocked Cases
              </span>
              <div className="w-7 h-7 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <AlertCircle size={15} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-red-600">
              {blockedCases.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 line-clamp-1 font-medium">
              {blockedCases[0] ? blockedCases[0].healthReason : 'No blocked cases'}
            </div>
            <div className="mt-4 pt-3 border-t border-border-light/60 flex items-center justify-between text-[11px] font-bold text-red-600 group-hover:underline">
              <span>View Blocked Cases</span>
              <ArrowRight size={12} />
            </div>
          </Link>

          {/* Card 2: Needs Attention */}
          <Link
            href="/app/cases"
            className="p-5 bg-white rounded-3xl border border-amber-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Needs Attention
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-amber-700">
              {needsAttentionCases.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 line-clamp-1 font-medium">
              {needsAttentionCases[0] ? needsAttentionCases[0].healthReason : 'Verification pending'}
            </div>
            <div className="mt-4 pt-3 border-t border-border-light/60 flex items-center justify-between text-[11px] font-bold text-amber-700 group-hover:underline">
              <span>Resolve Incomplete</span>
              <ArrowRight size={12} />
            </div>
          </Link>

          {/* Card 3: Due Today / Follow-ups */}
          <Link
            href="/app/cases?status=FOLLOW_UP"
            className="p-5 bg-white rounded-3xl border border-border-light shadow-xs hover:border-electric-blue hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Follow-ups / Today
              </span>
              <div className="w-7 h-7 rounded-xl bg-electric-blue/10 text-electric-blue flex items-center justify-center">
                <Clock size={15} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-navy group-hover:text-electric-blue transition-colors">
              {dueTodayCases.length}
            </div>
            <div className="mt-1 text-xs text-slate-500 line-clamp-1 font-medium">
              Official inquiry deadlines & impact reviews
            </div>
            <div className="mt-4 pt-3 border-t border-border-light/60 flex items-center justify-between text-[11px] font-bold text-electric-blue group-hover:underline">
              <span>Review Follow-ups</span>
              <ArrowRight size={12} />
            </div>
          </Link>

          {/* Card 4: Unprocessed Citizen Reports */}
          <Link
            href="/app/inbox"
            className="p-5 bg-white rounded-3xl border border-border-light shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Intake Inbox
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Inbox size={15} />
              </div>
            </div>
            <div className="mt-3 text-3xl font-black text-navy group-hover:text-emerald-600 transition-colors">
              {inboxUnprocessedCount}
            </div>
            <div className="mt-1 text-xs text-slate-500 line-clamp-1 font-medium">
              WhatsApp & DM reports waiting for triage
            </div>
            <div className="mt-4 pt-3 border-t border-border-light/60 flex items-center justify-between text-[11px] font-bold text-emerald-600 group-hover:underline">
              <span>Open Triage Buffer</span>
              <ArrowRight size={12} />
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Action-Oriented Case Table & Urgent Attention Queue */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Action-Oriented Cases Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-navy">
                Investigation Cases
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Action & Health Desk
              </span>
            </div>
            <Link
              href="/app/cases"
              className="text-xs font-bold text-electric-blue hover:underline flex items-center gap-1"
            >
              <span>View full registry ({cases.length})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-border-light shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-light bg-off-white/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Case & Location</th>
                    <th className="py-3.5 px-4">Health</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Next Action</th>
                    <th className="py-3.5 px-4">Verification</th>
                    <th className="py-3.5 px-4">Assigned</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light/60 text-xs">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-off-white/50 transition-colors group">
                      {/* Case details */}
                      <td className="py-4 px-4 min-w-[200px] max-w-[260px]">
                        <Link href={`/app/cases/${c.id}`} className="block">
                          <span className="font-mono text-[11px] font-bold text-electric-blue">
                            {c.caseNumber}
                          </span>
                          <div className="font-bold text-navy group-hover:text-electric-blue transition-colors line-clamp-2 mt-0.5 leading-snug">
                            {c.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                            <span>{c.category}</span>
                            <span>•</span>
                            <span>{c.location}</span>
                          </div>
                        </Link>
                      </td>

                      {/* Case Health */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <CaseHealthBadge
                          status={c.healthStatus}
                          reason={c.healthReason}
                          size="sm"
                          showReason={true}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <CaseStatusBadge status={c.status} size="sm" />
                      </td>

                      {/* Next Action */}
                      <td className="py-4 px-4 min-w-[200px] max-w-[240px]">
                        <div className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2 bg-off-white/80 p-2 rounded-xl border border-border-light/60">
                          {c.nextAction || 'Conduct initial witness interview and formulate verification plan'}
                        </div>
                      </td>

                      {/* Verification % Progress Bar */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1.5 min-w-[90px]">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">
                              {c.verifiedCount || 0}/{c.totalVerificationCount || 0}
                            </span>
                            <span
                              className={
                                c.verificationPercentage >= 60
                                  ? 'text-teal'
                                  : c.verificationPercentage > 0
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }
                            >
                              {c.verificationPercentage || 0}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                c.verificationPercentage >= 60
                                  ? 'bg-teal'
                                  : c.verificationPercentage > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${Math.max(4, c.verificationPercentage || 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Assigned */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center overflow-hidden">
                            {c.assignedTo?.avatarUrl ? (
                              <img src={c.assignedTo.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              c.assignedTo?.name?.[0] || '?'
                            )}
                          </div>
                          <span className="text-slate-600 font-medium">
                            {c.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/app/cases/${c.id}`}
                          className="px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-slate-100 rounded-xl border border-border-light transition-colors inline-block"
                        >
                          Open Desk
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Attention Queue & Live Audit Feed */}
        <div className="space-y-6">
          {/* Urgent Attention Queue with Explicit Diagnosis */}
          <div className="bg-white p-5 rounded-3xl border border-red-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2">
                <ShieldAlert size={17} className="text-coral" />
                <h3 className="text-sm font-black text-navy">Urgent Attention Queue</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-coral">
                {urgentCases.length} Cases
              </span>
            </div>

            <div className="divide-y divide-border-light/60">
              {urgentCases.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/cases/${c.id}`}
                  className="block py-3 hover:bg-off-white/60 -mx-2 px-2 rounded-2xl transition-all group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-electric-blue">{c.caseNumber}</span>
                    <CaseHealthBadge status={c.healthStatus} size="sm" />
                  </div>

                  <div className="mt-1 text-xs font-bold text-navy group-hover:text-electric-blue transition-colors line-clamp-2">
                    {c.title}
                  </div>

                  {/* Explicit reason for attention */}
                  <div className="mt-1.5 p-2 rounded-xl bg-red-50/70 border border-red-100 text-[11px] text-red-800 font-medium">
                    <span className="font-bold">Attention Reason: </span>
                    {c.healthReason || c.nextAction || 'Requires immediate triage review'}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{c.location}</span>
                    <span>Assigned: {c.assignedTo?.name?.split(' ')[0] || 'Unassigned'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live Activity Log */}
          <div className="bg-white p-5 rounded-3xl border border-border-light shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <h3 className="text-sm font-black text-navy">Live Operations Stream</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Audit Trail
              </span>
            </div>

            <div className="space-y-3.5">
              {recentActivities.map((act) => (
                <div key={act.id} className="text-xs space-y-0.5">
                  <div className="font-bold text-navy">
                    {act.user?.name || 'System'}{' '}
                    <span className="font-normal text-slate-500">
                      {act.action.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                  {act.case && (
                    <Link
                      href={`/app/cases/${act.caseId}`}
                      className="font-mono text-[11px] text-electric-blue hover:underline block truncate"
                    >
                      {act.case.caseNumber} — {act.case.title}
                    </Link>
                  )}
                  <div className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
