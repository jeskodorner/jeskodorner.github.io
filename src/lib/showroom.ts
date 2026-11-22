/**
 * Portfolio: Liste "showroom" in src/content/pages/startseite.md – welche Fotos, jeweils mit optionalem eigenem
 * Namen. Sortiert nach dem Datum des Albums, das neueste zuerst. Leere Liste: jede öffentliche Galerie einmal mit
 * Vorschaubild. Genutzt von der Startseite (Fotowechsel), der Seite /portfolio/ und den Mappen.
 */
import { getEntry, type CollectionEntry } from 'astro:content';
import { getPublicGalleries, type Gallery, type GalleryImage } from './galleries';
import { formatMonth } from '../i18n';

export interface WorkItem {
  image: GalleryImage;
  /** Album, zu dem das Foto gehört */
  gallery: Gallery;
  /** Link zum Album, zu dem das Foto gehört */
  href: string;
  /** Link, der genau dieses Foto im Album öffnet (Lightbox) */
  photoHref: string;
  /** Name des Albums */
  album: string;
  /** Eigener Name des Fotos (optional) */
  name?: string;
  meta?: string;
}

export async function getSelectedWorks(): Promise<WorkItem[]> {
  const text: Partial<CollectionEntry<'pages'>['data']> = (await getEntry('pages', 'startseite'))?.data ?? {};
  const galleries = await getPublicGalleries();
  const workFor = (g: Gallery, image: GalleryImage = g.cover, name?: string): WorkItem => ({
    image,
    gallery: g,
    href: g.url,
    photoHref: image.hashUrl,
    album: g.title,
    name,
    // Unter dem Titel nur das Datum – überall auf der Website ohne Anzahl der Fotos und ohne Ort (seit 20.11.2026)
    meta: formatMonth(g.date),
  });
  const error = (msg: string) => new Error(`startseite.md → showroom: ${msg}`);
  // Nach dem Datum des Albums, das neueste zuerst (seit 22.11.2026); bei gleichem Datum bleibt die Reihenfolge der
  // Liste (sort ist stabil)
  const byDate = (works: WorkItem[]) => works.sort((a, b) => b.gallery.date.getTime() - a.gallery.date.getTime());
  const showroom = text.showroom;
  if (!showroom?.length) return byDate(galleries.map((g) => workFor(g)));
  return byDate(showroom.map((s) => {
    const g = galleries.find((x) => x.slug === s.galerie || x.id === s.galerie);
    if (!g) {
      throw error(`Galerie „${s.galerie}“ gibt es nicht oder sie ist nicht öffentlich. Möglich: ${galleries.map((x) => x.slug).join(', ')}`);
    }
    const image = s.bild ? g.images.find((i) => i.file === s.bild) : g.cover;
    if (!image) throw error(`Bild „${s.bild}“ gibt es in „${s.galerie}“ nicht. Möglich: ${g.images.map((i) => i.file).join(', ')}`);
    return workFor(g, image, s.name?.trim() || undefined);
  }));
}
