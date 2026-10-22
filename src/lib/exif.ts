import type { RawExif } from './galleries';
import { de } from '../i18n/de';

export interface ExifRow {
  label: string;
  value: string;
}

function num(v: number | string | undefined) {
  if (v === undefined || v === '') return undefined;
  return typeof v === 'number' ? v : Number.parseFloat(v);
}

/** Wandelt EXIF-Rohwerte in lesbare Zeilen um (nur vorhandene Werte). */
export function exifRows(exif: RawExif): ExifRow[] {
  const t = de.image;
  const rows: ExifRow[] = [];
  if (exif.camera) rows.push({ label: t.camera, value: exif.camera });
  if (exif.lens) rows.push({ label: t.lens, value: exif.lens });
  const f = num(exif.aperture);
  if (f) rows.push({ label: t.aperture, value: `f/${Number.isInteger(f) ? f : f.toFixed(1)}` });
  if (exif.shutter) rows.push({ label: t.shutter, value: `${exif.shutter}${/s$/.test(exif.shutter) ? '' : ' s'}` });
  if (exif.iso) rows.push({ label: t.iso, value: String(exif.iso) });
  const fl = num(exif.focalLength);
  if (fl) rows.push({ label: t.focal, value: `${Math.round(fl)} mm` });
  return rows;
}

/** Kurze Zeile für die Lightbox, z. B. „Fujifilm X-T5 · 35 mm · f/2 · 1/250 s · ISO 400“ */
export function exifLine(exif: RawExif): string {
  const parts: string[] = [];
  if (exif.camera) parts.push(exif.camera);
  const fl = num(exif.focalLength);
  if (fl) parts.push(`${Math.round(fl)} mm`);
  const f = num(exif.aperture);
  if (f) parts.push(`f/${Number.isInteger(f) ? f : f.toFixed(1)}`);
  if (exif.shutter) parts.push(`${exif.shutter}${/s$/.test(exif.shutter) ? '' : ' s'}`);
  if (exif.iso) parts.push(`ISO ${exif.iso}`);
  return parts.join(' · ');
}
