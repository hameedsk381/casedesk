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
      className={`group relative bg-white border border-border-light rounded-xl p-6 lg:p-8 transition-all duration-300 hover:border-border hover:shadow-sm ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-electric-blue-subtle flex items-center justify-center text-electric-blue mb-5 transition-colors duration-300 group-hover:bg-electric-blue group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-slate">{description}</p>
    </div>
  );
}
