import React from 'react';
import { AlertTriangle, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react';

export interface PriorityBadgeProps {
  priority: string;
  className?: string;
  size?: 'sm' | 'md';
}

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ElementType }> = {
  LOW: {
    label: 'Low',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: ArrowDown,
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: ArrowUp,
  },
  HIGH: {
    label: 'High',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: AlertTriangle,
  },
  URGENT: {
    label: 'Urgent',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: AlertCircle,
  },
};

export default function PriorityBadge({ priority, className = '', size = 'sm' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
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
