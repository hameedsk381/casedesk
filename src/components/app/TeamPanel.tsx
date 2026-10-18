'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Check, Mail, Trash2, UserPlus, Loader2 } from 'lucide-react';

interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface TeamData {
  workspaceName: string | null;
  myUserId: string;
  myRole: string;
  canManage: boolean;
  members: Member[];
  invites: Invite[];
}

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  EDITOR: 'bg-success/15 text-success',
  RESEARCHER: 'bg-slate-200 text-slate-700',
  VIEWER: 'bg-slate-100 text-slate-500',
};

const ROLE_HELP: Record<string, string> = {
  RESEARCHER: 'Creates and edits cases, adds evidence and drafts content. Cannot publish or delete.',
  EDITOR: 'Edits cases, approves and publishes content. Cannot create cases or add evidence.',
  VIEWER: 'Read-only access.',
  ADMIN: 'Full access including team management and deleting cases.',
};

async function fetchTeam(): Promise<TeamData> {
  const res = await fetch('/api/team');
  if (!res.ok) throw new Error('Could not load the team.');
  return res.json();
}

/** Team screen: members, pending invitations and the invite form. */
export default function TeamPanel() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RESEARCHER');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Refresh after a change made on this screen.
  const load = useCallback(async () => {
    try {
      setData(await fetchTeam());
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Could not load the team.');
    }
  }, []);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    fetchTeam()
      .then((team) => {
        if (!cancelled) setData(team);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load the team.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setLink(null);
    try {
      const res = await fetch('/api/team/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Could not create the invitation.');
      setLink(result.inviteUrl);
      setMessage({
        kind: 'ok',
        text: result.emailSent
          ? `Invitation emailed to ${result.invite.email}. You can also copy the link below.`
          : `Email is not set up, so nothing was sent. Copy the link below and send it to ${result.invite.email} yourself.`,
      });
      setEmail('');
      await load();
    } catch (err: unknown) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Could not create the invitation.' });
    } finally {
      setBusy(false);
    }
  };

  const act = async (url: string, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setMessage(null);
    const res = await fetch(url, { method: 'DELETE' });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) setMessage({ kind: 'error', text: result.error || 'That did not work.' });
    await load();
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ kind: 'error', text: 'Could not copy automatically — select the link and copy it.' });
    }
  };

  if (loadError) return <p className="text-xs text-red-700">{loadError}</p>;
  if (!data) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={14} className="animate-spin" /> Loading team…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-3 pb-3">
        <h3 className="text-base font-bold text-primary">Newsroom Team{data.workspaceName ? ` — ${data.workspaceName}` : ''}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Roles: Owner, Admin, Researcher, Editor, Viewer.</p>
      </div>

      <div className="space-y-2">
        {data.members.map((m) => (
          <div key={m.userId} className="p-4 rounded-xl bg-background/50 border border-surface-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold text-primary truncate">
                {m.name} {m.userId === data.myUserId && <span className="font-normal text-muted-foreground">(you)</span>}
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate">{m.email}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${ROLE_BADGE[m.role] || ROLE_BADGE.VIEWER}`}>{m.role}</span>
              {data.canManage && m.userId !== data.myUserId && m.role !== 'OWNER' && (
                <button
                  type="button"
                  onClick={() => act(`/api/team/members/${m.userId}`, `Remove ${m.name} from this workspace? Their account and past work stay.`)}
                  className="text-slate-400 hover:text-red-600 cursor-pointer"
                  aria-label={`Remove ${m.name}`}
                  title="Remove from workspace"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.canManage ? (
        <>
          <form onSubmit={invite} className="space-y-3 rounded-xl border border-surface-3 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold text-primary">
              <UserPlus size={15} /> Invite a creator
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.org"
                className="flex-1 px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 bg-background/40 border border-surface-3 rounded-xl text-xs text-primary focus:outline-none"
              >
                <option value="RESEARCHER">Researcher</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
                {data.myRole === 'OWNER' && <option value="ADMIN">Admin</option>}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Sending…' : 'Send invite'}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">{ROLE_HELP[role]}</p>

            {message && (
              <p
                role="status"
                className={`rounded-xl border p-3 text-xs ${message.kind === 'ok' ? 'border-success/30 bg-success/10 text-success' : 'border-red-200 bg-red-50 text-red-700'}`}
              >
                {message.text}
              </p>
            )}
            {link && (
              <div className="flex items-center gap-2">
                <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="flex-1 px-3 py-2 bg-background border border-surface-3 rounded-xl text-[11px] font-mono text-primary" />
                <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-3 text-xs font-semibold text-primary cursor-pointer">
                  {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">The link works once and expires in 7 days. Treat it like a password.</p>
          </form>

          {data.invites.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending invitations</h4>
              {data.invites.map((i) => (
                <div key={i.id} className="p-3 rounded-xl border border-dashed border-surface-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2 text-xs text-primary">
                    <Mail size={13} className="shrink-0 text-slate-400" />
                    <span className="font-mono truncate">{i.email}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${ROLE_BADGE[i.role] || ROLE_BADGE.VIEWER}`}>{i.role}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-muted-foreground">
                    <span>expires {new Date(i.expiresAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => act(`/api/team/invites/${i.id}`, `Revoke the invitation for ${i.email}?`)}
                      className="font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Only owners and admins can invite people or change the team.</p>
      )}
    </div>
  );
}
