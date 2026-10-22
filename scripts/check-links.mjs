#!/usr/bin/env node
/**
 * npm run check-links   (nach npm run build)
 *
 * Prüft den fertigen dist/-Ordner:
 *  - alle internen Links, Bilder, srcsets, Skripte und Styles existieren
 *  - Unlisted-Galerien (/g/…) stehen nicht in der Sitemap und nicht in der Übersicht, haben noindex
 *  - jede Seite hat Titel, Beschreibung, lang-Attribut und genau eine h1
 *  - Gesamtgröße < 1 GB, keine Datei > 100 MB (Grenzen von GitHub Pages / Git)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { c } from './lib/util.mjs';

const DIST = path.resolve('dist');
const errors = [];
const warnings = [];
const external = new Map();

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function existsInDist(urlPath) {
  let p = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!p.startsWith('/')) return true;
  let file = path.join(DIST, p);
  if (p.endsWith('/')) file = path.join(file, 'index.html');
  try {
    const st = await fs.stat(file);
    if (st.isDirectory()) await fs.access(path.join(file, 'index.html'));
    return true;
  } catch {
    return false;
  }
}

try {
  await fs.access(DIST);
} catch {
  console.log(c.red('dist/ fehlt – erst "npm run build" ausführen.'));
  process.exit(1);
}

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
let totalBytes = 0;
for (const f of files) {
  const { size } = await fs.stat(f);
  totalBytes += size;
  if (size > 100 * 1024 * 1024) errors.push(`Datei über 100 MB: ${path.relative(DIST, f)}`);
}

const attrRe = /\s(href|src|srcset|data-pswp-src|data-pswp-srcset|content)="([^"]*)"/g;
const ids = new Map();

for (const file of htmlFiles) {
  const rel = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  const html = await fs.readFile(file, 'utf8');
  const isUnlisted = rel.startsWith('/g/');
  const is404 = rel.startsWith('/404');

  // Grundlegende SEO/A11y-Checks
  if (!/<html[^>]+lang="de"/.test(html)) errors.push(`${rel}: lang-Attribut fehlt`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${rel}: <title> fehlt`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${rel}: Meta-Beschreibung fehlt`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) errors.push(`${rel}: ${h1} h1-Überschriften (erwartet: 1)`);
  if (isUnlisted && !/<meta name="robots" content="noindex/.test(html)) errors.push(`${rel}: Unlisted ohne noindex!`);
  if (isUnlisted && !/<meta name="referrer" content="no-referrer"/.test(html)) warnings.push(`${rel}: Unlisted ohne no-referrer`);
  if (!isUnlisted && !is404 && /noindex/.test(html)) warnings.push(`${rel}: öffentliche Seite mit noindex`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt(=|\s|>|\/)/.test(m[0])) errors.push(`${rel}: <img> ohne alt-Attribut`);
  }

  // IDs für Anker-Links merken
  ids.set(rel, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));

  for (const m of html.matchAll(attrRe)) {
    const [, attr, value] = m;
    if (attr === 'content' && !/^https?:\/\/jeskodor\.github\.io/.test(value)) continue;
    const urls =
      attr === 'srcset' || attr === 'data-pswp-srcset'
        ? value.split(',').map((s) => s.trim().split(/\s+/)[0])
        : [value];
    for (let u of urls) {
      if (!u || u.startsWith('data:') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('javascript:')) continue;
      if (u.startsWith('#')) {
        continue; // seiteninterne Anker prüfen wir unten nicht einzeln
      }
      if (/^https?:\/\/jeskodor\.github\.io/.test(u)) u = u.replace(/^https?:\/\/jeskodor\.github\.io/, '');
      if (/^(https?:)?\/\//.test(u)) {
        const host = new URL(u, 'https://x').host;
        external.set(host, (external.get(host) ?? 0) + 1);
        continue;
      }
      const abs = u.startsWith('/') ? u : path.posix.join(rel.endsWith('/') ? rel : path.posix.dirname(rel) + '/', u);
      if (!(await existsInDist(abs))) errors.push(`${rel}: kaputter Link → ${u}`);
    }
  }
}

// Anker auf andere Seiten prüfen (z. B. /kontakt/#email)
for (const file of htmlFiles) {
  const rel = '/' + path.relative(DIST, file).replace(/index\.html$/, '');
  const html = await fs.readFile(file, 'utf8');
  for (const m of html.matchAll(/\shref="(\/[^"#]*)#([^"]+)"/g)) {
    const [, page, anchor] = m;
    if (/^bild-\d+$/.test(anchor)) continue; // Lightbox-Hash, wird im Raster als id gesetzt
    const target = ids.get(page);
    if (target && !target.has(anchor)) errors.push(`${rel}: Anker #${anchor} fehlt auf ${page}`);
  }
}

// Sitemap & Übersicht dürfen keine Unlisted-Galerien enthalten
const sitemapFiles = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
for (const f of sitemapFiles) {
  const xml = await fs.readFile(f, 'utf8');
  if (xml.includes('/g/')) errors.push(`${path.basename(f)} enthält Unlisted-Galerien (/g/)!`);
  if (xml.includes('/404')) errors.push(`${path.basename(f)} enthält die 404-Seite`);
}
if (sitemapFiles.length === 0) errors.push('Keine Sitemap gefunden');
for (const page of ['galerien/index.html', 'index.html', 'sitemap-index.xml']) {
  try {
    const html = await fs.readFile(path.join(DIST, page), 'utf8');
    if (/href="\/g\//.test(html)) errors.push(`${page} verlinkt eine Unlisted-Galerie!`);
  } catch {
    /* Seite existiert nicht */
  }
}
try {
  await fs.access(path.join(DIST, 'robots.txt'));
} catch {
  errors.push('robots.txt fehlt');
}

// Ergebnis
const mb = totalBytes / 1024 / 1024;
console.log(`${c.bold('Link-Check')}: ${htmlFiles.length} HTML-Seiten, ${files.length} Dateien, ${mb.toFixed(1)} MB`);
if (mb > 1024) errors.push(`Seite ist ${mb.toFixed(0)} MB groß – GitHub Pages erlaubt max. 1 GB.`);
else if (mb > 800) warnings.push(`Seite ist ${mb.toFixed(0)} MB groß – nah am 1-GB-Limit von GitHub Pages.`);
if (external.size) {
  console.log(c.dim(`Externe Ziele (nicht abgerufen): ${[...external].map(([h, n]) => `${h} (${n})`).join(', ')}`));
}
for (const w of warnings) console.log(c.yellow(`⚠ ${w}`));
if (errors.length) {
  for (const e of [...new Set(errors)]) console.log(c.red(`✗ ${e}`));
  console.log(c.red(`\n${new Set(errors).size} Fehler.`));
  process.exit(1);
}
console.log(c.green('✓ Keine Fehler gefunden.'));
