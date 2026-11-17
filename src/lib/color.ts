/**
 * Albumfarbe aus den Fotos: Aus den Durchschnittsfarben aller Fotos eines Albums (meta.json, Feld color) wird ein
 * heller, gedämpfter Ton desselben Farbtons – die Fläche über dem Album gehört dann zu seinen Bildern (bei Hilda ein
 * warmes Rostbraun-Beige statt Hellblau). Immer hell genug für schwarze Schrift (Kontrast über 9 : 1).
 * Gerechnet im OKLCH-Farbraum (gleichmäßige Helligkeit über alle Farbtöne).
 */

type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToOklab(hex: string): Lab | undefined {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  const n = parseInt(m[1]!, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => toLinear(v / 255)) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s,
  ];
}

/** OKLab → lineares sRGB (kann außerhalb 0…1 liegen) */
function oklabToLinear([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const hex = (rgb: [number, number, number]) =>
  '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, toGamma(c))) * 255).toString(16).padStart(2, '0')).join('');

/** Helligkeit und höchste Buntheit des Albumtons */
const TONE_L = 0.83;
const TONE_C_MAX = 0.06;
/** Unter dieser Buntheit gilt ein Album als farblos (schwarzweiß, grau) – dann ein neutraler, leicht warmer Ton */
const GREY_C = 0.012;

/**
 * Heller, gedämpfter Ton aus den Fotos; undefined, wenn keine Farben da sind.
 * Farbton: vom Titelbild (es steht für das Album), bei einem fast farblosen Titelbild der Mittelwert aller Fotos.
 * Buntheit: wie bunt die Fotos im Schnitt sind (nicht der Mittelwert der Farben – verschiedene Farbtöne würden
 * sich sonst zu Grau aufheben). Fast farblose Alben (schwarzweiß, Nacht) bekommen ein warmes Papiergrau.
 */
export function albumTone(colors: string[], cover?: string): string | undefined {
  const labs = colors.map(hexToOklab).filter((x): x is Lab => Boolean(x));
  if (!labs.length) return undefined;
  const a = labs.reduce((s, x) => s + x[1], 0) / labs.length;
  const b = labs.reduce((s, x) => s + x[2], 0) / labs.length;
  const vivid = labs.reduce((s, x) => s + Math.hypot(x[1], x[2]), 0) / labs.length;
  const c0 = cover ? hexToOklab(cover) : undefined;
  let h = c0 && Math.hypot(c0[1], c0[2]) > 0.008 ? Math.atan2(c0[2], c0[1]) : Math.atan2(b, a);
  let c = Math.min(TONE_C_MAX, vivid * 1.5);
  if (vivid < GREY_C) {
    h = (80 / 180) * Math.PI; // warmes Grau, wie Papier
    c = 0.01;
  }
  // in den sRGB-Farbraum holen: Buntheit verringern, bis alle Kanäle passen
  for (; c >= 0; c -= 0.002) {
    const rgb = oklabToLinear([TONE_L, c * Math.cos(h), c * Math.sin(h)]);
    if (rgb.every((v) => v >= 0 && v <= 1)) return hex(rgb);
  }
  return hex(oklabToLinear([TONE_L, 0, 0]));
}
