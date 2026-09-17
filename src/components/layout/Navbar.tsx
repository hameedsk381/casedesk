'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';

const navLinks = [
  { label: 'Product', href: '#product' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'For Teams', href: '#teams' },
  { label: 'Security', href: '#security' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/90 backdrop-blur-md border-b border-surface-3 shadow-xs py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <a href="#" className="flex items-baseline gap-2 group">
          <span className="text-xl font-bold tracking-tight text-primary">CaseDesk</span>
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
            Open Vaartha
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 rounded-lg hover:bg-surface/60"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Sign In
          </Link>
          <Button href="/app" size="sm">
            Launch Workspace
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2 -mr-2 text-primary hover:bg-surface rounded-lg transition-colors"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 top-0 bg-background z-40">
          <div className="flex items-center justify-between px-5 py-5 border-b border-surface-3">
            <a href="#" className="flex items-baseline gap-2" onClick={() => setIsMobileOpen(false)}>
              <span className="text-xl font-bold tracking-tight text-primary">CaseDesk</span>
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary">
                Open Vaartha
              </span>
            </a>
            <button
              className="p-2 -mr-2 text-primary hover:bg-surface rounded-lg transition-colors"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>
          <div className="px-5 py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-base font-medium text-primary hover:bg-surface rounded-lg transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 pt-4 border-t border-surface-3 flex flex-col gap-2">
              <Button href="/app" size="lg" className="w-full" onClick={() => setIsMobileOpen(false)}>
                Launch Workspace
              </Button>
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-sm font-semibold text-muted-foreground hover:text-primary"
                onClick={() => setIsMobileOpen(false)}
              >
                Sign In to Desk
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
