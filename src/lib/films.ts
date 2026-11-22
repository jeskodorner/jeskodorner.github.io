/**
 * Filme: Liste, Adressen und Vorschau für die Übersicht /film/ und die Seite je Film /film/<name>/.
 * <name> ist der Dateiname in src/content/films/ ohne .md.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Film = CollectionEntry<'films'>;

/** Alle Filme in der Reihenfolge der Seite (Feld `order`, dann neuere zuerst) */
export async function getFilms(): Promise<Film[]> {
  return (await getCollection('films')).sort(
    (a, b) => a.data.order - b.data.order || (b.data.year ?? 0) - (a.data.year ?? 0),
  );
}

export const filmUrl = (f: Film) => `/film/${f.id}/`;

/** Vorschaubild für die Übersicht: eigenes Vorschaubild (`cover`), sonst das Standbild */
export const filmPreview = (f: Film) =>
  f.data.cover
    ? { src: f.data.cover, alt: f.data.coverAlt ?? '' }
    : f.data.still
      ? { src: f.data.still, alt: f.data.stillAlt ?? '' }
      : undefined;

/** Kurztext für die Übersicht: `summary`, sonst der erste Absatz des Textes (ohne Markdown-Zeichen) */
export function filmTeaser(f: Film): string {
  if (f.data.summary) return f.data.summary;
  const first = (f.body ?? '').trim().split(/\n\s*\n/)[0] ?? '';
  return first
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
