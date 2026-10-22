#!/usr/bin/env node
/**
 * npm run new-gallery -- "Name der Galerie" [--unlisted] [--layout justified] [--date 2026-10-22] [--location "Ort"]
 *
 * Legt an:
 *   src/content/galleries/<ordner>/index.md   (Vorlage mit allen Feldern)
 *   photos-source/<ordner>/                   (hier kommen deine Originale hinein)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, loadConfig, slugify, randomSuffix, exists, galleryTemplate, today, c } from './lib/util.mjs';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const optionValues = new Set(['layout', 'date', 'location'].map(option).filter(Boolean));
const title = argv.find((a) => !a.startsWith('--') && !optionValues.has(a));

if (!title || flag('help')) {
  console.log(`
  Neue Galerie anlegen:
    npm run new-gallery -- "Küste im Oktober"
    npm run new-gallery -- "Hochzeit Lena & Tom" --unlisted
    npm run new-gallery -- "Stadt" --layout justified --date 2026-10-01 --location "Hamburg"
    (Layouts: showcase = Bühne [Standard], masonry, justified)
`);
  process.exit(title ? 0 : 1);
}

const unlisted = flag('unlisted');
const layout = ['masonry', 'justified'].includes(option('layout')) ? option('layout') : 'showcase';
const date = option('date') ?? today();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.log(c.red('Datum bitte im Format JJJJ-MM-TT angeben, z. B. 2026-10-22.'));
  process.exit(1);
}

const base = slugify(title);
if (!base) {
  console.log(c.red('Aus dem Namen lässt sich kein gültiger Slug bilden.'));
  process.exit(1);
}
const slug = unlisted ? `${base}-${randomSuffix(6)}` : base;

const config = await loadConfig();
const galleryDir = path.join(ROOT, config.galleriesDir, slug);
const sourceDir = path.join(ROOT, config.sourceDir, slug);

if (await exists(galleryDir)) {
  console.log(c.red(`Es gibt bereits eine Galerie im Ordner ${path.relative(ROOT, galleryDir)}.`));
  process.exit(1);
}

await fs.mkdir(path.join(galleryDir, 'images'), { recursive: true });
await fs.mkdir(sourceDir, { recursive: true });
await fs.writeFile(
  path.join(galleryDir, 'index.md'),
  galleryTemplate({ title, slug, date, layout, visibility: unlisted ? 'unlisted' : 'public', location: option('location') }),
);

const url = unlisted ? `/g/${slug}/` : `/galerien/${slug}/`;
console.log(`
${c.green('✓ Galerie angelegt:')} ${c.bold(title)}
  Daten:      ${path.relative(ROOT, path.join(galleryDir, 'index.md'))}
  Originale:  ${path.relative(ROOT, sourceDir)}/   ${c.dim('(wird nicht committet)')}
  Adresse:    ${url}${unlisted ? c.yellow('  ← unlisted: nur per Direktlink') : ''}

Nächste Schritte:
  1. Original-Fotos (JPG/TIFF/PNG) nach ${path.relative(ROOT, sourceDir)}/ kopieren
  2. npm run optimize -- ${slug}
  3. In index.md Beschreibung und Alt-Texte ergänzen
  4. npm run dev  →  http://localhost:4321${url}
`);
