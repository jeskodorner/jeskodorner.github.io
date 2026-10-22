# Jesko Dorner – Fotografie-Portfolio

Statische Portfolio-Website mit Galerien, Lightbox, Bildübergabe an Kunden und Filmarbeiten.
Gebaut mit **Astro 7** und TypeScript und gehostet kostenlos auf **GitHub Pages** unter
**https://jeskodorner.github.io**.

- Keine Cookies, keine Tracker, keine Google Fonts. Alle Schriften liegen lokal im Projekt.
- Die Seiten funktionieren ohne JavaScript. JavaScript wird nur für Lightbox, Teilen und die E-Mail-Adresse verwendet.
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
    pages/startseite.md     ← Texte der Startseite
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

**Warum eigenes CSS statt Tailwind?** Die Seite lebt von wenigen, gezielt gesetzten Design-Werten: Wandweiß, Schwarz und fünf Galeriefarben. CSS Custom Properties bilden das direkt ab: Eine Klasse wie `c-pink` färbt eine ganze Fläche ein, das HTML bleibt lesbar, und Astro begrenzt die Styles pro Komponente. Tailwind würde vor allem bei vielen generischen Oberflächen helfen, die es hier nicht gibt.

---

## 3. Texte und Einstellungen ändern

| Was | Wo |
|---|---|
| Claim, Beschreibung für Suchmaschinen, Instagram, E-Mail | `src/config/site.ts` |
| Texte der Startseite | `src/content/pages/startseite.md` |
| Über mich: Text, Stationen, Ausrüstung | `src/content/pages/ueber-mich.md` |
| Porträt | Datei `src/assets/portrait.jpg` ersetzen (Hochformat 4:5 ideal) |
| Filme und Videos | `src/content/films/*.md`. Pro Video eine Datei (siehe unten) |
| Buttons, Beschriftungen | `src/i18n/de.ts` |
| Impressum und Datenschutz | `src/pages/impressum.astro`, `src/pages/datenschutz.astro` |

> ⚠️ **Impressum und Datenschutzerklärung sind Platzhalter** und auf der Seite deutlich so markiert.
> Bitte vor der Veröffentlichung vervollständigen und rechtlich prüfen lassen. Das hier ist keine Rechtsberatung.

**Video hinzufügen:** In `src/content/films/` eine neue Datei anlegen, z. B. `mein-video.md`. Am einfachsten kopierst du eine vorhandene:

```yaml
---
title: "Innehalten"
youtube: "https://youtu.be/61yE6MHDz-o"   # Link oder ID genügt
format: "Kurzfilm"
year: 2025
# roles: ["Kamera", "Schnitt"]
# still: ./images/innehalten.jpg           # eigenes Vorschaubild (optional)
# stillAlt: "Beschreibung des Standbilds"
color: lime                                # Farbe der Vorschau ohne Standbild
order: 2                                   # Reihenfolge auf der Seite
---

Kurzer Text zum Video.
```

Videos werden **datensparsam per Zwei-Klick** eingebettet. Beim Seitenaufruf lädt nichts von YouTube, und es gibt keine Cookies.
Erst ein Klick auf „Abspielen“ lädt den Player von youtube-nocookie.com. Ohne JavaScript führt der Klick zu YouTube.
Die Datenschutzerklärung bekommt dazu automatisch einen YouTube-Abschnitt.

**Leuchtmarker:** In `startseite.md` und `ueber-mich.md` wird `*Wort*` in großen Titeln mit einem Leuchtmarker hervorgehoben (erst Lime, dann Pink). Beim Scrollen wischt der Marker über das Wort.

**Platzhalter entfernen:** Die Beispielgalerien liegen in `src/content/galleries/` (Ordner `kueste-im-oktober`,
`stadt-nach-regen`, `sommerfest-beispiel-q7m4zt`) und die Beispielfilme in `src/content/films/`. Ordner bzw. Dateien
löschen, und sie sind von der Seite verschwunden. Gibt es keine Filme mehr, verschwindet auch der Menüpunkt „Film“.

---

## 4. Neue Galerie anlegen

```bash
npm run new-gallery -- "Küste im Oktober"
```

Das legt zwei Ordner an:
- `src/content/galleries/kueste-im-oktober/index.md`, die Vorlage mit allen Feldern
- `photos-source/kueste-im-oktober/`, für deine Originale

Optionen: `--unlisted` (private Kundengalerie, siehe Abschnitt 6), `--layout masonry` oder `--layout justified` (Standard ist `showcase`), `--date 2026-10-22`, `--location "Sylt"`.

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
- **EXIF** (Kamera, Objektiv, Blende, Belichtung, ISO, Brennweite, Datum) wird ausgelesen und für Lightbox und Bildseite in `meta.json` gespeichert.
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
| `cover` | | Dateiname des Vorschaubilds. Es erscheint in der Galerie-Übersicht und auf der Startseite unter „Ausgewählte Arbeiten“ (jede Galerie einmal, unbeschnitten mit kleinem Schild und Link „Zum Album“). Ohne Angabe wird das erste Bild genommen. |
| `layout` | | `showcase` (Standard, „Bühne“), `masonry` (Raster) oder `justified` (gleich hohe Reihen). Siehe unten. |
| `visibility` | | `public` (Standard) oder `unlisted` |
| `showExif` | | Aufnahmedaten zeigen (Standard `true`) |
| `downloadUrl` | | Link zum Download der ganzen Galerie (ZIP/Ordner) |
| `downloadSize` | | z. B. `1,2 GB` |
| `downloadFormat` | | z. B. `ZIP · JPG in voller Auflösung` |
| `downloadNote` | | Hinweiszeile, z. B. Nutzungsrechte, Gültigkeit, Passworthinweis |
| `shareText` | | eigener Teilen-Text, `{title}` und `{url}` werden ersetzt |
| `images` | ja | Liste der Bilder (siehe unten) |

Pro Bild:

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `file` | ja | Dateiname in `images/` |
| `alt` | ja | Was ist zu sehen? Für Screenreader und Suchmaschinen. Ohne Alt-Text bricht der Build bewusst ab. |
| `caption` | | Bildunterschrift (Lightbox und Bildseite) |
| `originalUrl` | | Link zum Original. Dann erscheint „Original herunterladen“. |
| `hero` | | `true` = großes Bild auf der Startseite |
| `exif` | | überschreibt ausgelesene Werte, z. B. `exif: { lens: "Helios 44-2" }` |
| `focus` | | wichtigster Bildbereich, wenn das Foto für Vollbild beschnitten wird, z. B. `focus: "50% 30%"` (waagerecht senkrecht). Standard: Mitte |

Unterhalb des Kopfbereichs kannst du optional einen längeren Text in Markdown schreiben.

- **Reihenfolge** ändern: Einträge in `images:` umsortieren.
- **Bild entfernen:** Eintrag löschen und die Datei in `images/` löschen.

### Layouts

| Layout | Wirkung | Gut für |
|---|---|---|
| `showcase` („Bühne“, Standard) | Jedes Foto füllt den Bildschirm. Querformate laufen randlos über den ganzen Bildschirm, mit Werkschild als weißer Karte. Hoch- und Quadratformate stehen unbeschnitten in voller Höhe mittig, links und rechts füllt die Galeriefarbe den Bildschirm. Hat ein Hochformat eine Bildunterschrift (`caption`), wird der Bildschirm geteilt: eine Hälfte Bild, eine Hälfte Galeriefarbe mit der Bildunterschrift in großer Schrift. Beim Scrollen rastet die Galerie sanft Bild für Bild ein. Auf dem Handy erscheinen die Bilder in voller Breite und unbeschnitten. | Serien und Portfolio |
| `masonry` | kompaktes Raster in Spalten. Die Bilder laufen spaltenweise von oben nach unten. | viele Bilder, z. B. Kundengalerien |
| `justified` | gleich hohe Reihen, ruhig und dicht | viele Querformate |

Die Anordnung in der Bühne ergibt sich automatisch aus dem Seitenverhältnis und der Reihenfolge.
Willst du ein bestimmtes Bild über die volle Breite, setze es an eine passende Stelle in der Liste.

**Teilbare Bild-Links:** Jedes Bild hat eine eigene Seite (`/galerien/kueste-im-oktober/3/`) und einen Lightbox-Link
(`/galerien/kueste-im-oktober/#bild-3`). Die Nummer entspricht der Position in der Liste. Beim Umsortieren ändern sich die Nummern.

**Bildseite durchblättern:** Links und rechts neben dem Bild stehen „Vorheriges Bild“ und „Nächstes Bild“ (auf dem Handy
darunter). Mit der Tastatur geht es per **←** und **→** weiter, **Esc** führt zurück zur Galerie an die Stelle des Bildes
(`#pos-3`, öffnet keine Lightbox). Chrome und Edge laden das nächste Bild im Hintergrund vor.

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

Die Website braucht nur einen Link. Den Anbieter kannst du also jederzeit wechseln. Stand Oktober 2026, bitte vor der Entscheidung selbst prüfen:

| Anbieter | Passwort | Ablaufdatum | Kosten | Für wen |
|---|---|---|---|---|
| **Nextcloud** (gehostet, z. B. Hetzner Storage Share, oder selbst betrieben) | ✅ | ✅ | kostenpflichtig (gehostet) | **Kunden**: Ordner als ZIP, „Download verbergen“, Hosting in Deutschland |
| **Proton Drive** | ✅ | ✅ | Gratis-Speicher klein, mehr kostet | Kunden, Datenschutz |
| **Google Drive** (privates Konto) | ❌ | ❌ (bei „Jeder mit dem Link“) | 15 GB frei (geteilt mit Gmail) | **Freunde**, Unkritisches |
| **Backblaze B2** | ❌ | nur signierte Links (max. ca. 7 Tage) | 10 GB frei | technisch, günstig bei viel Volumen |
| **Cloudflare R2** | ❌ | nur signierte Links (max. 7 Tage) | 10 GB frei, Download gratis | sinnvoll erst mit eigener Domain; `r2.dev`-Links sind nach meinem Stand gedrosselt und nicht für den Dauerbetrieb gedacht |
| **GitHub Releases** | ❌ | ❌ | gratis, max. 2 GiB pro Datei | nur Öffentliches. Bei öffentlichem Repo sieht jeder die Releases. |

**Meine Empfehlung für dich:** Für Freunde und Unkritisches reicht **Google Drive**, das hast du schon.
Sobald Kunden oder sensible Bilder dazukommen, nimm einen Anbieter mit **Passwort und Ablaufdatum**,
z. B. **Nextcloud** (gehostet) oder **Proton Drive**. Die Entscheidung liegt bei dir.

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

- **Parallax:** Fotos gleiten in ihrem Rahmen etwas langsamer als die Seite und blenden beim Hereinscrollen ruhig ein.
- **Dehnende Titel:** Große Titel (Name im Hero, „Ausgewählte Arbeiten“, „Lass uns reden!“, Footer) ziehen sich beim Scrollen von schmal auf breit.
- **Leuchtmarker:** `*markierte*` Wörter bekommen beim Hereinscrollen einen Lime- bzw. Pink-Marker. Der Satz unter dem Hero leuchtet Wort für Wort auf.
- **Farbbänder:** Zwei gerade Bänder in Pink und Lime ziehen gegenläufig durch.
- **Hero:** Das Vollbild-Foto bleibt stehen, der Name zieht sich beim Scrollen in die Breite.
- **Weitere Effekte:** Das Hero-Foto hebt beim Scrollen ab, Texte steigen auf, der Fortschrittsbalken in Galerien zeigt die Galeriefarbe, und der Header wird kompakt.

**Browser:** Chrome, Edge, Brave und Safari (ab Version 26) zeigen die Scroll-Bewegung. Firefox hatte diese Technik
nach meinem Stand noch nicht standardmäßig aktiviert. Dort erscheint die Seite vollständig, nur ohne Scroll-Bewegung.
Wer im System „Bewegung reduzieren“ eingestellt hat, bekommt bewusst eine ruhige Seite.

Die Stärke der Effekte steht in `src/styles/motion.css`, z. B. `--px-scale` und `--px-from`/`--px-to` für Parallax
oder `--stretch-from`/`--stretch-to` für die dehnenden Titel.

## 8. Optionale Funktionen

Alles in `src/config/site.ts`:

**Kontaktformular (Formspree o. Ä.)**: GitHub Pages kann selbst keine Formulare verarbeiten, dafür braucht es einen externen Dienst.
1. Bei [formspree.io](https://formspree.io) ein Konto und ein Formular anlegen. Der Gratis-Tarif erlaubt nach meinem Stand etwa 50 Nachrichten pro Monat.
2. Den Endpoint eintragen: `contactForm: { endpoint: 'https://formspree.io/f/abcdwxyz' }`.
3. Das Formular erscheint dann auf `/kontakt/`. In der Datenschutzerklärung erscheint automatisch ein Abschnitt dazu, den du rechtlich prüfen musst.
   Formspree sitzt in den USA.

**Statistik mit GoatCounter (cookielos)**
1. Bei [goatcounter.com](https://www.goatcounter.com) einen Zugang anlegen, z. B. mit dem Code `jeskodorner`.
2. Eintragen: `analytics: { goatcounter: 'jeskodorner' }`.
3. Das Skript wird nur auf öffentlichen Seiten geladen, nicht auf Unlisted-Galerien. Die Datenschutzerklärung bekommt automatisch einen Abschnitt.
   Hinweis: Der gehostete Dienst ist laut GoatCounter für nicht-kommerzielle Nutzung kostenlos.
   Wenn du über die Seite Aufträge akquirierst, prüfe bitte die Bedingungen.

**Hero-Slideshow:** `hero: { mode: 'slideshow' }` und bei mehreren Bildern `hero: true` setzen.
Die Bilder blenden ruhig über, ohne JavaScript. Bei „Bewegung reduzieren“ bleibt das erste Bild stehen.

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

---

## 10. Grenzen von GitHub Pages

| Grenze | Wert | Was das für dich heißt |
|---|---|---|
| Größe der veröffentlichten Seite | max. 1 GB | Pro Bild entstehen geschätzt 1,2–1,6 MB (alle Größen und Formate). Das reicht für grob **600–800 Bilder**. Den echten Wert zeigt `npm run check-links` nach jedem Build. |
| Repository | empfohlen < 1 GB | Nur Web-Versionen liegen im Repo, niemals Originale. `photos-source/` ist ausgeschlossen. |
| Bandbreite | ca. 100 GB/Monat (weiche Grenze) | Große Downloads gehören deshalb zum externen Anbieter. |
| Einzeldatei | max. 100 MB | wird durch die Web-Versionen nie erreicht |

`npm run optimize` zeigt die Gesamtgröße der Web-Versionen an. `npm run check-links` meldet die Größe der fertigen Seite.

---

## 11. Design: Farben und Schriften

Look „White Cube“: weiße Galeriewände, schwarze Schrift, knallige Farbflächen. Definiert in `src/styles/tokens.css`.
Es gibt bewusst nur eine helle Ansicht und keinen Dunkelmodus.

- **Fotos füllen den Bildschirm**: Querformate randlos, Hochformate neben einer Hälfte in Galeriefarbe. Dazu ein Werkschild.
  Nichts ist schräg gestellt. Mutig sind Farben und Schrift, nicht die Anordnung.
- **Jede Galerie hat eine eigene Farbe.** Die Farbe erscheint in der Übersicht, im Farbband oben auf der Galerieseite,
  im Fortschrittsbalken, und im Download-Kasten.
  Festlegen per `color: pink | blue | lime | orange | violet` in `index.md`. Ohne Angabe wechselt die Farbe automatisch reihum.
- **Startseite:** Vollbild-Foto mit großem Namen, Leuchtmarker, zwei gerade Farbbänder, „Ausgewählte Arbeiten“ als Hängung
  (jedes Foto unbeschnitten an der weißen Wand, abwechselnd links/rechts, kleines Schild mit Link zum Album),
  ein blauer Film-Bereich und ein Lime-Bereich für Kontakt.

Kontraste nach WCAG 2.x:

| Farbe | Hex | Textfarbe darauf | Kontrast |
|---|---|---|---|
| Wand | `#FFFFFF` | Schwarz `#0B0B0B` / Nebentext `#5C5C5C` | 19,6 : 1 / 6,7 : 1 |
| Links, kleine Akzente | Blau `#2B3BFF` auf Weiß | – | 6,6 : 1 |
| Pink | `#FF3D8B` | Schwarz | 5,9 : 1 |
| Blau | `#2B3BFF` | Weiß | 6,6 : 1 |
| Lime | `#D4FF3A` | Schwarz | 17,0 : 1 |
| Orange | `#FF5A1F` | Schwarz | 6,3 : 1 |
| Violett | `#7C5CFF` | Schwarz | 4,5 : 1 |

Pink als Textfarbe auf Weiß (3,3 : 1) nur für große Schrift ab 24 px, z. B. „Dorner“ im Hero und den Footer-Schriftzug.

**Schriften** (lokal, über Fontsource, Lizenz OFL):
- **Anybody**: große Titel. Die Schrift ist stufenlos von extrem schmal (50 %) bis sehr breit (150 %) einstellbar.
  Deshalb können sich Titel beim Scrollen in die Breite ziehen.
- **Archivo**: Fließtext, Beschriftungen und Werkschilder

**Extenda einsetzen:** Extenda (Zetafonts) ist eine kommerzielle Schrift. Fürs Web brauchst du eine passende Lizenz.
Mit Lizenz:
1. Die `.woff2`-Dateien nach `src/assets/fonts/` legen.
2. In `src/styles/global.css` ganz oben ergänzen:
   ```css
   @font-face {
     font-family: 'Extenda';
     src: url('../assets/fonts/Extenda-30-Deca.woff2') format('woff2');
     font-weight: 400 900;
     font-display: swap;
   }
   ```
3. In `src/styles/tokens.css` `--font-display: 'Extenda', 'Anybody Variable', sans-serif;` setzen.
   Hinweis: Der Dehn-Effekt beim Scrollen braucht eine Schrift mit Breitenachse. Extenda hat einzelne Breiten-Schnitte statt einer Achse, mit Extenda bleiben die Titel deshalb fest in einer Breite.
4. Optional in `src/components/BaseHead.astro` die Preload-Zeile auf die neue Datei umstellen.

---

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
