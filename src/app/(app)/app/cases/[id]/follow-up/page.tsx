'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Calendar,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

const RESOLUTION_STATUSES = ['OPEN', 'ONGOING', 'PARTIALLY_RESOLVED', 'RESOLVED', 'CLOSED'];

export default function CaseFollowUpPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseRecord, setCaseRecord] = useState<any | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [savingResolution, setSavingResolution] = useState(false);

  // New follow-up event state
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  const fetchCase = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setCaseRecord(data);
      setResolutionStatus(data.resolutionStatus || 'OPEN');
    } catch (err) {
      console.error('Failed to load follow-up data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const handleResolutionUpdate = async (newStatus: string) => {
    setResolutionStatus(newStatus);
    setSavingResolution(true);
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStatus: newStatus,
          resolvedAt: newStatus === 'RESOLVED' ? new Date() : null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error('Resolution error:', err);
    } finally {
      setSavingResolution(false);
    }
  };

  const handleAddFollowUpEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    setSavingEvent(true);
    try {
      // In this MVP, we create an event record via case update / internal log
      await fetch(`/api/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'FOLLOW_UP',
        }),
      });

      setShowEventModal(false);
      setEventTitle('');
      setEventDesc('');
      fetchCase();
      router.refresh();
    } catch (err) {
      console.error('Event error:', err);
    } finally {
      setSavingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-3 p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const followUpEvents = caseRecord?.events?.filter(
    (e: any) =>
      e.type === 'FOLLOW_UP_CREATED' ||
      e.type === 'CONTENT_PUBLISHED' ||
      e.type === 'STATUS_CHANGED' ||
      e.type === 'RESPONSE_RECEIVED'
  ) || [];

  return (
    <div className="space-y-8">
      {/* 1. Resolution Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-3">
          <div>
            <h2 className="text-base font-bold text-primary">Public Impact & Resolution Lifecycle</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track what happens after publication: official action, citizen outcome, and long-term resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Resolution:</span>
            <select
              value={resolutionStatus}
              onChange={(e) => handleResolutionUpdate(e.target.value)}
              disabled={savingResolution}
              className="text-xs bg-background border border-surface-3 rounded-xl px-3 py-2 text-primary font-bold focus:outline-none cursor-pointer"
            >
              {RESOLUTION_STATUSES.map((res) => (
                <option key={res} value={res}>
                  {res.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-background/60 border border-surface-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Publication Date
            </span>
            <div className="font-semibold text-primary">
              {caseRecord.publishedAt
                ? new Date(caseRecord.publishedAt).toLocaleDateString()
                : 'Not yet published'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/60 border border-surface-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Authority Action
            </span>
            <div className="font-semibold text-primary">
              {caseRecord.responseRequests?.some((r: any) => r.status === 'RECEIVED')
                ? 'Official Response on Record'
                : 'Awaiting Action / Statement'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/60 border border-surface-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Case Status
            </span>
            <div className="font-semibold text-primary">{caseRecord.status.replace(/_/g, ' ')}</div>
          </div>
        </div>
      </div>

      {/* 2. Post-Publication Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-3">
          <h3 className="text-sm font-bold text-primary">Post-Publication Developments</h3>
          <button
            onClick={() => setShowEventModal(true)}
            className="py-1.5 px-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Log Development</span>
          </button>
        </div>

        <div className="space-y-4">
          {followUpEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No follow-up developments logged yet. Once published, document official inspections, citizen updates, and policy impact here.
            </p>
          ) : (
            followUpEvents.map((ev: any) => (
              <div key={ev.id} className="p-4 rounded-xl bg-background/40 border border-surface-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{ev.title}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(ev.eventDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{ev.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-surface-3 p-6 space-y-4">
            <h3 className="text-base font-bold text-primary">Log Citizen Outcome or Authority Action</h3>

            <form onSubmit={handleAddFollowUpEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Municipal commissioner ordered immediate pipe desiltation"
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Details & Citizen Feedback
                </label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="e.g. Complainant confirmed clean water supply restored as of yesterday afternoon."
                  className="w-full p-3 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-3">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEvent}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingEvent ? 'Saving...' : 'Record Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
