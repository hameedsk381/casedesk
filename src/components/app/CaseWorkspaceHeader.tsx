'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FilePlus,
  Send,
  Sparkles,
  Share2,
  ChevronDown,
  Clock,
  MapPin,
  Check,
  Edit3,
} from 'lucide-react';
import CaseStatusBadge from './CaseStatusBadge';
import PriorityBadge from './PriorityBadge';

interface CaseWorkspaceHeaderProps {
  caseRecord: any;
  users: any[];
}

const TABS = [
  { label: 'Overview', slug: '' },
  { label: 'Claims', slug: 'claims' },
  { label: 'Evidence', slug: 'evidence' },
  { label: 'Investigation', slug: 'investigation' },
  { label: 'Timeline', slug: 'timeline' },
  { label: 'Contacts', slug: 'contacts' },
  { label: 'Content', slug: 'content' },
  { label: 'Follow-up', slug: 'follow-up' },
];

export default function CaseWorkspaceHeader({ caseRecord, users }: CaseWorkspaceHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/app/cases/${caseRecord.id}`;
  const [status, setStatus] = useState(caseRecord.status);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setUpdating(true);
    try {
      await fetch(`/api/cases/${caseRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getActiveTab = () => {
    const subPath = pathname.replace(basePath, '').replace(/^\//, '');
    return subPath || '';
  };

  const activeTab = getActiveTab();

  return (
    <div className="bg-white border-b border-surface-3 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 pt-6">
      {/* Top Meta & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {caseRecord.caseNumber}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {caseRecord.category}
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} />
              <span>{caseRecord.location}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary">
            {caseRecord.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PriorityBadge priority={caseRecord.priority} />
            <CaseStatusBadge status={status} />
            {caseRecord.sources?.[0] && (
              <span className="text-xs text-slate-500 ml-2">
                Source:{' '}
                <strong className="text-primary">
                  {caseRecord.sources[0].anonymous ? 'Anonymous Complainant' : caseRecord.sources[0].name}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Quick Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Quick status change */}
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className="text-xs bg-background border border-surface-3 rounded-xl px-3 py-2 text-primary font-semibold focus:outline-none cursor-pointer"
          >
            <option value="NEW">Status: New</option>
            <option value="TRIAGE">Status: Triage</option>
            <option value="NEEDS_INFORMATION">Status: Needs Info</option>
            <option value="UNDER_REVIEW">Status: Under Review</option>
            <option value="VERIFICATION">Status: Verification</option>
            <option value="INVESTIGATION">Status: Investigation</option>
            <option value="CONTENT_READY">Status: Content Ready</option>
            <option value="PUBLISHED">Status: Published</option>
            <option value="FOLLOW_UP">Status: Follow Up</option>
            <option value="RESOLVED">Status: Resolved</option>
            <option value="CLOSED">Status: Closed</option>
          </select>

          <Link
            href={`${basePath}/evidence`}
            className="px-3 py-2 bg-background hover:bg-slate-100 text-primary font-semibold text-xs rounded-xl border border-surface-3 transition-colors flex items-center gap-1.5"
          >
            <FilePlus size={14} className="text-primary" />
            <span>Add Evidence</span>
          </Link>

          <Link
            href={`${basePath}/contacts`}
            className="px-3 py-2 bg-background hover:bg-slate-100 text-primary font-semibold text-xs rounded-xl border border-surface-3 transition-colors flex items-center gap-1.5"
          >
            <Send size={14} className="text-warning" />
            <span>Request Response</span>
          </Link>

          <Link
            href={`${basePath}/content`}
            className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Share2 size={14} className="text-success" />
            <span>Create Content</span>
          </Link>
        </div>
      </div>

      {/* Source Intake Provenance Banner */}
      {((caseRecord.createdFromIntakes && caseRecord.createdFromIntakes.length > 0) ||
        (caseRecord.mergedIntakes && caseRecord.mergedIntakes.length > 0)) && (
        <div className="mb-4 p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-primary font-medium">
              <span className="p-1 bg-primary/10 text-primary rounded-md font-bold text-[11px] uppercase tracking-wider">
                Intake Provenance
              </span>
              {caseRecord.createdFromIntakes?.[0] ? (
                <span>
                  Created from{' '}
                  <strong className="text-primary font-semibold">
                    {caseRecord.createdFromIntakes[0].sourceType} dispatch
                  </strong>{' '}
                  ({new Date(caseRecord.createdFromIntakes[0].createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })})
                  {caseRecord.createdFromIntakes[0].senderName && (
                    <span className="text-slate-600"> by {caseRecord.createdFromIntakes[0].senderName}</span>
                  )}
                </span>
              ) : (
                <span>Manually registered case</span>
              )}

              {caseRecord.mergedIntakes && caseRecord.mergedIntakes.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[11px]">
                  +{caseRecord.mergedIntakes.length} merged report{caseRecord.mergedIntakes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <Link
              href="/app/inbox"
              className="text-primary hover:text-primary font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <span>View in Inbox</span>
              <ChevronDown size={14} className="-rotate-90" />
            </Link>
          </div>

          {/* Merged Reports Drawer Preview */}
          {caseRecord.mergedIntakes && caseRecord.mergedIntakes.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-blue-200/50 space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Contributing Citizen Reports ({caseRecord.mergedIntakes.length}):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {caseRecord.mergedIntakes.map((merged: any) => (
                  <div
                    key={merged.id}
                    className="p-2 bg-white/80 rounded-lg border border-blue-100 text-slate-700 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-primary">
                        {merged.sourceType} • {merged.senderName || 'Anonymous'}
                      </span>
                      <span className="text-slate-500">
                        {new Date(merged.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] line-clamp-2 text-slate-600 leading-relaxed">
                      {merged.aiSummary || merged.rawText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-surface-3/70 pt-1 -mb-px">
        {TABS.map((tab) => {
          const tabHref = tab.slug ? `${basePath}/${tab.slug}` : basePath;
          const isTabActive = activeTab === tab.slug;

          return (
            <Link
              key={tab.slug}
              href={tabHref}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isTabActive
                  ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-primary hover:border-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
