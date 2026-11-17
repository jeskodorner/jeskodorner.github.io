import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** Breiten, in denen jedes Bild erzeugt wird (srcset). Überall gleich → keine Doppelungen im Build.
 *  320 für kleine Kacheln am Handy (Alben, Mappen, Galerie): spart dort gut die Hälfte der Daten. */
export const WIDTHS = [320, 480, 800, 1200, 1600, 2400] as const;

const AVIF_QUALITY = 55;
const WEBP_QUALITY = 78;

export interface ResponsiveSet {
  avif: string;
  webp: string;
  /** Fallback-src (WebP) */
  src: string;
  width: number;
  height: number;
  /** Alle WebP-Varianten (für PhotoSwipe & JSON-LD) */
  webpVariants: { url: string; width: number }[];
  /** Größte WebP-Variante */
  largest: { url: string; width: number; height: number };
}

/** srcset auf Breiten ≤ maxWidth kürzen (mindestens die kleinste Variante bleibt) – gemeinsam für Picture und Vorladen */
export function limitSrcset(srcset: string, maxWidth?: number) {
  if (!maxWidth) return srcset;
  const parts = srcset.split(', ');
  const kept = parts.filter((p) => Number(p.match(/ (\d+)w$/)?.[1] ?? Infinity) <= maxWidth);
  return (kept.length ? kept : parts.slice(0, 1)).join(', ');
}

/** Für <link rel="preload" as="image"> im Kopf der Seite: genau dieselbe AVIF-Auswahl wie im <picture>, damit der
 *  Browser das wichtigste Bild schon parallel zur Seite holt (und nicht doppelt) */
export async function preloadImage(src: ImageMetadata, sizes: string, maxWidth?: number) {
  const set = await responsive(src);
  return { srcset: limitSrcset(set.avif, maxWidth), sizes };
}

// Wichtig: nicht `src.src` lesen – Astro würde sonst das Master-Bild zusätzlich ausliefern.
const memo = new WeakMap<ImageMetadata, Promise<ResponsiveSet>>();

function widthsFor(src: ImageMetadata) {
  const w = WIDTHS.filter((x) => x < src.width) as number[];
  w.push(Math.min(src.width, WIDTHS[WIDTHS.length - 1]));
  return w;
}

/** Erzeugt AVIF- und WebP-srcsets in festen Breiten. */
export function responsive(src: ImageMetadata): Promise<ResponsiveSet> {
  let p = memo.get(src);
  if (!p) {
    p = build(src);
    memo.set(src, p);
  }
  return p;
}

async function build(src: ImageMetadata): Promise<ResponsiveSet> {
  const widths = widthsFor(src);
  const maxW = widths[widths.length - 1]!;
  const [avif, webp] = await Promise.all([
    getImage({ src, widths, width: maxW, format: 'avif', quality: AVIF_QUALITY }),
    getImage({ src, widths, width: maxW, format: 'webp', quality: WEBP_QUALITY }),
  ]);
  const ratio = src.height / src.width;
  const webpVariants = webp.srcSet.values.map((v) => ({
    url: v.url,
    width: Number(v.transform.width ?? maxW),
  }));
  const largest = webpVariants.reduce((a, b) => (b.width > a.width ? b : a), webpVariants[0]!);
  return {
    avif: avif.srcSet.attribute,
    webp: webp.srcSet.attribute,
    src: webp.src,
    width: src.width,
    height: src.height,
    webpVariants,
    largest: { url: largest.url, width: largest.width, height: Math.round(largest.width * ratio) },
  };
}

/** Vorschaubild für Open Graph / Twitter (1200 × 630, JPG für maximale Kompatibilität). */
export async function ogImage(src: ImageMetadata) {
  const img = await getImage({ src, width: 1200, height: 630, fit: 'cover', format: 'jpg', quality: 80 });
  return { url: img.src, width: 1200, height: 630 };
}
