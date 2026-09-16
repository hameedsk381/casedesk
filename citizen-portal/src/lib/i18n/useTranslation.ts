import { en, Dictionary } from './dictionaries/en';
import { te } from './dictionaries/te';
import { CIVIC_CATEGORIES } from '../contracts/intake';

export type Language = 'en' | 'te';

const dictionaries: Record<Language, Dictionary> = {
  en,
  te,
};

export function useTranslation(lang: Language = 'en') {
  const dictionary = dictionaries[lang] || dictionaries.en;

  const getCategoryName = (categoryId: string): string => {
    const found = CIVIC_CATEGORIES.find((c) => c.id === categoryId);
    if (!found) return categoryId;
    return lang === 'te' ? found.te : found.en;
  };

  return {
    t: dictionary,
    lang,
    categories: CIVIC_CATEGORIES.map((c) => ({
      id: c.id,
      name: lang === 'te' ? c.te : c.en,
    })),
    getCategoryName,
  };
}
