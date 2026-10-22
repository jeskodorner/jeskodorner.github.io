import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { site } from '../config/site';

/** Von `npm run optimize` erzeugte Zusatzdaten pro Bild (meta.json). */
export interface ImageMeta {
  width?: number;
  height?: number;
  color?: string;
  lqip?: string;
  exif?: RawExif;
}

export interface RawExif {
  camera?: string;
  lens?: string;
  aperture?: number | string;
  shutter?: string;
  iso?: number | string;
  focalLength?: number | string;
  date?: string | Date;
}

export interface GalleryImage {
  /** 1-basierte Position in der Galerie (für #bild-3 und /3/) */
  index: number;
  file: string;
  src: ImageMetadata;
  alt: string;
  caption?: string;
  originalUrl?: string;
  featured: boolean;
  hero: boolean;
  exif: RawExif;
  color: string;
  lqip?: string;
  /** Bildseite, z. B. /galerien/kueste/3/ */
  pageUrl: string;
  /** Galerie mit Hash, z. B. /galerien/kueste/#bild-3 */
  hashUrl: string;
}

export interface Gallery {
  id: string;
  folder: string;
  slug: string;
  title: string;
  date: Date;
  location?: string;
  description: string;
  layout: 'showcase' | 'masonry' | 'justified';
  visibility: 'public' | 'unlisted';
  isUnlisted: boolean;
  showExif: boolean;
  url: string;
  cover: GalleryImage;
  images: GalleryImage[];
  download?: { url: string; size?: string; format?: string; note?: string };
  shareText: string;
  entry: CollectionEntry<'galleries'>;
}

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/galleries/*/images/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true },
);
const metaModules = import.meta.glob<{ default: { images?: Record<string, ImageMeta> } }>(
  '/src/content/galleries/*/meta.json',
  { eager: true },
);

const FALLBACK_COLOR = '#d9c9b4';

function folderOf(entry: CollectionEntry<'galleries'>): string {
  // filePath z. B. "src/content/galleries/kueste-im-oktober/index.md"
  const parts = (entry.filePath ?? '').split('/');
  return parts[parts.length - 2] ?? entry.id;
}

export function galleryBasePath(visibility: 'public' | 'unlisted') {
  return visibility === 'unlisted' ? '/g/' : '/galerien/';
}

let cache: Promise<Gallery[]> | undefined;

/** Alle Galerien (öffentlich + unlisted), neueste zuerst. */
export function getAllGalleries(): Promise<Gallery[]> {
  // Im Dev-Server nicht zwischenspeichern, damit Änderungen an index.md sofort sichtbar sind.
  if (!import.meta.env.PROD) return load();
  cache ??= load();
  return cache;
}

async function load(): Promise<Gallery[]> {
  const entries = await getCollection('galleries');
  const seen = new Map<string, string>();

  const galleries = entries.map((entry) => {
    const d = entry.data;
    const folder = folderOf(entry);
    if (seen.has(d.slug)) {
      throw new Error(
        `Slug "${d.slug}" wird doppelt verwendet (Ordner "${seen.get(d.slug)}" und "${folder}"). Jeder Slug muss eindeutig sein.`,
      );
    }
    seen.set(d.slug, folder);

    const meta = metaModules[`/src/content/galleries/${folder}/meta.json`]?.default?.images ?? {};
    const url = `${galleryBasePath(d.visibility)}${d.slug}/`;

    const images: GalleryImage[] = d.images.map((img, i) => {
      const mod = imageModules[`/src/content/galleries/${folder}/images/${img.file}`];
      if (!mod) {
        throw new Error(
          `Galerie "${d.title}": Bild "images/${img.file}" nicht gefunden (Ordner src/content/galleries/${folder}/images/). ` +
            `Hast du "npm run optimize" ausgeführt oder den Dateinamen falsch geschrieben?`,
        );
      }
      const m = meta[img.file] ?? {};
      const index = i + 1;
      return {
        index,
        file: img.file,
        src: mod.default,
        alt: img.alt,
        caption: img.caption,
        originalUrl: img.originalUrl,
        featured: img.featured,
        hero: img.hero,
        exif: { ...(m.exif ?? {}), ...(img.exif ?? {}) },
        color: m.color ?? FALLBACK_COLOR,
        lqip: m.lqip,
        pageUrl: `${url}${index}/`,
        hashUrl: `${url}#bild-${index}`,
      };
    });

    const cover = (d.cover && images.find((i) => i.file === d.cover)) || images[0]!;

    return {
      id: entry.id,
      folder,
      slug: d.slug,
      title: d.title,
      date: d.date,
      location: d.location,
      description: d.description,
      layout: d.layout,
      visibility: d.visibility,
      isUnlisted: d.visibility === 'unlisted',
      showExif: d.showExif,
      url,
      cover,
      images,
      download: d.downloadUrl
        ? { url: d.downloadUrl, size: d.downloadSize, format: d.downloadFormat, note: d.downloadNote }
        : undefined,
      shareText: d.shareText ?? site.shareText,
      entry,
    } satisfies Gallery;
  });

  return galleries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Nur öffentliche Galerien – für Übersicht, Startseite, Sitemap. */
export async function getPublicGalleries() {
  return (await getAllGalleries()).filter((g) => !g.isUnlisted);
}

/** Vorherige/nächste öffentliche Galerie (Unlisted-Galerien haben keine Nachbarn). */
export async function getNeighbours(gallery: Gallery) {
  if (gallery.isUnlisted) return { prev: undefined, next: undefined };
  const list = await getPublicGalleries();
  const i = list.findIndex((g) => g.slug === gallery.slug);
  return { prev: list[i - 1], next: list[i + 1] };
}

/** Ausgewählte Arbeiten für die Startseite (max. 9). */
export async function getFeaturedImages(limit = 9) {
  const galleries = await getPublicGalleries();
  const picked = galleries.flatMap((g) => g.images.filter((i) => i.featured).map((image) => ({ gallery: g, image })));
  if (picked.length >= 6) return picked.slice(0, limit);
  // Fallback: Titelbilder ergänzen
  const covers = galleries
    .map((g) => ({ gallery: g, image: g.cover }))
    .filter((c) => !picked.some((p) => p.image === c.image));
  return [...picked, ...covers].slice(0, limit);
}

/** Hero-Bilder für die Startseite. */
export async function getHeroImages() {
  const galleries = await getPublicGalleries();
  const heroes = galleries.flatMap((g) => g.images.filter((i) => i.hero).map((image) => ({ gallery: g, image })));
  if (heroes.length) return heroes;
  const first = galleries[0];
  return first ? [{ gallery: first, image: first.cover }] : [];
}

/** Teilen-Text mit Platzhaltern füllen. */
export function fillShareText(template: string, title: string, url: string) {
  return template.replaceAll('{title}', title).replaceAll('{url}', url);
}
