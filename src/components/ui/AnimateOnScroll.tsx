'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation?: 'fade-in-up' | 'fade-in' | 'slide-in-left' | 'slide-in-right' | 'scale-in';
  delay?: number;
  className?: string;
  threshold?: number;
}

const animationClasses: Record<string, string> = {
  'fade-in-up': 'animate-fade-in-up',
  'fade-in': 'animate-fade-in',
  'slide-in-left': 'animate-slide-in-left',
  'slide-in-right': 'animate-slide-in-right',
  'scale-in': 'animate-scale-in',
};

export default function AnimateOnScroll({
  children,
  animation = 'fade-in-up',
  delay = 0,
  className = '',
  threshold = 0.15,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`${isVisible ? animationClasses[animation] : 'scroll-hidden'} ${className}`}
      style={isVisible && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
