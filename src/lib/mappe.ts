/**
 * „Mappe“: eine ruhige Übersicht zu einem Album aus dem Portfolio – wenige Fotos, groß, fast ohne Text, unten der
 * Weg ins ganze Album. Erreichbar über „Mappe ansehen →“ auf der Startseite (pages/mappe/[slug].astro).
 *
 * Welche Fotos: Steht im Album (index.md) eine Liste `mappe:` mit Dateinamen, genau diese in dieser Reihenfolge.
 * Sonst das Foto aus dem Portfolio und dazu bis zu 7 weitere, gleichmäßig über das Album verteilt (kleine Alben: alle
 * Fotos). Das Foto aus dem Portfolio steht nie vorne – man hat es gerade groß gesehen –, sondern am Ende (seit
 * 22.11.2026, Jeskos Wunsch; vorher stand es als erstes).
 */
import type { Gallery, GalleryImage } from './galleries';
import { getSelectedWorks } from './showroom';

/** So viele Fotos zeigt eine Mappe höchstens (ohne eigene Liste) */
export const MAPPE_SIZE = 8;

export const mappeUrl = (g: Gallery) => `/mappe/${g.slug}/`;

/** Das Foto aus dem Portfolio nach hinten, falls es vorne stünde */
const leadLast = (imgs: GalleryImage[], lead: GalleryImage) =>
  imgs.length > 1 && imgs[0] === lead ? [...imgs.slice(1), lead] : imgs;

/** Fotos der Mappe: Liste aus dem Portfolio-Eintrag (`own`), sonst `mappe:` im Album, sonst automatisch */
export function mappeImages(g: Gallery, lead: GalleryImage = g.cover, own?: string[]): GalleryImage[] {
  const list = own?.length ? own : g.entry.data.mappe;
  if (list?.length) {
    return leadLast(list.map((file) => {
      const img = g.images.find((i) => i.file === file);
      if (!img) {
        throw new Error(
          `Mappe „${g.slug}“: Bild „${file}“ gibt es im Album nicht. Möglich: ${g.images.map((i) => i.file).join(', ')}`,
        );
      }
      return img;
    }), lead);
  }
  const rest = g.images.filter((i) => i !== lead);
  const n = MAPPE_SIZE - 1;
  if (rest.length <= n) return [...rest, lead];
  const step = rest.length / n;
  return [...Array.from({ length: n }, (_, k) => rest[Math.floor(k * step + step / 2)]!), lead];
}

/** Alle Mappen: je Album aus dem Portfolio eine, mit dem Foto aus dem Portfolio vorne */
export async function getMappen() {
  const works = await getSelectedWorks();
  const seen = new Map<string, { gallery: Gallery; lead: GalleryImage; mappe?: string[]; name?: string; beschreibung?: string }>();
  for (const w of works)
    if (!seen.has(w.gallery.slug))
      seen.set(w.gallery.slug, { gallery: w.gallery, lead: w.image, mappe: w.mappe, name: w.name, beschreibung: w.beschreibung });
  return [...seen.values()];
}
