'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Users,
  Layers,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import TeamPanel from '@/components/app/TeamPanel';
import { DEFAULT_CASE_CATEGORIES } from '@/lib/cases/categories';
import { primaryWorkspaceRole } from '@/lib/auth/permissionTypes';

const TABS = [
  { id: 'profile', label: 'User Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'team', label: 'Newsroom Team', icon: Users },
  { id: 'categories', label: 'Case Categories', icon: Layers },
  { id: 'ai', label: 'AI Intelligence', icon: Cpu },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [wsName, setWsName] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CASE_CATEGORIES]);
  const [newCat, setNewCat] = useState('');
  const [canManageWorkspace, setCanManageWorkspace] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          setUserName(data.user.name);
          setUserEmail(data.user.email);
        }
      })
      .finally(() => setLoading(false));

    fetch('/api/workspace')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.workspace) return;
        setWorkspaceId(data.workspace.id);
        setWsName(data.workspace.name || '');
        setWsDesc(data.workspace.description || '');
        if (Array.isArray(data.workspace.categories) && data.workspace.categories.length > 0) {
          setCategories(data.workspace.categories);
        }
        setCanManageWorkspace(Boolean(data.canManage));
      })
      .catch(() => {});
  }, []);

  const notifySaved = (msg: string) => {
    setErrorMessage(null);
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const notifyError = (msg: string) => {
    setSavedMessage(null);
    setErrorMessage(msg);
  };

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      notifyError('Please enter your name.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      setUserName(data.user?.name ?? userName.trim());
      setCurrentUser((prev: any) => ({ ...prev, name: data.user?.name ?? userName.trim() }));
      notifySaved('Profile updated.');
    } catch (err: any) {
      notifyError(err.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!wsName.trim()) {
      notifyError('Please enter a workspace name.');
      return;
    }
    setSavingWorkspace(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, name: wsName.trim(), description: wsDesc.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update workspace');
      setWsName(data.workspace?.name ?? wsName.trim());
      setWsDesc(data.workspace?.description ?? wsDesc.trim());
      notifySaved('Workspace settings updated.');
    } catch (err: any) {
      notifyError(err.message || 'Failed to update workspace');
    } finally {
      setSavingWorkspace(false);
    }
  };

  const addCategory = () => {
    const value = newCat.trim();
    if (!value) return;
    if (categories.some((c) => c.toLowerCase() === value.toLowerCase())) {
      notifyError(`"${value}" is already a category.`);
      return;
    }
    setCategories([...categories, value]);
    setNewCat('');
  };

  const removeCategory = (value: string) => {
    setCategories(categories.filter((c) => c !== value));
  };

  const handleSaveCategories = async () => {
    setSavingWorkspace(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          name: wsName.trim(),
          description: wsDesc.trim(),
          categories,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save categories');
      if (Array.isArray(data.workspace?.categories)) {
        setCategories(data.workspace.categories);
      }
      notifySaved('Case categories updated.');
    } catch (err: any) {
      notifyError(err.message || 'Failed to save categories');
    } finally {
      setSavingWorkspace(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 flex justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">
          Desk Configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your newsroom profile, team permissions, categories, and AI extraction engine.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid md:grid-cols-4 gap-6 items-start">
        {/* Navigation tabs */}
        <div className="bg-card p-2 rounded-2xl border border-border shadow-sm space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-primary hover:bg-surface'
                }`}
              >
                <Icon size={16} className={isSelected ? 'text-secondary' : 'text-muted-foreground'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm space-y-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="border-b border-surface-3 pb-3">
                <h3 className="text-base font-bold text-primary">Investigator Profile</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your identity when logging case events, tasks, and audit logs.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                     className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                     className="w-full px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Workspace Role
                  </label>
                   <div className="px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs font-bold text-primary">
                    {primaryWorkspaceRole(currentUser) || currentUser?.role || 'RESEARCHER'}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Roles are assigned per workspace by the workspace owner or an admin.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                   className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* WORKSPACE TAB */}
          {activeTab === 'workspace' && (
            <div className="space-y-5">
              <div className="border-b border-surface-3 pb-3">
                <h3 className="text-base font-bold text-primary">Workspace Settings</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organization name and local filesystem vault scope.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    Mission Description
                  </label>
                  <textarea
                    rows={3}
                    value={wsDesc}
                    onChange={(e) => setWsDesc(e.target.value)}
                    className="w-full p-3 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Public Citizen Submission Portal Config Card */}
              <div className="mt-6 pt-6 border-t border-surface-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-primary">Public Citizen Submission Portal</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Share this public link with citizens and whistleblowers to receive structured stories into your inbox.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live & Active
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Public Portal URL
                      </div>
                      <div className="font-mono text-xs font-bold text-primary truncate">
                        /submit/janata-investigation-desk
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : '';
                          navigator.clipboard.writeText(`${origin}/submit/janata-investigation-desk`);
                          notifySaved('Public portal link copied to clipboard.');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-primary font-bold text-xs rounded-xl border border-surface-3 shadow-2xs transition-all cursor-pointer"
                      >
                        Copy Public Link
                      </button>
                      <a
                        href="/submit/janata-investigation-desk"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>Open Portal</span>
                        <span className="text-[10px]">↗</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Telugu & English text</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>In-browser voice notes</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Whistleblower anonymity</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveWorkspace}
                  disabled={savingWorkspace}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingWorkspace ? 'Saving...' : 'Update Workspace'}
                </button>
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && <TeamPanel />}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div className="border-b border-surface-3 pb-3">
                <h3 className="text-base font-bold text-primary">Case Classification Categories</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standardized categories for organizing complaints and sorting public-interest cases.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1.5 rounded-xl bg-background border border-surface-3 text-xs font-semibold text-primary inline-flex items-center gap-2"
                  >
                    {cat}
                    {canManageWorkspace && (
                      <button
                        onClick={() => removeCategory(cat)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                        title={`Remove ${cat}`}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {categories.length === 0 && (
                  <span className="text-xs text-slate-500">No categories configured.</span>
                )}
              </div>

              {canManageWorkspace ? (
                <>
                  <div className="flex gap-2 pt-2 border-t border-surface-3">
                    <input
                      type="text"
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                      placeholder="New category name..."
                      className="flex-1 px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                    />
                    <button
                      onClick={addCategory}
                      className="px-4 py-2 bg-background border border-surface-3 text-primary text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      onClick={handleSaveCategories}
                      disabled={savingWorkspace}
                      className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {savingWorkspace ? 'Saving...' : 'Save Categories'}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/70 border border-surface-3 text-[11px] leading-relaxed text-slate-500">
                    Categories are shared across the Inbox, Case Registry and case forms for this
                    workspace. Removing a category does not change cases already filed under it.
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-background/70 border border-surface-3 text-[11px] leading-relaxed text-slate-500">
                  Only workspace managers can edit categories. These are the categories in use for
                  this workspace.
                </div>
              )}
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              <div className="border-b border-surface-3 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  <h3 className="text-base font-bold text-primary">AI Intelligence Architecture</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How reports are triaged, transcribed, and turned into content.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-xs text-success space-y-1">
                <div className="font-bold">Intake triage &amp; transcription: Groq</div>
                <p className="text-[11px] leading-relaxed">
                  When <code className="font-mono">GROQ_API_KEY</code> is set, incoming reports are
                  summarized, categorized and scored by Groq, and voice notes are transcribed with
                  Whisper. If the key is absent or a request fails, a deterministic local heuristic
                  parser takes over so intake never breaks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background/70 border border-surface-3 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-primary">Content &amp; brief drafting: Groq, with local fallback</div>
                <p className="text-[11px] leading-relaxed">
                  Script, headline and case-brief generation use the same Groq engine when the key is
                  present, grounded in the case&apos;s verified claims, evidence and right-of-reply
                  status. Without a key (or if a call fails) the built-in local provider drafts from
                  the same data so the desk keeps working.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-background/70 border border-surface-3 text-[11px] leading-relaxed text-slate-500">
                Provider credentials are configured through environment variables on the server
                (never through this screen), so keys are not stored in the database.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
