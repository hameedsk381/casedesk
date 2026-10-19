'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_CASE_CATEGORIES } from '@/lib/cases/categories';

/**
 * The active workspace's case categories, fall-backs to the built-in defaults
 * while loading or when none are configured.
 */
export function useWorkspaceCategories(): string[] {
  const [categories, setCategories] = useState<string[]>([...DEFAULT_CASE_CATEGORIES]);

  useEffect(() => {
    let active = true;
    fetch('/api/workspace')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const configured = data?.workspace?.categories;
        if (Array.isArray(configured) && configured.length > 0) {
          setCategories(configured);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
