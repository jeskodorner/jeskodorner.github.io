/**
 * Ausgewählte Arbeiten: Liste "showroom" in src/content/pages/startseite.md – welche Fotos in welcher
 * Reihenfolge, jeweils mit optionalem eigenem Namen. Leere Liste: jede öffentliche Galerie einmal mit Vorschaubild.
 * Genutzt von der Startseite (Bilderstapel) und der Seite /ausgewaehlte-arbeiten/.
 */
import { getEntry, type CollectionEntry } from 'astro:content';
import { getPublicGalleries, type Gallery, type GalleryImage } from './galleries';
import { useTranslations, formatMonth } from '../i18n';

export interface WorkItem {
  image: GalleryImage;
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
  const t = useTranslations();
  const text: Partial<CollectionEntry<'pages'>['data']> = (await getEntry('pages', 'startseite'))?.data ?? {};
  const galleries = await getPublicGalleries();
  const workFor = (g: Gallery, image: GalleryImage = g.cover, name?: string): WorkItem => ({
    image,
    href: g.url,
    photoHref: image.hashUrl,
    album: g.title,
    name,
    meta: (name ? [formatMonth(g.date), g.location] : [t.galleries.images(g.images.length), formatMonth(g.date), g.location])
      .filter(Boolean)
      .join(' · '),
  });
  const error = (msg: string) => new Error(`startseite.md → showroom: ${msg}`);
  const showroom = text.showroom;
  if (!showroom?.length) return galleries.map((g) => workFor(g));
  return showroom.map((s) => {
    const g = galleries.find((x) => x.slug === s.galerie || x.id === s.galerie);
    if (!g) {
      throw error(`Galerie „${s.galerie}“ gibt es nicht oder sie ist nicht öffentlich. Möglich: ${galleries.map((x) => x.slug).join(', ')}`);
    }
    const image = s.bild ? g.images.find((i) => i.file === s.bild) : g.cover;
    if (!image) throw error(`Bild „${s.bild}“ gibt es in „${s.galerie}“ nicht. Möglich: ${g.images.map((i) => i.file).join(', ')}`);
    return workFor(g, image, s.name?.trim() || undefined);
  });
}
