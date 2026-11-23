#!/usr/bin/env node
/**
 * node scripts/fix-album-photos.mjs   (läuft automatisch bei GitHub, siehe .github/workflows/deploy.yml)
 *
 * Repariert Foto-Angaben aus dem CMS (seit 23.11.2026). Im Auswahlfenster für Vorschaufoto, Titelbild und Mappe kann
 * man im CMS auch ein Foto neu hochladen – es landet dann nicht im Album, sondern lose in src/content/galleries/
 * (z. B. „/alben/DSCF6580.jpg“), und die Website baut nicht. Dieses Skript:
 *   1. sucht zu jeder solchen Angabe das passende Foto im Album (gleicher Name, Groß/klein und „-1“ egal) und trägt
 *      dessen Pfad ein;
 *   2. gibt es keins, kommt das hochgeladene Foto ins Album (aufbereitet wie bei „Fotos hochladen“) und wird verwendet;
 *   3. löscht danach lose hochgeladene Fotos außerhalb der images-Ordner;
 *   4. schreibt in der Fotoliste überall den vollen Pfad (/alben/<ordner>/images/<datei>), damit das CMS Vorschauen zeigt.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseDocument, isSeq, isMap } from 'yaml';
import { ROOT, loadConfig, slugify, exists, splitFrontmatter, joinFrontmatter } from './lib/util.mjs';

const config = await loadConfig();
const galleriesRoot = path.join(ROOT, config.galleriesDir);
const sourceRoot = path.join(ROOT, config.sourceDir);
const IMG = /\.(jpe?g|png|webp|avif|tiff?|heic)$/i;

/** Name ohne Endung, klein, ohne angehängtes „-1“, „-2“ … */
const key = (name) => slugify(path.parse(name).name).replace(/-\d+$/, '');
/** „/alben/x/y.jpg“ → Datei im Repo */
const repoFile = (p) => path.join(galleriesRoot, String(p).trim().replace(/^\/?alben\//, ''));

const strays = new Set();
for (const e of await fs.readdir(galleriesRoot, { withFileTypes: true })) {
  if (e.isFile() && IMG.test(e.name)) strays.add(path.join(galleriesRoot, e.name));
}

for (const e of await fs.readdir(galleriesRoot, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  const folder = e.name;
  const dir = path.join(galleriesRoot, folder);
  const indexPath = path.join(dir, 'index.md');
  if (!(await exists(indexPath))) continue;
  // lose Fotos direkt im Album-Ordner (nicht in images/) sind ebenfalls Uploads aus dem Auswahlfenster
  for (const f of await fs.readdir(dir)) if (IMG.test(f)) strays.add(path.join(dir, f));

  const text = await fs.readFile(indexPath, 'utf8');
  const { yaml, body } = splitFrontmatter(text);
  let doc = parseDocument(yaml);
  let changed = false;
  const imagesDir = path.join(dir, 'images');
  const listFiles = async () => ((await exists(imagesDir)) ? (await fs.readdir(imagesDir)).filter((f) => IMG.test(f)) : []);
  const own = (f) => `/alben/${folder}/images/${f}`;

  // 0. Fotos, die im CMS direkt in den images-Ordner eines Albums hochgeladen wurden (stehen nicht in der Fotoliste,
  //    z. B. „DSCF6515.jpg“ als Vorschaufoto): wie bei „Fotos hochladen“ aufbereiten und ins Album aufnehmen (seit
  //    23.11.2026 – vorher brach der Bau ab, weil das Foto „im Album nicht“ stand)
  const listed = new Set(
    (doc.get('images')?.toJSON?.() ?? []).map((i) => String(i?.file ?? '').split('/').pop()).filter(Boolean),
  );
  const raw = (await listFiles()).filter((f) => !listed.has(f));
  if (raw.length) {
    const src = path.join(sourceRoot, folder);
    await fs.mkdir(src, { recursive: true });
    for (const f of raw) {
      await fs.copyFile(path.join(imagesDir, f), path.join(src, f));
      await fs.rm(path.join(imagesDir, f), { force: true });
    }
    const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'optimize.mjs'), folder], { stdio: 'inherit', cwd: ROOT });
    if (run.status === 0) console.log(`  + ${folder}: ${raw.length} hochgeladene(s) Foto(s) aufbereitet: ${raw.join(', ')}`);
    // optimize.mjs hat die Fotoliste in index.md ergänzt: Dokument neu einlesen
    const fresh = splitFrontmatter(await fs.readFile(indexPath, 'utf8'));
    doc = parseDocument(fresh.yaml);
    changed = true;
  }
  let present = await listFiles();


  /** passenden Pfad für eine Angabe finden (oder das hochgeladene Foto ins Album holen) */
  const resolve = async (value) => {
    const v = String(value ?? '').trim();
    if (!v) return v;
    const name = v.split('/').pop();
    if (v === own(name) && present.includes(name)) return v;
    const match = present.find((f) => key(f) === key(name));
    if (match) return own(match);
    const upload = repoFile(v);
    if (!(await exists(upload))) return v; // unbekannt – die Prüfung beim Bauen meldet es
    // 2. neues Foto: ins Album aufbereiten
    const src = path.join(sourceRoot, folder);
    await fs.mkdir(src, { recursive: true });
    await fs.copyFile(upload, path.join(src, path.basename(upload)));
    const run = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'optimize.mjs'), folder], { stdio: 'inherit', cwd: ROOT });
    if (run.status !== 0) return v;
    present = await listFiles();
    const added = present.find((f) => key(f) === key(name)) ?? `${slugify(path.parse(name).name)}.jpg`;
    console.log(`  + ${folder}: neues Foto ${path.basename(upload)} ins Album aufgenommen`);
    return own(added);
  };

  const fix = async (pathKeys) => {
    const node = doc.getIn(pathKeys, true);
    if (node === undefined || node === null) return;
    if (isSeq(node)) {
      for (let i = 0; i < node.items.length; i++) {
        const old = String(node.items[i]?.value ?? node.items[i] ?? '');
        const neu = await resolve(old);
        if (neu !== old) {
          node.set(i, neu);
          changed = true;
          console.log(`${folder}: ${old} → ${neu}`);
        }
      }
      return;
    }
    const old = String(doc.getIn(pathKeys) ?? '');
    const neu = await resolve(old);
    if (neu !== old) {
      doc.setIn(pathKeys, neu);
      changed = true;
      console.log(`${folder}: ${old} → ${neu}`);
    }
  };
  // 4. Fotoliste mit vollem Pfad (und falls dort ein Foto ersetzt wurde: wie oben auflösen)
  const images = doc.get('images', true);
  if (isSeq(images)) {
    for (const it of images.items) {
      if (!isMap(it)) continue;
      const f = String(it.get('file') ?? '').trim();
      const neu = f ? await resolve(f) : f;
      if (neu !== f) {
        it.set('file', neu);
        changed = true;
      }
    }
  }
  await fix(['portfolio', 'vorschau']);
  await fix(['cover']);
  await fix(['portfolio', 'fotos']);

  if (changed) {
    // optimize.mjs kann inzwischen neue Fotos in die Liste geschrieben haben: frisch einlesen und Änderungen übertragen
    const latest = parseDocument(splitFrontmatter(await fs.readFile(indexPath, 'utf8')).yaml);
    for (const k of [['portfolio', 'vorschau'], ['cover'], ['portfolio', 'fotos']]) {
      const v = doc.getIn(k);
      if (v !== undefined) latest.setIn(k, doc.getIn(k, true));
    }
    const li = latest.get('images', true);
    const title = String(latest.get('title') ?? folder);
    if (isSeq(li)) {
      for (const it of li.items) {
        if (!isMap(it)) continue;
        it.set('file', own(String(it.get('file')).split('/').pop()));
        // neues Foto ohne Bildbeschreibung: schlichter Platzhalter wie bei „Fotos hochladen“, sonst baut die Website nicht
        if (String(it.get('alt') ?? '').trim().length < 3) it.set('alt', `Foto aus „${title}“`);
      }
    }
    await fs.writeFile(indexPath, joinFrontmatter(latest.toString({ lineWidth: 0 }), body));
  }
}

// 3. lose Uploads entfernen
for (const f of strays) {
  await fs.rm(f, { force: true });
  console.log(`Lose hochgeladenes Foto entfernt: ${path.relative(ROOT, f)}`);
}
