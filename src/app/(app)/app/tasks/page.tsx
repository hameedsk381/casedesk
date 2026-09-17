'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Square,
  Clock,
  User,
  Filter,
  Loader2,
  Calendar,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

const FILTER_TABS = ['ALL', 'TODO', 'DONE'];

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load global tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (taskId: string, currentStatus: string) => {
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
    } catch (err) {
      console.error('Task toggle error:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const todoCount = tasks.filter((t) => t.status !== 'DONE').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">
            Investigation Tasks
          </h1>
          <p className="mt-1 text-sm text-slate">
            Global action items, document requests, and authority inquiries across all workspace cases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-off-white border border-border-light text-xs font-bold text-navy">
            {todoCount} Pending
          </span>
          <span className="px-3 py-1 rounded-xl bg-teal/10 text-teal text-xs font-bold">
            {doneCount} Completed
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border-light shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-navy text-white'
                  : 'text-slate-500 hover:text-navy hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All Tasks' : tab === 'TODO' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-off-white border border-border-light rounded-lg px-2.5 py-1 text-navy font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-border-light p-12 flex justify-center">
          <Loader2 size={28} className="animate-spin text-electric-blue" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-border-light text-center">
          <FolderOpen size={32} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-navy">No tasks match your filter</h3>
          <p className="text-xs text-slate mt-1 max-w-sm mx-auto">
            Try switching your filter to view completed tasks or clear priority filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'DONE';

            return (
              <div
                key={task.id}
                className={`p-4 bg-white rounded-2xl border transition-all shadow-xs flex items-start justify-between gap-4 ${
                  isDone ? 'opacity-65 border-border-light/60 bg-off-white/40' : 'border-border-light'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(task.id, task.status)}
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
                      className={`text-sm font-bold ${
                        isDone ? 'line-through text-slate-500' : 'text-navy'
                      }`}
                    >
                      {task.title}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
                      {task.case && (
                        <Link
                          href={`/app/cases/${task.case.id}`}
                          className="font-mono text-[11px] font-bold text-electric-blue hover:underline"
                        >
                          {task.case.caseNumber} — {task.case.title}
                        </Link>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Clock size={11} />
                          <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {task.assignedTo && (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <User size={11} />
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded shrink-0 ${
                    task.priority === 'URGENT'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : task.priority === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
