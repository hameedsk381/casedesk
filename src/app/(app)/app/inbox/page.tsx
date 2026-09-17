'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Inbox,
  MessageSquare,
  Mic,
  Mail,
  Globe,
  PenTool,
  Search,
  Filter,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Archive,
  GitMerge,
  FileCheck2,
  User,
  Clock,
  ArrowRight,
  X,
  ExternalLink,
  CheckSquare,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import PriorityBadge from '@/components/app/PriorityBadge';
import IntakeDetailModal from '@/components/app/IntakeDetailModal';
import AddIntakeModal from '@/components/app/AddIntakeModal';
import ArchiveReasonModal from '@/components/app/ArchiveReasonModal';

function InstagramIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const SOURCES = [
  { id: 'ALL', label: 'All Sources', icon: MessageSquare },
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'INSTAGRAM', label: 'Instagram DM', icon: InstagramIcon, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  { id: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'VOICE', label: 'Voice Note', icon: Mic, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'WEB_FORM', label: 'Citizen Web', icon: Globe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'MANUAL', label: 'Manual / Hotline', icon: PenTool, color: 'text-slate-600 bg-slate-100 border-slate-200' },
];

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

export default function IntakeInboxPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    needsReview: 0,
    highPriority: 0,
    potentialDuplicates: 0,
    needsInformation: 0,
  });

  // Filter & Search State
  const [activeFilterCard, setActiveFilterCard] = useState<'ALL' | 'NEEDS_REVIEW' | 'HIGH_PRIORITY' | 'DUPLICATES' | 'NEEDS_INFORMATION'>('NEEDS_REVIEW');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [languageFilter, setLanguageFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'newest'>('priority');

  // Selection for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Active Item Detail Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isAddIntakeOpen, setIsAddIntakeOpen] = useState(false);
  const [archivingItem, setArchivingItem] = useState<any | null>(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  const handleCopyPortalLink = () => {
    const portalUrl = process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL || 'http://localhost:3001';
    const url = `${portalUrl}/janata-investigation-desk`;
    navigator.clipboard.writeText(url);
    setCopiedPortalLink(true);
    setTimeout(() => setCopiedPortalLink(false), 2500);
  };

  // Active cases for duplicate / merge lookup
  const [existingCases, setExistingCases] = useState<any[]>([]);

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/intake/counts');
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  };

  const fetchCasesList = async () => {
    try {
      const res = await fetch('/api/cases?limit=50');
      if (res.ok) {
        const data = await res.json();
        setExistingCases(data.cases || []);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (sourceFilter !== 'ALL') params.set('sourceType', sourceFilter);
      if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (languageFilter !== 'ALL') params.set('language', languageFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/intake?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let list = data.items || [];

        // Apply Card Quick Filters
        if (activeFilterCard === 'NEEDS_REVIEW') {
          list = list.filter((i: any) => ['NEEDS_REVIEW', 'AI_TRIAGED', 'INCOMING'].includes(i.status));
        } else if (activeFilterCard === 'HIGH_PRIORITY') {
          list = list.filter(
            (i: any) => ['HIGH', 'URGENT'].includes(i.aiPriority) && !['ARCHIVED', 'CASE_CREATED', 'MERGED'].includes(i.status)
          );
        } else if (activeFilterCard === 'DUPLICATES') {
          list = list.filter((i: any) => i.duplicateCandidate && !['ARCHIVED', 'MERGED'].includes(i.status));
        } else if (activeFilterCard === 'NEEDS_INFORMATION') {
          list = list.filter((i: any) => i.status === 'NEEDS_INFORMATION');
        }

        setItems(list);
      }
    } catch (err) {
      console.error('Failed to fetch intake items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    fetchCasesList();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeFilterCard, statusFilter, sourceFilter, priorityFilter, categoryFilter, languageFilter, search, sortBy]);

  const handleSelectFilterCard = (card: 'ALL' | 'NEEDS_REVIEW' | 'HIGH_PRIORITY' | 'DUPLICATES' | 'NEEDS_INFORMATION') => {
    setActiveFilterCard(card);
    if (card === 'NEEDS_REVIEW') setStatusFilter('ALL');
    else if (card === 'HIGH_PRIORITY') setPriorityFilter('ALL');
    else if (card === 'NEEDS_INFORMATION') setStatusFilter('NEEDS_INFORMATION');
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkArchive = async (reason: string = 'OTHER') => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/intake/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ARCHIVE',
          ids: selectedIds,
          reason,
        }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchItems();
        fetchCounts();
      }
    } catch (err) {
      console.error('Bulk archive failed:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkReviewed = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/intake/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MARK_REVIEWED',
          ids: selectedIds,
        }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchItems();
        fetchCounts();
      }
    } catch (err) {
      console.error('Bulk mark reviewed failed:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getSourceBadge = (source: string) => {
    const s = SOURCES.find((src) => src.id === source) || {
      label: source,
      icon: MessageSquare,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
    };
    const Icon: any = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>
        <Icon size={12} />
        <span>{s.label}</span>
      </span>
    );
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Detail Workspace Modal */}
      {selectedItem && (
        <IntakeDetailModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          intakeItem={selectedItem}
          existingCases={existingCases}
          onUpdated={() => {
            fetchItems();
            fetchCounts();
          }}
        />
      )}

      {/* Add Intake Modal */}
      <AddIntakeModal
        isOpen={isAddIntakeOpen}
        onClose={() => setIsAddIntakeOpen(false)}
        onSuccess={() => {
          fetchItems();
          fetchCounts();
        }}
      />

      {/* Archive Reason Modal */}
      {archivingItem && (
        <ArchiveReasonModal
          isOpen={!!archivingItem}
          onClose={() => setArchivingItem(null)}
          intakeItem={archivingItem}
          onSuccess={() => {
            fetchItems();
            fetchCounts();
          }}
        />
      )}

      {/* Header (Section 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-surface-3 shadow-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary">
            Intake Inbox
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review incoming reports before they become cases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopyPortalLink}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-primary font-bold text-xs rounded-xl border border-surface-3 shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Copy Public Submission Link for Citizens"
          >
            {copiedPortalLink ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-primary" />
                <span>Share Citizen Portal</span>
              </>
            )}
          </button>
          <a
            href={`${process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL || 'http://localhost:3001'}/janata-investigation-desk`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-primary rounded-xl border border-surface-3 shadow-2xs transition-colors"
            title="Launch Standalone Citizen Portal (Port 3001)"
          >
            <ExternalLink size={14} />
          </a>
          <button
            onClick={() => setIsAddIntakeOpen(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer hover:shadow-md active:scale-95"
          >
            <Plus size={15} />
            <span>+ Add Intake</span>
          </button>
        </div>
      </div>

      {/* Top Summary Metrics / Filter Cards (Section 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <button
          onClick={() => handleSelectFilterCard('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilterCard === 'ALL'
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-white text-primary border-surface-3 hover:border-slate-300'
          }`}
        >
          <div className="text-2xl font-black">{counts.total}</div>
          <div className={`text-xs font-semibold mt-0.5 ${activeFilterCard === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
            Total
          </div>
        </button>

        <button
          onClick={() => handleSelectFilterCard('NEEDS_REVIEW')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilterCard === 'NEEDS_REVIEW'
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-white text-primary border-surface-3 hover:border-primary/40'
          }`}
        >
          <div className="text-2xl font-black">{counts.needsReview}</div>
          <div className={`text-xs font-semibold mt-0.5 ${activeFilterCard === 'NEEDS_REVIEW' ? 'text-blue-100' : 'text-slate-500'}`}>
            Needs Review
          </div>
        </button>

        <button
          onClick={() => handleSelectFilterCard('HIGH_PRIORITY')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilterCard === 'HIGH_PRIORITY'
              ? 'bg-red-600 text-white border-red-600 shadow-md'
              : 'bg-white text-primary border-surface-3 hover:border-red-300'
          }`}
        >
          <div className="text-2xl font-black">{counts.highPriority}</div>
          <div className={`text-xs font-semibold mt-0.5 ${activeFilterCard === 'HIGH_PRIORITY' ? 'text-red-100' : 'text-slate-500'}`}>
            High Priority
          </div>
        </button>

        <button
          onClick={() => handleSelectFilterCard('DUPLICATES')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilterCard === 'DUPLICATES'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white text-primary border-surface-3 hover:border-amber-300'
          }`}
        >
          <div className="text-2xl font-black">{counts.potentialDuplicates}</div>
          <div className={`text-xs font-semibold mt-0.5 ${activeFilterCard === 'DUPLICATES' ? 'text-amber-100' : 'text-slate-500'}`}>
            Potential Duplicates
          </div>
        </button>

        <button
          onClick={() => handleSelectFilterCard('NEEDS_INFORMATION')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeFilterCard === 'NEEDS_INFORMATION'
              ? 'bg-success-700 text-white border-success-700 shadow-md'
              : 'bg-white text-primary border-surface-3 hover:border-success-300'
          }`}
        >
          <div className="text-2xl font-black">{counts.needsInformation}</div>
          <div className={`text-xs font-semibold mt-0.5 ${activeFilterCard === 'NEEDS_INFORMATION' ? 'text-success-100' : 'text-slate-500'}`}>
            Needs Information
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-surface-3 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Debounced Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content, sender, phone, location, or summary..."
              className="w-full pl-9 pr-4 py-2 bg-background/50 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          {/* Sort By Toggle */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Sort:</span>
            <button
              onClick={() => setSortBy(sortBy === 'priority' ? 'newest' : 'priority')}
              className="px-3 py-1.5 rounded-xl border border-surface-3 bg-background hover:bg-slate-100 text-primary font-bold transition-colors cursor-pointer"
            >
              {sortBy === 'priority' ? '⚡ Sorted by priority' : '🕐 Sorted by newest'}
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-3/60 text-xs">
          <span className="font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Filter size={12} />
            <span>Filters:</span>
          </span>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="p-1.5 bg-background border border-surface-3 rounded-lg font-medium text-primary focus:outline-none cursor-pointer"
          >
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 bg-background border border-surface-3 rounded-lg font-medium text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="AI_TRIAGED">AI Triaged</option>
            <option value="NEEDS_INFORMATION">Needs Information</option>
            <option value="CASE_CREATED">Case Created</option>
            <option value="MERGED">Merged</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-1.5 bg-background border border-surface-3 rounded-lg font-medium text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">Priority: All</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-1.5 bg-background border border-surface-3 rounded-lg font-medium text-primary focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="p-1.5 bg-background border border-surface-3 rounded-lg font-medium text-primary focus:outline-none cursor-pointer"
          >
            <option value="ALL">Language: All</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
            <option value="English">English</option>
            <option value="Other">Other</option>
          </select>

          {(sourceFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            categoryFilter !== 'ALL' ||
            languageFilter !== 'ALL' ||
            search) && (
            <button
              onClick={() => {
                setSourceFilter('ALL');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setCategoryFilter('ALL');
                setLanguageFilter('ALL');
                setSearch('');
              }}
              className="font-bold text-primary hover:underline ml-auto cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (Section 23) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary text-white rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold px-2 py-0.5 rounded bg-white/20">
              {selectedIds.length} Selected
            </span>
            <span className="text-slate-300 hidden sm:inline">
              Apply bulk editorial decision to selected items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkMarkReviewed()}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Mark Reviewed
            </button>
            <button
              onClick={() => handleBulkArchive('SPAM')}
              disabled={bulkActionLoading}
              className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Archive
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 text-slate-300 hover:text-white cursor-pointer"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Message List Content */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-surface-3 p-16 flex flex-col items-center justify-center text-slate-500">
          <Loader2 size={32} className="animate-spin text-primary mb-3" />
          <span className="text-sm font-medium">Filtering intake reports...</span>
        </div>
      ) : items.length === 0 ? (
        /* Empty State (Section 32) */
        <div className="bg-white rounded-3xl border border-surface-3 p-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-black text-primary">Your inbox is clear.</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            New citizen reports will appear here for review.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsAddIntakeOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>＋ Add Intake</span>
            </button>
          </div>
        </div>
      ) : (
        /* Message Cards (Section 6) */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-2 text-xs text-slate-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.length === items.length && items.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-primary"
              />
              <span>Select All</span>
            </label>
            <span>Showing {items.length} reports</span>
          </div>

          {items.map((item) => {
            let missingList: string[] = [];
            try {
              if (item.aiMissingInformation) missingList = JSON.parse(item.aiMissingInformation);
            } catch {
              missingList = [];
            }

            let hasSensitive = false;
            try {
              if (item.sensitiveInfoDetected) {
                const parsed = JSON.parse(item.sensitiveInfoDetected);
                hasSensitive = parsed.length > 0;
              }
            } catch {
              hasSensitive = false;
            }

            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-5 bg-white rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-primary shadow-sm ring-1 ring-primary/20'
                    : 'border-surface-3 hover:border-primary/60 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(item.id)}
                    className="w-4 h-4 mt-1 rounded text-primary cursor-pointer shrink-0"
                  />

                  {/* Main Card Content */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header Row: Source Badge & Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {getSourceBadge(item.sourceType)}
                        {item.referenceNumber && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            {item.referenceNumber}
                          </span>
                        )}
                        <span className="font-semibold text-primary">
                          {item.senderName}
                        </span>
                        {item.preferredLanguage === 'Telugu' && (
                          <span className="px-2 py-0.2 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                            తెలుగు
                          </span>
                        )}
                        {hasSensitive && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                            <ShieldAlert size={10} /> Sensitive info
                          </span>
                        )}
                        {item.duplicateCandidate && (
                          <span className="px-2 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                            <AlertTriangle size={10} /> Potential Duplicate
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={12} />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Quotation Preview */}
                    <p className="text-xs text-primary font-medium leading-relaxed line-clamp-2 italic text-slate-700">
                      &ldquo;{item.rawText}&rdquo;
                    </p>

                    {/* AI Tag Line */}
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        AI
                      </span>
                      <span className="text-primary">{item.aiCategory || 'Civic Infrastructure'}</span>
                      <span>·</span>
                      <PriorityBadge priority={item.aiPriority || 'MEDIUM'} size="sm" />
                    </div>

                    {/* AI Summary */}
                    {item.aiSummary && (
                      <div className="p-2.5 rounded-xl bg-background/80 border border-surface-3/60 text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold text-primary mr-1">AI Summary:</span>
                        {item.aiSummary}
                      </div>
                    )}

                    {/* Missing Information Line */}
                    {missingList.length > 0 && (
                      <div className="text-[11px] text-amber-800 flex items-center gap-1 font-medium">
                        <span className="font-bold">Missing: </span>
                        <span>{missingList.slice(0, 2).join(', ')}</span>
                      </div>
                    )}

                    {/* Provenance if already converted or merged */}
                    {item.createdCase && (
                      <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 pt-1">
                        <CheckCircle2 size={13} />
                        <span>Converted to Case: </span>
                        <Link
                          href={`/app/cases/${item.createdCase.id}`}
                          className="font-mono font-bold text-emerald-800 hover:underline"
                        >
                          {item.createdCase.caseNumber} — {item.createdCase.title}
                        </Link>
                      </div>
                    )}

                    {item.mergedCase && (
                      <div className="text-xs text-amber-700 font-medium flex items-center gap-1 pt-1">
                        <GitMerge size={13} />
                        <span>Merged into Case: </span>
                        <Link
                          href={`/app/cases/${item.mergedCase.id}`}
                          className="font-mono font-bold text-amber-800 hover:underline"
                        >
                          {item.mergedCase.caseNumber} — {item.mergedCase.title}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Review
                    </button>

                    {!item.createdCaseId && (
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1 text-slate-600 hover:text-primary hover:bg-background text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Create Case
                      </button>
                    )}

                    {item.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => setArchivingItem(item)}
                        className="px-2.5 py-1 text-slate-500 hover:text-red-600 hover:bg-red-50 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
