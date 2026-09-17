'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquareText,
  FileUp,
  Mic,
  PenTool,
  X,
  Sparkles,
  ArrowRight,
  Inbox,
} from 'lucide-react';

interface IntakeChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntakeChoiceModal({ isOpen, onClose }: IntakeChoiceModalProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectMode = (mode: string) => {
    onClose();
    router.push(`/app/cases/new?mode=${mode}`);
  };

  const options = [
    {
      id: 'text',
      title: 'Paste Citizen Message',
      subtitle: 'WhatsApp forward, Instagram DM, or grievance email text',
      badge: 'AI Powered',
      badgeColor: 'bg-electric-blue/10 text-electric-blue',
      icon: MessageSquareText,
      iconBg: 'bg-electric-blue/10 text-electric-blue group-hover:bg-electric-blue group-hover:text-white',
      borderColor: 'hover:border-electric-blue',
    },
    {
      id: 'file',
      title: 'Upload Evidence / Documents',
      subtitle: 'Official petitions, FIR copies, lab reports, photo evidence, or PDFs',
      badge: 'Multi-File',
      badgeColor: 'bg-emerald-50 text-emerald-700',
      icon: FileUp,
      iconBg: 'bg-emerald-100/60 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
      borderColor: 'hover:border-emerald-500',
    },
    {
      id: 'voice',
      title: 'Voice Note / Audio Grievance',
      subtitle: 'Upload WhatsApp audio dispatch or field recording with auto-transcription',
      badge: 'Transcription',
      badgeColor: 'bg-purple-50 text-purple-700',
      icon: Mic,
      iconBg: 'bg-purple-100/60 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
      borderColor: 'hover:border-purple-500',
    },
    {
      id: 'manual',
      title: 'Manual Structured Entry',
      subtitle: 'Directly fill case dossier, title, category, priority, and verification checks',
      badge: 'Direct Entry',
      badgeColor: 'bg-slate-100 text-slate-700',
      icon: PenTool,
      iconBg: 'bg-slate-100 text-slate-700 group-hover:bg-navy group-hover:text-white',
      borderColor: 'hover:border-navy',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-border-light overflow-hidden transition-all scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-7 pt-7 pb-5 border-b border-border-light/80 flex items-start justify-between bg-radial from-electric-blue/5 to-transparent">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[11px] font-bold tracking-wide uppercase mb-2">
              <Sparkles size={12} />
              <span>Intelligent Case Intake</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-navy">
              Choose How to Bring in This Report
            </h2>
            <p className="text-xs text-slate mt-1">
              Select your source format. CaseDesk will extract claims, detect locations, and propose verification checks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-navy hover:bg-off-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Options Grid */}
        <div className="p-6 grid sm:grid-cols-2 gap-3.5 bg-off-white/30">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectMode(opt.id)}
                className={`group text-left p-4 rounded-2xl bg-white border border-border-light/90 shadow-xs ${opt.borderColor} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${opt.iconBg}`}
                    >
                      <Icon size={20} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-navy group-hover:text-electric-blue transition-colors">
                    {opt.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {opt.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border-light/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 group-hover:text-electric-blue transition-colors">
                  <span>Continue</span>
                  <ArrowRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer with Inbox shortcut */}
        <div className="px-6 py-4 bg-off-white/80 border-t border-border-light/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Inbox size={15} className="text-electric-blue" />
            <span>Have raw citizen messages waiting?</span>
          </div>
          <Link
            href="/app/inbox"
            onClick={onClose}
            className="text-xs font-bold text-electric-blue hover:text-navy hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Review Intake Inbox (8 Reports)</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
