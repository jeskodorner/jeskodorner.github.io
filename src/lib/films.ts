/**
 * Filme: Liste, Adressen und Vorschau für die Übersicht /film/ und die Seite je Film /film/<name>/.
 * <name> ist der Dateiname in src/content/films/ ohne .md.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { getAllGalleries } from './galleries';

export type Film = CollectionEntry<'films'>;

/** Alle Filme in der Reihenfolge der Seite (Feld `order`, dann neuere zuerst) */
export async function getFilms(): Promise<Film[]> {
  const films = (await getCollection('films')).sort(
    (a, b) => a.data.order - b.data.order || (b.data.year ?? 0) - (a.data.year ?? 0),
  );
  // Tippfehler bei `galerie` fallen sofort auf (sonst fehlte das Video still und leise in der Mappe)
  const galleries = await getAllGalleries();
  for (const f of films) {
    const g = f.data.galerie;
    if (g && !galleries.some((x) => x.slug === g || x.folder === g)) {
      throw new Error(`films/${f.id}.md → galerie: Album „${g}“ gibt es nicht. Möglich: ${galleries.map((x) => x.slug).join(', ')}`);
    }
  }
  return films;
}

/** Eigenes Video zu einem Album (Feld `galerie` im Film): erscheint oben in der Mappe des Albums */
export async function filmForGallery(g: { slug: string; folder: string }): Promise<Film | undefined> {
  return (await getFilms()).find((f) => f.data.video && f.data.still && (f.data.galerie === g.slug || f.data.galerie === g.folder));
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
