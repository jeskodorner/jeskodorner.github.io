/**
 * „Mappe“: eine ruhige Übersicht zu einem Album aus dem Portfolio – wenige Fotos, groß, fast ohne Text, unten der
 * Weg ins ganze Album. Erreichbar über „Mappe ansehen →“ auf der Startseite (pages/mappe/[slug].astro).
 *
 * Welche Fotos: Steht im Album (index.md) eine Liste `mappe:` mit Dateinamen, genau diese in dieser Reihenfolge.
 * Sonst das Foto, das auf der Startseite zu sehen war, und dazu bis zu 7 weitere, gleichmäßig über das Album verteilt
 * (kleine Alben: alle Fotos).
 */
import type { Gallery, GalleryImage } from './galleries';
import { getSelectedWorks } from './showroom';

/** So viele Fotos zeigt eine Mappe höchstens (ohne eigene Liste) */
export const MAPPE_SIZE = 8;

export const mappeUrl = (g: Gallery) => `/mappe/${g.slug}/`;

export function mappeImages(g: Gallery, lead: GalleryImage = g.cover): GalleryImage[] {
  const list = g.entry.data.mappe;
  if (list?.length) {
    return list.map((file) => {
      const img = g.images.find((i) => i.file === file);
      if (!img) {
        throw new Error(
          `${g.folder}/index.md → mappe: Bild „${file}“ gibt es nicht. Möglich: ${g.images.map((i) => i.file).join(', ')}`,
        );
      }
      return img;
    });
  }
  const rest = g.images.filter((i) => i !== lead);
  const n = MAPPE_SIZE - 1;
  if (rest.length <= n) return [lead, ...rest];
  const step = rest.length / n;
  return [lead, ...Array.from({ length: n }, (_, k) => rest[Math.floor(k * step + step / 2)]!)];
}

/** Alle Mappen: je Album aus dem Portfolio eine, mit dem Foto aus dem Portfolio vorne */
export async function getMappen() {
  const works = await getSelectedWorks();
  const seen = new Map<string, { gallery: Gallery; lead: GalleryImage }>();
  for (const w of works) if (!seen.has(w.gallery.slug)) seen.set(w.gallery.slug, { gallery: w.gallery, lead: w.image });
  return [...seen.values()];
}
