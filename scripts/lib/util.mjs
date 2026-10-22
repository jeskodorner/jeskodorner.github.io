import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const ROOT = process.cwd();

export async function loadConfig() {
  const raw = await fs.readFile(path.join(ROOT, 'photos.config.json'), 'utf8');
  return JSON.parse(raw);
}

/** "Küste im Oktober!" → "kueste-im-oktober" */
export function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, '-und-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Zufälliger Anteil für Unlisted-Slugs, z. B. "x7k2p9" (ohne verwechselbare Zeichen) */
export function randomSuffix(length = 6) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(length);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
}

export async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { yaml: '', body: text };
  return { yaml: m[1], body: m[2] };
}

export function joinFrontmatter(yaml, body = '') {
  const b = body.replace(/^\s+/, '');
  return `---\n${yaml.trimEnd()}\n---\n${b ? `\n${b}` : ''}`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Natürliche Sortierung: bild-2 vor bild-10 */
export const naturalSort = (a, b) => a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' });

export const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

export function galleryTemplate({ title, slug, date, layout = 'showcase', visibility = 'public', location }) {
  return `---
# Titel der Galerie
title: ${JSON.stringify(title)}
# URL-Teil: ${visibility === 'unlisted' ? `/g/${slug}/` : `/galerien/${slug}/`}
slug: ${slug}
date: ${date}
${location ? `location: ${JSON.stringify(location)}` : '# location: "Ort"'}
# Kurzbeschreibung (1–2 Sätze) – erscheint auf der Kachel und in Link-Vorschauen
description: "Kurze Beschreibung der Galerie."
# showcase = Bühne (jedes Bild groß, Parallax) · masonry = Raster · justified = gleich hohe Reihen
layout: ${layout}
# Raumfarbe: pink | blue | lime | orange | violet (ohne Angabe: automatisch reihum)
# color: pink
# public = in der Übersicht · unlisted = nur per Direktlink, noindex
visibility: ${visibility}
# Aufnahmedaten (Kamera, Blende …) anzeigen
showExif: true
# Titelbild (Dateiname aus der Liste unten). Ohne Angabe: das erste Bild
# cover: bild-01.jpg

# --- Download (optional, siehe README) ---
# downloadUrl: https://…
# downloadSize: 1,2 GB
# downloadFormat: ZIP · JPG
# downloadNote: Link gültig bis 31.12.2026 – Passwort bekommst du separat.

# Bilder: werden von "npm run optimize" automatisch ergänzt.
# Pro Bild Pflicht: alt (Bildbeschreibung). Optional: caption, originalUrl, hero, focus, exif
images: []
---
`;
}
