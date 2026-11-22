#!/usr/bin/env node
/**
 * node scripts/prepare-folder.mjs <ordner|foto> … [--open] [--wasserzeichen | --ohne-wasserzeichen]
 * Dahinter steckt das Mac-Programm „Fotos aufbereiten.app“: Ordner (oder einzelne Fotos) im Finder darauf ziehen.
 *
 * Macht aus jedem Foto eine fertige Web-Version – genau wie für die Website (photos.config.json): lange Kante
 * 2400 px, sRGB, JPEG unter ca. 600 KB, GPS entfernt, Wasserzeichen nur wenn in photos.config.json eingeschaltet
 * (seit 22.11.2026 aus); Kamera-Daten, Aufnahmezeit,
 * Bildbeschreibung und Bildunterschrift aus Lightroom bleiben erhalten. Die Originale bleiben unverändert.
 * Ergebnis: neben dem Ordner ein Ordner „<Name> – fertig“ (bei einzelnen Fotos: „Fotos – fertig“ daneben).
 * Diese Fotos lassen sich direkt im CMS unter „Fotos hochladen“ verwenden – sie bekommen dort kein zweites
 * Wasserzeichen (Markierung in den Metadaten).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadConfig, naturalSort } from './lib/util.mjs';
import { readExif, renderWebVersion } from './lib/web-image.mjs';

const SOURCE_EXT = /\.(jpe?g|png|tiff?|webp|avif|heic|heif)$/i;
const args = process.argv.slice(2);
const openAfter = args.includes('--open');
// Wasserzeichen: Schalter im Mac-Programm (Doppelklick) überstimmt photos.config.json
const wmOn = args.includes('--wasserzeichen');
const wmOff = args.includes('--ohne-wasserzeichen');
const inputs = args.filter((a) => !a.startsWith('--'));
if (!inputs.length) {
  console.log('Ordner oder Fotos angeben (oder auf „Fotos aufbereiten.app“ ziehen).');
  process.exit(1);
}
const config = await loadConfig();
if (config.watermark && (wmOn || wmOff)) config.watermark.enabled = wmOn;

// Aufträge sammeln: je Ordner seine Fotos; einzelne Fotos nach ihrem Ordner gruppiert
const jobs = new Map(); // Zielordner → Quelldateien
for (const input of inputs) {
  const abs = path.resolve(input);
  const stat = await fs.stat(abs).catch(() => undefined);
  if (!stat) continue;
  if (stat.isDirectory()) {
    if (/ – fertig$/.test(abs)) continue; // schon fertige Ordner nicht noch einmal
    const files = (await fs.readdir(abs)).filter((f) => SOURCE_EXT.test(f) && !f.startsWith('.')).sort(naturalSort);
    jobs.set(`${abs} – fertig`, files.map((f) => path.join(abs, f)));
  } else if (SOURCE_EXT.test(abs)) {
    const target = path.join(path.dirname(abs), 'Fotos – fertig');
    jobs.set(target, [...(jobs.get(target) ?? []), abs]);
  }
}

let done = 0;
let failed = 0;
const outDirs = [];
for (const [target, files] of jobs) {
  if (!files.length) continue;
  await fs.mkdir(target, { recursive: true });
  outDirs.push(target);
  const used = new Set();
  for (const file of files) {
    let name = `${path.parse(file).name}.jpg`;
    for (let k = 2; used.has(name.toLowerCase()); k++) name = `${path.parse(file).name}-${k}.jpg`;
    used.add(name.toLowerCase());
    try {
      const info = await readExif(file);
      const { buffer, width, height } = await renderWebVersion(file, config, info);
      await fs.writeFile(path.join(target, name), buffer);
      done++;
      console.log(`✓ ${path.basename(file)} → ${name} (${width}×${height}, ${Math.round(buffer.length / 1024)} KB)`);
    } catch (err) {
      failed++;
      const hint = /heic|heif/i.test(file) ? ' – HEIC bitte als JPG exportieren.' : '';
      console.log(`✗ ${path.basename(file)}: ${err.message}${hint}`);
    }
  }
}

const summary = `${done} Foto${done === 1 ? '' : 's'} fertig${config.watermark?.enabled ? ' (mit Wasserzeichen)' : ''}${failed ? `, ${failed} mit Fehler` : ''}.`;
console.log(summary);
if (openAfter) for (const d of outDirs) spawnSync('open', [d]);
if (!done && !failed) {
  console.log('Keine Fotos gefunden (JPG, PNG, TIFF, WebP, HEIC).');
  process.exitCode = 1;
}
if (failed) process.exitCode = 1;
