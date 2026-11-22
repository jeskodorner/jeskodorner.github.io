/**
 * Gemeinsame Bildaufbereitung für `npm run optimize`, den CMS-Eingang (scripts/inbox.mjs) und das Mac-Programm
 * „Fotos aufbereiten“ (scripts/prepare-folder.mjs): Metadaten lesen und Web-Version erzeugen.
 */
import sharp from 'sharp';
import exifr from 'exifr';

export async function readExif(file) {
  let data = {};
  try {
    data =
      (await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        xmp: true,
        iptc: true,
        icc: false,
        reviveValues: true,
        translateValues: true,
      })) ?? {};
  } catch {
    data = {};
  }
  // Standardtexte, die Kameras selbst in die Bildbeschreibung schreiben – keine echte Bildunterschrift
  const CAMERA_DEFAULTS = /^(OLYMPUS DIGITAL CAMERA|SONY DSC|DIGITAL CAMERA|KODAK.*DIGITAL CAMERA|DCIM|Default|Image|Picture|SAMSUNG|LEICA|NIKON|CANON|PENTAX|Photo)$/i;
  const text = (v) => {
    if (!v) return undefined;
    if (typeof v === 'string') {
      const s = v.trim();
      return s && !CAMERA_DEFAULTS.test(s) ? s : undefined;
    }
    if (Array.isArray(v)) return text(v[0]);
    if (typeof v === 'object' && 'value' in v) return text(v.value);
    return undefined;
  };

  let make = (data.Make ?? '').trim().replace(/\s*(corporation|corp\.?|imaging corp\.?|co\.,? ?ltd\.?)$/i, '');
  if (make.length > 3 && make === make.toUpperCase()) make = make[0] + make.slice(1).toLowerCase();
  const model = (data.Model ?? '').trim();
  const camera = model ? (model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`.trim()) : make || undefined;

  const t = data.ExposureTime;
  const shutter =
    typeof t === 'number' && t > 0 ? (t >= 1 ? `${Math.round(t * 10) / 10}` : `1/${Math.round(1 / t)}`) : undefined;
  const iso = data.ISO ?? data.ISOSpeedRatings ?? data.PhotographicSensitivity;
  const date = data.DateTimeOriginal ?? data.CreateDate;

  const exif = Object.fromEntries(
    Object.entries({
      camera: camera || undefined,
      lens: (data.LensModel ?? data.Lens ?? '').toString().trim() || undefined,
      aperture: typeof data.FNumber === 'number' ? Math.round(data.FNumber * 10) / 10 : undefined,
      shutter,
      iso: Array.isArray(iso) ? iso[0] : iso,
      focalLength: typeof data.FocalLength === 'number' ? Math.round(data.FocalLength) : undefined,
      date: date instanceof Date && !Number.isNaN(date.getTime()) ? localIso(date) : undefined,
    }).filter(([, v]) => v !== undefined && v !== ''),
  );

  const gps =
    typeof data.latitude === 'number' && typeof data.longitude === 'number'
      ? { lat: data.latitude, lng: data.longitude }
      : undefined;

  return {
    exif,
    gps,
    /** EXIF „Software“ – „jeskodorner-web“ = schon mit „Fotos aufbereiten“ fertig gemacht (Wasserzeichen drin) */
    software: typeof data.Software === 'string' ? data.Software.trim() : undefined,
    alt: text(data.AltTextAccessibility),
    caption: text(data.Caption) ?? text(data.description) ?? text(data.ImageDescription),
  };
}

/** Aufnahmezeit als lokale Zeit ohne Zeitzone (EXIF kennt meist keine Zeitzone) */
function localIso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Markierung in fertigen Fotos (EXIF „Software“): verhindert ein zweites Wasserzeichen beim erneuten Aufbereiten */
export const WEB_MARKER = 'jeskodorner-web';

/**
 * Web-Version eines Fotos: lange Kante höchstens cfg.maxEdge, sRGB, Wasserzeichen (cfg.watermark), JPEG mit möglichst
 * hoher Qualität unter cfg.targetMaxKB. Metadaten: Urheber, Kamera/Objektiv/Belichtung/Datum, Bildbeschreibung und
 * Bildunterschrift (XMP) bleiben erhalten, GPS fällt weg (außer cfg.keepGps). Ist das Foto schon fertig (Markierung
 * WEB_MARKER), kommt kein zweites Wasserzeichen dazu.
 */
export async function renderWebVersion(file, cfg, info = {}) {
  const base = sharp(file, { failOn: 'none' });
  const m = await base.metadata();
  let w = m.width ?? 0;
  let h = m.height ?? 0;
  if ((m.orientation ?? 1) >= 5) [w, h] = [h, w];
  const scale = Math.min(1, cfg.maxEdge / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const alreadyDone = info.software === WEB_MARKER;

  const make = (quality) => {
    let p = sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width, height, fit: 'fill' })
      .withIccProfile('srgb');
    if (cfg.watermark?.enabled && !alreadyDone) {
      p = p.composite([{ input: watermarkSvg(width, height, cfg.watermark), gravity: gravityOf(cfg.watermark.position) }]);
    }
    if (cfg.keepGps) p = p.keepExif();
    else p = p.withExif(exifFor(info, cfg));
    const xmp = xmpFor(info);
    if (xmp) p = p.withXmp(xmp);
    return p.jpeg({ quality, mozjpeg: true }).toBuffer();
  };

  let quality = cfg.jpegQuality;
  let buffer = await make(quality);
  while (buffer.length / 1024 > cfg.targetMaxKB && quality - 4 >= cfg.minJpegQuality) {
    quality -= 4;
    buffer = await make(quality);
  }
  return { buffer, quality, width, height };
}

/** EXIF ohne GPS: Urheber, Kamera, Objektiv, Belichtung, Aufnahmezeit (Werte als Text, so verlangt es sharp) */
function exifFor(info, cfg) {
  const e = info.exif ?? {};
  const ifd0 = { Copyright: cfg.copyright ?? '', Artist: cfg.artist ?? '', Software: WEB_MARKER };
  if (e.camera) ifd0.Model = String(e.camera);
  const ifd2 = {};
  if (e.lens) ifd2.LensModel = String(e.lens);
  if (typeof e.aperture === 'number') ifd2.FNumber = `${Math.round(e.aperture * 10)}/10`;
  if (e.shutter) ifd2.ExposureTime = String(e.shutter);
  if (e.iso) ifd2.ISOSpeedRatings = String(e.iso);
  if (typeof e.focalLength === 'number') ifd2.FocalLength = `${Math.round(e.focalLength)}/1`;
  if (e.date) ifd2.DateTimeOriginal = String(e.date).replace('T', ' ').replace(/^(\d{4})-(\d{2})-(\d{2})/, '$1:$2:$3');
  return { IFD0: ifd0, IFD2: ifd2 };
}

/** XMP mit Bildbeschreibung (Alt-Text) und Bildunterschrift, damit sie beim erneuten Aufbereiten erhalten bleiben */
function xmpFor(info) {
  if (!info.alt && !info.caption) return undefined;
  const alt = (tag, v) => (v ? `<${tag}><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(v)}</rdf:li></rdf:Alt></${tag}>` : '');
  return (
    '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/">' +
    '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about=""' +
    ' xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/">' +
    alt('dc:description', info.caption) +
    alt('Iptc4xmpCore:AltTextAccessibility', info.alt) +
    '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>'
  );
}

function gravityOf(position = 'bottom-right') {
  return { 'bottom-right': 'southeast', 'bottom-left': 'southwest', 'bottom-center': 'south' }[position] ?? 'southeast';
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]);
}

function watermarkSvg(w, h, wm) {
  const fontSize = Math.max(13, Math.round(Math.max(w, h) * (wm.size ?? 0.016)));
  const pad = Math.round(fontSize * 1.2);
  const textWidth = Math.round(fontSize * 0.62 * wm.text.length + fontSize * 0.1 * wm.text.length);
  const svgW = Math.min(w, textWidth + pad * 2);
  const svgH = Math.min(h, fontSize + pad * 2);
  const anchor = wm.position === 'bottom-left' ? 'start' : wm.position === 'bottom-center' ? 'middle' : 'end';
  const x = anchor === 'start' ? pad : anchor === 'middle' ? svgW / 2 : svgW - pad;
  const y = svgH - pad;
  const o = wm.opacity ?? 0.5;
  const text = escapeXml(wm.text);
  const style = `font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="${(fontSize * 0.06).toFixed(1)}" text-anchor="${anchor}"`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}">` +
      `<text x="${x + 1}" y="${y + 1}" ${style} fill="#000" fill-opacity="${(o * 0.45).toFixed(2)}">${text}</text>` +
      `<text x="${x}" y="${y}" ${style} fill="#fff" fill-opacity="${o}">${text}</text>` +
      `</svg>`,
  );
}

