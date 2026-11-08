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

**Warum eigenes CSS statt Tailwind?** Die Seite lebt von wenigen, gezielt gesetzten Design-Werten: Wandweiß, Schwarz und fünf Galeriefarben. CSS Custom Properties bilden das direkt ab: Eine Klasse wie `c-pink` färbt eine ganze Fläche ein, das HTML bleibt lesbar, und Astro begrenzt die Styles pro Komponente. Tailwind würde vor allem bei vielen generischen Oberflächen helfen, die es hier nicht gibt.

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

**Portfolio:** In `startseite.md` legt die Liste `showroom` fest, welche Fotos ausgewählt sind, in welcher
Reihenfolge und unter welchem Namen. Sie erscheinen auf der Seite **/portfolio/** als kleine Ausstellung (jedes Foto
einzeln, linksbündig untereinander, daneben bzw. darunter der Name; ein Klick öffnet direkt dort die Lightbox mit dem ganzen Album ab diesem Foto, ohne die Albumseite)
und liefern das Vorschaubild der Startseite für Link-Vorschauen.

```yaml
showroom:
  - galerie: hilda-setcard        # Ordnername in src/content/galleries/
    bild: hilda-setcard-gesicht.jpg   # ohne Angabe: Vorschaubild der Galerie
    name: "Hilda"                 # ohne Angabe: Name der Galerie
```

Mit Namen zeigt das Schild den Namen, darunter Album und Datum. Ohne Namen zeigt es den Namen der Galerie und die Bildanzahl. Das Schild hat keinen Link, ein Klick aufs Foto öffnet das Album in der Lightbox.
Neue Galerien erscheinen dort nicht automatisch. Mit `showroom: []` kommt jede öffentliche Galerie einmal mit ihrem Vorschaubild.
Ein Tippfehler bei `galerie` oder `bild` bricht den Build mit einer Meldung ab, welche Namen möglich sind.

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

**Sternchen in Titeln:** `*Wort*` in `startseite.md` und `ueber-mich.md` wird bewusst schlicht gesetzt, ohne Marker (seriöserer Auftritt). Die Sternchen können stehen bleiben.

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
| `visibility` | | `public` (Standard) oder `unlisted` |
| `showExif` | | Aufnahmedaten in den Lightbox-Details zeigen (Standard `true`) |
| `downloadUrl` | | Link zum Download der ganzen Galerie (ZIP/Ordner) |
| `downloadSize` | | z. B. `1,2 GB` |
| `downloadFormat` | | z. B. `ZIP · JPG in voller Auflösung` |
| `downloadNote` | | Hinweiszeile, z. B. Nutzungsrechte, Gültigkeit, Passworthinweis |
| `albumRequest` | | Zeile „Ganzes Album anfordern“ unter den Fotos mit Knopf „Code anfordern“. Standard: an bei öffentlichen, aus bei Unlisted-Galerien. `false` blendet ihn aus. Siehe Abschnitt 6. |
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
Titelbild, darunter Name, Bilderzahl und Monat. Es gibt nur diese eine Ansicht.

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
- **Zum Start: Pixieset Free.** Galerie-Passwort plus Download-PIN passt genau zu „Code anfordern“, und es ist gratis.
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

### „Ganzes Album anfordern“ (Zugangscode)

Auf öffentlichen Galerien steht unter den Fotos, bewusst ruhig, **„Ganzes Album anfordern“**
(rechts daneben „Album teilen“ mit kleinen Symbolen):
„Hier siehst du eine Auswahl. Das ganze Album in voller Auflösung gibt es mit Zugangscode.“

- **Code anfordern** öffnet eine vorformulierte E-Mail an dich: Betreff mit dem Albumnamen und die Bitte,
  kurz zu schreiben, wer man ist und wofür man die Fotos braucht.
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

Ohne `downloadUrl` gibt es nur „Code anfordern“. Dann schickst du Link und Code zusammen per E-Mail.
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
- **Dehnende Titel:** Große Titel („Portfolio“, „Galerie“, „Film“, Footer) ziehen sich beim Scrollen von schmal auf breit.
- **Weitere Effekte:** Texte steigen auf, der Fortschrittsbalken in Galerien zeigt die Galeriefarbe, und der Header wird kompakt.

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

---

## 11. Design: Farben und Schriften

Look „White Cube“: weiße Galeriewände, schwarze Schrift, knallige Farbflächen. Definiert in `src/styles/tokens.css`.
Es gibt bewusst nur eine helle Ansicht und keinen Dunkelmodus.

- **Fotos werden nie beschnitten**: in Alben, Übersichten und der Lightbox immer im Originalformat, groß mit weißem
  Rand. Nichts ist schräg gestellt. Mutig sind Farben und Schrift, nicht die Anordnung.
- **Jede Galerie hat eine eigene Farbe.** Die Farbe erscheint im Button auf der Seite „Galerie“, im Farbband oben auf
  der Galerieseite, im Fortschrittsbalken und im Download-Kasten (Kundengalerien).
  Festlegen per `color: pink | blue | lime | orange | violet` in `index.md`. Ohne Angabe wechselt die Farbe automatisch reihum.
- **Startseite = das blaue Menü** (`src/components/BlueMenu.astro`): Fläche in Schieferblau `#58677F` (Token
  `--menu-bg` in `tokens.css`, Farbe aus der Stirn eines invertierten Portfolio-Fotos). Akzent dort ist Rosa: der
  aktive bzw. überfahrene Menüpunkt bekommt ein rosa Feld mit schwarzer Schrift, der Menü-Knopf ist ein rosa Kreis,
  Instagram/Impressum/Datenschutz unten sind rosa hinterlegt, der Name hat einen leicht versetzten rosa Schatten
  (`text-shadow` bei `.bm-name`) über den ganzen Bildschirm, oben
  groß der Name, darunter die Menüpunkte (Portfolio, Galerie, Film, Über mich, Kontakt), unten Instagram, Impressum
  und Datenschutz. Ohne weiße Leiste und ohne Scrollen. Dasselbe Menü öffnet sich auf allen Geräten über den grünen
  Menü-Knopf oben rechts: Die Fläche wächst als Kreis aus dem Knopf, der Schließen-Knopf sitzt an derselben Stelle,
  der Name führt zur Startseite. Eine Textleiste mit Menüpunkten gibt es nur noch als Rückfall für sehr alte Browser.
  Am Handy (unter 700 px) steht der Name mittig, die Menüpunkte beginnen an seiner linken Kante, die Fußzeile ist
  mittig. Ab 700 px ist alles linksbündig.
- **Bildfeld auf der Startseite** (`src/components/BlendLoop.astro`): Fotos aus dem Portfolio (Liste `showroom`),
  farblich invertiert und im Modus „Aufhellen“ übereinandergelegt, immer 4:3. Es sind immer zwei zu sehen. Alle
  2,8 Sekunden blendet ein neues oben ein und das unterste verschwindet, so entstehen laufend neue Bilder (Reihenfolge
  bei jedem Besuch zufällig). Am Laptop rechts neben dem Menü. Am Handy immer randlos über die ganze Breite (auf niedrigen
  Bildschirmen etwas flacher als 4:3, damit nichts scrollt), es beginnt
  halb hinter „Kontakt“ (das Foto beginnt mit kurzem weichem Rand an der Mitte der Buchstaben; „Kontakt“ ist oben
  weiß und auf dem Foto in der Hintergrundfarbe) und läuft unten weich aus (Verlauf:
  `--blend-mask` in `BlueMenu.astro`). Am Laptop hat es harte Kanten. Mit „Bewegung reduzieren“
  oder ohne JavaScript bleibt ein festes Paar stehen. Invertieren abschalten: in `BlendLoop.astro` die Zeile
  `filter: invert(1);` löschen. Die frühere Startseite liegt in der Git-Geschichte.
- **Ausprobierte Versionen (gemerkt):**
  - *Fotos im Bildfeld mit dem Blau eingefärbt* (Modus „Farbe“, 65 %). Im Git-Verlauf markiert als Tag
    `alte-version-blau-2b3bff`. Zurückholen: in `BlendLoop.astro` wieder ein
    `.blend::after { content: ''; position: absolute; inset: 0; background: var(--menu-bg); mix-blend-mode: color; opacity: 0.65; }`
    ergänzen.
  - *Andere Hintergründe* (Fotos nur invertiert): kräftiges Blau `#2B3BFF` (mit Grün als Akzent) und Blaugrün
    `#3D8AAE`. Ausprobieren: in `tokens.css` z. B. `--menu-bg: var(--blue);` setzen. Der grüne Akzent war `var(--lime)`
    statt `var(--pink)` in `BlueMenu.astro` und beim Menü-Knopf in `Header.astro`.

Kontraste nach WCAG 2.x:

| Farbe | Hex | Textfarbe darauf | Kontrast |
|---|---|---|---|
| Wand | `#FFFFFF` | Schwarz `#0B0B0B` / Nebentext `#5C5C5C` | 19,6 : 1 / 6,7 : 1 |
| Links, kleine Akzente | Blau `#2B3BFF` auf Weiß | – | 6,6 : 1 |
| Pink | `#FF3D8B` | Schwarz | 5,9 : 1 |
| Blau | `#2B3BFF` | Weiß | 6,6 : 1 |
| Startseite/Menü | `#58677F` | Weiß | 5,7 : 1 |
| Akzent im Menü | Pink `#FF3D8B` (Fläche) | Schwarz | 5,9 : 1 |
| Lime | `#D4FF3A` | Schwarz | 17,0 : 1 |
| Orange | `#FF5A1F` | Schwarz | 6,3 : 1 |
| Violett | `#7C5CFF` | Schwarz | 4,5 : 1 |

Pink als Textfarbe auf Weiß (3,3 : 1) nur für große Schrift ab 24 px, z. B. den Footer-Schriftzug.

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
