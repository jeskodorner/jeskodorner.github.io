#!/usr/bin/env node
/**
 * node scripts/cleanup-albums.mjs   (läuft automatisch bei GitHub, siehe .github/workflows/deploy.yml)
 *
 * Räumt gelöschte Alben auf (seit 23.11.2026). Löscht man im CMS ein Album, verschwindet nur seine index.md – die
 * Fotos (images/) und meta.json blieben sonst im Repo liegen. Dieses Skript löscht jeden Album-Ordner ohne index.md
 * ganz und nimmt ihn aus src/content/alte-adressen.json. Zurückholen lässt sich ein Album über die Git-Geschichte.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HISTORY_FILE } from './lib/album-addresses.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'src/content/galleries');
const removed = [];
for (const e of await fs.readdir(dir, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  const index = path.join(dir, e.name, 'index.md');
  if (await fs.stat(index).then(() => true, () => false)) continue;
  await fs.rm(path.join(dir, e.name), { recursive: true, force: true });
  removed.push(e.name);
  console.log(`Gelöschtes Album aufgeräumt: ${e.name} (Fotos und meta.json entfernt)`);
}

if (removed.length) {
  const file = path.join(ROOT, HISTORY_FILE);
  const history = JSON.parse(await fs.readFile(file, 'utf8').catch(() => '{}'));
  for (const name of removed) delete history[name];
  await fs.writeFile(file, JSON.stringify(history, null, 2) + '\n');
}
