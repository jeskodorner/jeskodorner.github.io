/**
 * Eigene Videos (Dateien in public/videos/): Adresse und Seitenverhältnis. Breite und Höhe liest der Build direkt aus
 * der MP4 (Box „tkhd“ der Bildspur), damit sie nirgends von Hand eingetragen werden müssen. Fehlt die Datei, bricht
 * der Build mit einer verständlichen Meldung ab.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface VideoInfo {
  src: string;
  width: number;
  height: number;
  /** Größe in MB (nur zur Info) */
  mb: number;
}

const cache = new Map<string, VideoInfo>();

export function videoInfo(file: string): VideoInfo {
  const hit = cache.get(file);
  if (hit) return hit;
  const abs = path.join(process.cwd(), 'public', 'videos', file);
  if (!fs.existsSync(abs)) {
    const have = fs.existsSync(path.dirname(abs)) ? fs.readdirSync(path.dirname(abs)).join(', ') : '–';
    throw new Error(`Video „${file}“ gibt es in public/videos/ nicht. Vorhanden: ${have}`);
  }
  const data = fs.readFileSync(abs);
  const size = findSize(data);
  if (!size) throw new Error(`Video „${file}“: Breite und Höhe nicht gefunden – ist es eine MP4 mit Bildspur?`);
  const info = { src: `/videos/${file}`, ...size, mb: Math.round(data.length / 1e5) / 10 };
  cache.set(file, info);
  return info;
}

/** Breite und Höhe der ersten Spur mit Bild (tkhd: die letzten 8 Byte, Festkomma 16.16) */
function findSize(d: Buffer): { width: number; height: number } | undefined {
  const containers = new Set(['moov', 'trak']);
  const walk = (start: number, end: number): { width: number; height: number } | undefined => {
    let i = start;
    while (i + 8 <= end) {
      let len = d.readUInt32BE(i);
      const type = d.toString('latin1', i + 4, i + 8);
      let head = 8;
      if (len === 1) {
        len = Number(d.readBigUInt64BE(i + 8));
        head = 16;
      } else if (len === 0) len = end - i;
      if (len < head) return undefined;
      if (type === 'tkhd') {
        const width = d.readUInt32BE(i + len - 8) / 65536;
        const height = d.readUInt32BE(i + len - 4) / 65536;
        if (width > 0 && height > 0) return { width: Math.round(width), height: Math.round(height) };
      } else if (containers.has(type)) {
        const found = walk(i + head, i + len);
        if (found) return found;
      }
      i += len;
    }
    return undefined;
  };
  return walk(0, d.length);
}
