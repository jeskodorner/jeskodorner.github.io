/**
 * Portfolio: Liste "showroom" in src/content/pages/startseite.md – welche Fotos, jeweils mit optionalem eigenem
 * Namen. Sortiert nach dem Datum des Albums, das neueste zuerst. Leere Liste: jede öffentliche Galerie einmal mit
 * Vorschaubild. Genutzt von der Startseite (Fotowechsel), der Seite /portfolio/ und den Mappen.
 */
import { getEntry, type CollectionEntry } from 'astro:content';
import { getPublicGalleries, type Gallery, type GalleryImage } from './galleries';
import { formatMonth } from '../i18n';
import { fileOf, folderOf } from './portfolio-paths';

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
  /** Fotos der Mappe aus dem Portfolio-Eintrag (Dateinamen), sonst undefined */
  mappe?: string[];
  /** Beschreibung der Mappe (optional) */
  beschreibung?: string;
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
  // Seit 22.11.2026: Im Album schaltet „portfolio.zeigen“ das Album ins Portfolio (CMS: Alben → Portfolio)
  const fromAlbums = galleries.filter((g) => g.entry.data.portfolio?.zeigen);
  if (fromAlbums.length) {
    return byDate(
      fromAlbums.map((g) => {
        const p = g.entry.data.portfolio!;
        const bild = fileOf(p.vorschau);
        const image = bild ? g.images.find((i) => i.file === bild) : g.cover;
        if (!image) throw new Error(`${g.folder}/index.md → portfolio.vorschau: Bild „${bild}“ gibt es im Album nicht.`);
        const mappe = p.fotos?.map((f) => fileOf(f)).filter((f): f is string => Boolean(f));
        return {
          ...workFor(g, image, p.name?.trim() || undefined),
          mappe: mappe?.length ? mappe : undefined,
          beschreibung: p.beschreibung?.trim() || undefined,
        };
      }),
    );
  }
  // Früher: Liste „showroom“ in startseite.md
  const showroom = text.showroom;
  if (!showroom?.length) return byDate(galleries.map((g) => workFor(g)));
  return byDate(showroom.map((s) => {
    const key = s.galerie?.trim() || folderOf(s.bild);
    const g = galleries.find((x) => x.slug === key || x.id === key || x.folder === key);
    if (!g) {
      throw error(`Galerie „${key ?? '(leer)'}“ gibt es nicht oder sie ist nicht öffentlich. Möglich: ${galleries.map((x) => x.slug).join(', ')}`);
    }
    const bild = fileOf(s.bild);
    const image = bild ? g.images.find((i) => i.file === bild) : g.cover;
    if (!image) throw error(`Bild „${bild}“ gibt es in „${g.slug}“ nicht. Möglich: ${g.images.map((i) => i.file).join(', ')}`);
    const mappe = s.mappe?.map((p) => fileOf(p)).filter((f): f is string => Boolean(f));
    return { ...workFor(g, image, s.name?.trim() || undefined), mappe: mappe?.length ? mappe : undefined };
  }));
}
