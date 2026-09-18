'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Search, Plus } from 'lucide-react';
import NotificationMenu from './NotificationMenu';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  user?: any;
}

export default function Topbar({ onOpenMobileMenu, onOpenSearch, user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6">
      {/* Left Mobile Menu & Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 text-primary hover:bg-surface rounded-lg transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-2 border border-border text-muted-foreground text-xs font-medium transition-all w-48 sm:w-72 cursor-pointer"
        >
          <Search size={15} className="text-muted-foreground shrink-0" />
          <span className="truncate">Search cases, sources, files...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] text-muted-foreground font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/cases/new"
          className="hidden sm:inline-flex items-center gap-1.5 py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={14} />
          <span>New Case</span>
        </Link>

        {/* Notifications */}
        <NotificationMenu />

        {/* Profile icon */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0] || 'U'
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
