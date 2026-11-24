# Jesko Dorner – Fotografie-Portfolio

Statische Portfolio-Website mit Galerien, Lightbox, Bildübergabe an Kunden und Filmarbeiten.
Gebaut mit **Astro 7** und TypeScript und gehostet kostenlos auf **GitHub Pages** unter
**https://jeskodorner.de** (die alte Adresse jeskodorner.github.io leitet automatisch weiter).

- Keine Cookies, keine Tracker, keine Google Fonts. Alle Schriften liegen lokal im Projekt.
- Die Seiten funktionieren ohne JavaScript. JavaScript wird nur für Lightbox, Foto-Reihen, Teilen und die E-Mail-Adresse verwendet.
- Lighthouse (lokal gemessen, Mobil): Performance 98–100, Barrierefreiheit 100, Best Practices 100 und SEO 100.
- Große Fotos mit Parallax und Bewegung beim Scrollen, alles reines CSS (siehe Abschnitt 7).

---

## Inhalt

1. [Schnellstart](#1-schnellstart)
2. [Projektstruktur](#2-projektstruktur)
3. [Texte und Einstellungen ändern](#3-texte-und-einstellungen-ändern)
4. [Neue Galerie anlegen](#4-neue-galerie-anlegen)
5. [Felder einer Galerie](#5-felder-einer-galerie)
6. [Bildübergabe: Downloads und Unlisted-Galerien](#6-bildübergabe-downloads-und-unlisted-galerien)
7. [Bewegung beim Scrollen](#7-bewegung-beim-scrollen)
8. [Optionale Funktionen](#8-optionale-funktionen)
9. [Deployment auf GitHub Pages](#9-deployment-auf-github-pages)
10. [Grenzen von GitHub Pages](#10-grenzen-von-github-pages)
11. [Design: Farben und Schriften](#11-design-farben-und-schriften)
12. [Englisch später ergänzen](#12-englisch-später-ergänzen)
13. [Häufige Fehler](#13-häufige-fehler)

---

## 1. Schnellstart

Voraussetzung ist **Node.js 24** (LTS). Auf diesem Mac ist Node bereits über Homebrew installiert.

```bash
npm install
```

```bash
npm run dev
```

Danach läuft die Seite unter **http://localhost:4321**. Änderungen erscheinen sofort.

| Befehl | Was passiert |
|---|---|
| `npm run dev` | Entwicklungsserver mit Live-Neuladen |
| `npm run build` | fertige Website nach `dist/` bauen |
| `npm run preview` | gebaute Website lokal ansehen |
| `npm run optimize` | Original-Fotos in Web-Versionen umwandeln (siehe Abschnitt 4) |
| `npm run new-gallery -- "Name"` | neue Galerie anlegen |
| `npm run check` | TypeScript und Inhalte prüfen |
| `npm run check-links` | gebaute Seite prüfen: Links, Unlisted-Regeln, Größe |
| `npm test` | alles zusammen: check, build, check-links |

---

## 2. Projektstruktur

```
photos-source/              ← deine ORIGINALE (wird nie committet, steht in .gitignore)
  kueste-im-oktober/*.jpg
src/
  config/site.ts            ← zentrale Einstellungen: Name, Claim, Instagram, Formular, Statistik
  content/
    galleries/<ordner>/
      index.md              ← Galerie-Daten (Titel, Beschreibung, Bilder, Download …)
      images/*.jpg          ← Web-Versionen (erzeugt von npm run optimize)
      meta.json             ← EXIF, Farbe, Blur-Platzhalter (erzeugt, nicht von Hand ändern)
    films/*.md              ← Filmarbeiten (+ images/ für Standbilder)
    pages/startseite.md     ← Liste fürs Portfolio („showroom“)
    pages/ueber-mich.md     ← Texte „Über mich“, Stationen, Ausrüstung
  assets/portrait.jpg       ← Porträt für „Über mich“ (einfach ersetzen)
  pages/                    ← Seiten und Routen
  components/               ← Bausteine (Galerie-Raster, Lightbox, Teilen …)
  styles/tokens.css         ← Farben, Schriftgrößen, Abstände
  i18n/de.ts                ← alle festen Texte (Buttons, Labels …)
scripts/                    ← optimize, new-gallery, check-links
photos.config.json          ← Einstellungen für die Bildverarbeitung (Größe, Qualität, Wasserzeichen, GPS)
.github/workflows/deploy.yml← automatisches Deployment
```

**Warum eigenes CSS statt Tailwind?** Die Seite lebt von wenigen, gezielt gesetzten Design-Werten: vier Farben. CSS Custom Properties bilden das direkt ab: Eine Klasse wie `c-green` färbt eine ganze Fläche ein, das HTML bleibt lesbar, und Astro begrenzt die Styles pro Komponente. Tailwind würde vor allem bei vielen generischen Oberflächen helfen, die es hier nicht gibt.

---

## 3. Texte und Einstellungen ändern

| Was | Wo |
|---|---|
| Claim, Beschreibung für Suchmaschinen, Instagram, E-Mail | `src/config/site.ts` |
| Portfolio: welche Fotos, Reihenfolge, eigene Namen | `src/content/pages/startseite.md`, Liste `showroom` (siehe unten) |
| Über mich: Text, Stationen, Ausrüstung | `src/content/pages/ueber-mich.md` |
| Porträt | Datei `src/assets/portrait.jpg` ersetzen (Hochformat 4:5 ideal) |
| Filme und Videos | `src/content/films/*.md`. Pro Video eine Datei (siehe unten) |
| Buttons, Beschriftungen | `src/i18n/de.ts` |
| Impressum und Datenschutz | `src/pages/impressum.astro`, `src/pages/datenschutz.astro` |

> ⚠️ **Das Impressum enthält bewusst keine Anschrift** (nur Name und E-Mail). § 18 Abs. 1 MStV verlangt sie bei
> öffentlichen Seiten eigentlich; eine c/o-Adresse eines Impressum-Dienstes wäre eine Möglichkeit. Die
> Datenschutzerklärung hat noch Platzhalter, die auf der Seite markiert sind. Das hier ist keine Rechtsberatung.

**Portfolio:** Seit 22.11.2026 wird es **im Album** eingestellt (im CMS: Alben → Album → „Portfolio“), Feld
`portfolio` in index.md. Die Reihenfolge ergibt sich aus dem Datum des Album, das neueste zuerst – auch für den
Fotowechsel auf der Startseite. Die Alben erscheinen auf der Seite **/portfolio/** als kleine Ausstellung und haben je
eine **Mappe** (`/mappe/<kurzname>/`): eine eigene, reduzierte Seite; „Ganzes Album ansehen“ führt von dort ins Album.

```yaml
portfolio:
  zeigen: true                                  # im Portfolio anzeigen
  vorschau: /alben/hoodie/images/dsc01421.jpg   # Vorschaufoto, zugleich Titelbild des Albums (Dateiname genügt auch)
  fotos:                                        # Fotos der Mappe in dieser Reihenfolge; leer = automatisch bis zu 8
    - /alben/hoodie/images/dsc01423.jpg
  name: "Beton und Rüschen"                     # optional: Titel in Portfolio und Mappe (sonst Name des Albums)
  beschreibung: "Ein Satz zur Mappe"            # optional: steht in der Mappe unter dem Titel
```

Das Vorschaufoto steht in der Mappe nie vorne. Ein falscher Dateiname bricht den Build mit einer Meldung ab. Vorher
stand die Auswahl als Liste `showroom` in `startseite.md` (wird nur noch genutzt, wenn kein Album `zeigen: true` hat).

**Video hinzufügen:** In `src/content/films/` eine neue Datei anlegen, z. B. `mein-video.md`. Am einfachsten kopierst du eine vorhandene:

```yaml
---
title: "Innehalten"
youtube: "https://youtu.be/61yE6MHDz-o"   # Link oder ID genügt
year: 2025                                 # nur für die Reihenfolge, wird nicht angezeigt
# still: ./images/innehalten.jpg           # eigenes Vorschaubild (optional)
# stillAlt: "Beschreibung des Standbilds"
color: green                               # Farbe der Vorschau ohne Standbild (blue | orange | green | cream)
order: 2                                   # Reihenfolge auf der Seite
---

Kurzer Text zum Video.
```

**Film-Übersicht** (`/film/`, `src/pages/film.astro`): je Film ein Vorschaubild (16:9), der Titel klein darunter,
ein kurzer Text in Grau und „Mehr ansehen →“ – kein Player. Laptop 3, Tablet 2, Handy 1 pro Reihe.
**Seite je Film** (`/film/<dateiname>/`, `src/pages/film/[slug].astro`): aufgebaut wie die Albumseite – oben
ohne Farbband (seit 22.11.2026) „← Zurück“, Titel und der ganze Text in Grau, dazu der Player mit „Abspielen“ (am Laptop
ab 1000 px nebeneinander, Text links, Video rechts; am Handy und Tablet untereinander, der Player dann so groß, dass
er auf den ersten Bildschirm passt). Unten „Nächster Film →“ mit Vorschaubild, gleich aufgebaut wie „Nächste
Galerie“ beim Album (`src/components/NeighbourNav.astro`; „Nächste …“ steht immer rechtsbündig, gespiegelt zu
„Vorherige …“, seit 22.11.2026 auch am Handy), nur in eine Richtung; nach dem letzten Film kommt der
erste. Mit eigener Vorschaukarte fürs Teilen. Die Mappe bleibt bewusst anders: ruhiger, ohne Band.

Felder dafür (alle optional):

```yaml
cover: ./images/mein-video-vorschau.jpg     # eigenes Vorschaubild für die Übersicht (ohne: das Standbild `still`)
coverAlt: "Was auf dem Vorschaubild zu sehen ist"
summary: "Kurzer Text für die Übersicht"     # ohne: der erste Absatz des Textes
```

Das Vorschaubild legst du in `src/content/films/images/`. Aufgaben, Videotyp, Länge, Jahr, Regie und Festivals
(`roles`, `format`, `runtime`, `year`, `director`, `festivals`) werden seit 20.11.2026 nicht mehr gezeigt – die
Felder dürfen in alten Dateien stehen bleiben.

**Video in einer Mappe** (seit 22.11.2026, z. B. Dollgow): Die MP4 liegt in `public/videos/`, das Album nennt sie in
index.md mit `mappeVideo: dollgow-neujahr-2025.mp4`. In der Mappe läuft sie oben über die volle Breite **ohne Ton in
Schleife wie ein bewegtes Foto** (`src/components/LoopVideo.astro`), ohne Knopf zum Anhalten; darunter die Fotos.
Solche Videos gehören nur zur Mappe und erscheinen **nicht im Bereich „Film“** (Jeskos Wunsch). Sie laden erst, wenn
sie auf dem Bildschirm sind, und laufen nur dort; bei „Bewegung reduzieren“ oder im Datensparmodus bleibt das
Standbild stehen. Standbild: ein Bild aus dem Video mit demselben Namen in `src/assets/videos/` (z. B.
`dollgow-neujahr-2025.jpg`, aus dem Video bei 0:46 gezogen). Breite und Höhe liest der Build aus der Datei
(`src/lib/video.ts`). Ein Film im Bereich „Film“ kann mit `video:` ebenfalls eine eigene MP4 statt YouTube zeigen
(dann mit kleinem Knopf zum Anhalten und `still:` als Vorschau).

Export aus DaVinci Resolve (Deliver, Custom Export): MP4, H.264, Größe im Seitenverhältnis des Films (z. B.
1920 × 1280 bei 3:2), „Restrict to“ etwa 6000 Kb/s, Key Frames alle 2 Sekunden, Gamma Tag Rec.709-A, ohne Ton.
**Unter 50 MB bleiben** (GitHub warnt ab 50 MB, lehnt ab 100 MB ab), und jede neue Fassung bleibt für immer in der
Git-Geschichte – also möglichst einmal sorgfältig exportieren. Damit das Video sofort anläuft, die Datei vor dem
Kopieren einmal ohne neues Komprimieren umpacken: `avconvert -s eingang.mp4 -p PresetPassthrough -o public/videos/name.mp4`
(macOS, schiebt das Inhaltsverzeichnis der Datei nach vorn).

YouTube-Videos werden **datensparsam per Zwei-Klick** eingebettet. Beim Seitenaufruf lädt nichts von YouTube, und es gibt keine Cookies.
Erst ein Klick auf „Abspielen“ lädt den Player von youtube-nocookie.com. Ohne JavaScript führt der Klick zu YouTube.
Die Datenschutzerklärung bekommt dazu automatisch einen YouTube-Abschnitt.

**Sternchen in Titeln:** `*Wort*` in `startseite.md` und `ueber-mich.md` wird bewusst schlicht gesetzt, ohne Marker (seriöserer Auftritt). Die Sternchen können stehen bleiben.

**Platzhalter entfernen:** Die Beispielgalerien sind gelöscht (zuletzt am 23.11.2026 die Beispiel-Kundengalerie
`sommerfest-beispiel-q7m4zt`; zurückholen über die Git-Geschichte, Tag `alte-version-vor-design-review`). Gibt es keine
Filme mehr, verschwindet auch der Menüpunkt „Film“.

---

## 4. Neue Galerie anlegen

### Im Browser mit Pages CMS (ohne Terminal, seit 22.11.2026)

Unter **https://app.pagescms.org** mit dem GitHub-Konto anmelden und das Projekt `jeskodorner.github.io` öffnen.
Die Formulare stehen in `.pages.yml`. Jede Speicherung ist ein Commit auf `main`; danach baut GitHub die Website neu
(ein paar Minuten, zu sehen unter GitHub → Actions).

- **Fotos hochladen** → neuer Eintrag: Albumtitel, Datum, Ort, Kurzbeschreibung, Sichtbarkeit, Fotos hineinziehen,
  speichern. Für Fotos zu einem **bestehenden** Album dessen Kurznamen (aus der Adresse) ins Feld „Zu einem
  bestehenden Album hinzufügen“ schreiben. GitHub macht daraus automatisch das Album (`scripts/inbox.mjs`, wie
  `npm run optimize`: verkleinern, Wasserzeichen, GPS weg, Aufnahmedaten, Eintrag in `index.md`) und leert den
  Eingang (`photos-inbox/`, Fotos in `photos-uploads/`) wieder.
- **Alben**: Titel, Texte, Bildbeschreibungen, Ausschnitt (`focus`) usw. ändern. Jedes Foto ist dort mit Vorschau zu
  sehen (seit 23.11.2026 steht in `images` der Pfad `/alben/<ordner>/images/<datei>` statt nur des Dateinamens –
  die Website nimmt beides, `scripts/optimize.mjs` schreibt neue Fotos mit Pfad).
- **Album löschen** (seit 23.11.2026): im CMS unter „Alben“ beim Album auf „Delete“. Das CMS löscht nur die
  `index.md`; beim nächsten Bauen räumt GitHub den Rest des Ordners (Fotos, `meta.json`) auf
  (`scripts/cleanup-albums.mjs`). Zurückholen geht nur über die Git-Geschichte.
- **Versehentlich hochgeladene Fotos** (seit 23.11.2026): Wird beim Vorschaufoto, Titelbild oder in der Mappe im
  Auswahlfenster ein Foto neu hochgeladen statt aus dem Album gewählt, repariert GitHub das beim Bauen
  (`scripts/fix-album-photos.mjs`): gibt es das Foto schon im Album (gleicher Name), wird das genommen, sonst kommt es
  aufbereitet ins Album; die lose Datei wird gelöscht.
- **Mehrere Fotos auf einmal hochladen**: unter „Fotos hochladen“ alle Fotos im Finder markieren und aufs Feld „Fotos“
  ziehen, oder dort auf „Upload“ und im Fenster alle markieren (⌘A). Das „Upload“ im Auswahlfenster („Select“) nimmt
  nur ein Foto pro Klick.
- **Adresse eines Albums** (Feld „Adresse“, seit 23.11.2026 änderbar): Die alte Adresse leitet danach automatisch
  auf die neue weiter (auch die Mappe). Dafür merkt sich GitHub beim Bauen jede Adresse
  (`scripts/slug-history.mjs` → `src/content/alte-adressen.json`), `astro.config.mjs` legt die Weiterleitungen an.
  Ausnahme: Wird ein öffentliches Album privat, leitet die alte Adresse nicht weiter (sonst wäre die geheime Adresse
  verraten). Private Alben behalten beim Ändern ihren zufälligen Teil am Ende (z. B. `-x7k2p9`).
- **Portfolio** (im Album-Formular): Schalter „Im Portfolio anzeigen“ und „Auf der Startseite zeigen“ (seit
  24.11.2026, Standard an: ausgeschaltet steht die Mappe nur im Portfolio, nicht in der Diashow der Startseite), **Vorschaufoto** und **Fotos der Mappe** per
  Klick aus dem Album-Ordner (Medienquelle „Album-Fotos“; dort nichts hochladen), Name und Beschreibung der Mappe.
- **Filme**, **Über mich**: Texte und Felder.

**Fotos aus Lightroom exportieren** (vor dem Hochladen): JPEG, sRGB, lange Kante 2400 px, Qualität ca. 85,
Metadaten „Alle außer Kamera- und Camera-Raw-Infos“ oder „Alle“ (GPS entfernt das Skript), Dateiname z. B.
„Dateiname“. Bildbeschreibungen am besten schon in Lightroom ins Feld „Bildunterschrift“ schreiben – sie werden
übernommen. Fehlt eine, trägt das Skript „Foto aus „Albumtitel““ ein; im CMS unter „Alben“ → Fotos verbessern.
Originale mit 20 MB gehören nicht ins Repo (GitHub-Grenzen, siehe Abschnitt 10).

**Sicherheit:** Bearbeiten kann nur, wer sich mit einem GitHub-Konto anmeldet, das Schreibrechte am Repo hat. Die
Pages-CMS-App nur für dieses eine Repo freigeben (GitHub → Settings → Applications), Zwei-Faktor-Anmeldung bei GitHub
einschalten. Die Freigabe lässt sich dort jederzeit widerrufen. Beim Speichern im CMS gehen `#`-Kommentare in der
bearbeiteten Datei verloren; leere Felder aus dem CMS gelten als „nicht angegeben“ (`src/content.config.ts`).

### Fotos vorab fertig machen: Mac-Programm „Fotos aufbereiten“

Im Projektordner liegt **„Fotos aufbereiten.app“** (am besten ins Dock ziehen). Öffnen und einen Ordner mit Fotos (oder
einzelne Fotos) ins Fenster ziehen – oder direkt aufs Symbol im Dock: Daneben entsteht „<Name> – Web“ (mit Wasserzeichen:
„<Name> – Web mit Wasserzeichen“) mit Web-Versionen wie für die Website – lange
Kante 2400 px, sRGB, JPEG unter ca. 600 KB, GPS entfernt; Kamera-Daten, Aufnahmezeit und Bildbeschreibungen aus
Lightroom bleiben drin. Die Originale bleiben unverändert. Diese Fotos lassen sich direkt im CMS hochladen.
**Wasserzeichen im Programm:** Schalter im Fenster (gemerkt in den Mac-Einstellungen `de.jeskodorner.fotos-aufbereiten`;
Standard: aus). Quelltext des Fensters: `scripts/app/FotosAufbereiten.swift` (SwiftUI, gebaut mit den Command Line Tools). Das gilt nur für dieses Programm, nicht
für die Website. Dahinter
steckt `scripts/prepare-folder.mjs`; nach dem Verschieben des Projekts die App neu bauen: `bash scripts/make-app.sh`.

**Wasserzeichen** „© Jesko Dorner“: seit 22.11.2026 ausgeschaltet (`photos.config.json` → `watermark.enabled`),
damit die Vorschaubilder ohne Stempel sind. Alle Web-Fotos wurden dafür aus den Originalen neu erzeugt (`npm run
optimize -- --force`); der Stand mit Wasserzeichen ist Git-Tag `alte-version-mit-wasserzeichen`. Wieder einschalten:
`enabled: true` und erneut `npm run optimize -- --force`. Fotos, die schon mit „Fotos aufbereiten“ fertig gemacht
wurden, bekommen beim Aufbereiten kein zweites Wasserzeichen (Markierung in den Metadaten).

### Im Terminal

```bash
npm run new-gallery -- "Küste im Oktober"
```

Das legt zwei Ordner an:
- `src/content/galleries/kueste-im-oktober/index.md`, die Vorlage mit allen Feldern
- `photos-source/kueste-im-oktober/`, für deine Originale

Optionen: `--unlisted` (private Kundengalerie, siehe Abschnitt 6), `--date 2026-10-22`, `--location "Sylt"`.

**Dann:**

1. Originale (JPG, TIFF oder PNG) nach `photos-source/kueste-im-oktober/` kopieren.
   RAW- und HEIC-Dateien bitte vorher als JPG oder TIFF exportieren, z. B. aus Lightroom.
2. Bilder optimieren:
   ```bash
   npm run optimize
   ```
   Für nur einen Ordner: `npm run optimize -- kueste-im-oktober`
3. In `index.md` die **Beschreibung** und für jedes Bild den **Alt-Text** ausfüllen.
   Neue Bilder trägt `optimize` automatisch mit leerem `alt: ""` ein.
4. `npm run dev` und ansehen.

### Was `npm run optimize` macht

- Lange Kante max. **2400 px**, sRGB, JPEG mit ca. 300–600 KB. Ist ein Bild zu groß, senkt das Skript die Qualität schrittweise.
- **Wasserzeichen** „© Jesko Dorner“ dezent unten rechts, nur auf den Web-Versionen.
- **EXIF** (Kamera, Objektiv, Blende, Belichtung, ISO, Brennweite, Datum) wird ausgelesen und für die Details in der Lightbox in `meta.json` gespeichert.
- **GPS-Daten werden entfernt.** In den Web-Versionen bleiben nur Copyright und Urheber.
- Wurde in Lightroom ein **Alt-Text** oder eine **Bildunterschrift** (IPTC/XMP) hinterlegt, übernimmt das Skript beides automatisch.
- Bereits verarbeitete Bilder werden übersprungen. `npm run optimize -- --force` erzeugt alles neu, z. B. nach einer Änderung am Wasserzeichen.

Einstellungen stehen in `photos.config.json`:

| Feld | Bedeutung |
|---|---|
| `maxEdge` | lange Kante in Pixeln (Standard 2400) |
| `jpegQuality` / `minJpegQuality` / `targetMaxKB` | Qualität und Zielgröße |
| `keepGps` | `true` = GPS bleibt in den Web-Versionen (Standard: `false`) |
| `watermark.enabled` | Wasserzeichen an oder aus |
| `watermark.text`, `opacity`, `position`, `size` | Text, Deckkraft (0–1), `bottom-right` / `bottom-left` / `bottom-center`, Größe relativ zur Bildkante |

Nach jeder Änderung `npm run optimize -- --force` ausführen.

**Beim Build** erzeugt Astro aus jeder Web-Version AVIF- und WebP-Dateien in 5 Breiten (480–2400 px) mit Blur-Platzhalter
und festen Seitenverhältnissen, damit beim Laden nichts springt.

---

## 5. Felder einer Galerie

`src/content/galleries/<ordner>/index.md`, die Felder stehen im Kopfbereich (YAML):

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `title` | ja | Titel |
| `slug` | ja | URL-Teil, z. B. `kueste-im-oktober` → `/galerien/kueste-im-oktober/` |
| `date` | ja | `2026-10-22`. Die Übersicht sortiert danach, neueste zuerst. |
| `location` | | Ort |
| `description` | ja | 1–2 Sätze für Kachel, Suchmaschinen und Link-Vorschau |
| `cover` | | Dateiname des Vorschaubilds. Es erscheint in der Galerie-Übersicht und im Portfolio, wenn dort kein `bild` angegeben ist. Ohne Angabe wird das erste Bild genommen. |
| `mappe` | | Nur für Alben im Portfolio: Fotos der Mappe (`/mappe/<slug>/`) als Liste von Dateinamen, z. B. `mappe: [a.jpg, b.jpg]`. Ohne Angabe: das Portfolio-Foto und bis zu 7 weitere, gleichmäßig über das Album verteilt. |
| `visibility` | | `public` (Standard) oder `unlisted` |
| `showExif` | | Aufnahmedaten in den Lightbox-Details zeigen (Standard `true`) |
| `downloadUrl` | | Link zum Download der ganzen Galerie (ZIP/Ordner) |
| `downloadSize` | | z. B. `1,2 GB` |
| `downloadFormat` | | z. B. `ZIP · JPG in voller Auflösung` |
| `downloadNote` | | Hinweiszeile, z. B. Nutzungsrechte, Gültigkeit, Passworthinweis |
| `albumRequest` | | Zeile „Ganzes Album anfordern“ unter den Fotos mit Knopf „Album anfordern“. Standard seit 22.11.2026: aus. `true` blendet ihn ein (z. B. CC DS-Kurs). Im CMS: Album → „Kasten „Ganzes Album anfordern“ zeigen“. Siehe Abschnitt 6. |
| `shareText` | | eigener Teilen-Text, `{title}` und `{url}` werden ersetzt |
| `images` | ja | Liste der Bilder (siehe unten) |

Pro Bild:

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `file` | ja | Dateiname in `images/` |
| `alt` | ja | Was ist zu sehen? Für Screenreader und Suchmaschinen. Ohne Alt-Text bricht der Build bewusst ab. |
| `caption` | | Bildunterschrift (in den Lightbox-Details) |
| `originalUrl` | | Link zum Original. Dann erscheint „Original herunterladen“. |
| `hero` | | wird nicht mehr verwendet (früher: großes Bild auf der Startseite). |
| `exif` | | überschreibt ausgelesene Werte, z. B. `exif: { lens: "Helios 44-2" }` |
| `focus` | | wichtigster Bildbereich, falls ein Foto doch einmal beschnitten wird (z. B. Film-Vorschaubilder), z. B. `focus: "50% 30%"` (waagerecht senkrecht). Standard: Mitte. In Alben werden Fotos nie beschnitten. |

Unterhalb des Kopfbereichs kannst du optional einen längeren Text in Markdown schreiben.

- **Reihenfolge** ändern: Einträge in `images:` umsortieren.
- **Bild entfernen:** Eintrag löschen und die Datei in `images/` löschen.

### So sieht ein Album aus

- **Album:** alle Fotos klein in gleich hohen Reihen wie in Lightroom, jedes unbeschnitten im Originalformat,
  jede Reihe füllt die Breite, auch die letzte. Die Reihen verteilt ein kleines Skript (`src/scripts/justify.ts`)
  über die ganze Liste, damit alle Reihen ähnlich hoch bleiben und keine Lücken entstehen. Nur ein Album mit
  sehr wenigen Fotos (z. B. ein einzelnes Hochformat) lässt rechts Platz, weil das Foto sonst höher als der
  Bildschirm würde. Kein Foto wird schmaler als eine Mindestbreite (`--min-w`, in `global.css` für Alben und in
  `galerien/index.astro` für die Galerie-Seite), ein Hochformat wird also nie winzig neben Querformaten.
  Ohne JavaScript übernimmt reines CSS (dann ist die letzte Reihe nicht gestreckt).
- **Klick auf ein Foto** öffnet es groß in der Lightbox, mit weißem Rand ringsum (auch auf dem Handy).
  Direkt über dem Foto stehen „← Vorheriges Bild“ und „Nächstes Bild →“ (nie auf dem Foto). Außerdem blättern per
  Wischen oder **←**/**→**, schließen per **Esc**. Oben eine einheitliche Leiste: Nummer, Details, Teilen, Zoom, Schließen.
- **Details** (i-Symbol oben oder Taste **I**): Albumtitel, „Bild 3 von 12“, Bildunterschrift (`caption`) und
  Aufnahmedaten (Kamera, Objektiv, Blende, Belichtung, ISO, Brennweite, Datum). Auf dem Handy klappen sie unten auf,
  am Desktop als Spalte rechts. Das Foto wird dabei kleiner und rückt zur Seite – die Details liegen nie über dem Foto.
  Offene Details bleiben für den Besuch offen.
- **Teilbare Bild-Links:** `/galerien/kueste-im-oktober/#bild-3` öffnet das Album direkt mit Foto 3 in der Lightbox.
  Die Nummer entspricht der Position in der Liste. Beim Umsortieren ändern sich die Nummern.
- Ohne JavaScript öffnet ein Klick das Foto selbst in groß.

**Seite „Galerie“ (`/galerien/`)** zeigt alle Galerien wie in Lightroom in gleich hohen, randvollen Reihen mit
Titelbild, darunter Name und Monat. Es gibt nur diese eine Ansicht.

**Titelbild eines Albums** (Galerie-Übersicht, Band oben auf der Albumseite, Vorschau beim Teilen): Ist das Album im
Portfolio, ist es seit 22.11.2026 **automatisch das Foto aus dem Portfolio** (Feld `bild` in `startseite.md`) – es
geht vor `cover:` in index.md (`src/lib/galleries.ts`). Sonst `cover:` oder das erste Foto. Den Ausschnitt im
breiten Band bestimmt `focus` am Foto (bei Hochformaten ohne Angabe das obere Drittel); der graue Filter darüber
richtet sich nach der Helligkeit des Fotos, damit dunkle Nachtfotos nicht schwarz werden.

---

## 6. Bildübergabe: Downloads und Unlisted-Galerien

### Ehrlich vorweg: Was diese Seite schützen kann und was nicht

- Die Seite ist **statisch und öffentlich**. Wer einen Link kennt, kann ihn öffnen. Ein Direktlink ist **kein Zugriffsschutz**.
- Mit **GitHub Free** muss das Repository **öffentlich** sein. Dadurch kann jeder im Quellcode
  die Unlisted-Galerien finden, inklusive ihrer Web-Bilder und **Download-Links**.
- „Unlisted“ heißt also: nicht in der Übersicht, nicht in der Sitemap, `noindex` für Suchmaschinen, kein Referrer an fremde Seiten.
  Das schützt vor Zufallsfunden, **nicht vor gezieltem Suchen**.
- **Für sensible oder kostenpflichtige Bilder muss der Download-Link selbst geschützt sein**, mit Passwort und/oder Ablaufdatum
  beim Speicheranbieter. Das Passwort schickst du separat, z. B. per Nachricht, und schreibst es nie auf die Website.
- Mehr Privatsphäre bietet ein privates Repository. Das geht nur mit GitHub Pro (kostenpflichtig). Die Website selbst bleibt auch dann öffentlich.

### Welcher Speicher für die Originale?

Die Website braucht nur einen Link. Den Anbieter kannst du also jederzeit wechseln.
Preise geprüft am 26.10.2026 auf den Seiten der Anbieter, inkl. MwSt. Bitte vor der Entscheidung selbst nachsehen:

| Anbieter | Gratis | Günstigster passender Tarif | Passwort / Ablauf | Originale | Server |
|---|---|---|---|---|---|
| **Pixieset** | 3 GB | Basic ca. 8 $/Monat (jährlich), 10 GB | Galerie-Passwort **und** 4-stellige Download-PIN, Ablauf | gratis nur bis 3600 px lange Kante | nicht angegeben |
| **ente** | 10 GB | 50 GB für 2,49 $/Monat | Passwort, Ablauf, Download an/aus | ja | EU (Amsterdam, Frankfurt, Paris), Ende-zu-Ende-verschlüsselt |
| **Proton Drive** | 5 GB | 200 GB für 4,99 €/Monat | Passwort, Ablauf | ja, ohne Konto | Schweiz/Deutschland/Norwegen, verschlüsselt |
| **Hetzner Storage Share** (Nextcloud) | – | 1 TB für ca. 5,11 €/Monat, monatlich kündbar | Passwort, Ablauf, „Download verbergen“ | ja, Ordner als ZIP | Deutschland |
| **SwissTransfer** | bis 50 GB pro Versand, max. 30 Tage | – | Passwort, Download-Limit | ja, als ZIP | Schweiz |
| Google Drive | 15 GB | – | ❌ keine Link-Passwörter | ja | – |
| Dropbox Plus | 2 GB | Plus hat **keine** Link-Passwörter, erst „Standard“ | – | ja | – |

**Empfehlung:**
- **Zum Start: Pixieset Free.** Galerie-Passwort plus Download-PIN passt genau zu „Album anfordern“, und es ist gratis.
  Grenzen: 3 GB, Downloads gratis nur bis 3600 px. Volle Originale gibt es ab Basic (ca. 96 $/Jahr). Wo die Server stehen,
  gibt Pixieset nicht an.
- **Datenschutz zuerst: ente.** 10 GB gratis, Server in der EU, verschlüsselt, Links mit Passwort und Ablauf.
- **Wenn es viel wird: Hetzner Storage Share.** Rund 5 €/Monat für 1 TB in Deutschland, Nextcloud-Links mit Passwort und Ablauf.
- **Einzelne Übergaben: SwissTransfer.**
- **Nicht geeignet für Codes:** Google Drive und Dropbox Plus, denn dort gibt es keine Link-Passwörter.

### Links erzeugen

**Google Drive**
- Ordner: Rechtsklick → *Teilen* → *Allgemeiner Zugriff: Jeder mit dem Link* → *Link kopieren*.
  Diesen Link als `downloadUrl` eintragen. Empfänger klicken dort auf *Alle herunterladen*.
  Google packt das als ZIP und teilt große Ordner in mehrere ZIPs auf.
- Einzelne Datei als direkter Download: Aus `https://drive.google.com/file/d/DATEI-ID/view` wird
  `https://drive.google.com/uc?export=download&id=DATEI-ID`.
- ⚠️ Freigabelinks laden **nicht** direkt herunter, sondern öffnen erst die Drive-Ansicht. Bei großen Dateien zeigt Google
  zusätzlich eine Warnseite („kann nicht auf Viren geprüft werden“), die man bestätigen muss. Das ist normal.

**Nextcloud**
- Datei oder Ordner → *Teilen* → *Link teilen* → in den Link-Einstellungen **Passwort** und **Ablaufdatum** setzen.
- Hängst du an den Link `/download` an (`https://…/s/AbCdEf/download`), startet direkt der Download. Ordner kommen als ZIP.
  Mit Passwort fragt Nextcloud vorher danach.

**Proton Drive**
- Datei oder Ordner → *Link teilen* → in den Einstellungen Passwort und Ablaufdatum setzen.

**Backblaze B2**
- Öffentlicher Bucket: Datei hochladen → *Friendly URL* kopieren (`https://f00X.backblazeb2.com/file/<bucket>/<datei>`).

### Eintragen

```yaml
downloadUrl: https://cloud.example.de/s/AbCdEf
downloadSize: 1,2 GB
downloadFormat: ZIP · 120 JPG in voller Auflösung
downloadNote: Link gültig bis 31.12.2026 – das Passwort bekommst du separat. Nutzung nur privat.
images:
  - file: bild-01.jpg
    alt: …
    originalUrl: https://cloud.example.de/s/XyZ123/download
```

Ohne `downloadUrl` bzw. `originalUrl` erscheint kein Download-Button. Alle Download-Links öffnen in einem neuen Tab
mit `rel="noopener noreferrer"`.

### „Ganzes Album anfordern“

Nur auf Galerien mit `albumRequest: true` (seit 22.11.2026 Standard: aus) steht unter den Fotos, bewusst ruhig, **„Ganzes Album anfordern“**
(rechts daneben „Album teilen“ mit kleinen Symbolen):
„Hier siehst du eine Auswahl. Das ganze Album in voller Auflösung schicke ich dir gern als Link – schreib mir dafür
kurz.“

- **Album anfordern** öffnet eine vorformulierte E-Mail an dich (Betreff „Anfrage: ganzes Album „…““) mit der Bitte,
  kurz zu schreiben, wer man ist und wofür man die Fotos braucht. Du antwortest mit einem Link zum Album (bis
  November 2026 hieß der Knopf „Code anfordern“ und es ging um einen Zugangscode).
- Mit eingerichteten **HQ-Alben** (siehe unten) steht darunter „Code erhalten? Album öffnen →“ und führt zu
  jeskodorner.de/album. Der Code ist dann der Code aus `npm run album`.
- Ist stattdessen `downloadUrl` eingetragen, erscheint **Album öffnen** und führt zu einem externen Anbieter, der nach
  dem Passwort fragt. Das Passwort ist dann der „Code“.

So pflegst du das pro Album mit einem externen Anbieter (mit HQ-Alben siehe nächster Abschnitt):

1. Originale beim Anbieter hochladen (ein Ordner pro Album).
2. Freigabelink mit **Passwort** erstellen, optional mit Ablaufdatum. Das Passwort ist der Code.
3. Den Link als `downloadUrl` in die `index.md` der Galerie eintragen. **Das Passwort niemals eintragen**,
   denn das Repository ist öffentlich.
4. Kommt eine Anfrage per E-Mail: prüfen (z. B. ob die Person auf den Fotos ist) und den Code als Antwort schicken.
5. Zugang entziehen: beim Anbieter das Passwort ändern oder den Link löschen. Auf der Website musst du nichts ändern,
   solange der Link gleich bleibt.

Ohne `downloadUrl` gibt es nur „Album anfordern“. Dann schickst du den Link (und falls nötig das Passwort) per E-Mail.
Mit `albumRequest: false` verschwindet die Zeile für diese Galerie.
Private Kundengalerien mit `downloadUrl` zeigen stattdessen oben den Download-Kasten, weil Kunden genau danach suchen.

### HQ-Alben mit Zugangscode (eigene Albumseite, empfohlen)

Ganze Alben in voller Auflösung, direkt auf deiner Website: Kunden öffnen **jeskodorner.de/album**, geben den Code ein
und sehen alle Fotos (gleiche Reihen und Lightbox wie auf der Seite). Sie können jedes Original einzeln oder alle auf
einmal herunterladen: Chrome und Edge am Computer speichern in einen Ordner, andere Browser als ZIP (bis 2 GB).

**Sicherheit:** Die Fotos werden auf deinem Mac verschlüsselt (AES-256), bevor sie hochgeladen werden. Der Code ist
der Schlüssel. Ohne ihn sind die Dateien bei Cloudflare unlesbar, auch die Dateinamen. Der Code steht nirgends im
Projekt, nur lokal in `alben.local.json` (nicht im Git, bitte sichern). Ist die Datei weg, kannst du für bestehende
Alben keinen neuen Code mehr vergeben und lädst sie einfach neu hoch.

**Kosten:** Cloudflare R2 ist bis 10 GB Speicher kostenlos, Downloads kosten nichts. Für R2 verlangt Cloudflare nach
meinem Stand eine hinterlegte Zahlungsart, auch wenn du unter 10 GB bleibst.

**Einmalig einrichten (ca. 15 Minuten):**

1. Auf **dash.cloudflare.com** ein kostenloses Konto anlegen, links **R2 Object Storage** öffnen und aktivieren.
2. **Create bucket**, Name z. B. `jeskodorner-alben`.
3. Im Bucket **Settings → Public Development URL → Enable**. Die Adresse (`https://pub-….r2.dev`) kopieren.
4. In R2 **Manage API tokens → Create API token**: Berechtigung **Object Read & Write**, nur für diesen Bucket.
   Angezeigt werden **Access Key ID**, **Secret Access Key** und die **Account ID** (steht auch in der Endpunkt-Adresse
   `https://<account-id>.r2.cloudflarestorage.com`). Den Secret siehst du nur einmal.
5. Im Projektordner eine Datei **`.env`** anlegen (sie ist vom Git ausgeschlossen):
   ```
   R2_ACCOUNT_ID=…
   R2_ACCESS_KEY_ID=…
   R2_SECRET_ACCESS_KEY=…
   R2_BUCKET=jeskodorner-alben
   ```
6. `npm run album -- einrichten`. Das prüft die Verbindung und erlaubt deiner Website den Zugriff (CORS).
7. Die r2.dev-Adresse aus Schritt 3 in `src/config/site.ts` bei `hqAlbums.baseUrl` eintragen und pushen.
   Ab dann zeigt die Seite /album/ das Codefeld, und unter jedem Album steht „Code erhalten? Album öffnen →“.

**Pro Album:**

```
npm run album -- hochladen ~/Desktop/Hochzeit-Lena --titel "Hochzeit Lena & Tom"
```

Das Skript verkleinert Vorschau und Ansicht, lädt die Originale unverändert hoch und gibt dir am Ende den **Code** aus,
z. B. `K7QM-4XPA-9TRW`. Schick dem Kunden den Link `https://jeskodorner.de/album/` und den Code. Groß- und
Kleinschreibung, Leerzeichen und Bindestriche sind beim Eintippen egal.

| Befehl | Was er tut |
|---|---|
| `npm run album -- liste` | alle Alben mit Datum, Größe und Code |
| `npm run album -- neuer-code 2` | neuer Code für Album Nr. 2, der alte gilt sofort nicht mehr (z. B. wenn er weitergegeben wurde) |
| `npm run album -- loeschen 2` | Album Nr. 2 bei Cloudflare löschen (spart Speicher) |

Hinweis: Cloudflare sieht die r2.dev-Adresse eher für kleine Nutzung vor. Für ein paar Kundenalben reicht sie. Wird es
viel mehr, kann der Bucket eine eigene Adresse wie `alben.jeskodorner.de` bekommen. Dafür müsste die Domain-Verwaltung
(DNS) zu Cloudflare umziehen.

### Kundengalerie (unlisted) anlegen

```bash
npm run new-gallery -- "Hochzeit Lena & Tom" --unlisted
```

Das erzeugt einen Slug mit zufälligem Anteil, z. B. `/g/hochzeit-lena-und-tom-x7k2p9/`.
Der Build verweigert Unlisted-Galerien ohne Zufallsanteil. Auf der Galerieseite gibt es **Link kopieren**,
**Teilen** (auf dem Handy), **WhatsApp** und **E-Mail** mit vorformuliertem Text. Unlisted-Galerien
haben keine Vor/Zurück-Navigation zu anderen Galerien und werden nicht von der Statistik erfasst.

---

## 7. Bewegung beim Scrollen

Alle Effekte sind reines CSS, ohne JavaScript, und laufen flüssig:

- **Parallax:** Beschnittene Fotos (Film, Porträt) gleiten in ihrem Rahmen etwas langsamer als die Seite. Galerie-Fotos bewegen sich nicht, damit nichts beschnitten wird.
- **Weitere Effekte:** Texte steigen auf, und der Header wird kompakt. (Den Fortschrittsbalken oben in den Alben gibt es nicht mehr.)

**Browser:** Chrome, Edge, Brave und Safari (ab Version 26) zeigen die Scroll-Bewegung. Firefox hatte diese Technik
nach meinem Stand noch nicht standardmäßig aktiviert. Dort erscheint die Seite vollständig, nur ohne Scroll-Bewegung.
Wer im System „Bewegung reduzieren“ eingestellt hat, bekommt bewusst eine ruhige Seite.

Die Stärke der Effekte steht in `src/styles/motion.css`, z. B. `--px-scale` und `--px-from`/`--px-to` für Parallax.

## 8. Optionale Funktionen

Alles in `src/config/site.ts`:

**Kontaktformular (Formspree o. Ä.)**: GitHub Pages kann selbst keine Formulare verarbeiten, dafür braucht es einen externen Dienst.
1. Bei [formspree.io](https://formspree.io) ein Konto und ein Formular anlegen. Der Gratis-Tarif erlaubt nach meinem Stand etwa 50 Nachrichten pro Monat.
2. Den Endpoint eintragen: `contactForm: { endpoint: 'https://formspree.io/f/abcdwxyz' }`.
3. Das Formular erscheint dann auf `/kontakt/`. In der Datenschutzerklärung erscheint automatisch ein Abschnitt dazu, den du rechtlich prüfen musst.
   Formspree sitzt in den USA.

**Statistik mit GoatCounter (cookielos)**
Seit 20.11.2026 aktiv mit dem Code `jeskodorner` (Auswertung auf https://jeskodorner.goatcounter.com).
1. Bei [goatcounter.com](https://www.goatcounter.com) einen Zugang anlegen, z. B. mit dem Code `jeskodorner`.
2. Eintragen in `src/config/site.ts`: `analytics: { goatcounter: 'jeskodorner' }`.
3. Das Skript wird nur auf öffentlichen Seiten geladen, nicht auf Unlisted-Galerien. Die Datenschutzerklärung bekommt automatisch einen Abschnitt.
   Hinweis: Der gehostete Dienst ist laut GoatCounter für nicht-kommerzielle Nutzung kostenlos.
   Wenn du über die Seite Aufträge akquirierst, prüfe bitte die Bedingungen.



**Wasserzeichen aus:** In `photos.config.json` `"watermark": { "enabled": false, … }` setzen, dann `npm run optimize -- --force`.

---

## 9. Deployment auf GitHub Pages

Die Adresse einer GitHub-Pages-Seite ist immer `<kontoname>.github.io`. Das Konto heißt **jeskodorner**,
das Repository muss deshalb exakt **`jeskodorner.github.io`** heißen. Eine Organisation brauchst du nicht.

### Einmalig einrichten (mit GitHub Desktop, ca. 10 Minuten)

1. **GitHub Desktop** öffnen und unter *Einstellungen → Accounts* prüfen, dass du als **jeskodorner** angemeldet bist.
2. *File → Add Local Repository…* → Projektordner „Website Jesko Dorner“ wählen → *Add Repository*.
3. Oben auf **„Publish repository“** klicken:
   - Name: **`jeskodorner.github.io`**
   - Haken bei **„Keep this code private“ entfernen**. GitHub Pages braucht im kostenlosen Tarif ein öffentliches Repo.
   - Organization: **None**
   - *Publish Repository*
4. Auf github.com/jeskodorner/jeskodorner.github.io: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
5. **Actions** → „Deploy auf GitHub Pages“ → **Run workflow** → *Run workflow*.
   Der erste automatische Lauf direkt nach dem Veröffentlichen kann fehlschlagen, weil Pages da noch nicht eingeschaltet war. Das ist normal.
6. Nach 2–5 Minuten ist der Lauf grün und die Seite unter **https://jeskodorner.github.io** erreichbar.

### Änderungen veröffentlichen

**Jeder Push auf `main` veröffentlicht automatisch.** In GitHub Desktop:
1. Links erscheinen die geänderten Dateien. Unten eine kurze Beschreibung eintragen, z. B. „Neue Galerie: Küste im Oktober“ → **Commit to main**.
2. Oben **Push origin** klicken.

Oder im Terminal:

```bash
git add -A
```

```bash
git commit -m "Neue Galerie: Küste im Oktober"
```

```bash
git push
```

Der Workflow (`.github/workflows/deploy.yml`) prüft vor dem Veröffentlichen Typen, Inhalte, Links und Unlisted-Regeln.
Schlägt etwas fehl, bleibt die alte Version online, und unter *Actions* steht der Grund.

### Alternative: ohne GitHub Desktop (Terminal)

```bash
brew install gh
```

```bash
gh auth login
```

```bash
gh repo create jeskodorner/jeskodorner.github.io --public --source . --push
```

Danach weiter mit Schritt 4 und 5 von oben.

### Eigene Domain: jeskodorner.de

**Eingerichtet am 06.11.2026.** Die Domain liegt bei **Infomaniak**, die Seite weiter kostenlos bei GitHub Pages (mit HTTPS).
Falls du das je neu einrichten oder umziehen musst:

- **DNS bei Infomaniak** (Manager → Web & Domain → Domains → jeskodorner.de → DNS-Zone). Quelle leer = die Domain selbst:

  | Typ | Quelle | Ziel |
  |---|---|---|
  | A (4×) | *(leer)* | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
  | AAAA (4×) | *(leer)* | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
  | CNAME | `www` | `jeskodorner.github.io` |
  | TXT | `_github-pages-challenge-jeskodorner` | Code aus GitHub (Bestätigung der Domain) |

  Beim zweiten A- bzw. AAAA-Eintrag fragt Infomaniak „Replace“ oder „Add … in addition“: immer **in addition** wählen.
  Die übrigen Einträge (MX, SPF, DMARC, autoconfig, autodiscover, SRV) gehören zum E-Mail-Postfach und bleiben.
- **GitHub, Konto:** Profilbild → *Settings → Pages → Verified domains* → Domain bestätigen (TXT-Eintrag oben).
- **GitHub, Projekt:** *Settings → Pages → Custom domain* `jeskodorner.de` → *Enforce HTTPS* anhaken.
- **Im Projekt:** `url` in `src/config/site.ts` und `site` in `astro.config.mjs` zeigen auf `https://jeskodorner.de`
  (sonst stimmen Sitemap, Teilen-Links und Vorschaubilder für Social Media nicht).
- **Nach Änderungen** dauert es Minuten bis Stunden, bis alle Internetanschlüsse die neuen Einträge kennen.
  Hat ein Netz sich vorher „gibt es nicht“ gemerkt, kann es dort bis zu einer Stunde länger dauern.

---

## 10. Grenzen von GitHub Pages

| Grenze | Wert | Was das für dich heißt |
|---|---|---|
| Größe der veröffentlichten Seite | max. 1 GB | Pro Bild entstehen geschätzt 1,2–1,6 MB (alle Größen und Formate). Das reicht für grob **600–800 Bilder**. Den echten Wert zeigt `npm run check-links` nach jedem Build. |
| Repository | empfohlen < 1 GB | Nur Web-Versionen liegen im Repo, niemals Originale. `photos-source/` ist ausgeschlossen. |
| Bandbreite | ca. 100 GB/Monat (weiche Grenze) | Große Downloads gehören deshalb zum externen Anbieter. |
| Einzeldatei | max. 100 MB | wird durch die Web-Versionen nie erreicht |

`npm run optimize` zeigt die Gesamtgröße der Web-Versionen an. `npm run check-links` meldet die Größe der fertigen Seite.

**Ladezeit (November 2026 optimiert, ohne Änderung am Aussehen).** Gemessen wie Google PageSpeed „Handy“ (langsames
4G, gedrosselte CPU) wurde der Speed Index 1,4- bis 2,3-mal schneller, der erste sichtbare Inhalt kommt etwa doppelt
so früh. Was dafür sorgt – bitte beibehalten:
- **Stylesheets stehen direkt in jeder Seite** (`inlineStylesheets: 'always'` in `astro.config.mjs`): kein eigener Abruf
  vor dem ersten Bild.
- **Wichtigstes Bild im Kopf angekündigt** (`preload` an `BaseLayout`, erzeugt mit `preloadImage` aus `src/lib/images.ts`):
  Startseite, Portfolio, Galerie, Über mich. Die `sizes`-Angaben dafür stehen in `src/lib/sizes.ts`, damit Bild und
  Ankündigung genau gleich sind (sonst lädt der Browser doppelt).
- **Schriften:** Migha Black (Name, gut 20 KB) und Melodrama (Titel, 40 KB als WOFF2) werden vorab geladen.
  Melodrama darf laut Lizenz nicht verkleinert oder umgewandelt werden – die Datei bleibt so, wie Fontshare sie
  liefert.
- **Startseite:** Nur das erste Foto lädt sofort, die übrigen eine Sekunde nach dem Laden der Seite.
- **Fotoreihen sofort fertig:** Die Reihen in Alben und Galerie werden direkt nach der Liste im HTML verteilt
  (`JustifyNow.astro`, Rechnung in `src/scripts/justify-layout.js`) statt erst nach dem Skript.
- **Kleinste Bildgröße 320 px** (`WIDTHS` in `src/lib/images.ts`): Kacheln am Handy laden etwa halb so viele Daten.
- **Nur sichtbare Bilder zuerst:** Erstes Portfolio-Foto, erste 4 Galerie-Kacheln und erste Album-Kacheln laden sofort,
  der Rest erst beim Scrollen.

---

## 11. Design: Farben und Schriften

Vier Farben, sonst nichts (seit 20. November 2026). Definiert in `src/styles/tokens.css`:

| Farbe | Hex | Rolle |
|---|---|---|
| Dark Blue | `#1A0089` | Schrift überall (statt Schwarz), Bühne: Startseite und Menü; Links (unterstrichen), Fokusrahmen, Vorschaukarten. Als Fläche sonst nirgends (seit 20.11.2026: Knöpfe, Abspielen, Fußzeile waren blau – zu viel Blau) |
| White Chocolate | `#EFE7D3` | Wände: Hintergrund aller Seiten; Schrift auf Dark Blue; Grund des Browser-Symbols |
| Portland Orange | `#E8481F` | „J“ im Browser-Symbol. „hier kannst du klicken“: volle Knöpfe (Ganzes Album ansehen, Schreib mir, Senden; beim Überfahren blau), Überfahren als Fläche – immer mit heller Schrift (White Chocolate), Unterstrich beim Überfahren von Titeln. Einen Hauch tiefer als im Palettenbild (`#FF5E33`), damit helle Schrift darauf lesbar ist; blaue Schrift auf Orange mochte Jesko nicht |
| June Bud | `#B7CF4F` | Fußzeile (blaue Schrift, blauer Name; seit 22.11.2026 wieder), „Link kopiert“. Über Album und Film gibt es kein Farbband mehr: Die Albumseite zeigt oben das Vorschaubild, die Filmseite den Player. Verlauf der Fußzeile: 20.11. June Bud → 21.11. beige, kurz orange, beige mit orangem Namen → 22.11. wieder June Bud (Git-Tags `alte-version-fusszeile-…`) |

Dazu nur dunklere Stufen von White Chocolate für Platzhalter und Kästen (`--wall-2`, `--wall-3`). Es gibt bewusst nur
eine helle Ansicht und keinen Dunkelmodus. Vorher (bis 20.11.2026): weiße Wände, schwarze Schrift, Ultramarin
`#3A45C8` als Bühne, Koralle `#FF807F` fürs Überfahren, schwarze Fußzeile und für jedes Album ein Ton aus seinen
Fotos – Git-Tag `alte-version-ultramarin-climate-crisis`.

- **Fotos werden nie beschnitten**: in Alben, Übersichten und der Lightbox immer im Originalformat, groß mit hellem
  Rand. Nichts ist schräg gestellt. Mutig sind Farben und Schrift, nicht die Anordnung.
- **Farbflächen** (`color:` in `index.md` eines Albums oder bei einem Film): `blue | orange | green | cream` (Klassen
  `c-blue` … in `tokens.css`). Ohne Angabe bekommt jedes Album ein helles Grau (`cream`). Bei Filmen ist es die Farbe der
  Vorschau ohne Standbild.
- **Links und Überfahren:** Links sind blau wie der Text und unterstrichen (Token `--accent`). Beim Überfahren
  überall dieselbe Antwort wie im Menü: ein oranges Feld mit heller Schrift (Token `--hover`, Schrift `--on-hover`) – Links im Text,
  Knöpfe, Knöpfe der Lightbox, Kontakt-Adressen, auch in der Fußzeile. Was schon orange ist (volle
  Knöpfe, Abspielen, Menü- und Schließen-Knopf), wird beim Überfahren blau. Bewusst dezenter: Titel neben Fotos (Galerie-Übersicht, Film-Übersicht, Schilder im Portfolio, nächstes/vorheriges Album) bekommen nur einen
  Unterstrich in Orange (Token `--hover-line`).
- **Startseite = das Menü** (`src/components/BlueMenu.astro`): Dark Blue `#1A0089` mit Schrift in White Chocolate
  (Token `--menu-bg` und `--on-menu` in `tokens.css`). Der Name hat die
  Schriftfarbe (`--name-color` in `BlueMenu.astro`), der Menüpunkt der aktuellen Seite ist unterstrichen. Beim Überfahren bekommen
  Menüpunkte ein oranges Feld mit heller Schrift, der Name im Menü ein oranges Feld gleichmäßig um beide Zeilen (nur mit Maus – am Handy blieb es beim Antippen stehen und schnitt beim Übergang in „DORNER“), Menü- und Schließen-Knopf sind orange Kreise. Instagram
  unten wie in der Fußzeile jeder Seite mit Symbol und „jeskodorner“, aber klein (etwa so groß wie das Datum unter dem Foto; beim Überfahren orange). Sparsam bleiben: mehr Orange wirkt schnell zu viel. Die Fläche geht über den ganzen
  Bildschirm, oben groß der Name, darunter die Menüpunkte (Portfolio, Galerie, Film, Über mich, Kontakt), unten
  nur Instagram – auf der Startseite und im Menü gleich. Impressum und Datenschutz stehen in der Fußzeile jeder
  Unterseite (von der Startseite aus also mit zwei Klicks). Ohne Kopfleiste und ohne Scrollen. Am Handy und
  Tablet öffnet sich dasselbe Menü über den Menü-Knopf oben rechts (dunkelbeiges Quadrat, seit 22.11.2026; vorher oranger Kreis): Die Fläche wächst als Kreis aus dem Knopf, der Schließen-Knopf sitzt an derselben Stelle,
  der Name führt zur Startseite. **Am Laptop (ab 1000 px) klassisch** (seit 20.11.2026): die fünf Bereiche als
  Wörter rechts in der Kopfleiste (Titelschrift, Großbuchstaben), der aktuelle unterstrichen, Überfahren oranges
  Feld; kein Menüknopf (`Header.astro`, `.nav-desktop`).
  Das Menü ist die Startseite ohne Foto: Name und Menüpunkte stehen an derselben Stelle und sind gleich groß
  (Laptop ab 1000 px: Name zweizeilig oben links, Menüpunkte unten links, rechts Blau; darunter wie am Handy: Name
  mittig, die Menüpunkte beginnen an seiner linken Kante, Instagram mittig unten). Der Schließen-Knopf sitzt genau
  dort, wo der Menüknopf war (Regeln mit `:is(.bm--aside, .bm--overlay)` in `BlueMenu.astro`).
- **Startseite „Bild neben Name“** (seit 16. November 2026, `src/components/HomeSlides.astro` und `BlueMenu.astro`):
  Schrift steht nie auf dem Foto. Am Laptop (ab 1000 px) zwei Spalten: links auf Blau der Name zweizeilig, unten
  das Menü (etwa halb so groß wie der Name) und Instagram; rechts ein Foto aus dem Portfolio in einer festen Fläche
  im Format 4:3. Seit 22.11.2026 steht das Foto senkrecht mittig, „jeskodorner“ (Instagram) direkt mittig darunter,
  und die Grundlinie von „KONTAKT“ liegt auf der Unterkante des Fotos. Im Menü auf Unterseiten steht das Menü
  senkrecht mittig zwischen Name und Instagram. Vorher lagen Menü und Fotounterkante unten auf einer Linie (Tag
  `alte-version-menue-unten`). Seit 22.11.2026 gibt es keine Bildunterschrift mehr – weder am Laptop noch am Handy
  (vorher: „Albumname – Monat Jahr“ unter dem Foto, Stand im Tag `alte-version-startseite-bildunterschrift`).
  Jedes Foto füllt diese Fläche (Ausschnitt nach dem
  Bildschwerpunkt), so wechselt beim Bildwechsel nie das Format; ganz zu sehen sind die Fotos im Portfolio. Am Handy
  und Tablet hochkant steht das Foto ganz oben, randlos, darunter Name (eine Zeile), Menü,
  Instagram – ohne Scrollen, auch auf kleinen Handys. Das Foto hat dort Vorrang (30–45 % der Höhe, höchstens 4:3).
  Das Foto führt ins Portfolio genau zu diesem Foto (`/portfolio/#werk-<n>`).
  Die Fotos wechseln alle 7 Sekunden in der Reihenfolge des Portfolios (nach Datum, das neueste zuerst): Das neue Foto blendet in 1,8 Sekunden
  weich über dem alten ein und setzt sich dabei langsam aus einer leichten Vergrößerung; das alte bleibt darunter
  stehen, bis das neue ganz da ist (nie eine leere Fläche dazwischen). Ein Foto erscheint erst fertig geladen. Kommt
  man aus einer Mappe (oder einer anderen Seite) zurück, geht es mit dem Foto weiter, das zuletzt zu sehen war
  (gemerkt im Tab, `sessionStorage`); erst ein neuer Besuch beginnt wieder vorne. Mit „Bewegung reduzieren“ oder
  ohne JavaScript bleibt das erste Foto stehen.
- **Albumseite** (`src/components/GalleryPage.astro`): oben seit 22.11.2026 ein Band mit dem **Vorschaubild der
  Galerie als Hintergrund** (beschnitten, Ausschnitt nach `focus`) und einem dunklen grauen Filter darüber, der nach
  unten dichter wird (Jeskos Wahl „dunkel, farbig“; verglichen mit hell/schwarzweiß und dunkel/schwarzweiß). Darauf
  „← Zurück“, Monat, Titel und Beschreibung in heller Schrift. Darunter die Fotos. Vorher ein kompaktes Band in June
  Bud nur mit Text (Git-Tag `alte-version-album-band`); die Fußzeile ist dafür wieder grün. Der Titel ist kleiner als
  auf den Hauptseiten. Vorher (bis 20.11.2026) war der Titel so groß wie „Galerie“, die
  Beschreibung stand groß darunter, und am Laptop sah man bei langen Titeln nur die Überschrift.
- **Mappe** (`src/pages/mappe/[slug].astro`, Auswahl in `src/lib/mappe.ts`): je Album aus dem Portfolio eine ruhige
  Übersicht wie eine aufgeschlagene Fotomappe, einfacher als das Album. Kopf kompakt wie auf der Albumseite (Titel
  mit `display-compact`, `global.css`), damit die Fotos beim Öffnen sofort zu sehen sind. Erreichbar nur über das Portfolio (Foto oder
  Schild). Oben „← Zurück“ (führt dorthin zurück, wo man herkam, samt Stelle auf
  der Seite; ohne Vorgeschichte zur Startseite), Titel und Monat linksbündig wie auf allen Seiten. Darunter die Fotos
  seit 22.11.2026 wie auf der Galerie-Seite: gleich hohe, randvolle Reihen, jedes Foto im Originalformat, ohne
  Schatten und ohne Text, mit schmalen Abständen (dieselbe Rechnung wie dort, `justify-layout.js`, gleiche
  Reihenhöhe). Vorher gleich große Felder in Spalten mit je einem Abzug mit Schatten (Git-Tag
  `alte-version-mappe-felder`). Gibt es einen eigenen Film zum Album (Dollgow), läuft er oben über die volle Breite
  in Schleife, darunter die Fotos. Mappen mit nur zwei oder drei Fotos zeigen sie am Handy größer (eins pro Reihe).
  Fotos: das Foto aus dem Portfolio steht seit 22.11.2026 nicht mehr vorne, sondern als letztes (man hat es gerade
  groß gesehen); dazu bis zu 7
  weitere gleichmäßig über das Album verteilt (oder genau die Fotos aus `mappe:` im Album). **Mappe und Album sind
  zwei getrennte Orte** (seit 22.11.2026): Ein Klick auf ein Foto öffnet die Großansicht nur mit den Fotos der Mappe
  und eigener Zählung („2 von 4“, `src/scripts/open-album.ts`); die einzige Verbindung ins Album ist unten „Ganzes
  Album ansehen →“ (keine Bildanzahl). Nummern in Jeskos Wünschen („Bild 3 raus“) beziehen sich je nach Ort auf die
  Mappe oder das Album – im Zweifel nachfragen. Vorher blätterte die Großansicht durchs ganze Album.
- **Frühere Startseite: Bildfeld mit Doppelbelichtung** (bis 16. November 2026, Git-Tag
  `alte-version-startseite-ueberblendung`, Datei `BlendLoop.astro`): Fotos aus dem Portfolio (Liste `showroom`),
  in normalen Farben im Modus „Aufhellen“ übereinandergelegt (wie eine Doppelbelichtung), immer 4:3. Es sind immer zwei zu sehen. Alle
  2,8 Sekunden blendet ein neues oben ein und das unterste verschwindet, so entstehen laufend neue Bilder (Reihenfolge
  bei jedem Besuch zufällig). Am Laptop (ab 700 px) füllt es den ganzen Bildschirm hinter Name und Menü;
  unten bleibt ein blauer Streifen (bündig links, rechts und unten) mit der Fußzeile. Die weiße Schrift hebt sich mit einem weichen Schatten ab, der sich dem Foto anpasst: Bei jedem
  Fotowechsel misst ein Skript (`initShadows` in `BlueMenu.astro`) die Fläche hinter jedem Wort – auf hellen Stellen
  wird der Schatten kräftig, auf dunklen kaum sichtbar, und er nimmt einen dunklen Ton aus dem Foto an. Die vorherige
  geteilte Fassung (Foto rechts, Kante zwischen R und N) liegt im Git-Tag `alte-version-laptop-geteilt`. Am Handy steht es ganz oben, randlos mit harten Kanten oben,
  links und rechts (4:3, auf niedrigen Bildschirmen etwas flacher, damit nichts scrollt), und läuft unten weich in
  den Namen aus: Das Foto endet mitten in „JESKO“, der Name ist ganz weiß und hat dort einen Schatten, der sich dem Foto
  anpasst (Verlauf: `--blend-mask` in `BlueMenu.astro`). Früher zeigten die Buchstaben im Foto das Negativ (Git-Verlauf). Früher lag das Foto am Handy unten, halb hinter „Kontakt“. Mit „Bewegung reduzieren“
  oder ohne JavaScript bleibt ein festes Paar stehen. Früher waren die Fotos invertiert (Negativ) und die Buchstaben
  zeigten sie positiv; zurückholen: in `BlendLoop.astro` bei `.blend-layer` wieder `filter: invert(1);` ergänzen. Die frühere Startseite liegt in der Git-Geschichte.
- **Ausprobierte Versionen (gemerkt):**
  - *Fotos im Bildfeld mit dem Blau eingefärbt* (Modus „Farbe“, 65 %). Im Git-Verlauf markiert als Tag
    `alte-version-blau-2b3bff`. Zurückholen: in `BlendLoop.astro` wieder ein
    `.blend::after { content: ''; position: absolute; inset: 0; background: var(--menu-bg); mix-blend-mode: color; opacity: 0.65; }`
    ergänzen.
  - *Andere Hintergründe* (Fotos nur invertiert): kräftiges Blau `#2B3BFF` (mit Grün als Akzent) und Blaugrün
    `#3D8AAE`. Ausprobieren: in `tokens.css` z. B. `--menu-bg: var(--blue);` setzen. Der grüne Akzent war `var(--lime)`
    statt `var(--pink)` in `BlueMenu.astro` und beim Menü-Knopf in `Header.astro`.
  - *Startseite weiß mit schwarzer Schrift* (November 2026, Name erst blau, dann schwarz, Links Mittelblau `#4273B0`):
    Git-Tag `alte-version-startseite-weiss`; in `tokens.css` `--menu-bg: #ffffff; --on-menu: #0b0b0b;` setzen.
  - *Startseite in Mittelblau `#4273B0` mit weißer Schrift* (kurz im November 2026): in `tokens.css`
    `--menu-bg: #4273b0; --on-menu: #ffffff;` setzen.
  - *Verblichene, kühle Palette* (kurz im November 2026, wirkte zu traurig): Schieferblau `#58677F` für Startseite
    und Links, Korallenrosa `#EF9D9F`, Aprikose `#ECAF80`, Salbei `#9AD4B4`, Taubenblau `#95B8DD`, Lavendel `#B9A6DD`,
    Hover-Orange `#E66330`, Nebentext `#5B616A`. Git-Tag `alte-version-verblichene-farben`.
  - *Knallige Galeriefarben* (bis November 2026): Blau `#2B3BFF` (weiße Schrift), Lime `#D4FF3A`, Orange `#FF5A1F`
    (auch fürs Überfahren), Violett `#7C5CFF`, Nebentext `#5C5C5C`. Im Git-Verlauf markiert als Tag
    `alte-version-knallige-galeriefarben`. Zurückholen: die Werte in `tokens.css` wieder eintragen (`--on-blue: #ffffff`).

Kontraste nach WCAG 2.x:

| Fläche | Schrift darauf | Kontrast |
|---|---|---|
| White Chocolate `#EFE7D3` | Dark Blue `#1A0089` / Nebentext `#55507A` | 12,1 : 1 / 6,1 : 1 |
| Dark Blue (Startseite, Menü) | White Chocolate | 12,1 : 1 |
| Dunkles Beige `#DDD2B8` (Knöpfe ohne eigene Farbe, Menü-Knopf, Knöpfe der Großansicht) | Dark Blue | 10 : 1 |
| Portland Orange `#E8481F` (Überfahren, volle Knöpfe) | White Chocolate | 3,2 : 1 – reicht für fette und große Schrift und Symbole, nicht für langen Text |
| June Bud `#B7CF4F` (Fußzeile) | Dark Blue / Text-Grau `#4B4672` | 8,6 : 1 / 5,0 : 1 |

Orange nie als Schriftfarbe auf White Chocolate (2,5 : 1), nur als Fläche oder Linie.

**Feinschliff-Regeln** (November 2026 einmal über die ganze Seite geprüft; bei neuen Seiten bitte beibehalten):

- **Keine Füll-Etiketten:** Ein Etikett steht nur da, wenn es etwas Neues sagt. „Video“ auf der Filmseite,
  „E-Mail“ über einer E-Mail-Adresse oder „Fehler 404“ über der Fehlerseite sind weg (für Screenreader bleiben
  die Bezeichnungen unsichtbar erhalten).
- **Keine Kursive in der Titelschrift:** Melodrama hat keinen kursiven Schnitt; „kursiv“ zeigt dieselben geraden
  Buchstaben (fonts.css), der Browser rechnet nichts schräg. Menüpunkte stehen in Großbuchstaben, Titel normal
  geschrieben. (In Migha waren die Menüpunkte außer „Portfolio“ und kleine Zwischenüberschriften kursiv.)
- **Gesperrte Großbuchstaben nur für Angaben:** Die Klasse `label` (klein, fett, gesperrt) ist für Angaben wie
  „September 2026“, Knöpfe und Rechtliches da, nicht für Überschriften.
- **Nur das Datum:** Unter Titeln steht überall nur Monat und Jahr – keine Anzahl der Fotos, kein Ort, kein
  Videotyp (Galerie, Album, Mappe, Portfolio, Film).
- **Text immer grau:** Einleitungen, Beschreibungen und Fließtext stehen in Grau (`--ink-soft`, Klassen `lead` und
  `prose`); Überschriften, Links, Etiketten und Knöpfe in Blau.
- **Tippflächen mindestens 44 px:** Knöpfe sind mindestens 44 px hoch (`btn--small`, Teilen-Knöpfe 44 × 44).
  Kleine Textlinks (Logo, Menüpunkte, Fußzeile, Kontakt) bekommen mit der Klasse `tap` eine unsichtbare Fläche um
  den Link; die Schrift bleibt gleich. Wo solche Links untereinander stehen, ist der Abstand so groß, dass sich
  die Flächen nicht überlappen (Fußzeile am Handy, Kontakt).
- **Fotos beim Überfahren:** überall gleich, 3 % größer im Rahmen (Token `--hover-zoom`): Album, Galerie, Portfolio.
- **Knöpfe sagen, was passiert:** Verb und Ding („Portfolio ansehen“, „Galerie ansehen“, „Album anfordern“,
  „Schreib mir“), keine Auslassungspunkte. Am Ende von Portfolio und Über mich steht dasselbe Paar (Klasse
  `btn-row`): „Schreib mir“ gefüllt, daneben der Weg weiter mit Pfeil; am Handy beide untereinander in voller Breite.
- **Zurück:** Album, Film und Mappe haben oben denselben Knopf „← Zurück“ (`src/scripts/back-link.ts`, Text in
  `de.ts` unter `back`). Er führt dorthin, wo man herkam, wie der Zurück-Knopf des Browsers, samt Stelle auf der
  Seite. Ohne Vorgeschichte (Link von außen) führt er im Album zur Stelle des Albums in der Übersicht
  (`/galerien/#album-…`), im Film zur Stelle des Films in der Film-Übersicht und in der Mappe zur Startseite. Bis
  21.11.2026 hieß er im Album „Alle Galerien“ und im Film „Alle Filme“ und führte immer zur Übersicht.
- **Erster Bildschirm sagt, worum es geht:** über die Fotos mit Bildunterschrift. Eine Zeile „Fotografie“ unter dem
  Namen gab es kurz, sie ist wieder weg.
- **Fotoreihen ohne Ruckeln:** Mit JavaScript erscheinen die Fotoreihen eines Albums erst, wenn `justify.ts` sie
  randvoll verteilt hat (sonst rückten sie nach dem ersten Bild einmal zur Seite); nach spätestens 1,5 s sind sie
  in jedem Fall sichtbar.
- **Ein System statt Einzelwerte:** Farben, Radien und Schriften kommen aus `src/styles/tokens.css`
  (`--radius` 4 px für Flächen und Felder, `--radius-pill` für Knöpfe).
- **Zwei Titelgrößen:** groß (`display-1`) auf den fünf Hauptseiten (Portfolio, Galerie, Film, Über mich, Kontakt)
  und der Fehlerseite; kompakt (`display-1 display-compact`) auf allen anderen: Album, Mappe, Film, Impressum,
  Datenschutz, Album öffnen. Zwischenüberschriften (`display-3`, z. B. „Stationen“) sind immer kleiner als der
  kompakte Titel. Abstand oben überall gleich (Klasse `head` in `global.css`).
- **Symbole aus einem Satz:** alle aus `Icon.astro` mit derselben Linienstärke, auch Pfeile (keine Pfeil-Zeichen
  aus der Schrift mehr).
- **Gruppen durch Abstand:** Was zusammengehört, steht enger (Titel und Datum), der nächste Block mit mehr Luft.
- **Überschriften umbrechen sauber:** nie mitten im Wort (die größte Überschrift ist am Handy so bemessen, dass
  auch „Einzelbilder“ oder „Ausstellung“ in eine Zeile passen, `--fs-h1`); ausgeglichene Zeilen; ein Gedankenstrich bleibt beim Wort davor
  (`tidyTitle` in `src/lib/text.ts`), Monat und Jahr werden nicht getrennt.
- **Optisch bündig:** Große Überschriften sind um 0,015 Schrifthöhen nach links gerückt, weil Serifenbuchstaben
  links Luft haben; Adressen und Rechtliches in der Fußzeile stehen auf einer Grundlinie.
- **Gleich breite Ziffern** überall, wo Zahlen untereinander stehen oder sich ändern (Etiketten, Jahreszahlen,
  Zähler in der Großansicht, Download-Fortschritt).
- **Ladezustände:** Die Startseite zeigt jedes Foto erst fertig geladen. Ein Video zeigt nach dem Klick „Lädt …“ mit drehendem Kreis über dem
  Vorschaubild, bis der Player da ist. Die Großansicht wird im Leerlauf vorgeladen und zeigt beim Blättern einen
  Ladekreis.
- **Menü und Großansicht bis ganz unten:** Beide sind oben und unten an den Bildschirmrand geheftet (nicht auf eine
  gemessene Höhe gesetzt) und haben darunter einen Streifen in ihrer Farbe. Klappen Safari oder Firefox am Handy
  ihre Leisten ein, scheint unten nie die Seite durch. Hinter der Großansicht lässt sich die Seite nicht scrollen.
- **Großansicht am Handy quer:** Das Foto bekommt fast die ganze Höhe; Knöpfe als Spalte rechts, Pfeile unten in
  den Ecken, Details als Spalte rechts (`isShort` in `src/scripts/lightbox.ts`, Media-Query am Ende von
  `src/styles/lightbox.css`).
- **Rückmeldung:** Knöpfe geben beim Drücken kurz nach; „Link kopieren“ wird für zwei Sekunden zum Haken.
- **Leicht abgerundet** (seit 22.11.2026): Knöpfe, Menü-Knopf, Knöpfe der Großansicht und am Video haben 10 px
  Rundung (`--radius-pill`), Kästen und Eingabefelder 6 px (`--radius`) – nicht mehr ganz rund wie vorher (Pillen
  und Kreise) und nicht kantig (kurz ausprobiert). Knöpfe ohne eigene Farbe („Zurück“, „Galerie ansehen“ …) haben
  keinen blauen Rahmen mehr, sondern eine dunkelbeige Fläche (`--field`); der Menü-Knopf ebenso (vorher orange).
  Volle Knöpfe bleiben orange. Vorher runde Knöpfe mit blauem Rahmen: Git-Tag `alte-version-runde-knoepfe`.
  Symbole in Knöpfen sind um ihren leeren Rand gekürzt (`.btn svg`), damit der Inhalt optisch mittig sitzt.
- **Fokusrahmen** folgt der Form des Elements.
- **Abschluss mit klarer Handlung:** Am Ende des Portfolios steht „Schreib mir“ als gefüllter Knopf, daneben der
  Weg zur Galerie.

**Vorschau beim Teilen** (WhatsApp, iMessage, Instagram, …) – *noch nicht fertig (Stand 20.11.2026), wird noch überarbeitet*: Jede Seite und jedes Album hat eine eigene
Vorschaukarte (1200 × 630 px), die beim Bauen automatisch entsteht (`src/lib/og.ts`, Dateien unter `/og/…`). Links ein
Feld in Dark Blue mit „JESKO DORNER“ (Migha Black) und dem Titel der Seite (Migha Display aus
`src/assets/fonts/migha-regular.otf`), rechts das Foto,
zugeschnitten auf seinen Bildschwerpunkt (Feld `focus` beim Bild; ohne Angabe bei Hochformaten etwas über der Mitte).
Startseite und Portfolio zeigen das erste Foto aus `showroom`, Galerie das neueste Album, Film das erste Standbild,
Über mich das Porträt, jedes Album sein Vorschaubild (`cover`). Kontakt, Impressum, Datenschutz und die Albumseite mit
Code bekommen eine Karte nur in Dark Blue. Der Titel beim Teilen enthält immer den Namen, z. B.
„Hilda – Setcard · Jesko Dorner“. Hinweis: Ein geteilter Link auf ein einzelnes Foto (`#bild-3`) zeigt die Karte des
Albums – mehr gibt eine statische Seite nicht her. WhatsApp und Co. merken sich alte Vorschauen eine Weile; neue
Karten erscheinen dort manchmal erst nach Tagen.

**Browser-Symbol** (Favicon): seit 21.11.2026 ein „J“ in Portland Orange aus Migha Black (der Schrift des Namens)
auf White Chocolate, ganz sichtbar und mittig nach seinem Umriss gesetzt, als `public/favicon.svg`, dazu
`public/favicon.ico` (32 px, für ältere Browser) und `public/apple-touch-icon.png` (180 px, Home-Bildschirm). Der
Buchstabe ist als Form gespeichert, damit er überall gleich aussieht. Vorher: „J“ aus der feineren Migha Display hell auf
Dark Blue (Git-Tag `alte-version-favicon-blau`) – Jesko wollte es nicht auch noch blau und ohne die elegante Schrift.
Verglichen und nicht gewählt: J und JD hell auf Orange, J und JD schlicht aus einfachen Formen gezeichnet.

**Schriften** (alle lokal, keine Google-Fonts-Verbindung, alle frei auch für geschäftliche Nutzung: Libre
Franklin unter SIL OFL, Migha laut Lizenz von Seniors Studio, Melodrama unter der ITF Free Font License – siehe
`src/assets/fonts/LIZENZ-melodrama.txt`). Bewusst keine
der Schriften, die auf sehr vielen KI-gebauten Seiten stehen (Inter, Geist, Space Grotesk, Instrument Serif,
Playfair, Fraunces …):
- **Migha Black** (seit 20.11.2026): der Name „JESKO DORNER“ – groß auf Startseite und Menü, klein als Logo oben
  links auf allen Unterseiten, als Schriftzug unten in der Fußzeile, auf den Vorschaukarten (Token `--font-name`,
  eigener Familienname `Migha Black`, damit kein Titel aus Versehen in Black erscheint). Kräftig und schmal als
  bewusster Gegenpol zu den feinen Titeln in Melodrama. Die Datei wird vorab
  geladen (`BaseHead.astro`), damit das Logo beim Seitenwechsel nie kurz in einer Ersatzschrift erscheint. Beim
  Wechsel Startseite → Unterseite gleitet der Name Wort für Wort ins Logo („JESKO“ und „DORNER“ einzeln,
  Übergangsnamen `jd-name-1`/`jd-name-2`), so wird er nur gleichmäßig kleiner und nie verzerrt. Hinweis zum Testen:
  Im lokalen `npm run preview` laufen die Seitenübergänge nicht, mit `npm run dev` und auf GitHub Pages schon.
  Größen (`BlueMenu.astro`): Laptop zweizeilig, „DORNER“ füllt die linke Spalte; Handy und Tablet einzeilig, knapp
  90 % der Breite (bis 20.11.2026 am Handy zweizeilig – dann blieb fürs Foto nur ein Streifen). Die Startseite passt
  ohne Scrollen auf einen Bildschirm, auch im Handy-Browser mit eingeblendeten Leisten (Rechnung bei `--frame-h` und
  `--name-fs`): Das Foto hat Vorrang (mindestens 30 % der Höhe); erst auf sehr kurzen Bildschirmen wird der Name
  kleiner. Das Menü ist gleich aufgebaut, der Name dort gleich groß.
  Vorher: Climate Crisis (sehr fett und breit, bis 20.11.2026, Git-Tag `alte-version-ultramarin-climate-crisis`),
  davor Instrument Serif mit von Hand ausgeglichenen Buchstabenpaaren (Werte bei `KERN` in `BlueMenu.astro`).
- **Melodrama** (seit 20.11.2026, Shaily Patel / Indian Type Foundry, über Fontshare): Titel, Menü (in
  Großbuchstaben), Kopfleiste, Schilder im Portfolio, Bild- und Filmtitel, Zwischenüberschriften, Titel auf den
  Vorschaukarten. Schmal, mit starkem Kontrast zwischen feinen und kräftigen Strichen, echte Kleinbuchstaben. Stärke
  Medium (500) aus der variablen Datei (300–700, `--display-wght` in `tokens.css`), keine Kursive. In `fonts.css`:
  `size-adjust: 120 %`, damit die Großbuchstaben so hoch sind wie vorher (0,838 der Schriftgröße), und
  `ascent-/descent-override`, damit die Schrift in ihrer Zeile genau wie vorher sitzt – so gelten alle Größen,
  Abstände und Grundlinien-Ausgleiche der Seite unverändert, und große Titel ragen mit g/p nicht in den Text darunter.
  Lizenz: frei auch geschäftlich, selbst hosten erlaubt; die Dateien dürfen aber nicht verändert (auch nicht
  verkleinert) oder weitergegeben werden. Die Vorschaukarten nutzen die feste Datei `melodrama-medium.otf`.
  Vorher: Cyrene (20.11.2026, Git-Tag `alte-version-cyrene-titel`), Migha Display Regular/Slant (20.11.2026,
  Git-Tag `alte-version-migha-titel`), Bodoni Moda (16.–20.11.2026, Git-Tag `alte-version-bodoni`), davor Instrument
  Serif und Anybody. Verglichen und nicht gewählt: Sporting Grotesque (zu breit neben dem schmalen Namen), New Title,
  Zodiak, Boska u. a. Kurz angeschaut und verworfen: Kugile (Demo nur privat nutzbar, ohne Umlaute), Murmure.
- **Libre Franklin** (seit November 2026): Fließtext, Knöpfe, Beschriftungen. Vorher: Archivo.
- Alle Schriften liegen als Dateien in `src/assets/fonts/` (Libre Franklin aus dem Fontsource-Paket, nur
  Zeichensatz „latin“ mit Ä, Ö, Ü, ß; Migha Black als OTF, Melodrama als WOFF2 und OTF unverändert aus dem
  Download), eingebunden in
  `src/styles/fonts.css`, Lizenztexte daneben.

**Extenda einsetzen:** Extenda (Zetafonts) ist eine kommerzielle Schrift. Fürs Web brauchst du eine passende Lizenz.
Mit Lizenz:
1. Die `.woff2`-Dateien nach `src/assets/fonts/` legen.
2. In `src/styles/fonts.css` ergänzen:
   ```css
   @font-face {
     font-family: 'Extenda';
     src: url('../assets/fonts/Extenda-30-Deca.woff2') format('woff2');
     font-weight: 400 900;
     font-display: swap;
   }
   ```
3. In `src/styles/tokens.css` `--font-display: 'Extenda', 'Migha', sans-serif;` setzen.
4. Optional in `src/components/BaseHead.astro` die Preload-Zeile auf die neue Datei umstellen.

---

### Design-Durchgang vom 23.11.2026

Ganze Seite geprüft (Laptop, Tablet, Handy; Prüfregeln der Skills „impeccable“ und „emil-design-eng“, Stand davor im
Tag `alte-version-vor-design-review`). Geändert:

- **Mappen:** „Ganzes Album ansehen“ nur, wenn das Album mehr Fotos hat als die Mappe; „← Vorherige / Nächste
  Mappe →“ in der Reihenfolge des Portfolios; „Zurück“ ohne Vorgeschichte ins Portfolio zu dieser Mappe (vorher
  Startseite); größere Fotos (Laptop gut halbe Bildschirmhöhe, Handy jedes Foto in voller Breite), ein einzelnes Foto
  mittig. Im Menü ist auf Mappen „Portfolio“ markiert.
- **Ausschnitte:** Fotos ohne `focus` werden bei Hochformaten im oberen Drittel, sonst knapp über der Mitte beschnitten
  (Startseite, Album-Kopf) – vorher genau mittig, Köpfe fielen ab. Grauer Filter im Album-Kopf mindestens 0,6.
- **Kontrast:** „Zum Inhalt springen“ blau. Volle Knöpfe bleiben Orange mit heller Schrift in 15 px (3,2:1) – 19 px
  Schrift für ausreichenden Kontrast war kurz drin, sah Jesko aber zu klobig aus (zurückgenommen am selben Tag).
- **Portfolio:** Titel an einer gemeinsamen Linie, Fotos rechtsbündig in der linken Spalte.
- **Alben am Handy:** Reihen ~170 statt 104 px hoch.
- **Großansicht:** am Handy Pfeile 44 px ohne Beschriftung, Details starten geschlossen; der „i“-Knopf erscheint nur,
  wenn ein Foto des Albums eine Bildunterschrift oder Aufnahmedaten hat (nur Albumname und „Bild 1 von 9“ lohnten
  kein Feld); nach dem Schließen steht der Fokus auf dem zuletzt angesehenen Foto.
- **Startseite:** Diashow wechselt alle 5 statt 7 Sekunden, hält an, solange die Maus auf dem Foto ist oder es den Tastaturfokus hat; es lädt nur das
  jeweils nächste Foto vor (vorher alle 13).
- **Titel:** große Seitentitel höchstens 16 % der Bildschirmhöhe (Laptop 144 statt 192 px); Mediävalziffern mit runder
  Null (Melodramas Null hat einen Schrägstrich, „2Ø25“); „&“ und „x“ in Titeln bleiben beim folgenden Wort.
- **Begriffe:** „Vorheriges / Nächstes Album“, „Weitere Alben“; Filme haben auch „Vorheriger Film“.
- **Kleinigkeiten:** Kontaktseite ohne doppelte Adressen in der Fußzeile; private Kundengalerie: Download als voller
  Knopf, Hinweis im selben Kasten, „Galerie“ im Menü nicht markiert; größere Tippflächen (Menü, Laptop-Menü auf
  Tablets); Fotos blenden beim Scrollen nur noch leicht ein; keine federnde Bewegungskurve mehr (`--pop`).
- **Inhalt:** echte Bildbeschreibungen für 9 Fotos (Dramaqueen, Hilda, Liv und Hilda, Photoautomat), „Hilda“ groß.

## 12. Englisch später ergänzen

Die Struktur ist dafür vorbereitet:
1. `src/i18n/en.ts` mit derselben Struktur wie `de.ts` anlegen und in `src/i18n/index.ts` registrieren.
2. Seiten unter `src/pages/en/` anlegen. Sie verwenden dieselben Komponenten, `useTranslations('en')` liefert die Texte.
3. In `astro.config.mjs` die `i18n`-Konfiguration von Astro ergänzen und `hreflang`-Links in `BaseHead.astro` hinzufügen.

---

## 13. Häufige Fehler

**Build bricht ab: „Alt-Text fehlt oder ist zu kurz“**
In `index.md` hat ein Bild noch `alt: ""`. Die Meldung nennt Galerie und Position, z. B. `images.3.alt`. Die Zählung beginnt bei 0.

**„Bild … nicht gefunden … Hast du npm run optimize ausgeführt?“**
Der Dateiname in `index.md` passt nicht zu einer Datei in `images/`. Groß- und Kleinschreibung beachten:
`optimize` schreibt alles klein und ersetzt Leerzeichen durch `-`.

**„Unlisted-Galerien brauchen einen zufälligen Anteil im Slug“**
Den Slug um z. B. `-x7k2p9` ergänzen oder die Galerie mit `--unlisted` neu anlegen.

**Seite auf GitHub zeigt 404 oder eine alte Version**
- *Settings → Pages → Source* muss auf **GitHub Actions** stehen, nicht auf „Deploy from a branch“.
- Das Repo muss exakt `jeskodorner.github.io` heißen. Sonst stimmt die Adresse nicht.
- Unter *Actions* nachsehen, ob der letzte Lauf grün ist. Nach einem grünen Lauf kann es 1–2 Minuten dauern.

**Bilder fehlen auf GitHub, lokal sind sie da**
Wurden die Web-Versionen committet? `git status` zeigt nicht hinzugefügte Dateien in `src/content/galleries/*/images/`.
Originale aus `photos-source/` werden absichtlich **nicht** hochgeladen.

**Der erste Build auf GitHub dauert lange**
Das ist bei vielen Bildern normal, weil alle AVIF-/WebP-Größen erzeugt werden. Danach greift der Bild-Cache, und Builds dauern meist nur Sekunden bis wenige Minuten.

**HEIC- oder RAW-Dateien werden nicht verarbeitet**
Bitte als JPG oder TIFF exportieren und dann `npm run optimize` erneut ausführen.

**`node` oder `npm` nicht gefunden**
Neues Terminalfenster öffnen. Falls es weiter fehlt: `brew link --force node@24`.
