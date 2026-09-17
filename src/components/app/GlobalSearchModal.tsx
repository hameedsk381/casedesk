'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Folder, User, PhoneCall, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { GlobalSearchResult } from '@/lib/search/service';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <Folder size={16} className="text-electric-blue" />;
      case 'source':
        return <User size={16} className="text-teal" />;
      case 'contact':
        return <PhoneCall size={16} className="text-coral" />;
      case 'evidence':
        return <FileText size={16} className="text-navy" />;
      default:
        return <Search size={16} className="text-slate" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-navy/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-border-light overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border-light">
          <Search size={20} className="text-slate-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, sources, contacts, or evidence files..."
            className="w-full bg-transparent text-navy text-base focus:outline-none placeholder:text-slate-500"
          />
          {loading && <Loader2 size={18} className="animate-spin text-electric-blue mr-2" />}
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3">
          {query.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type at least 2 characters to search across cases, sources, contacts, and evidence.
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-slate-500">
              No results found for &ldquo;<span className="font-semibold text-navy">{query}</span>&rdquo;
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((res) => (
                <div
                  key={`${res.type}-${res.id}`}
                  onClick={() => handleSelect(res.href)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-off-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-off-white border border-border-light flex items-center justify-center shrink-0">
                      {getIcon(res.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-navy truncate group-hover:text-electric-blue transition-colors">
                        {res.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{res.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {res.badge && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {res.badge}
                      </span>
                    )}
                    <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-off-white/70 border-t border-border-light flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-border-light rounded text-[10px]">Esc</kbd> to close
            </span>
          </div>
          <span>CaseDesk Global Index</span>
        </div>
      </div>
    </div>
  );
}
