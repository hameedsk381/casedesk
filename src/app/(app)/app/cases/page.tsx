'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Loader2,
  FolderOpen,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import CaseStatusBadge from '@/components/app/CaseStatusBadge';
import PriorityBadge from '@/components/app/PriorityBadge';
import CaseHealthBadge from '@/components/app/CaseHealthBadge';
import IntakeChoiceModal from '@/components/app/IntakeChoiceModal';

const CATEGORIES = [
  'ALL',
  'Healthcare',
  'Government Services',
  'Police / Law Enforcement',
  'Education',
  'Land / Property',
  'Consumer Complaint',
  'Employment',
  'Infrastructure',
  'Environment',
  'Public Safety',
  'Financial',
];

const STATUSES = [
  'ALL',
  'NEW',
  'TRIAGE',
  'NEEDS_INFORMATION',
  'UNDER_REVIEW',
  'VERIFICATION',
  'INVESTIGATION',
  'CONTENT_READY',
  'PUBLISHED',
  'FOLLOW_UP',
  'RESOLVED',
  'CLOSED',
];

const PRIORITIES = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

const HEALTH_OPTIONS = [
  { id: 'ALL', label: 'All Health' },
  { id: 'BLOCKED', label: '🔴 Blocked' },
  { id: 'NEEDS_ATTENTION', label: '🟡 Needs Attention' },
  { id: 'ON_TRACK', label: '🟢 On Track' },
];

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/cases?${params.toString()}`);
      const data = await res.json();
      let list = data.cases || [];

      if (healthFilter !== 'ALL') {
        list = list.filter((c: any) => c.healthStatus === healthFilter);
      }

      setCases(list);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCases();
    }, 150);
    return () => clearTimeout(timer);
  }, [statusFilter, priorityFilter, categoryFilter, healthFilter, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Intake Choice Modal */}
      <IntakeChoiceModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary">
            Case Registry 2.0
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All citizen reports, active investigations, diagnostic health metrics, and next operational steps.
          </p>
        </div>

        <button
          onClick={() => setIsIntakeModalOpen(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-xs transition-all self-start sm:self-auto cursor-pointer hover:shadow-md active:scale-95"
        >
          <Plus size={16} />
          <span>＋ New Case</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-surface-3 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case number, title, next action, location, or complainant..."
              className="w-full pl-10 pr-4 py-2 bg-background/50 border border-surface-3 rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 self-end md:self-auto border border-surface-3 rounded-xl p-1 bg-background/40">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-500 hover:text-primary'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-500 hover:text-primary'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Filter Dropdowns & Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-3/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
            <Filter size={13} />
            <span>Filters:</span>
          </div>

          {/* Health Filter */}
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="text-xs bg-background border border-surface-3 rounded-lg px-2.5 py-1.5 text-primary font-semibold focus:outline-none cursor-pointer"
          >
            {HEALTH_OPTIONS.map((h) => (
              <option key={h.id} value={h.id}>
                Health: {h.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-background border border-surface-3 rounded-lg px-2.5 py-1.5 text-primary font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            {STATUSES.filter((s) => s !== 'ALL').map((s) => (
              <option key={s} value={s}>
                Status: {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-background border border-surface-3 rounded-lg px-2.5 py-1.5 text-primary font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Priority: All</option>
            {PRIORITIES.filter((p) => p !== 'ALL').map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-background border border-surface-3 rounded-lg px-2.5 py-1.5 text-primary font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Category: All</option>
            {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(statusFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            categoryFilter !== 'ALL' ||
            healthFilter !== 'ALL' ||
            search) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setCategoryFilter('ALL');
                setHealthFilter('ALL');
                setSearch('');
              }}
              className="text-xs font-bold text-primary hover:underline ml-auto cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Case List Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-surface-3 p-16 flex flex-col items-center justify-center text-slate-500">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <span className="text-sm font-medium">Filtering case registry...</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-surface-3 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={28} />
          </div>
          <h3 className="text-base font-bold text-primary">No cases match your filters</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search keywords or reset filter conditions to see all registered cases.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsIntakeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl"
            >
              <Plus size={14} /> Create a new case
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View 2.0 with Health, Next Action, and Verification % */
        <div className="bg-white rounded-3xl border border-surface-3 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-3 bg-background/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Case & Location</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Next Action</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Assigned</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3/60 text-xs">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-background/50 transition-colors group">
                    {/* Case details */}
                    <td className="py-4 px-4 min-w-[220px] max-w-[280px]">
                      <Link href={`/app/cases/${c.id}`} className="block">
                        <span className="font-mono text-[11px] font-bold text-primary">
                          {c.caseNumber}
                        </span>
                        <div className="font-bold text-primary group-hover:text-primary transition-colors line-clamp-2 mt-0.5 leading-snug">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>{c.category}</span>
                          <span>•</span>
                          <span>{c.location}</span>
                        </div>
                      </Link>
                    </td>

                    {/* Health */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <CaseHealthBadge
                        status={c.healthStatus}
                        reason={c.healthReason}
                        size="sm"
                        showReason={true}
                      />
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <CaseStatusBadge status={c.status} size="sm" />
                    </td>

                    {/* Next Action */}
                    <td className="py-4 px-4 min-w-[200px] max-w-[240px]">
                      <div className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2 bg-background/80 p-2 rounded-xl border border-surface-3/60">
                        {c.nextAction || 'Conduct initial witness interview and formulate verification plan'}
                      </div>
                    </td>

                    {/* Verification % Progress */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-1.5 min-w-[90px]">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-500">
                            {c.verifiedCount || 0}/{c.totalVerificationCount || 0}
                          </span>
                          <span
                            className={
                              c.verificationPercentage >= 60
                                ? 'text-success'
                                : c.verificationPercentage > 0
                                ? 'text-amber-600'
                                : 'text-slate-500'
                            }
                          >
                            {c.verificationPercentage || 0}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              c.verificationPercentage >= 60
                                ? 'bg-success'
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
                      <span className="text-slate-600 font-medium">
                        {c.assignedTo?.name?.split(' ')[0] || 'Unassigned'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-slate-100 rounded-xl border border-surface-3 transition-colors inline-block"
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
      ) : (
        /* Grid View 2.0 with Health and Next Action */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/app/cases/${c.id}`}
              className="p-6 bg-white rounded-3xl border border-surface-3 shadow-xs hover:border-primary hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-xs font-bold text-primary">
                    {c.caseNumber}
                  </span>
                  <CaseHealthBadge status={c.healthStatus} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {c.title}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {c.summary}
                </p>

                {/* Next Action Snippet */}
                <div className="mt-3.5 p-2.5 bg-background/80 rounded-xl border border-surface-3/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Next Action
                  </div>
                  <div className="text-xs font-semibold text-primary line-clamp-2 leading-snug">
                    {c.nextAction || 'Formulate verification plan and contact complainant'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-3/60 space-y-3">
                {/* Verification Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">
                      Verification ({c.verifiedCount || 0}/{c.totalVerificationCount || 0})
                    </span>
                    <span className={c.verificationPercentage >= 60 ? 'text-success' : 'text-slate-600'}>
                      {c.verificationPercentage || 0}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.verificationPercentage >= 60
                          ? 'bg-success'
                          : c.verificationPercentage > 0
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${Math.max(4, c.verificationPercentage || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} />
                    <span className="truncate max-w-[130px]">{c.location}</span>
                  </div>
                  <PriorityBadge priority={c.priority} size="sm" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <User size={11} />
                    <span>{c.assignedTo?.name?.split(' ')[0] || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={11} />
                    <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
