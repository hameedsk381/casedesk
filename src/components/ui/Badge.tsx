import React from 'react';

type BadgeVariant = 'blue' | 'teal' | 'coral' | 'red' | 'green' | 'yellow' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-electric-blue-subtle text-electric-blue',
  teal: 'bg-teal-subtle text-teal',
  coral: 'bg-coral-subtle text-coral',
  red: 'bg-red-subtle text-red',
  green: 'bg-green-subtle text-green',
  yellow: 'bg-yellow-subtle text-yellow',
  neutral: 'bg-cream text-slate',
};

const dotStyles: Record<BadgeVariant, string> = {
  blue: 'bg-electric-blue',
  teal: 'bg-teal',
  coral: 'bg-coral',
  red: 'bg-red',
  green: 'bg-green',
  yellow: 'bg-yellow',
  neutral: 'bg-slate-light',
};

export default function Badge({ children, variant = 'neutral', dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}
