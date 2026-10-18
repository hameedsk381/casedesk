import { cookies, headers } from 'next/headers';
import type { Language } from './useTranslation';

export const LANG_COOKIE = 'lang';
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'te';
}

/**
 * Resolves the display language on the server:
 * explicit ?lang= → saved cookie → browser Accept-Language (Telugu) → English.
 */
export async function getServerLang(explicit?: string | string[]): Promise<Language> {
  if (typeof explicit === 'string' && isLanguage(explicit)) return explicit;

  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLanguage(saved)) return saved;

  const acceptLanguage = (await headers()).get('accept-language') || '';
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.trim().split(';')[0].toLowerCase())
    .find((tag) => tag.startsWith('te') || tag.startsWith('en'));
  return preferred?.startsWith('te') ? 'te' : 'en';
}
