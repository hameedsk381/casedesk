'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  FolderLock,
  CheckSquare,
  Sparkles,
  Settings,
  PlusCircle,
  LogOut,
  Building2,
  ExternalLink,
} from 'lucide-react';
import IntakeChoiceModal from './IntakeChoiceModal';

interface SidebarProps {
  user?: any;
  workspaceName?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  user,
  workspaceName = 'CaseDesk',
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [inboxUnprocessedCount, setInboxUnprocessedCount] = useState<number | null>(6);
  const [activeCasesCount, setActiveCasesCount] = useState<number | null>(10);

  useEffect(() => {
    // Quick background fetch to refresh badge counters
    const fetchCounts = async () => {
      try {
        const [intakeRes, casesRes] = await Promise.all([
          fetch('/api/intake/counts'),
          fetch('/api/cases?limit=1'),
        ]);
        if (intakeRes.ok) {
          const data = await intakeRes.json();
          if (typeof data.needsReview === 'number') {
            setInboxUnprocessedCount(data.needsReview);
          }
        }
        if (casesRes.ok) {
          const data = await casesRes.json();
          if (typeof data.totalCount === 'number') {
            setActiveCasesCount(data.totalCount);
          }
        }
      } catch {
        // Fallbacks already set
      }
    };
    fetchCounts();
  }, [pathname]);

  const operationsLinks = [
    {
      label: 'Dashboard',
      href: '/app',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Inbox',
      href: '/app/inbox',
      icon: Inbox,
      badge: inboxUnprocessedCount !== null && inboxUnprocessedCount > 0 ? `${inboxUnprocessedCount}` : null,
      badgeColor: 'bg-primary text-white font-bold',
    },
    {
      label: 'Cases',
      href: '/app/cases',
      icon: FolderLock,
      badge: activeCasesCount !== null ? `${activeCasesCount}` : null,
      badgeColor: 'bg-slate-100 text-slate-700 font-semibold',
    },
    {
      label: 'Tasks',
      href: '/app/tasks',
      icon: CheckSquare,
      badge: null,
    },
  ];

  const editorialLinks = [
    {
      label: 'Content Studio',
      href: '/app/cases?status=CONTENT_READY',
      icon: Sparkles,
      badge: null,
      badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200/60 font-semibold',
    },
  ];

  const systemLinks = [
    {
      label: 'Settings',
      href: '/app/settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app';
    if (href.includes('?')) {
      const [base] = href.split('?');
      return pathname === base;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Intelligent Intake Choice Modal */}
      <IntakeChoiceModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
          <Link href="/app" className="flex items-baseline gap-2">
            <img src="/casedesk.png" alt="CaseDesk" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-xl font-black tracking-tight text-sidebar-primary">CaseDesk</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="text-sidebar-foreground/70 hover:text-sidebar-primary p-1 rounded-md transition-colors"
            title="Open Public Site"
          >
            <ExternalLink size={14} />
          </Link>
        </div>

        {/* Workspace Selector Bar */}
        <div className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shrink-0 font-bold">
              <Building2 size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-sidebar-foreground truncate">{workspaceName}</div>
              <div className="text-[10px] text-sidebar-foreground/65 font-medium">Investigation Desk</div>
            </div>
          </div>
        </div>

        {/* Unified Intelligent Intake CTA */}
        <div className="p-4">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              setIsIntakeModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sidebar-primary hover:bg-secondary-dark text-sidebar-primary-foreground font-semibold rounded-xl text-sm shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-[0.98]"
          >
            <PlusCircle size={16} />
            <span>＋ New Case</span>
          </button>
        </div>

        {/* Nav Hierarchy */}
        <div className="flex-1 px-3 space-y-5 overflow-y-auto pb-4">
          {/* Section: Operations */}
          <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
              Operations
            </div>
            <nav className="space-y-1">
              {operationsLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                         ? 'bg-sidebar-accent text-sidebar-primary'
                         : 'text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                       <Icon size={16} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${link.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section: Editorial */}
          <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
              Editorial
            </div>
            <nav className="space-y-1">
              {editorialLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                         ? 'bg-sidebar-accent text-sidebar-primary'
                         : 'text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                       <Icon size={16} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${link.badgeColor}`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Section: System */}
          <div>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/60">
              System
            </div>
            <nav className="space-y-1">
              {systemLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                         ? 'bg-sidebar-accent text-sidebar-primary'
                         : 'text-sidebar-foreground/80 hover:text-sidebar-primary hover:bg-sidebar-accent/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                       <Icon size={16} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'} />
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Footer Profile & Role */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0] || 'U'
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-sidebar-foreground truncate">{user?.name || 'Investigator'}</div>
                <div className="text-[10px] uppercase font-bold text-sidebar-foreground/60 tracking-wider">
                  {user?.role || 'RESEARCHER'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-sidebar-foreground/60 hover:text-white hover:bg-destructive/30 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
