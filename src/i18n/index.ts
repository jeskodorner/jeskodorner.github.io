import { de } from './de';

/** Aktuell nur Deutsch. Für Englisch: `en` importieren und hier ergänzen. */
export const dictionaries = { de } as const;
export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = 'de';

export function useTranslations(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}

/** Datum lokalisiert formatieren, z. B. „Oktober 2026“ */
/** Monat + Jahr eines Kalenderdatums aus dem Frontmatter (date: 2026-04-01 = Mitternacht UTC).
 *  Immer in UTC formatieren – sonst wird auf einem Rechner westlich von Greenwich (z. B. Ecuador)
 *  aus dem 1. April der 31. März. */
export function formatMonth(date: Date, locale: Locale = defaultLocale) {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDate(date: Date, locale: Locale = defaultLocale) {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
