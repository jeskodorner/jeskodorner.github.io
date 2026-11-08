/**
 * Daten eines Fotos für die Lightbox (data-pswp-*, Bildunterschrift, Details) – gemeinsam für
 * Alben (GalleryGrid) und das Portfolio (dort öffnet ein Klick direkt das ganze Album).
 */
import type { Gallery, GalleryImage } from './galleries';
import { responsive, type ResponsiveSet } from './images';
import { exifRows } from './exif';
import { formatDate, useTranslations } from '../i18n';

export interface PhotoData {
  set: ResponsiveSet;
  /** Attribute für den Foto-Link */
  attrs: Record<string, string | number | undefined>;
}

export async function photoData(gallery: Gallery, img: GalleryImage): Promise<PhotoData> {
  const t = useTranslations();
  const set = await responsive(img.src);
  // Details für die Lightbox: [Bezeichnung, Wert]
  const details: [string, string][] = [];
  if (gallery.showExif) {
    for (const r of exifRows(img.exif)) details.push([r.label, r.value]);
    const shot = img.exif.date ? new Date(img.exif.date) : undefined;
    if (shot && !Number.isNaN(shot.getTime())) details.push([t.image.date, formatDate(shot)]);
  }
  return {
    set,
    attrs: {
      'data-pswp-src': set.largest.url,
      'data-pswp-width': set.largest.width,
      'data-pswp-height': set.largest.height,
      'data-pswp-srcset': set.webp,
      'data-index': img.index,
      'data-caption': img.caption,
      'data-details': details.length ? JSON.stringify(details) : undefined,
      'data-original': img.originalUrl,
    },
  };
}
