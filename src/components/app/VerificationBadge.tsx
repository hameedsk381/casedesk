import React from 'react';
import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';

export interface VerificationBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

const VERIFY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  NOT_STARTED: {
    label: 'Not Started',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: HelpCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  SUBSTANTIALLY_VERIFIED: {
    label: 'Verified',
    bg: 'bg-success-50',
    text: 'text-success-800',
    border: 'border-success-200',
    icon: CheckCircle2,
  },
  DISPUTED: {
    label: 'Disputed',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: XCircle,
  },
};

export default function VerificationBadge({ status, className = '', size = 'sm' }: VerificationBadgeProps) {
  const config = VERIFY_CONFIG[status] || VERIFY_CONFIG.NOT_STARTED;
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <Icon size={12} className="shrink-0" />
      {config.label}
    </span>
  );
}
