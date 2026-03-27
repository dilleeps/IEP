import { en, type TranslationKeys } from './en';
import { es } from './es';

export type Language = 'en' | 'es';

const translations: Record<Language, TranslationKeys> = { en, es };

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object
      ? `${K}.${NestedKeyOf<T[K]>}`
      : K
    }[keyof T & string]
  : never;

type TranslationKey = NestedKeyOf<TranslationKeys>;

export function t(key: string): string {
  const keys = key.split('.');
  let result: any = translations[currentLanguage];
  for (const k of keys) {
    result = result?.[k];
  }
  return typeof result === 'string' ? result : key;
}

export { en, es };
export type { TranslationKeys };
