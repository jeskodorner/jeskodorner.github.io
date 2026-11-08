/**
 * HQ-Album (/album/): Code prüfen, Album entschlüsseln, Fotos zeigen und in voller Auflösung herunterladen.
 * Gegenstück zu scripts/album.mjs (gleiche Regeln für Code, Schlüssel und Dateiaufbau).
 *
 * Ablauf: Code → Name der Schlüsseldatei (SHA-256) → Album-Schlüssel mit dem Code entschlüsseln (PBKDF2)
 * → Dateiliste und Fotos mit dem Album-Schlüssel entschlüsseln (AES-256-GCM). Nichts davon verlässt den Browser.
 */
import { de } from '../i18n/de';
import { initLightbox } from './lightbox';
import { initJustify, justifyAll } from './justify';

interface FileEntry {
  name: string;
  size: number;
  width: number;
  height: number;
  viewWidth: number;
  viewHeight: number;
  thumb: string;
  view: string;
  orig: string;
  type: string;
}
interface Manifest {
  title: string;
  created: string;
  total: number;
  files: FileEntry[];
}

type Bytes = Uint8Array<ArrayBuffer>;

const h = de.hqAlbum;
const SESSION = 'jd-hq-code';
/** Größter gemeinsamer Download als ZIP (darüber: einzeln oder mit Chrome/Edge in einen Ordner) */
const ZIP_LIMIT = 2 * 1024 ** 3;

const b64 = (s: string): Bytes => Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));
const normalize = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
const mb = (n: number) =>
  n > 1024 ** 3
    ? `${(n / 1024 ** 3).toFixed(1).replace('.', ',')} GB`
    : n < 10 * 1024 ** 2
      ? `${(n / 1024 ** 2).toFixed(1).replace('.', ',')} MB`
      : `${Math.round(n / 1024 ** 2)} MB`;

async function lookupId(code: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`jd-album|${normalize(code)}`));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

/** IV (12 Byte) + Geheimtext mit Prüfsumme */
async function decrypt(key: CryptoKey, data: ArrayBuffer | Bytes): Promise<Bytes> {
  const bytes: Bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12)));
}

class WrongCode extends Error {}

async function unlock(base: string, code: string) {
  const res = await fetch(`${base}/a/${await lookupId(code)}.json`, { cache: 'no-store' });
  if (res.status === 404 || res.status === 403) throw new WrongCode();
  if (!res.ok) throw new Error(String(res.status));
  const lock = (await res.json()) as { album: string; kdf: { iterations: number; salt: string }; key: string };
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalize(code)), 'PBKDF2', false, ['deriveKey']);
  const kek = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64(lock.kdf.salt), iterations: lock.kdf.iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  let raw: Bytes;
  try {
    raw = await decrypt(kek, b64(lock.key));
  } catch {
    throw new WrongCode();
  }
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const albumBase = `${base}/${lock.album}`;
  const man = await fetch(`${albumBase}/manifest`);
  if (!man.ok) throw new Error(String(man.status));
  const manifest = JSON.parse(new TextDecoder().decode(await decrypt(key, await man.arrayBuffer()))) as Manifest;
  return { key, albumBase, manifest };
}

// ---------- ZIP (ohne Kompression – Fotos sind schon komprimiert) ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(data: Bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
class Zip {
  private parts: BlobPart[] = [];
  private central: Bytes[] = [];
  private offset = 0;
  add(name: string, data: Bytes) {
    const fileName = new TextEncoder().encode(name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8-Dateinamen
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, fileName.length, true);
    this.parts.push(local.buffer, fileName, data);
    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, 0x02014b50, true);
    dir.setUint16(4, 20, true);
    dir.setUint16(6, 20, true);
    dir.setUint16(8, 0x0800, true);
    dir.setUint32(16, crc, true);
    dir.setUint32(20, data.length, true);
    dir.setUint32(24, data.length, true);
    dir.setUint16(28, fileName.length, true);
    dir.setUint32(42, this.offset, true);
    const entry = new Uint8Array(46 + fileName.length);
    entry.set(new Uint8Array(dir.buffer));
    entry.set(fileName, 46);
    this.central.push(entry);
    this.offset += 30 + fileName.length + data.length;
  }
  blob() {
    const size = this.central.reduce((s, e) => s + e.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, this.central.length, true);
    end.setUint16(10, this.central.length, true);
    end.setUint32(12, size, true);
    end.setUint32(16, this.offset, true);
    return new Blob([...this.parts, ...this.central, end.buffer], { type: 'application/zip' });
  }
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---------- Seite ----------

export function initHqAlbum() {
  const root = document.querySelector<HTMLElement>('[data-hq]');
  const base = root?.dataset.base;
  if (!root || !base) return;
  const gate = root.querySelector<HTMLElement>('[data-gate]')!;
  const form = root.querySelector<HTMLFormElement>('[data-form]')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const msg = form.querySelector<HTMLElement>('[data-msg]')!;
  const albumEl = root.querySelector<HTMLElement>('[data-album]')!;
  const list = root.querySelector<HTMLElement>('[data-list]')!;
  const progress = root.querySelector<HTMLElement>('[data-progress]')!;
  const allBtn = root.querySelector<HTMLButtonElement>('[data-all]')!;
  const allLabel = root.querySelector<HTMLElement>('[data-all-label]')!;
  let busy = false;

  const open = async (code: string) => {
    if (busy) return;
    busy = true;
    msg.textContent = h.checking;
    try {
      const album = await unlock(base, code);
      try {
        sessionStorage.setItem(SESSION, normalize(code));
      } catch {
        /* privater Modus */
      }
      msg.textContent = '';
      show(album);
    } catch (err) {
      msg.textContent = err instanceof WrongCode ? h.wrongCode : h.offline;
      try {
        sessionStorage.removeItem(SESSION);
      } catch {
        /* privater Modus */
      }
    } finally {
      busy = false;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim()) void open(input.value);
  });
  root.querySelector('[data-other]')?.addEventListener('click', () => {
    try {
      sessionStorage.removeItem(SESSION);
    } catch {
      /* privater Modus */
    }
    location.reload();
  });

  function show({ key, albumBase, manifest }: Awaited<ReturnType<typeof unlock>>) {
    const files = manifest.files;
    gate.hidden = true;
    albumEl.hidden = false;
    document.title = `${manifest.title} – ${document.title}`;
    root!.querySelector('[data-title]')!.textContent = manifest.title;
    root!.querySelector('[data-meta]')!.textContent = `${h.photos(files.length)} · ${mb(manifest.total)}`;
    allLabel.textContent = `${h.downloadAll} (${mb(manifest.total)})`;
    list.dataset.gallery = '';
    list.dataset.count = String(files.length);
    list.dataset.title = manifest.title;

    const fetchFile = async (path: string) => {
      const res = await fetch(`${albumBase}/${path}`);
      if (!res.ok) throw new Error(String(res.status));
      return decrypt(key, await res.arrayBuffer());
    };
    const urls = new Map<string, Promise<string>>();
    const imageUrl = (path: string) => {
      let p = urls.get(path);
      if (!p) {
        p = fetchFile(path).then((data) => URL.createObjectURL(new Blob([data], { type: 'image/webp' })));
        urls.set(path, p);
      }
      return p;
    };
    const original = async (i: number) => {
      const f = files[i]!;
      return new Blob([await fetchFile(f.orig)], { type: f.type });
    };

    // Kacheln (gleiche Reihen wie in den Alben); Vorschaubilder werden beim Hereinscrollen entschlüsselt
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          const img = entry.target as HTMLImageElement;
          void imageUrl(img.dataset.thumb!).then((src) => (img.src = src));
        }
      },
      { rootMargin: '600px 0px' },
    );
    list.replaceChildren(
      ...files.map((f, i) => {
        const li = document.createElement('li');
        li.className = 'tile-cell';
        li.style.setProperty('--r', (f.viewWidth / f.viewHeight).toFixed(4));
        const a = document.createElement('a');
        a.className = 'ph tile';
        a.href = '#';
        a.dataset.index = String(i);
        a.dataset.pswpSrc = f.view;
        a.dataset.pswpWidth = String(f.viewWidth);
        a.dataset.pswpHeight = String(f.viewHeight);
        a.dataset.details = JSON.stringify([
          [h.file, f.name],
          [h.size, mb(f.size)],
          [h.resolution, `${f.width} × ${f.height} px`],
        ]);
        const img = document.createElement('img');
        img.alt = f.name;
        img.width = f.viewWidth;
        img.height = f.viewHeight;
        img.dataset.thumb = f.thumb;
        a.append(img);
        li.append(a);
        io.observe(img);
        return li;
      }),
    );
    initJustify();
    justifyAll();

    initLightbox({
      gallery: list,
      share: false,
      loadImage: (link) => imageUrl(files[Number(link.dataset.index)]!.view),
      download: async (link) => {
        const i = Number(link.dataset.index);
        save(await original(i), files[i]!.name);
      },
    });

    // Alle herunterladen: Chrome/Edge am Computer direkt in einen Ordner, sonst als ZIP
    allBtn.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      allBtn.disabled = true;
      try {
        const picker = (window as unknown as { showDirectoryPicker?: (o: object) => Promise<FileSystemDirectoryHandle> })
          .showDirectoryPicker;
        if (picker) {
          const dir = await picker({ mode: 'readwrite' });
          for (const [i, f] of files.entries()) {
            progress.textContent = h.downloading(i + 1, files.length);
            const handle = await dir.getFileHandle(f.name, { create: true });
            const out = await handle.createWritable();
            await out.write(await original(i));
            await out.close();
          }
        } else if (manifest.total <= ZIP_LIMIT) {
          const zip = new Zip();
          for (const [i, f] of files.entries()) {
            progress.textContent = h.downloading(i + 1, files.length);
            zip.add(f.name, await fetchFile(f.orig));
          }
          save(zip.blob(), `${manifest.title}.zip`);
        } else {
          progress.textContent = h.tooBig;
          return;
        }
        progress.textContent = h.done;
      } catch (err) {
        // Ordnerauswahl abgebrochen: still bleiben
        progress.textContent = err instanceof DOMException && err.name === 'AbortError' ? '' : h.failed;
      } finally {
        busy = false;
        allBtn.disabled = false;
      }
    });
  }

  // Code vom letzten Öffnen (gleicher Tab) – Neuladen ohne neue Eingabe
  try {
    const saved = sessionStorage.getItem(SESSION);
    if (saved) void open(saved);
  } catch {
    /* privater Modus */
  }
}
