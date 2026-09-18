'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Users,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'User Profile', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Building2 },
  { id: 'team', label: 'Newsroom Team', icon: Users },
  { id: 'categories', label: 'Case Categories', icon: Layers },
  { id: 'ai', label: 'AI Intelligence', icon: Cpu },
];

const INITIAL_CATEGORIES = [
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
  'Legal',
  'Other',
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [wsName, setWsName] = useState('Citizen Helpdesk');
  const [wsDesc, setWsDesc] = useState(
    'Independent public accountability newsroom and citizen grievance desk.'
  );
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newCat, setNewCat] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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
  }, []);

  const handleSave = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleAddCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat('');
      handleSave('Category added successfully.');
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
                    Assigned Role
                  </label>
                   <div className="px-3 py-2 bg-surface-2 border border-border rounded-xl text-xs font-bold text-primary">
                    {currentUser?.role || 'RESEARCHER'}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSave('Profile changes updated locally.')}
                   className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save Profile
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
                          handleSave('Public portal link copied to clipboard.');
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
                  onClick={() => handleSave('Workspace settings updated.')}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Update Workspace
                </button>
              </div>
            </div>
          )}

          {/* TEAM TAB */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="border-b border-surface-3 pb-3">
                <h3 className="text-base font-bold text-primary">Newsroom Team Members</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Role-based permissions (OWNER, ADMIN, RESEARCHER, EDITOR, VIEWER).
                </p>
              </div>

              <div className="space-y-3">
                {currentUser && (
                  <div
                    className="p-4 rounded-xl bg-background/50 border border-surface-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-primary">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500">
                        <span className="font-mono">{currentUser.email}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        currentUser.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-800'
                          : currentUser.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : currentUser.role === 'EDITOR'
                          ? 'bg-success/15 text-success'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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
                    className="px-3 py-1.5 rounded-xl bg-background border border-surface-3 text-xs font-semibold text-primary"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-surface-3">
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
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
                  Decoupled provider interface. Uses local deterministic extraction by default.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-xs text-success space-y-1">
                <div className="font-bold">Active Engine: Local Deterministic Heuristic Provider</div>
                <p className="text-[11px] leading-relaxed">
                  Extracts claims, entities, missing info, and generates format-tailored content scripts locally without requiring an OpenAI or Gemini API key.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-primary uppercase tracking-wider mb-1">
                    OpenAI API Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-••••••••••••••••"
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-primary uppercase tracking-wider mb-1">
                    Gemini API Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy••••••••••••••••"
                    className="w-full px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSave('API provider configuration saved.')}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
