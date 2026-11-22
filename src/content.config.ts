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

/** Leere Felder aus dem CMS (Pages CMS schreibt bei leeren Feldern "" oder null) wie „nicht angegeben“ behandeln –
 *  sonst brächen z. B. ein leerer Link oder ein leerer Ausschnitt den Build ab (seit 22.11.2026). */
const empty = (v: unknown) => (v === '' || v === null ? undefined : v);
const opt = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(empty, schema.optional());

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
    caption: opt(z.string()),
    /** Link zum hochauflösenden Original beim externen Anbieter */
    originalUrl: opt(
      z.url({
        error: 'originalUrl muss eine vollständige URL sein (https://…).',
      }),
    ),
    /** Als Hero-Bild auf der Startseite verwenden */
    hero: z.boolean().default(false),
    /** Wichtigster Bildbereich bei Vollbild-Zuschnitt, z. B. "50% 30%" (waagerecht senkrecht). Standard: Mitte */
    focus: opt(
      z.string().regex(/^\d{1,3}% \d{1,3}%$/, {
        error: 'focus bitte als "50% 30%" angeben (waagerecht senkrecht).',
      }),
    ),
    exif: opt(exifOverride),
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
      date: z.coerce.date({
        error: 'Datum fehlt oder ist ungültig (Format: 2026-10-22).',
      }),
      location: opt(z.string()),
      /** Kurzbeschreibung (Kacheln, Suchmaschinen, Vorschau beim Teilen) */
      description: z.string().min(1, { error: 'Beschreibung fehlt.' }).max(300),
      /** Dateiname des Titelbilds; leer = erstes Bild */
      cover: opt(z.string()),
      /** Fotos der „Mappe“ (Seite /mappe/<slug>/, nur Alben aus dem Portfolio), Dateinamen in Reihenfolge.
       *  Leer = das Portfolio-Foto und bis zu 7 weitere, gleichmäßig über das Album verteilt. */
      mappe: opt(z.array(z.string())),
      /** Video für die Mappe (Dateiname einer MP4 in public/videos/): läuft dort oben über die volle Breite ohne Ton
       *  in Schleife, darunter die Fotos. Gehört nur zur Mappe – nicht in den Bereich „Film“ (seit 22.11.2026). */
      mappeVideo: opt(
        z.string().regex(/^[\w.-]+\.mp4$/, {
          error: 'mappeVideo: nur der Dateiname einer MP4 in public/videos/, ohne Leerzeichen.',
        }),
      ),
      /** Galeriefarbe der Galerie. Ohne Angabe wird automatisch durchgewechselt. */
      color: opt(z.enum(['blue', 'orange', 'green', 'cream'])),
      visibility: z.enum(['public', 'unlisted']).default('public'),
      /** EXIF-Daten in Lightbox und Bildseite zeigen */
      showExif: z.boolean().default(true),
      downloadUrl: opt(
        z.url({
          error: 'downloadUrl muss eine vollständige URL sein (https://…).',
        }),
      ),
      downloadSize: opt(z.string()),
      downloadFormat: opt(z.string()),
      /** Hinweiszeile, z. B. Nutzungsrechte, Gültigkeit, Passworthinweis */
      downloadNote: opt(z.string()),
      /**
       * Kasten „Ganzes Album anfordern“ (Code per E-Mail anfordern). Standard: an bei öffentlichen, aus bei Unlisted-Galerien.
       * Mit downloadUrl erscheint zusätzlich „Album öffnen“ – das Passwort setzt du beim Anbieter, nie hier.
       */
      albumRequest: opt(z.boolean()),
      /** Eigener Teilen-Text; {title} und {url} werden ersetzt */
      shareText: opt(z.string()),
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
        year: opt(z.coerce.number().int()),
        /** z. B. ["Kamera", "Schnitt"] */
        roles: z.preprocess(empty, z.array(z.string()).default([])),
        format: opt(z.string()),
        runtime: opt(z.string()),
        director: opt(z.string()),
        /** YouTube-Link oder -ID – wird datensparsam per Zwei-Klick eingebettet */
        youtube: opt(
          z
            .string()
            .refine((v) => Boolean(youtubeId(v)), {
              error: 'youtube: Link oder ID nicht erkannt (z. B. https://youtu.be/abc123XYZ_-).',
            })
            .transform((v) => youtubeId(v)!),
        ),
        /** Standbild im Player auf der Seite des Films (vor dem Klick auf „Abspielen“). Ohne Standbild: farbige
         *  Fläche mit Titel */
        still: opt(image()),
        stillAlt: opt(z.string().trim()),
        /** Eigenes Vorschaubild für die Übersicht /film/ (optional, z. B. extra hochgeladen). Ohne: das Standbild */
        cover: opt(image()),
        coverAlt: opt(z.string().trim()),
        /** Kurzer Text für die Übersicht (optional). Ohne: der erste Absatz des Textes */
        summary: opt(z.string().trim()),
        /** Farbe der Vorschau ohne Standbild */
        color: opt(z.enum(['blue', 'orange', 'green', 'cream'])),
        /** Eigenes Video statt YouTube: Dateiname einer MP4 in public/videos/ (z. B. "dollgow-neujahr-2025.mp4"). Läuft
         *  ohne Ton in Schleife wie ein bewegtes Foto (src/components/LoopVideo.astro). Unter 50 MB halten (GitHub). */
        video: opt(
          z.string().regex(/^[\w.-]+\.mp4$/, {
            error: 'video: nur der Dateiname einer MP4 in public/videos/, ohne Leerzeichen.',
          }),
        ),
        /** Externer Link (z. B. Vimeo), falls kein YouTube-Video eingebettet wird */
        link: opt(z.url()),
        linkLabel: opt(z.string()),
        festivals: z.preprocess(empty, z.array(z.string()).default([])),
        order: z.preprocess(empty, z.coerce.number().default(0)),
      })
      .strict()
      .superRefine((f, ctx) => {
        if (f.still && (!f.stillAlt || f.stillAlt.length < 3)) {
          ctx.addIssue({
            code: 'custom',
            path: ['stillAlt'],
            message: 'Alt-Text für das Standbild fehlt (stillAlt).',
          });
        }
        if (f.video && !f.still) {
          ctx.addIssue({
            code: 'custom',
            path: ['still'],
            message: 'Zum Video fehlt ein Standbild (still) – es steht in der Übersicht und solange das Video lädt.',
          });
        }
        if (f.cover && (!f.coverAlt || f.coverAlt.length < 3)) {
          ctx.addIssue({
            code: 'custom',
            path: ['coverAlt'],
            message: 'Alt-Text für das Vorschaubild fehlt (coverAlt).',
          });
        }
      }),
});

/** Texte einzelner Seiten (Startseite, Über mich) – getrennt vom Code. */
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z
    .object({
      kicker: opt(z.string()),
      /** Startseite „Portfolio“: welche Fotos hängen, mit optionalem eigenem Namen */
      showroom: z.preprocess(
        empty,
        z
          .array(
            z
              .object({
                galerie: z.string().min(1),
                bild: opt(z.string()),
                name: opt(z.string()),
              })
              .strict(),
          )
          .default([]),
      ),
      statement: opt(z.string()),
      note: opt(z.string()),
      aboutTeaser: opt(z.string()),
      lead: opt(z.string()),
      portraitAlt: opt(z.string()),
      stations: z.preprocess(
        empty,
        z
          .array(
            z
              .object({
                year: z.coerce.string(),
                title: z.string(),
                text: opt(z.string()),
              })
              .strict(),
          )
          .default([]),
      ),
      gear: z.preprocess(empty, z.array(z.string()).default([])),
    })
    .strict(),
});

export const collections = { galleries, films, pages };
