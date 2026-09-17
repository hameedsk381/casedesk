'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  User,
  ShieldCheck,
  Clock,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

export default function CaseInvestigationPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [tasks, setTasks] = useState<any[]>([]);
  const [verificationItems, setVerificationItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // New verification item form state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [statement, setStatement] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState('');
  const [savingVerify, setSavingVerify] = useState(false);

  const fetchCaseDetails = async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setVerificationItems(data.verificationItems || []);
    } catch (err) {
      console.error('Failed to load investigation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
    fetch('/api/tasks')
      .then((res) => res.json())
      .catch((err) => console.error(err));
  }, [caseId]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      router.refresh();
    } catch (err) {
      console.error('Task toggle error:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setSavingTask(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
          assignedToId: taskAssignee || null,
          dueDate: taskDueDate ? new Date(taskDueDate) : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task');

      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setShowTaskModal(false);
      fetchCaseDetails();
      router.refresh();
    } catch (err) {
      console.error('Task creation error:', err);
    } finally {
      setSavingTask(false);
    }
  };

  const handleUpdateVerification = async (itemId: string, status: string) => {
    try {
      await fetch(`/api/verification/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setVerificationItems((prev) =>
        prev.map((v) => (v.id === itemId ? { ...v, status } : v))
      );
      router.refresh();
    } catch (err) {
      console.error('Verification update error:', err);
    }
  };

  const handleCreateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    setSavingVerify(true);
    try {
      await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          statement: statement.trim(),
          evidenceRequired: evidenceRequired.trim(),
          status: 'PENDING',
        }),
      });

      setStatement('');
      setEvidenceRequired('');
      setShowVerifyModal(false);
      fetchCaseDetails();
      router.refresh();
    } catch (err) {
      console.error('Verification creation error:', err);
    } finally {
      setSavingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border-light p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-electric-blue" />
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-8">
      {/* 1. Verification Checklist Section */}
      <div className="bg-white p-6 rounded-2xl border border-border-light shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light">
          <div>
            <h2 className="text-base font-bold text-navy">Factual Verification Matrix</h2>
            <p className="text-xs text-slate mt-0.5">
              Specific statements that require evidentiary corroboration before publication.
            </p>
          </div>

          <button
            onClick={() => setShowVerifyModal(true)}
            className="py-1.5 px-3 bg-teal hover:bg-teal/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Statement</span>
          </button>
        </div>

        <div className="space-y-3">
          {verificationItems.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No verification statements logged yet.
            </p>
          ) : (
            verificationItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-off-white/50 border border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'VERIFIED'
                          ? 'bg-teal'
                          : item.status === 'DISPUTED'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-navy">{item.statement}</span>
                  </div>
                  {item.evidenceRequired && (
                    <div className="text-[11px] text-slate-500 pl-4">
                      Required proof: {item.evidenceRequired}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[11px] text-slate-500 pl-4">Notes: {item.notes}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateVerification(item.id, e.target.value)}
                    className="text-xs bg-white border border-border-light rounded-lg px-2.5 py-1 text-navy font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="PENDING">Pending Check</option>
                    <option value="VERIFIED">Verified ✓</option>
                    <option value="NOT_VERIFIED">Not Verified</option>
                    <option value="DISPUTED">Disputed</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Investigation Task Checklist Section */}
      <div className="bg-white p-6 rounded-2xl border border-border-light shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light">
          <div>
            <h2 className="text-base font-bold text-navy">
              Investigation Tasks ({completedTasks}/{tasks.length} Done)
            </h2>
            <p className="text-xs text-slate mt-0.5">
              Assigned newsroom research checklist and authority outreach tasks.
            </p>
          </div>

          <button
            onClick={() => setShowTaskModal(true)}
            className="py-1.5 px-3 bg-navy hover:bg-navy/90 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>New Task</span>
          </button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No tasks assigned yet. Add research tasks to track your workflow.
            </p>
          ) : (
            tasks.map((task) => {
              const isDone = task.status === 'DONE';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isDone
                      ? 'bg-off-white/40 border-border-light/60 opacity-65'
                      : 'bg-white border-border-light hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-0.5 text-navy hover:text-teal transition-colors cursor-pointer"
                    >
                      {isDone ? (
                        <CheckSquare size={18} className="text-teal" />
                      ) : (
                        <Square size={18} className="text-slate-500" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold ${
                          isDone ? 'line-through text-slate-500' : 'text-navy'
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {task.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User size={11} />
                            <span>{task.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      task.priority === 'URGENT'
                        ? 'bg-red-50 text-red-700'
                        : task.priority === 'HIGH'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border-light p-6 space-y-4">
            <h3 className="text-base font-bold text-navy">Create Investigation Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Call Substation Engineer at Collectorate Feeder"
                  className="w-full px-3 py-2 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="e.g. Verify grid outage timings between 11:20 PM and 12:05 AM on Sep 12."
                  className="w-full p-3 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Verification Statement Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border-light p-6 space-y-4">
            <h3 className="text-base font-bold text-navy">Add Verification Statement</h3>

            <form onSubmit={handleCreateVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  Factual Statement to Verify
                </label>
                <input
                  type="text"
                  required
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="e.g. Commercial meter USC No. 441092 erroneously mapped to domestic hut"
                  className="w-full px-3 py-2 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
                  Evidence Required
                </label>
                <input
                  type="text"
                  value={evidenceRequired}
                  onChange={(e) => setEvidenceRequired(e.target.value)}
                  placeholder="e.g. ADE Electricity written confirmation letter and physical bill copies"
                  className="w-full px-3 py-2 bg-off-white/40 border border-border-light rounded-xl text-xs text-navy focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-navy cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVerify}
                  className="px-4 py-2 bg-teal text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingVerify ? 'Saving...' : 'Add Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
