'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Send,
  Building2,
  Mail,
  Phone,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader2,
  Calendar,
  MessageSquare,
} from 'lucide-react';

const CONTACT_TYPES = ['AUTHORITY', 'ORGANIZATION', 'EXPERT', 'WITNESS', 'SOURCE', 'OTHER'];

export default function CaseContactsPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [contacts, setContacts] = useState<any[]>([]);
  const [responseRequests, setResponseRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactType, setContactType] = useState('AUTHORITY');
  const [contactNotes, setContactNotes] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // New Response Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [requestMethod, setRequestMethod] = useState('Email & Formal Letter');
  const [deadlineDays, setDeadlineDays] = useState('3');
  const [requestNotes, setRequestNotes] = useState('');
  const [savingRequest, setSavingRequest] = useState(false);

  // Log response modal
  const [selectedRequestToUpdate, setSelectedRequestToUpdate] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RECEIVED');
  const [updatingReply, setUpdatingReply] = useState(false);

  const fetchContactsData = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setResponseRequests(data.responseRequests || []);
    } catch (err) {
      console.error('Failed to load contacts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactsData();
  }, [caseId]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;

    setSavingContact(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          name: contactName.trim(),
          organization: contactOrg.trim(),
          role: contactRole.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          type: contactType,
          notes: contactNotes.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to create contact');

      setContactName('');
      setContactOrg('');
      setContactRole('');
      setContactPhone('');
      setContactEmail('');
      setContactNotes('');
      setShowContactModal(false);
      fetchContactsData();
      router.refresh();
    } catch (err) {
      console.error('Contact error:', err);
    } finally {
      setSavingContact(false);
    }
  };

  const handleCreateResponseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    setSavingRequest(true);
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(deadlineDays, 10));

      const res = await fetch('/api/response-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          contactId: selectedContactId,
          method: requestMethod,
          deadline,
          notes: requestNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to dispatch response request');

      setShowRequestModal(false);
      fetchContactsData();
      router.refresh();
    } catch (err) {
      console.error('Request error:', err);
    } finally {
      setSavingRequest(false);
    }
  };

  const handleUpdateResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestToUpdate) return;

    setUpdatingReply(true);
    try {
      await fetch(`/api/response-requests/${selectedRequestToUpdate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: replyStatus,
          responseText: responseText.trim(),
        }),
      });

      setSelectedRequestToUpdate(null);
      setResponseText('');
      fetchContactsData();
      router.refresh();
    } catch (err) {
      console.error('Update reply error:', err);
    } finally {
      setUpdatingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-surface-3 p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Right of Reply Workflow Pipeline */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">
                Ethical Newsroom Standard
              </span>
            </div>
            <h2 className="text-base font-bold text-primary mt-1">Right of Reply Tracker</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Before reporting negative allegations, always issue formal right of reply and document responses.
            </p>
          </div>

          <button
            onClick={() => {
              if (contacts.length === 0) {
                alert('Please add an authority or organization contact first.');
                return;
              }
              setSelectedContactId(contacts[0].id);
              setShowRequestModal(true);
            }}
            className="py-2 px-3.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Send size={13} className="text-success" />
            <span>Issue Response Notice</span>
          </button>
        </div>

        {/* Linear Workflow Visualization */}
        <div className="p-4 bg-background/60 rounded-xl border border-surface-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2 text-primary">
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Authority Identified</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-primary">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Inquiry Dispatched</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-primary">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Statutory Deadline</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2 text-primary">
            <span className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold">
              4
            </span>
            <span>Response Received / No Reply</span>
          </div>
        </div>

        {/* Requests Table / List */}
        <div className="space-y-3">
          {responseRequests.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No Right of Reply notices issued for this case yet.
            </p>
          ) : (
            responseRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-white border border-surface-3 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-primary">{req.contact.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({req.contact.role} at {req.contact.organization || 'Department'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        req.status === 'RECEIVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : req.status === 'NO_RESPONSE'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {req.status.replace(/_/g, ' ')}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedRequestToUpdate(req);
                        setResponseText(req.responseText || '');
                        setReplyStatus(req.status === 'RECEIVED' ? 'RECEIVED' : 'RECEIVED');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-primary hover:bg-slate-100 rounded-lg border border-surface-3 cursor-pointer"
                    >
                      Log Response
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-2 text-[11px] text-slate-500 pt-1">
                  <div>
                    Dispatched:{' '}
                    <strong className="text-primary">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </strong>
                  </div>
                  <div>
                    Method: <strong className="text-primary">{req.method}</strong>
                  </div>
                  <div>
                    Deadline:{' '}
                    <strong className="text-warning">
                      {req.deadline ? new Date(req.deadline).toLocaleDateString() : 'None set'}
                    </strong>
                  </div>
                </div>

                {req.responseText && (
                  <div className="p-3 rounded-lg bg-background/80 border border-surface-3 text-xs text-primary leading-relaxed">
                    <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Official Statement Received:
                    </strong>
                    {req.responseText}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Contact Directory */}
      <div className="bg-white p-6 rounded-2xl border border-surface-3 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-3">
          <div>
            <h2 className="text-base font-bold text-primary">Case Contacts & Authorities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Officials, departmental superintendents, expert witnesses, and complainants.
            </p>
          </div>

          <button
            onClick={() => setShowContactModal(true)}
            className="py-1.5 px-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Contact</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-background/50 border border-surface-3 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-primary text-sm">{c.name}</h3>
                  <div className="text-slate-500 font-medium">
                    {c.role || c.type} {c.organization ? `• ${c.organization}` : ''}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                  {c.type}
                </span>
              </div>

              <div className="space-y-1 text-slate-500 pt-1">
                {c.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-slate-500" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-500" />
                    <span>{c.phone}</span>
                  </div>
                )}
              </div>

              {c.notes && <div className="text-[11px] text-slate-500 italic pt-1">{c.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-surface-3 p-6 space-y-4">
            <h3 className="text-base font-bold text-primary">Add Official / Witness Contact</h3>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. C. Prabhakar Rao"
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={contactOrg}
                    onChange={(e) => setContactOrg(e.target.value)}
                    placeholder="e.g. GGH Guntur"
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                    placeholder="e.g. Medical Superintendent"
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="superintendent@ap.gov.in"
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 863 2234001"
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Contact Type
                </label>
                <select
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value)}
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none cursor-pointer"
                >
                  {CONTACT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-3">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingContact ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Right of Reply Notice Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-surface-3 p-6 space-y-4">
            <h3 className="text-base font-bold text-primary">Issue Formal Right of Reply Notice</h3>

            <form onSubmit={handleCreateResponseRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Target Authority Contact
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none cursor-pointer"
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role || c.type} - {c.organization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Transmission Method
                  </label>
                  <select
                    value={requestMethod}
                    onChange={(e) => setRequestMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Official Email">Official Email</option>
                    <option value="Speed Post / Registered Letter">Registered Post</option>
                    <option value="In-person Hand Delivery">In-person Hand Delivery</option>
                    <option value="Official WhatsApp / Fax">Official WhatsApp / Fax</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Deadline Window
                  </label>
                  <select
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="2">48 Hours (Urgent issues)</option>
                    <option value="3">3 Days (Standard)</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Specific Questions Dispatched
                </label>
                <textarea
                  rows={3}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. 1. Why was generator fuel empty? 2. Who authorized manual resuscitation?"
                  className="w-full p-3 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRequest}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingRequest ? 'Recording...' : 'Log Notice Dispatched'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Response Received Modal */}
      {selectedRequestToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-surface-3 p-6 space-y-4">
            <h3 className="text-base font-bold text-primary">Record Official Authority Response</h3>

            <form onSubmit={handleUpdateResponse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Response Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none cursor-pointer"
                >
                  <option value="RECEIVED">Response Received</option>
                  <option value="FOLLOW_UP_REQUIRED">Incomplete / Follow-up Required</option>
                  <option value="NO_RESPONSE">Deadline Expired — No Response</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  Official Statement / Transcript
                </label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Paste the official statement, press note, or summary of phone conversation..."
                  className="w-full p-3 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequestToUpdate(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingReply}
                  className="px-4 py-2 bg-success text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {updatingReply ? 'Saving...' : 'Record Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
