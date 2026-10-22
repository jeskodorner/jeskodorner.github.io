import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Optionale manuelle EXIF-Angaben – überschreiben die automatisch ausgelesenen Werte. */
const exifOverride = z
  .object({
    camera: z.string(),
    lens: z.string(),
    aperture: z.union([z.number(), z.string()]),
    shutter: z.string(),
    iso: z.union([z.number(), z.string()]),
    focalLength: z.union([z.number(), z.string()]),
    date: z.coerce.date(),
  })
  .partial()
  .strict();

const IMAGE_FILE = /^[a-z0-9][a-z0-9._-]*\.(jpe?g|png|webp|avif)$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const galleryImage = z
  .object({
    /** Dateiname im Unterordner images/ der Galerie, z. B. "kueste-01.jpg" */
    file: z.string().regex(IMAGE_FILE, {
      error: 'Ungültiger Dateiname. Erlaubt: Kleinbuchstaben, Ziffern, - _ . und .jpg/.png/.webp/.avif',
    }),
    /** Pflicht: Beschreibung des Bildinhalts für Screenreader und Suchmaschinen */
    alt: z
      .string({ error: 'Alt-Text fehlt (Feld "alt").' })
      .trim()
      .min(3, { error: 'Alt-Text fehlt oder ist zu kurz (Feld "alt").' })
      .refine((v) => !/^(todo|tbd|xxx)\b/i.test(v), {
        error: 'Alt-Text ist noch ein Platzhalter (TODO).',
      }),
    caption: z.string().optional(),
    /** Link zum hochauflösenden Original beim externen Anbieter */
    originalUrl: z.url({ error: 'originalUrl muss eine vollständige URL sein (https://…).' }).optional(),
    /** Als Hero-Bild auf der Startseite verwenden */
    hero: z.boolean().default(false),
    /** Wichtigster Bildbereich bei Vollbild-Zuschnitt, z. B. "50% 30%" (waagerecht senkrecht). Standard: Mitte */
    focus: z
      .string()
      .regex(/^\d{1,3}% \d{1,3}%$/, { error: 'focus bitte als "50% 30%" angeben (waagerecht senkrecht).' })
      .optional(),
    exif: exifOverride.optional(),
  })
  .strict();

const galleries = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/galleries' }),
  schema: z
    .object({
      title: z.string().min(1, { error: 'Titel fehlt.' }),
      /** URL-Teil, z. B. "kueste-im-oktober" → /galerien/kueste-im-oktober/ */
      slug: z.string().regex(SLUG, {
        error: 'Slug darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.',
      }),
      date: z.coerce.date({ error: 'Datum fehlt oder ist ungültig (Format: 2026-10-22).' }),
      location: z.string().optional(),
      /** Kurzbeschreibung (Kacheln, Suchmaschinen, Vorschau beim Teilen) */
      description: z.string().min(1, { error: 'Beschreibung fehlt.' }).max(300),
      /** Dateiname des Titelbilds; leer = erstes Bild */
      cover: z.string().optional(),
      layout: z.enum(['showcase', 'masonry', 'justified']).default('showcase'),
      /** Galeriefarbe der Galerie. Ohne Angabe wird automatisch durchgewechselt. */
      color: z.enum(['pink', 'blue', 'lime', 'orange', 'violet']).optional(),
      visibility: z.enum(['public', 'unlisted']).default('public'),
      /** EXIF-Daten in Lightbox und Bildseite zeigen */
      showExif: z.boolean().default(true),
      downloadUrl: z.url({ error: 'downloadUrl muss eine vollständige URL sein (https://…).' }).optional(),
      downloadSize: z.string().optional(),
      downloadFormat: z.string().optional(),
      /** Hinweiszeile, z. B. Nutzungsrechte, Gültigkeit, Passworthinweis */
      downloadNote: z.string().optional(),
      /** Eigener Teilen-Text; {title} und {url} werden ersetzt */
      shareText: z.string().optional(),
      images: z.array(galleryImage).min(1, { error: 'Die Galerie braucht mindestens ein Bild.' }),
    })
    .strict()
    .superRefine((g, ctx) => {
      if (g.visibility === 'unlisted' && !/-[a-z0-9]{6,}$/.test(g.slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['slug'],
          message:
            'Unlisted-Galerien brauchen einen zufälligen Anteil im Slug (z. B. "hochzeit-x7k2p9"). Tipp: npm run new-gallery -- "Name" --unlisted',
        });
      }
      const files = g.images.map((i) => i.file);
      if (g.cover && !files.includes(g.cover)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cover'],
          message: `Titelbild "${g.cover}" steht nicht in der Bildliste.`,
        });
      }
      const dupes = files.filter((f, i) => files.indexOf(f) !== i);
      if (dupes.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['images'],
          message: `Doppelte Bilder in der Liste: ${[...new Set(dupes)].join(', ')}`,
        });
      }
    }),
});

/** YouTube-ID aus einem Link oder einer reinen ID holen (youtu.be/…, youtube.com/watch?v=…, /shorts/…, /embed/…) */
function youtubeId(input: string): string | undefined {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m?.[1];
}

const films = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/films' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        year: z.number().int().optional(),
        /** z. B. ["Kamera", "Schnitt"] */
        roles: z.array(z.string()).default([]),
        format: z.string().optional(),
        runtime: z.string().optional(),
        director: z.string().optional(),
        /** YouTube-Link oder -ID – wird datensparsam per Zwei-Klick eingebettet */
        youtube: z
          .string()
          .refine((v) => Boolean(youtubeId(v)), { error: 'youtube: Link oder ID nicht erkannt (z. B. https://youtu.be/abc123XYZ_-).' })
          .transform((v) => youtubeId(v)!)
          .optional(),
        /** Eigenes Standbild als Vorschau (optional). Ohne Standbild: farbige Vorschau mit Titel */
        still: image().optional(),
        stillAlt: z.string().trim().optional(),
        /** Farbe der Vorschau ohne Standbild */
        color: z.enum(['pink', 'blue', 'lime', 'orange', 'violet']).optional(),
        /** Externer Link (z. B. Vimeo), falls kein YouTube-Video eingebettet wird */
        link: z.url().optional(),
        linkLabel: z.string().optional(),
        festivals: z.array(z.string()).default([]),
        order: z.number().default(0),
      })
      .strict()
      .superRefine((f, ctx) => {
        if (f.still && (!f.stillAlt || f.stillAlt.length < 3)) {
          ctx.addIssue({ code: 'custom', path: ['stillAlt'], message: 'Alt-Text für das Standbild fehlt (stillAlt).' });
        }
      }),
});

/** Texte einzelner Seiten (Startseite, Über mich) – getrennt vom Code. */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z
    .object({
      kicker: z.string().optional(),
      statement: z.string().optional(),
      note: z.string().optional(),
      aboutTeaser: z.string().optional(),
      lead: z.string().optional(),
      portraitAlt: z.string().optional(),
      stations: z
        .array(z.object({ year: z.coerce.string(), title: z.string(), text: z.string().optional() }).strict())
        .default([]),
      gear: z.array(z.string()).default([]),
    })
    .strict(),
});

export const collections = { galleries, films, pages };
