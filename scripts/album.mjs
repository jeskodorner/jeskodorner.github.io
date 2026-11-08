#!/usr/bin/env node
/**
 * HQ-Alben mit Zugangscode (Cloudflare R2, verschlüsselt).
 *
 *   npm run album -- einrichten                          Verbindung prüfen, CORS am Bucket setzen
 *   npm run album -- hochladen <ordner> --titel "Name"   Fotos verschlüsseln + hochladen → Code
 *   npm run album -- liste                               alle Alben mit Code und Größe
 *   npm run album -- neuer-code <nr|titel>               neuen Code vergeben (alter wird ungültig)
 *   npm run album -- loeschen <nr|titel>                 Album bei Cloudflare löschen
 *
 * So funktioniert es:
 *   - Jedes Album bekommt einen zufälligen Schlüssel. Alle Dateien (Vorschau, Ansicht, Original) und die
 *     Dateiliste werden damit auf diesem Rechner verschlüsselt (AES-256-GCM), bevor sie hochgeladen werden.
 *   - Der Album-Schlüssel wird mit dem Code verschlüsselt (PBKDF2, 600 000 Runden) und unter einem Namen
 *     abgelegt, der sich aus dem Code ergibt. Die Albumseite (/album/) findet das Album so nur mit dem Code.
 *   - Ohne Code sind die Dateien bei Cloudflare wertloser Datensalat. Der Code steht nirgends im Projekt,
 *     nur lokal in alben.local.json (nicht im Git) – damit du ihn später noch einmal nachsehen kannst.
 *
 * Zugangsdaten stehen in .env (nicht im Git): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
 * Zum Testen ohne Cloudflare: --lokal <ordner> schreibt die verschlüsselten Dateien in einen Ordner.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { AwsClient } from 'aws4fetch';
import { ROOT, exists, naturalSort, c } from './lib/util.mjs';

// Album-Liste mit Codes (geheim, nicht im Git). Im Testmodus (--lokal) liegt sie im Testordner.
const STATE_FILE = (() => {
  const i = process.argv.indexOf('--lokal');
  return i >= 0 && process.argv[i + 1] ? path.join(path.resolve(process.argv[i + 1]), 'alben.local.json') : path.join(ROOT, 'alben.local.json');
})();
const ITERATIONS = 600_000;
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // ohne 0/O, 1/I/L
const IMAGE_EXT = /\.(jpe?g|png|webp|tiff?|heic|heif|avif)$/i;
const ORIGINS = ['https://jeskodorner.de', 'https://www.jeskodorner.de', 'http://localhost:4321', 'http://localhost:4322'];

// ---------- Hilfen ----------

const argv = process.argv.slice(2);
const cmd = argv[0];
const option = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const positional = argv.slice(1).filter((a, i, all) => !a.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--')));
const fail = (msg) => {
  console.error(c.red(`\n✗ ${msg}\n`));
  process.exit(1);
};
const mb = (n) => `${(n / 1024 / 1024).toFixed(n > 100 * 1024 * 1024 ? 0 : 1).replace('.', ',')} MB`;

/** Code wie „K7QM-4XPA-9TRW“ (12 Zeichen, ca. 59 Bit Zufall) */
function newCode() {
  let s = '';
  for (let i = 0; i < 12; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
/** Gleiche Regel wie auf der Albumseite: Großbuchstaben, nur Buchstaben und Ziffern */
const normalize = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
const lookupId = (code) => crypto.createHash('sha256').update(`jd-album|${normalize(code)}`).digest('hex').slice(0, 32);

/** AES-256-GCM: Ergebnis = IV (12 Byte) + Geheimtext + Prüfsumme (16 Byte) – passt zu WebCrypto */
function encrypt(key, data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  return Buffer.concat([iv, cipher.update(data), cipher.final(), cipher.getAuthTag()]);
}

/** Schlüsseldatei für einen Code: Album-Schlüssel, verschlüsselt mit einem aus dem Code abgeleiteten Schlüssel */
function lockFile(code, albumId, albumKey) {
  const salt = crypto.randomBytes(16);
  const kek = crypto.pbkdf2Sync(normalize(code), salt, ITERATIONS, 32, 'sha256');
  const wrapped = encrypt(kek, albumKey);
  return JSON.stringify({
    v: 1,
    album: albumId,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: salt.toString('base64') },
    key: wrapped.toString('base64'),
  });
}

async function loadState() {
  if (!(await exists(STATE_FILE))) return { albums: [] };
  return JSON.parse(await fs.readFile(STATE_FILE, 'utf8'));
}
async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
}
function findAlbum(state, query) {
  if (!query) fail('Welches Album? Nummer oder Titel aus „npm run album -- liste“ angeben.');
  const n = Number(query);
  const hit = Number.isInteger(n) && n >= 1 ? state.albums[n - 1] : state.albums.find((a) => a.title.toLowerCase() === query.toLowerCase());
  if (!hit) fail(`Album „${query}“ nicht gefunden. „npm run album -- liste“ zeigt alle.`);
  return hit;
}

// ---------- Speicher: Cloudflare R2 (S3-Schnittstelle) oder lokaler Ordner zum Testen ----------

async function storage() {
  const local = option('lokal');
  if (local) {
    const dir = path.resolve(local);
    return {
      name: `Ordner ${dir}`,
      put: async (key, body) => {
        await fs.mkdir(path.dirname(path.join(dir, key)), { recursive: true });
        await fs.writeFile(path.join(dir, key), body);
      },
      del: async (key) => fs.rm(path.join(dir, key), { force: true }),
    };
  }
  try {
    process.loadEnvFile(path.join(ROOT, '.env'));
  } catch {
    /* keine .env – Fehlermeldung unten */
  }
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    fail('Zugangsdaten fehlen. Lege die Datei .env an (siehe README, Abschnitt „HQ-Alben mit Zugangscode“).');
  }
  const aws = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: 's3', region: 'auto' });
  const base = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`;
  const call = async (url, init, what) => {
    for (let attempt = 1; ; attempt++) {
      const res = await aws.fetch(url, init);
      if (res.ok) return res;
      if (attempt >= 3 || res.status < 500) fail(`${what}: Cloudflare antwortet ${res.status}\n${(await res.text()).slice(0, 400)}`);
    }
  };
  return {
    name: `Cloudflare R2, Bucket „${R2_BUCKET}“`,
    put: (key, body, type = 'application/octet-stream') =>
      call(`${base}/${key}`, { method: 'PUT', body, headers: { 'content-type': type } }, `Hochladen ${key}`),
    del: (key) => call(`${base}/${key}`, { method: 'DELETE' }, `Löschen ${key}`),
    setCors: async () => {
      const xml =
        '<CORSConfiguration><CORSRule>' +
        ORIGINS.map((o) => `<AllowedOrigin>${o}</AllowedOrigin>`).join('') +
        '<AllowedMethod>GET</AllowedMethod><AllowedMethod>HEAD</AllowedMethod><AllowedHeader>*</AllowedHeader>' +
        '<MaxAgeSeconds>86400</MaxAgeSeconds></CORSRule></CORSConfiguration>';
      const md5 = crypto.createHash('md5').update(xml).digest('base64');
      await call(`${base}?cors`, { method: 'PUT', body: xml, headers: { 'content-type': 'application/xml', 'content-md5': md5 } }, 'CORS setzen');
    },
  };
}

/** Mehrere Uploads gleichzeitig (schneller), mit Fortschritt */
async function pool(tasks, size, onDone) {
  let next = 0;
  const run = async () => {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
      onDone?.();
    }
  };
  await Promise.all(Array.from({ length: size }, run));
}

// ---------- Befehle ----------

async function einrichten() {
  const store = await storage();
  if (!store.setCors) fail('„einrichten“ geht nur mit Cloudflare, nicht mit --lokal.');
  await store.setCors();
  const probe = `test/${crypto.randomBytes(4).toString('hex')}.txt`;
  await store.put(probe, 'ok', 'text/plain');
  await store.del(probe);
  console.log(c.green(`\n✓ Verbindung zu ${store.name} klappt, Zugriff von jeskodorner.de ist erlaubt (CORS).\n`));
  console.log('Trage jetzt die öffentliche Adresse des Buckets (r2.dev) in src/config/site.ts bei hqAlbums.baseUrl ein.\n');
}

async function hochladen() {
  const folder = positional[0];
  if (!folder) fail('Ordner mit den Fotos angeben, z. B.: npm run album -- hochladen ~/Desktop/Hochzeit-Lena --titel "Hochzeit Lena & Tom"');
  const dir = path.resolve(folder.replace(/^~(?=\/)/, process.env.HOME ?? '~'));
  if (!(await exists(dir))) fail(`Ordner nicht gefunden: ${dir}`);
  const title = option('titel') ?? path.basename(dir);
  const files = (await fs.readdir(dir)).filter((f) => IMAGE_EXT.test(f) && !f.startsWith('.')).sort(naturalSort);
  if (!files.length) fail(`Keine Fotos in ${dir} (JPG, PNG, WebP, TIFF, HEIC).`);

  const store = await storage();
  const state = await loadState();
  const albumId = crypto.randomBytes(16).toString('hex');
  const key = crypto.randomBytes(32);
  const code = option('code') ?? newCode();
  console.log(`\n${c.bold(title)}: ${files.length} Fotos → ${store.name}\n`);

  const entries = [];
  const uploads = [];
  let total = 0;
  for (const [i, file] of files.entries()) {
    const n = String(i + 1).padStart(4, '0');
    const original = await fs.readFile(path.join(dir, file));
    const img = sharp(original, { failOn: 'none' }).rotate();
    const meta = await sharp(original, { failOn: 'none' }).metadata();
    const turned = (meta.orientation ?? 1) >= 5;
    const w = turned ? meta.height : meta.width;
    const h = turned ? meta.width : meta.height;
    const thumb = await img.clone().resize(640, 640, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    const view = await img.clone().resize(2048, 2048, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
    const viewMeta = await sharp(view).metadata();
    const ext = path.extname(file).toLowerCase();
    entries.push({
      name: file,
      size: original.length,
      width: w,
      height: h,
      viewWidth: viewMeta.width,
      viewHeight: viewMeta.height,
      thumb: `t/${n}`,
      view: `v/${n}`,
      orig: `o/${n}`,
      type: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : /\.tiff?$/.test(ext) ? 'image/tiff' : /\.hei[cf]$/.test(ext) ? 'image/heic' : ext === '.avif' ? 'image/avif' : 'image/jpeg',
    });
    total += original.length;
    for (const [part, data] of [['t', thumb], ['v', view], ['o', original]]) {
      uploads.push(() => store.put(`${albumId}/${part}/${n}`, encrypt(key, data)));
    }
    process.stdout.write(`\r  vorbereitet ${i + 1}/${files.length}`);
  }
  console.log();

  let done = 0;
  await pool(uploads, 4, () => process.stdout.write(`\r  hochgeladen ${++done}/${uploads.length}`));
  console.log();

  const manifest = { v: 1, title, created: new Date().toISOString().slice(0, 10), total, files: entries };
  await store.put(`${albumId}/manifest`, encrypt(key, Buffer.from(JSON.stringify(manifest))));
  await store.put(`a/${lookupId(code)}.json`, lockFile(code, albumId, key), 'application/json');

  state.albums.push({
    title,
    created: manifest.created,
    code,
    albumId,
    lookup: lookupId(code),
    key: key.toString('base64'),
    files: entries.length,
    bytes: total,
    objects: entries.flatMap((e) => [e.thumb, e.view, e.orig].map((k) => `${albumId}/${k}`)).concat(`${albumId}/manifest`),
    storage: store.name,
  });
  await saveState(state);

  console.log(c.green(`\n✓ Fertig: ${entries.length} Fotos, ${mb(total)}`));
  console.log(`\n  Link:  https://jeskodorner.de/album/`);
  console.log(`  Code:  ${c.bold(code)}\n`);
  console.log('  Beides an deinen Kunden schicken. Den Code findest du später mit „npm run album -- liste“.\n');
}

async function liste() {
  const state = await loadState();
  if (!state.albums.length) return console.log('\nNoch keine Alben. Hochladen: npm run album -- hochladen <ordner> --titel "Name"\n');
  console.log();
  state.albums.forEach((a, i) => console.log(`  ${i + 1}. ${c.bold(a.title)}  ${a.created} · ${a.files} Fotos · ${mb(a.bytes)}  Code: ${a.code}`));
  console.log();
}

async function neuerCode() {
  const state = await loadState();
  const album = findAlbum(state, positional[0]);
  const store = await storage();
  const code = option('code') ?? newCode();
  await store.put(`a/${lookupId(code)}.json`, lockFile(code, album.albumId, Buffer.from(album.key, 'base64')), 'application/json');
  await store.del(`a/${album.lookup}.json`);
  Object.assign(album, { code, lookup: lookupId(code) });
  await saveState(state);
  console.log(c.green(`\n✓ Neuer Code für „${album.title}“: ${c.bold(code)} – der alte gilt nicht mehr.\n`));
}

async function loeschen() {
  const state = await loadState();
  const album = findAlbum(state, positional[0]);
  const store = await storage();
  let done = 0;
  await pool(
    [`a/${album.lookup}.json`, ...album.objects].map((k) => () => store.del(k)),
    6,
    () => process.stdout.write(`\r  gelöscht ${++done}/${album.objects.length + 1}`),
  );
  state.albums = state.albums.filter((a) => a !== album);
  await saveState(state);
  console.log(c.green(`\n✓ „${album.title}“ ist gelöscht.\n`));
}

const commands = { einrichten, hochladen, liste, 'neuer-code': neuerCode, loeschen };
if (!commands[cmd]) {
  console.log(`
  HQ-Alben mit Zugangscode:
    npm run album -- einrichten
    npm run album -- hochladen ~/Desktop/Hochzeit-Lena --titel "Hochzeit Lena & Tom"
    npm run album -- liste
    npm run album -- neuer-code 1
    npm run album -- loeschen 1
`);
  process.exit(cmd ? 1 : 0);
}
await commands[cmd]();
