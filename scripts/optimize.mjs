#!/usr/bin/env node
/**
 * npm run optimize [-- ordner …] [--force]
 *
 * Liest Original-Fotos aus photos-source/<ordner>/, erzeugt Web-Versionen
 * (lange Kante max. 2400 px, sRGB, JPEG ~300–600 KB, optional Wasserzeichen)
 * in src/content/galleries/<ordner>/images/ und schreibt meta.json
 * (EXIF, Durchschnittsfarbe, Blur-Platzhalter). Neue Bilder werden in index.md eingetragen.
 *
 * GPS-Daten werden standardmäßig entfernt (photos.config.json → "keepGps").
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import exifr from 'exifr';
import { parseDocument, isSeq, isMap } from 'yaml';
import {
  ROOT,
  loadConfig,
  slugify,
  exists,
  splitFrontmatter,
  joinFrontmatter,
  galleryTemplate,
  today,
  naturalSort,
  c,
} from './lib/util.mjs';

const SOURCE_EXT = /\.(jpe?g|png|tiff?|webp|avif|heic|heif)$/i;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  npm run optimize                    alle Ordner in photos-source/ verarbeiten
  npm run optimize -- kueste          nur den Ordner "kueste"
  npm run optimize -- --force         alles neu erzeugen (z. B. nach Wasserzeichen-Änderung)
`);
  process.exit(0);
}
const force = args.includes('--force');
const only = args.filter((a) => !a.startsWith('--'));

const config = await loadConfig();
const sourceRoot = path.join(ROOT, config.sourceDir);
const galleriesRoot = path.join(ROOT, config.galleriesDir);

if (!(await exists(sourceRoot))) {
  console.log(c.yellow(`Ordner ${config.sourceDir}/ existiert nicht. Lege deine Originale in ${config.sourceDir}/<galerie>/ ab.`));
  process.exit(0);
}

const folders = (await fs.readdir(sourceRoot, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  .map((d) => d.name)
  .filter((name) => only.length === 0 || only.includes(name))
  .sort(naturalSort);

if (only.length && folders.length === 0) {
  console.log(c.red(`Kein passender Ordner in ${config.sourceDir}/ gefunden: ${only.join(', ')}`));
  process.exit(1);
}

let totalNew = 0;
let totalSkipped = 0;
const missingAlt = [];
const problems = [];

for (const folder of folders) {
  const srcDir = path.join(sourceRoot, folder);
  const targetDir = path.join(galleriesRoot, folder);
  const imagesDir = path.join(targetDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });

  const indexPath = path.join(targetDir, 'index.md');
  if (!(await exists(indexPath))) {
    const title = folder.replace(/[-_]+/g, ' ').replace(/^\w/, (m) => m.toUpperCase());
    await fs.writeFile(indexPath, galleryTemplate({ title, slug: slugify(folder), date: today() }));
    console.log(c.green(`+ Neue Galerie angelegt: ${path.relative(ROOT, indexPath)}`));
  }

  const metaPath = path.join(targetDir, 'meta.json');
  const meta = (await exists(metaPath)) ? JSON.parse(await fs.readFile(metaPath, 'utf8')) : { images: {} };
  meta.images ??= {};

  const files = (await fs.readdir(srcDir)).filter((f) => SOURCE_EXT.test(f) && !f.startsWith('.')).sort(naturalSort);
  console.log(`\n${c.bold(folder)} ${c.dim(`(${files.length} Originale)`)}`);

  const produced = [];
  const prefill = {};
  const usedNames = new Set();

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    let outName = `${slugify(path.parse(file).name) || 'bild'}.jpg`;
    // Namenskollisionen vermeiden (z. B. bild.JPG und bild.png)
    let k = 2;
    while (usedNames.has(outName)) outName = `${slugify(path.parse(file).name)}-${k++}.jpg`;
    usedNames.add(outName);
    const outPath = path.join(imagesDir, outName);
    produced.push(outName);

    const srcStat = await fs.stat(srcPath);
    if (!force && (await exists(outPath)) && meta.images[outName]) {
      const outStat = await fs.stat(outPath);
      if (outStat.mtimeMs >= srcStat.mtimeMs) {
        totalSkipped++;
        continue;
      }
    }

    try {
      const info = await readExif(srcPath);
      const { buffer, quality, width, height } = await renderWebVersion(srcPath, config);
      await fs.writeFile(outPath, buffer);
      const { color, lqip } = await placeholder(buffer);
      meta.images[outName] = {
        source: file,
        width,
        height,
        color,
        lqip,
        exif: info.exif,
        ...(config.keepGps && info.gps ? { gps: info.gps } : {}),
      };
      if (info.alt || info.caption) prefill[outName] = { alt: info.alt, caption: info.caption };
      const kb = Math.round(buffer.length / 1024);
      const warn = kb > config.targetMaxKB ? c.yellow(` (über ${config.targetMaxKB} KB)`) : '';
      console.log(`  ${c.green('✓')} ${file} → images/${outName} ${c.dim(`${width}×${height}, ${kb} KB, q${quality}`)}${warn}`);
      totalNew++;
    } catch (err) {
      const hint = /heic|heif/i.test(file)
        ? ' – HEIC wird evtl. nicht unterstützt. Bitte als JPG exportieren.'
        : '';
      problems.push(`${folder}/${file}: ${err.message}${hint}`);
      console.log(`  ${c.red('✗')} ${file}: ${err.message}${hint}`);
      produced.pop();
    }
  }

  // Verwaiste Einträge entfernen (Bild nicht mehr im images/-Ordner)
  const present = new Set((await fs.readdir(imagesDir)).filter((f) => !f.startsWith('.')));
  for (const key of Object.keys(meta.images)) if (!present.has(key)) delete meta.images[key];
  const sorted = Object.fromEntries(Object.entries(meta.images).sort(([a], [b]) => naturalSort(a, b)));
  await fs.writeFile(metaPath, `${JSON.stringify({ images: sorted }, null, 2)}\n`);

  // index.md: fehlende Bilder ergänzen
  const added = await updateIndex(indexPath, produced, prefill);
  if (added.length) console.log(c.green(`  + ${added.length} Bild(er) in index.md eingetragen`));

  const missing = await findMissingAlt(indexPath);
  for (const f of missing) missingAlt.push(`${folder}: ${f}`);
}

// Zusammenfassung
const allImages = await sizeOf(galleriesRoot);
console.log(`\n${c.bold('Fertig.')} ${totalNew} erzeugt, ${totalSkipped} unverändert übersprungen.`);
console.log(
  c.dim(
    `Web-Versionen im Repo: ${(allImages / 1024 / 1024).toFixed(1)} MB. Beim Build entstehen daraus AVIF/WebP in mehreren Größen (grob ×2–3, echter Wert: npm run check-links).`,
  ),
);
if (allImages > 330 * 1024 * 1024) {
  console.log(c.yellow('Achtung: Die Bilder nähern sich dem 1-GB-Limit von GitHub Pages (inkl. erzeugter Größen). Siehe README.'));
}
if (missingAlt.length) {
  console.log(c.yellow(`\n${missingAlt.length} Bild(er) brauchen noch einen Alt-Text (Feld "alt" in index.md):`));
  for (const m of missingAlt) console.log(c.yellow(`  • ${m}`));
  console.log(c.dim('Ohne Alt-Text bricht der Build bewusst ab (Barrierefreiheit).'));
}
if (problems.length) {
  console.log(c.red(`\n${problems.length} Problem(e):`));
  for (const p of problems) console.log(c.red(`  • ${p}`));
  process.exitCode = 1;
}

/* ------------------------------------------------------------------ */

async function readExif(file) {
  let data = {};
  try {
    data =
      (await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        xmp: true,
        iptc: true,
        icc: false,
        reviveValues: true,
        translateValues: true,
      })) ?? {};
  } catch {
    data = {};
  }
  const text = (v) => {
    if (!v) return undefined;
    if (typeof v === 'string') return v.trim() || undefined;
    if (Array.isArray(v)) return text(v[0]);
    if (typeof v === 'object' && 'value' in v) return text(v.value);
    return undefined;
  };

  let make = (data.Make ?? '').trim().replace(/\s*(corporation|corp\.?|imaging corp\.?|co\.,? ?ltd\.?)$/i, '');
  if (make.length > 3 && make === make.toUpperCase()) make = make[0] + make.slice(1).toLowerCase();
  const model = (data.Model ?? '').trim();
  const camera = model ? (model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`.trim()) : make || undefined;

  const t = data.ExposureTime;
  const shutter =
    typeof t === 'number' && t > 0 ? (t >= 1 ? `${Math.round(t * 10) / 10}` : `1/${Math.round(1 / t)}`) : undefined;
  const iso = data.ISO ?? data.ISOSpeedRatings ?? data.PhotographicSensitivity;
  const date = data.DateTimeOriginal ?? data.CreateDate;

  const exif = Object.fromEntries(
    Object.entries({
      camera: camera || undefined,
      lens: (data.LensModel ?? data.Lens ?? '').toString().trim() || undefined,
      aperture: typeof data.FNumber === 'number' ? Math.round(data.FNumber * 10) / 10 : undefined,
      shutter,
      iso: Array.isArray(iso) ? iso[0] : iso,
      focalLength: typeof data.FocalLength === 'number' ? Math.round(data.FocalLength) : undefined,
      date: date instanceof Date && !Number.isNaN(date.getTime()) ? localIso(date) : undefined,
    }).filter(([, v]) => v !== undefined && v !== ''),
  );

  const gps =
    typeof data.latitude === 'number' && typeof data.longitude === 'number'
      ? { lat: data.latitude, lng: data.longitude }
      : undefined;

  return {
    exif,
    gps,
    alt: text(data.AltTextAccessibility),
    caption: text(data.Caption) ?? text(data.description) ?? text(data.ImageDescription),
  };
}

/** Aufnahmezeit als lokale Zeit ohne Zeitzone (EXIF kennt meist keine Zeitzone) */
function localIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

async function renderWebVersion(file, cfg) {
  const base = sharp(file, { failOn: 'none' });
  const m = await base.metadata();
  let w = m.width ?? 0;
  let h = m.height ?? 0;
  if ((m.orientation ?? 1) >= 5) [w, h] = [h, w];
  const scale = Math.min(1, cfg.maxEdge / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  const make = (quality) => {
    let p = sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width, height, fit: 'fill' })
      .withIccProfile('srgb');
    if (cfg.watermark?.enabled) {
      p = p.composite([{ input: watermarkSvg(width, height, cfg.watermark), gravity: gravityOf(cfg.watermark.position) }]);
    }
    p = cfg.keepGps
      ? p.keepExif()
      : p.withExif({ IFD0: { Copyright: cfg.copyright ?? '', Artist: cfg.artist ?? '' } });
    return p.jpeg({ quality, mozjpeg: true }).toBuffer();
  };

  let quality = cfg.jpegQuality;
  let buffer = await make(quality);
  while (buffer.length / 1024 > cfg.targetMaxKB && quality - 4 >= cfg.minJpegQuality) {
    quality -= 4;
    buffer = await make(quality);
  }
  return { buffer, quality, width, height };
}

function gravityOf(position = 'bottom-right') {
  return { 'bottom-right': 'southeast', 'bottom-left': 'southwest', 'bottom-center': 'south' }[position] ?? 'southeast';
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]);
}

function watermarkSvg(w, h, wm) {
  const fontSize = Math.max(13, Math.round(Math.max(w, h) * (wm.size ?? 0.016)));
  const pad = Math.round(fontSize * 1.2);
  const textWidth = Math.round(fontSize * 0.62 * wm.text.length + fontSize * 0.1 * wm.text.length);
  const svgW = Math.min(w, textWidth + pad * 2);
  const svgH = Math.min(h, fontSize + pad * 2);
  const anchor = wm.position === 'bottom-left' ? 'start' : wm.position === 'bottom-center' ? 'middle' : 'end';
  const x = anchor === 'start' ? pad : anchor === 'middle' ? svgW / 2 : svgW - pad;
  const y = svgH - pad;
  const o = wm.opacity ?? 0.5;
  const text = escapeXml(wm.text);
  const style = `font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="${(fontSize * 0.06).toFixed(1)}" text-anchor="${anchor}"`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">` +
      `<text x="${x + 1}" y="${y + 1}" ${style} fill="#000" fill-opacity="${(o * 0.45).toFixed(2)}">${text}</text>` +
      `<text x="${x}" y="${y}" ${style} fill="#fff" fill-opacity="${o}">${text}</text>` +
      `</svg>`,
  );
}

async function placeholder(buffer) {
  const [avg, tiny] = await Promise.all([
    sharp(buffer).resize(1, 1, { fit: 'cover' }).raw().toBuffer(),
    sharp(buffer).resize(24, 24, { fit: 'inside' }).blur(0.6).webp({ quality: 45 }).toBuffer(),
  ]);
  const hex = `#${[...avg.subarray(0, 3)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return { color: hex, lqip: `data:image/webp;base64,${tiny.toString('base64')}` };
}

async function updateIndex(indexPath, files, prefill) {
  const text = await fs.readFile(indexPath, 'utf8');
  const { yaml, body } = splitFrontmatter(text);
  const doc = parseDocument(yaml);
  let seq = doc.get('images', true);
  if (!isSeq(seq)) {
    doc.set('images', doc.createNode([]));
    seq = doc.get('images', true);
  }
  seq.flow = false;
  const existing = new Set(
    seq.items.map((it) => (isMap(it) ? String(it.get('file') ?? '') : '')).filter(Boolean),
  );
  const added = [];
  for (const file of files) {
    if (existing.has(file)) continue;
    const entry = { file, alt: prefill[file]?.alt ?? '' };
    if (prefill[file]?.caption) entry.caption = prefill[file].caption;
    seq.add(doc.createNode(entry));
    added.push(file);
  }
  if (added.length) await fs.writeFile(indexPath, joinFrontmatter(doc.toString({ lineWidth: 0 }), body));
  return added;
}

async function findMissingAlt(indexPath) {
  const { yaml } = splitFrontmatter(await fs.readFile(indexPath, 'utf8'));
  const data = parseDocument(yaml).toJS() ?? {};
  return (data.images ?? []).filter((i) => !i?.alt || String(i.alt).trim().length < 3).map((i) => i.file);
}

async function sizeOf(dir) {
  let total = 0;
  if (!(await exists(dir))) return 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(entry.name)) {
      total += (await fs.stat(path.join(entry.parentPath ?? entry.path, entry.name))).size;
    }
  }
  return total;
}
