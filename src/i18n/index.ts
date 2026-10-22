import { de } from './de';

/** Aktuell nur Deutsch. Für Englisch: `en` importieren und hier ergänzen. */
export const dictionaries = { de } as const;
export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = 'de';

export function useTranslations(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}

/** Datum lokalisiert formatieren, z. B. „Oktober 2026“ */
export function formatMonth(date: Date, locale: Locale = defaultLocale) {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDate(date: Date, locale: Locale = defaultLocale) {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
