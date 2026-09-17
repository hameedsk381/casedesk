import React from 'react';

type BadgeVariant = 'blue' | 'success' | 'warning' | 'destructive' | 'success' | 'warning' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  blue: 'bg-primary-subtle text-primary',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  destructive: 'bg-destructive-subtle text-red',
  success: 'bg-success-subtle text-green',
  warning: 'bg-warning-subtle text-yellow',
  neutral: 'bg-surface text-muted-foreground',
};

const dotStyles: Record<BadgeVariant, string> = {
  blue: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-red',
  success: 'bg-green',
  warning: 'bg-yellow',
  neutral: 'bg-secondary',
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
