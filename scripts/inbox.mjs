#!/usr/bin/env node
/**
 * node scripts/inbox.mjs   (läuft automatisch bei GitHub, siehe .github/workflows/deploy.yml)
 *
 * Fotos-Eingang aus Pages CMS (seit 22.11.2026): Im CMS legt Jesko unter „Fotos hochladen“ einen Eintrag an
 * (Titel, Datum, Text, Fotos). Pages CMS speichert ihn als photos-inbox/<name>.md und die Fotos in photos-inbox/fotos/.
 * Dieses Skript macht daraus ein Album – genauso wie `npm run optimize` im Terminal:
 *   1. Album-Ordner wählen: bestehendes Album (Feld „album“) oder neues aus dem Titel (unlisted: mit Zufallsanteil).
 *   2. Neues Album: index.md mit Titel, Datum, Ort, Text, Sichtbarkeit anlegen.
 *   3. Fotos nach photos-source/<ordner>/ kopieren und `scripts/optimize.mjs <ordner>` laufen lassen (verkleinern,
 *      Wasserzeichen, GPS weg, Aufnahmedaten, Farbe, Platzhalter, Eintrag in index.md, Alt-Text aus Lightroom).
 *   4. Fotos ohne Bildbeschreibung bekommen einen schlichten Platzhalter („Foto aus „Titel““), damit die Website baut –
 *      im CMS unter „Alben“ lässt er sich jederzeit verbessern.
 *   5. Eintrag und hochgeladene Dateien aus dem Eingang löschen.
 * Ohne Einträge im Eingang tut es nichts.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseDocument, isSeq, isMap } from 'yaml';
import { ROOT, loadConfig, slugify, randomSuffix, exists, splitFrontmatter, joinFrontmatter, galleryTemplate, today, c } from './lib/util.mjs';

const INBOX = path.join(ROOT, 'photos-inbox');
const config = await loadConfig();
const sourceRoot = path.join(ROOT, config.sourceDir);
const galleriesRoot = path.join(ROOT, config.galleriesDir);

if (!(await exists(INBOX))) process.exit(0);
const entries = (await fs.readdir(INBOX)).filter((f) => f.endsWith('.md') && !f.startsWith('.'));
if (!entries.length) {
  console.log('Fotos-Eingang ist leer.');
  process.exit(0);
}

const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
/** Pfad aus dem CMS („/photos-inbox/fotos/x.jpg“, „photos-inbox/fotos/x.jpg“ oder nur „x.jpg“) → Datei im Repo */
const inboxFile = (p) => {
  const clean = str(p).replace(/^\/+/, '');
  return clean.includes('/') ? path.join(ROOT, clean) : path.join(INBOX, 'fotos', clean);
};
/** Datum aus dem CMS (Date-Objekt oder Text) → JJJJ-MM-TT */
const isoDate = (v) => {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(str(v));
  return m ? m[1] : today();
};

let failed = false;
for (const entryName of entries.sort()) {
  const entryPath = path.join(INBOX, entryName);
  const { yaml } = splitFrontmatter(await fs.readFile(entryPath, 'utf8'));
  const d = parseDocument(yaml ?? '').toJS() ?? {};
  const title = str(d.title);
  const photos = (Array.isArray(d.fotos) ? d.fotos : d.fotos ? [d.fotos] : []).map(str).filter(Boolean);
  console.log(`\n${c.bold(entryName)}: ${title || '(ohne Titel)'} – ${photos.length} Foto(s)`);
  if (!title && !str(d.album)) {
    console.log(c.red('  ✗ Weder Titel noch Album angegeben – übersprungen.'));
    failed = true;
    continue;
  }

  // 1. Album-Ordner
  const existing = (await fs.readdir(galleriesRoot, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const wanted = str(d.album);
  let folder = wanted && existing.includes(wanted) ? wanted : wanted ? slugify(wanted) : slugify(title);
  // Bestehendes Album auch über seinen Kurznamen (slug) finden
  if (!existing.includes(folder)) {
    for (const name of existing) {
      const text = await fs.readFile(path.join(galleriesRoot, name, 'index.md'), 'utf8').catch(() => '');
      const slug = /^slug:\s*["']?([a-z0-9-]+)/m.exec(text)?.[1];
      if (slug && (slug === folder || slug === wanted)) folder = name;
    }
  }
  const indexPath = path.join(galleriesRoot, folder, 'index.md');
  const isNew = !(await exists(indexPath));

  // 2. Neues Album anlegen
  if (isNew) {
    const visibility = str(d.visibility) === 'unlisted' ? 'unlisted' : 'public';
    const slug = visibility === 'unlisted' ? `${slugify(title)}-${randomSuffix()}` : slugify(title);
    await fs.mkdir(path.join(galleriesRoot, folder, 'images'), { recursive: true });
    const template = galleryTemplate({ title, slug, date: isoDate(d.date), visibility, location: str(d.location) || undefined });
    const parts = splitFrontmatter(template);
    const doc = parseDocument(parts.yaml);
    doc.set('description', str(d.description) || `Fotos: ${title}.`);
    await fs.writeFile(indexPath, joinFrontmatter(doc.toString(), parts.body));
    console.log(c.green(`  + Neues Album: ${path.relative(ROOT, indexPath)}`));
  } else {
    console.log(`  → Fotos kommen ins bestehende Album ${folder}`);
  }

  // 3. Fotos aufbereiten
  const srcDir = path.join(sourceRoot, folder);
  await fs.mkdir(srcDir, { recursive: true });
  const copied = [];
  for (const p of photos) {
    const from = inboxFile(p);
    if (!(await exists(from))) {
      console.log(c.yellow(`  ! Datei nicht gefunden: ${p}`));
      continue;
    }
    await fs.copyFile(from, path.join(srcDir, path.basename(from)));
    copied.push(from);
  }
  if (copied.length) {
    const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'optimize.mjs'), folder], { stdio: 'inherit', cwd: ROOT });
    if (run.status !== 0) {
      console.log(c.red('  ✗ Aufbereiten ist fehlgeschlagen – Eintrag bleibt im Eingang.'));
      failed = true;
      continue;
    }
  }

  // 4. Fehlende Bildbeschreibungen: schlichter Platzhalter
  const parts = splitFrontmatter(await fs.readFile(indexPath, 'utf8'));
  const doc = parseDocument(parts.yaml);
  const albumTitle = str(doc.get('title')) || title;
  const images = doc.get('images');
  let filled = 0;
  if (isSeq(images)) {
    for (const item of images.items) {
      if (!isMap(item)) continue;
      const alt = str(item.get('alt'));
      if (alt.length < 3 || /^(todo|tbd|xxx)\b/i.test(alt)) {
        item.set('alt', `Foto aus „${albumTitle}“`);
        filled++;
      }
    }
  }
  if (filled) {
    await fs.writeFile(indexPath, joinFrontmatter(doc.toString(), parts.body));
    console.log(c.yellow(`  ! ${filled} Foto(s) ohne Bildbeschreibung – Platzhalter eingetragen (im CMS unter „Alben“ verbessern).`));
  }

  // 5. Eingang aufräumen
  for (const f of copied) await fs.rm(f, { force: true });
  await fs.rm(entryPath, { force: true });
  console.log(c.green(`  ✓ Fertig, Eintrag aus dem Eingang entfernt.`));
}

if (failed) process.exitCode = 1;
