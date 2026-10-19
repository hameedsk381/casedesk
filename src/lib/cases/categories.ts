/**
 * Case categories. Workspaces may override the default list from
 * Settings → Case Categories; these values are the seed and fallback.
 */
export const DEFAULT_CASE_CATEGORIES = [
  'Healthcare',
  'Government Services',
  'Police / Law Enforcement',
  'Education',
  'Land / Property',
  'Consumer Complaint',
  'Employment',
  'Infrastructure',
  'Environment',
  'Public Safety',
  'Financial',
  'Legal',
  'Other',
] as const;

const MAX_CATEGORIES = 50;
const MAX_LENGTH = 60;

/**
 * Coerces an untrusted value into a clean category list: strings only, trimmed,
 * de-duplicated case-insensitively, length- and count-capped. Returns null when
 * the input is not an array at all, so callers can distinguish "not provided".
 */
export function normalizeCategories(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;

  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const value = raw.trim().slice(0, MAX_LENGTH);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= MAX_CATEGORIES) break;
  }
  return result;
}

/** The workspace's categories, or the defaults when none are configured. */
export function effectiveCategories(categories: unknown): string[] {
  const normalized = normalizeCategories(categories);
  return normalized && normalized.length > 0 ? normalized : [...DEFAULT_CASE_CATEGORIES];
}
