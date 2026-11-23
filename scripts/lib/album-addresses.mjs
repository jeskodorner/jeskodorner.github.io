// Adressen der Alben lesen und Weiterleitungen für frühere Adressen bauen (seit 23.11.2026).
// Genutzt von scripts/slug-history.mjs (merkt sich Änderungen) und astro.config.mjs (legt die Weiterleitungen an).
import fs from 'node:fs/promises';
import path from 'node:path';

export const HISTORY_FILE = 'src/content/alte-adressen.json';
const GALLERIES = 'src/content/galleries';

/** Startseite der Adresse je Sichtbarkeit (wie galleryBasePath in src/lib/galleries.ts) */
const base = (visibility) => (visibility === 'unlisted' ? '/g/' : '/galerien/');

/** { ordner: { slug, visibility } } aus den index.md aller Alben */
export async function readAlbumAddresses(root) {
  const dir = path.join(root, GALLERIES);
  const out = {};
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const text = await fs.readFile(path.join(dir, e.name, 'index.md'), 'utf8').catch(() => '');
    const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
    const slug = /^slug:\s*["']?([^"'\s#]+)/m.exec(front)?.[1];
    const visibility = /^visibility:\s*["']?(\w+)/m.exec(front)?.[1] === 'unlisted' ? 'unlisted' : 'public';
    // steht im Portfolio (hat also eine Mappe)?
    const mappe = /^portfolio:\s*\n(?:[ \t]+.*\n)*?[ \t]+zeigen:\s*true\b/m.test(front + '\n');
    if (slug) out[e.name] = { slug, visibility, mappe };
  }
  return out;
}

/** Weiterleitungen { '/galerien/alt/': '/galerien/neu/', '/mappe/alt/': '/mappe/neu/' } für Astro */
export async function albumRedirects(root) {
  const history = JSON.parse(await fs.readFile(path.join(root, HISTORY_FILE), 'utf8').catch(() => '{}'));
  const current = await readAlbumAddresses(root);
  // Adressen, die gerade ein Album benutzt, nie umleiten
  const taken = new Set(Object.values(current).map((c) => `${base(c.visibility)}${c.slug}/`));
  const takenMappe = new Set(Object.values(current).map((c) => `/mappe/${c.slug}/`));
  const redirects = {};
  for (const [folder, entry] of Object.entries(history)) {
    const now = current[folder];
    if (!now) continue; // Album gelöscht
    for (const old of entry.frueher ?? []) {
      // Ein öffentliches Album, das privat geworden ist, darf seine geheime Adresse nicht verraten: keine Weiterleitung
      if (old.visibility === 'public' && now.visibility === 'unlisted') continue;
      const from = `${base(old.visibility)}${old.slug}/`;
      const to = `${base(now.visibility)}${now.slug}/`;
      if (from !== to && !taken.has(from)) redirects[from] = to;
      // alte Mappe → neue Mappe (oder ins Album, wenn es nicht mehr im Portfolio steht)
      if (old.visibility === 'public' && old.slug !== now.slug && !takenMappe.has(`/mappe/${old.slug}/`)) {
        redirects[`/mappe/${old.slug}/`] = now.mappe ? `/mappe/${now.slug}/` : to;
      }
    }
  }
  return redirects;
}
