import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export default function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  return (
    <div
      className={`group relative bg-white border border-surface-3 rounded-xl p-6 lg:p-8 transition-all duration-300 hover:border-border hover:shadow-sm ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-primary-subtle flex items-center justify-center text-primary mb-5 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
