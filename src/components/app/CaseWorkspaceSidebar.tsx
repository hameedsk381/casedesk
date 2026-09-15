'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import CaseStatusBadge from './CaseStatusBadge';
import PriorityBadge from './PriorityBadge';
import VerificationBadge from './VerificationBadge';

interface CaseWorkspaceSidebarProps {
  caseRecord: any;
  users: any[];
}

export default function CaseWorkspaceSidebar({ caseRecord, users }: CaseWorkspaceSidebarProps) {
  const router = useRouter();
  const [assignedToId, setAssignedToId] = useState(caseRecord.assignedToId || '');
  const [resolutionStatus, setResolutionStatus] = useState(caseRecord.resolutionStatus || 'OPEN');
  const [saving, setSaving] = useState(false);

  const handleAssignChange = async (userId: string) => {
    setAssignedToId(userId);
    setSaving(true);
    try {
      await fetch(`/api/cases/${caseRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: userId || null }),
      });
      router.refresh();
    } catch (err) {
      console.error('Assign error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResolutionChange = async (newRes: string) => {
    setResolutionStatus(newRes);
    try {
      await fetch(`/api/cases/${caseRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStatus: newRes,
          resolvedAt: newRes === 'RESOLVED' ? new Date() : null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error('Resolution update error:', err);
    }
  };

  const totalVerifications = caseRecord.verificationItems?.length || 0;
  const verifiedCount =
    caseRecord.verificationItems?.filter((v: any) => v.status === 'VERIFIED').length || 0;
  const verificationPercent =
    totalVerifications > 0 ? Math.round((verifiedCount / totalVerifications) * 100) : 0;

  const primarySource = caseRecord.sources?.[0];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* Dossier Meta Card */}
      <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Investigation Dossier Meta
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-light/60">
            <span className="text-slate-500 font-medium">Priority</span>
            <PriorityBadge priority={caseRecord.priority} />
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border-light/60">
            <span className="text-slate-500 font-medium">Status</span>
            <CaseStatusBadge status={caseRecord.status} />
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border-light/60">
            <span className="text-slate-500 font-medium">Category</span>
            <span className="font-semibold text-navy">{caseRecord.category}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border-light/60">
            <span className="text-slate-500 font-medium">Location</span>
            <span className="font-semibold text-navy text-right max-w-[140px] truncate">
              {caseRecord.location}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border-light/60">
            <span className="text-slate-500 font-medium">Assigned Lead</span>
            <select
              value={assignedToId}
              onChange={(e) => handleAssignChange(e.target.value)}
              disabled={saving}
              className="text-xs bg-off-white border border-border-light rounded-lg px-2 py-1 text-navy font-semibold focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Created</span>
            <span>{new Date(caseRecord.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Last Updated</span>
            <span>{new Date(caseRecord.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Verification Progress Card */}
      <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Verification Index
          </h3>
          <VerificationBadge status={caseRecord.verificationStatus} size="sm" />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-navy">Factual Items Verified</span>
            <span className="font-bold text-teal">
              {verifiedCount}/{totalVerifications} ({verificationPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-teal transition-all duration-300"
              style={{ width: `${verificationPercent}%` }}
            />
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 leading-relaxed">
          {totalVerifications === 0
            ? 'No formal verification checklist items added yet.'
            : `${totalVerifications - verifiedCount} statements require primary document or authority corroboration.`}
        </div>
      </div>

      {/* Publication & Resolution Card */}
      <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Editorial Lifecycle
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border-light/60">
            <span className="text-slate-500 font-medium">Publication</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                caseRecord.publicationStatus === 'PUBLISHED'
                  ? 'bg-indigo-50 text-indigo-700'
                  : caseRecord.publicationStatus === 'DRAFT_READY'
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {caseRecord.publicationStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Resolution Status</span>
            <select
              value={resolutionStatus}
              onChange={(e) => handleResolutionChange(e.target.value)}
              className="text-xs bg-off-white border border-border-light rounded-lg px-2 py-1 text-navy font-semibold focus:outline-none cursor-pointer"
            >
              <option value="OPEN">Open</option>
              <option value="ONGOING">Ongoing</option>
              <option value="PARTIALLY_RESOLVED">Partially Resolved</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Source & Complainant Privacy Card */}
      {primarySource && (
        <div className="bg-white p-5 rounded-2xl border border-border-light shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Source Consent Flags
            </h3>
            <ShieldCheck size={16} className="text-teal" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Identity Mode</span>
              <span className="font-semibold text-navy">
                {primarySource.anonymous ? 'ANONYMOUS' : 'Identified'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Contact Consent</span>
              <span
                className={`font-semibold ${
                  primarySource.consentToContact ? 'text-teal' : 'text-slate-400'
                }`}
              >
                {primarySource.consentToContact ? 'Granted ✓' : 'No'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Publish Consent</span>
              <span
                className={`font-semibold ${
                  primarySource.consentToPublish ? 'text-teal' : 'text-coral'
                }`}
              >
                {primarySource.consentToPublish ? 'Granted ✓' : 'Protected (Do not name)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
