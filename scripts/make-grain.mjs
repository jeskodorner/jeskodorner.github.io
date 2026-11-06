/**
 * Erzeugt die Korn-Textur für das Vignetting am Bildschirmrand (public/textures/).
 * Nahtlos kachelbar: Rauschen pro Pixel, weichgezeichnet mit Umbruch an den Rändern.
 *   grain-512.webp → für hochauflösende Bildschirme (Retina), angezeigt als 256 × 256 CSS-Pixel
 *   grain-256.webp → für normale Bildschirme
 * Aufruf: node scripts/make-grain.mjs   (nur nötig, wenn das Korn anders aussehen soll)
 */
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/textures/', import.meta.url));

/** Zufallszahlen mit festem Startwert: gleiches Korn bei jedem Aufruf */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianNoise(size, rand) {
  const a = new Float32Array(size * size);
  for (let i = 0; i < a.length; i += 2) {
    // Box-Muller: zwei normalverteilte Werte
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    a[i] = r * Math.cos(2 * Math.PI * v);
    if (i + 1 < a.length) a[i + 1] = r * Math.sin(2 * Math.PI * v);
  }
  return a;
}

/** Weichzeichnen mit Umbruch an den Rändern (bleibt nahtlos) */
function blurWrap(src, size, sigma) {
  const rad = Math.ceil(sigma * 2.5);
  const k = [];
  let sum = 0;
  for (let i = -rad; i <= rad; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(w);
    sum += w;
  }
  const kn = k.map((w) => w / sum);
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const wrap = (i) => ((i % size) + size) % size;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let acc = 0;
      for (let i = -rad; i <= rad; i++) acc += src[y * size + wrap(x + i)] * kn[i + rad];
      tmp[y * size + x] = acc;
    }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let acc = 0;
      for (let i = -rad; i <= rad; i++) acc += tmp[wrap(y + i) * size + x] * kn[i + rad];
      out[y * size + x] = acc;
    }
  return out;
}

/** Korn = feines Rauschen + etwas gröberes Rauschen, normiert auf Mittelgrau mit fester Streuung */
function grain(size, { fine, coarse, mix, spread, seed }) {
  const rand = rng(seed);
  const a = blurWrap(gaussianNoise(size, rand), size, fine);
  const b = blurWrap(gaussianNoise(size, rand), size, coarse);
  const c = new Float32Array(size * size);
  for (let i = 0; i < c.length; i++) c[i] = a[i] * (1 - mix) + b[i] * mix;
  let mean = 0;
  for (const v of c) mean += v;
  mean /= c.length;
  let sd = 0;
  for (const v of c) sd += (v - mean) ** 2;
  sd = Math.sqrt(sd / c.length);
  const px = Buffer.alloc(size * size);
  for (let i = 0; i < c.length; i++) px[i] = Math.max(0, Math.min(255, Math.round(128 + ((c[i] - mean) / sd) * spread)));
  return px;
}

await mkdir(OUT, { recursive: true });
// Feines Korn: kaum weichgezeichnet, wenig grobe Anteile (wie feinkörniger Film)
for (const [size, fine, coarse] of [
  [512, 0.38, 0.9],
  [256, 0.28, 0.6],
]) {
  const px = grain(size, { fine, coarse, mix: 0.12, spread: 54, seed: 20261106 });
  const file = `${OUT}grain-${size}.webp`;
  await sharp(px, { raw: { width: size, height: size, channels: 1 } })
    .webp({ quality: 86, smartSubsample: false })
    .toFile(file);
  console.log(`grain-${size}.webp  ${((await stat(file)).size / 1024).toFixed(0)} KB`);
}
