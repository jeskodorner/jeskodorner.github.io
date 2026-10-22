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
    /** Auf der Startseite unter „Ausgewählte Arbeiten“ zeigen */
    featured: z.boolean().default(false),
    /** Als Hero-Bild auf der Startseite verwenden */
    hero: z.boolean().default(false),
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

const films = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/films' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        year: z.number().int(),
        /** z. B. ["Kamera", "Drehbuch"] */
        roles: z.array(z.string()).min(1),
        format: z.string().optional(),
        runtime: z.string().optional(),
        director: z.string().optional(),
        still: image(),
        stillAlt: z.string().trim().min(3, { error: 'Alt-Text für das Standbild fehlt (stillAlt).' }),
        /** Externer Link zu Trailer/Film (Vimeo, YouTube …) – wird nur verlinkt, nicht eingebettet */
        link: z.url().optional(),
        linkLabel: z.string().optional(),
        festivals: z.array(z.string()).default([]),
        order: z.number().default(0),
      })
      .strict(),
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
