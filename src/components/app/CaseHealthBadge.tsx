import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CaseHealthBadgeProps {
  status?: string | null;
  reason?: string | null;
  size?: 'sm' | 'md';
  showReason?: boolean;
}

export default function CaseHealthBadge({
  status = 'ON_TRACK',
  reason,
  size = 'md',
  showReason = false,
}: CaseHealthBadgeProps) {
  const normStatus = (status || 'ON_TRACK').toUpperCase();

  let config = {
    label: 'On Track',
    icon: CheckCircle2,
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    iconColor: 'text-emerald-600',
  };

  if (normStatus === 'BLOCKED') {
    config = {
      label: 'Blocked',
      icon: AlertCircle,
      bg: 'bg-red-50 text-red-700 border-red-200/80',
      dot: 'bg-red-500 animate-pulse',
      iconColor: 'text-red-600',
    };
  } else if (normStatus === 'NEEDS_ATTENTION') {
    config = {
      label: 'Needs Attention',
      icon: AlertTriangle,
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      dot: 'bg-amber-500',
      iconColor: 'text-amber-600',
    };
  }

  const Icon = config.icon;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        title={reason || config.label}
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border transition-colors ${
          config.bg
        } ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        <Icon size={size === 'sm' ? 11 : 13} className={config.iconColor} />
        <span>{config.label}</span>
      </span>
      {showReason && reason && (
        <span className="text-[10px] text-slate-500 font-medium max-w-[220px] leading-tight line-clamp-1">
          {reason}
        </span>
      )}
    </div>
  );
}
