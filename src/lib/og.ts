/**
 * Vorschaukarten fürs Teilen (WhatsApp, iMessage, Instagram, …): 1200 × 630 px, beim Bauen erzeugt
 * (Route src/pages/og/[...card].jpg.ts, Datei z. B. /og/album/hilda-setcard.jpg).
 *
 * Aufbau wie die Startseite: links ein Feld in Dark Blue mit „JESKO / DORNER“ (Migha Black, wie auf der Website) oben und dem
 * Seitentitel (Migha, wie die Titel der Website) unten, rechts das Foto, zugeschnitten auf seinen Bildschwerpunkt (Feld `focus`).
 * Seiten ohne Foto (Kontakt, Impressum, Datenschutz, HQ-Album): das ganze Feld in Dark Blue, Name groß.
 *
 * Die Schrift wird als Form (Pfad) eingesetzt – so braucht der Bildbau keine installierten Schriften.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ImageMetadata } from 'astro';
import sharp, { type OverlayOptions } from 'sharp';
import opentype from 'opentype.js';
import { site } from '../config/site';

export const OG_W = 1200;
export const OG_H = 630;
const BLUE = '#1a0089'; // Dark Blue (tokens.css)
const WHITE = '#efe7d3'; // White Chocolate
/** Breite des blauen Felds (Rest: Foto) */
const PANEL_W = 456;
const PAD = 52;

export interface CardPhoto {
  src: ImageMetadata;
  /** Bildschwerpunkt wie CSS object-position, z. B. "50% 30%" */
  focus?: string;
}
export interface Card {
  /** Pfad unter /og/ ohne Endung, z. B. "album/hilda-setcard" */
  key: string;
  /** Text unten im blauen Feld */
  title: string;
  photo?: CardPhoto;
}

/** Adresse der Karte (für og:image) */
export const cardImage = (key: string, alt?: string) => ({ url: `/og/${key}.jpg`, width: OG_W, height: OG_H, alt });

// ---------- Schriften ----------
/** Feste Schriftdatei aus dem Projekt (opentype.js liest .otf/.woff, aber keine variablen .woff2) */
const loadLocalFont = (file: string) => {
  const buf = fs.readFileSync(path.join(process.cwd(), file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
let fonts: { name: opentype.Font; serif: opentype.Font } | undefined;
const getFonts = () =>
  (fonts ??= {
    name: loadLocalFont('src/assets/fonts/migha-black.otf'),
    serif: loadLocalFont('src/assets/fonts/migha-regular.otf'),
  });

const capHeight = (font: opentype.Font) => (font.tables.os2?.sCapHeight ?? font.unitsPerEm * 0.7) / font.unitsPerEm;

/** Eine Zeile als SVG-Pfad; Grundlinie bei y */
const line = (font: opentype.Font, text: string, x: number, y: number, size: number) =>
  font.getPath(text, x, y, size, { kerning: true }).toPathData(2);
const width = (font: opentype.Font, text: string, size: number) => font.getAdvanceWidth(text, size, { kerning: true });

/** Titel in Zeilen umbrechen; ein Gedankenstrich bleibt beim Wort davor (wie tidyTitle) */
function wrap(font: opentype.Font, text: string, size: number, max: number) {
  const words = text.replace(/ ([–—]) /g, ' $1 ').split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && width(font, next.replace(/ /g, ' '), size) > max) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.map((l) => l.replace(/ /g, ' '));
}

/** Größte Schrift (zwischen min und max), bei der der Titel in höchstens 3 Zeilen passt und kein Wort übersteht */
function fitTitle(font: opentype.Font, text: string, maxW: number, maxSize: number, minSize: number) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    const lines = wrap(font, text, size, maxW);
    if (lines.length <= 3 && lines.every((l) => width(font, l, size) <= maxW)) return { size, lines };
  }
  return { size: minSize, lines: wrap(font, text, minSize, maxW).slice(0, 3) };
}

// ---------- Foto ----------
/** Datei zu einem importierten Bild (beim Bauen: fsPath; im Entwicklungsserver: aus der /@fs/-Adresse) */
function filePath(src: ImageMetadata): string {
  const fsPath = (src as ImageMetadata & { fsPath?: string }).fsPath;
  if (fsPath) return fsPath;
  const m = decodeURIComponent(src.src).match(/\/@fs(\/[^?]+)/);
  if (m) return m[1]!;
  return path.join(process.cwd(), src.src.split('?')[0]!);
}

async function photoPart(photo: CardPhoto, w: number, h: number) {
  const { src } = photo;
  const portrait = src.height > src.width;
  // Ohne eigenen Schwerpunkt: bei Hochformaten etwas über der Mitte (Gesichter sitzen meist im oberen Drittel)
  const [fx = 50, fy = portrait ? 32 : 50] = (photo.focus && photo.focus !== '50% 50%' ? photo.focus : '')
    .split(/\s+/)
    .filter(Boolean)
    .map((v) => parseFloat(v));
  const scale = Math.max(w / src.width, h / src.height);
  const sw = Math.round(src.width * scale);
  const sh = Math.round(src.height * scale);
  const left = Math.round(((sw - w) * fx) / 100);
  const top = Math.round(((sh - h) * fy) / 100);
  return sharp(filePath(src))
    .rotate()
    .resize(sw, sh)
    .extract({ left: Math.min(left, sw - w), top: Math.min(top, sh - h), width: w, height: h })
    .toBuffer();
}

// ---------- Karte ----------
export async function renderCard(card: Card): Promise<Buffer> {
  const { name, serif } = getFonts();
  const [first = site.name, ...rest] = site.name.toUpperCase().split(' ');
  const second = rest.join(' ');
  const withPhoto = Boolean(card.photo);
  const panelW = withPhoto ? PANEL_W : OG_W;
  const pad = withPhoto ? PAD : 64;

  // Name oben, zweizeilig („DORNER“ in Migha Black 3,18 Schrifthöhen breit). Mit Foto so breit wie vorher in
  // Climate Crisis (58 px), ohne Foto so groß, dass unten der Titel Platz behält
  const nameSize = withPhoto ? 112 : 180;
  const nameCap = capHeight(name) * nameSize;
  const nameLead = nameSize * 0.92;
  const nameTop = pad + nameCap;
  const nameD = line(name, first, pad, nameTop, nameSize) + line(name, second, pad, nameTop + nameLead, nameSize);

  // Titel unten, Grundlinie der letzten Zeile auf dem unteren Rand
  const { size: ts, lines } = fitTitle(serif, card.title, panelW - 2 * pad, withPhoto ? 78 : 100, 44);
  const tLead = ts * 1.0;
  const lastBase = OG_H - pad - ts * 0.04;
  const titleD = lines.map((l, i) => line(serif, l, pad, lastBase - (lines.length - 1 - i) * tLead, ts)).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${panelW}" height="${OG_H}">
<rect width="100%" height="100%" fill="${BLUE}"/>
<path d="${nameD}" fill="${WHITE}"/>
<path d="${titleD}" fill="${WHITE}"/>
</svg>`;
  const panel = await sharp(Buffer.from(svg)).png().toBuffer();

  const base = sharp({ create: { width: OG_W, height: OG_H, channels: 3, background: BLUE } });
  const layers: OverlayOptions[] = [{ input: panel, left: 0, top: 0 }];
  if (card.photo) layers.push({ input: await photoPart(card.photo, OG_W - PANEL_W, OG_H), left: PANEL_W, top: 0 });
  return base.composite(layers).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
