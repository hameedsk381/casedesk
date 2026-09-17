import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  headline: string | React.ReactNode;
  body?: string;
  centered?: boolean;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  headline,
  body,
  centered = true,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''} ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] tracking-tight text-primary">
        {headline}
      </h2>
      {body && (
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          {body}
        </p>
      )}
    </div>
  );
}
