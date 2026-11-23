#!/usr/bin/env node
/**
 * node scripts/slug-history.mjs   (läuft automatisch bei GitHub, siehe .github/workflows/deploy.yml)
 *
 * Merkt sich die Adressen aller Alben (seit 23.11.2026), damit alte Links weiter funktionieren, wenn im CMS die
 * Adresse eines Albums geändert wird. Liste: src/content/alte-adressen.json – je Album-Ordner die aktuelle Adresse
 * und alle früheren. Hat sich die Adresse eines Albums geändert, kommt die alte zu den früheren.
 * astro.config.mjs legt daraus Weiterleitungen an (/galerien/alt/ → /galerien/neu/, ebenso /mappe/ und /g/).
 * Der Ordnername eines Albums ändert sich nie (Umbenennen ist im CMS gesperrt), deshalb dient er als Schlüssel.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAlbumAddresses, HISTORY_FILE } from './lib/album-addresses.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(ROOT, HISTORY_FILE);
const history = JSON.parse(await fs.readFile(file, 'utf8').catch(() => '{}'));
const current = await readAlbumAddresses(ROOT);

let changed = false;
for (const [folder, now] of Object.entries(current)) {
  const entry = history[folder];
  if (!entry) {
    history[folder] = { slug: now.slug, visibility: now.visibility, frueher: [] };
    changed = true;
    continue;
  }
  if (entry.slug !== now.slug || entry.visibility !== now.visibility) {
    const old = { slug: entry.slug, visibility: entry.visibility };
    // frühere Adresse nur einmal merken; wird eine frühere Adresse wieder benutzt, ist sie keine frühere mehr
    entry.frueher = [...entry.frueher.filter((f) => !(f.slug === old.slug && f.visibility === old.visibility)), old].filter(
      (f) => !(f.slug === now.slug && f.visibility === now.visibility),
    );
    entry.slug = now.slug;
    entry.visibility = now.visibility;
    changed = true;
    console.log(`Neue Adresse für ${folder}: ${old.slug} → ${now.slug} (alte Adresse leitet weiter)`);
  }
}

if (changed) {
  const sorted = Object.fromEntries(Object.entries(history).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(file, JSON.stringify(sorted, null, 2) + '\n');
}
