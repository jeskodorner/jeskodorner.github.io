#!/usr/bin/env node
/**
 * npm run vorschau
 *
 * Baut die Website und legt eine Vorschau als Ordner an:
 *   vorschau/
 *     Vorschau starten.command   ← Doppelklick (macOS): startet einen lokalen Server und öffnet den Browser
 *     Vorschau starten.bat       ← dasselbe für Windows
 *     LIESMICH.txt
 *     website/                   ← die fertige Seite
 *   vorschau.zip                 ← derselbe Ordner zum Verschicken (nur macOS)
 *
 * Warum nicht einfach index.html doppelklicken? Die Seite nutzt Pfade wie /galerien/ und
 * JavaScript-Module – beides funktioniert nur über einen (lokalen) Webserver.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, exists, c } from './lib/util.mjs';

const OUT = path.join(ROOT, 'vorschau');
const DIST = path.join(ROOT, 'dist');
const skipBuild = process.argv.includes('--no-build');

if (!skipBuild) {
  console.log(c.bold('Baue die Website …'));
  execFileSync('npx', ['astro', 'build'], { cwd: ROOT, stdio: 'inherit' });
}
if (!(await exists(path.join(DIST, 'index.html')))) {
  console.log(c.red('dist/ fehlt – Build fehlgeschlagen?'));
  process.exit(1);
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
await fs.cp(DIST, path.join(OUT, 'website'), { recursive: true });

const PORT = 4747;

const command = `#!/bin/bash
# Startet die Vorschau der Website von Jesko Dorner.
# Zum Beenden: dieses Fenster schließen oder Ctrl+C drücken.
cd "$(dirname "$0")/website" || exit 1
PORT=${PORT}
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
URL="http://localhost:$PORT/"
echo ""
echo "  Vorschau läuft unter: $URL"
echo "  Zum Beenden: dieses Fenster schließen oder Ctrl+C drücken."
echo ""
(sleep 1; open "$URL") &
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v npx >/dev/null 2>&1; then
  npx --yes serve -l "$PORT" .
else
  echo "Weder python3 noch Node.js gefunden. Bitte eines davon installieren."
  read -r -p "Enter zum Schließen …"
fi
`;

const bat = `@echo off
rem Startet die Vorschau der Website von Jesko Dorner (Windows).
cd /d "%~dp0website"
set PORT=${PORT}
echo.
echo   Vorschau laeuft unter: http://localhost:%PORT%/
echo   Zum Beenden: dieses Fenster schliessen.
echo.
start "" http://localhost:%PORT%/
where python >nul 2>nul && (python -m http.server %PORT% --bind 127.0.0.1 & goto :eof)
where npx >nul 2>nul && (npx --yes serve -l %PORT% . & goto :eof)
echo Weder Python noch Node.js gefunden. Bitte eines davon installieren.
pause
`;

const readme = `VORSCHAU – Website Jesko Dorner
================================

So öffnest du die Vorschau:

  macOS:   Doppelklick auf „Vorschau starten.command“
           Beim ersten Mal (oder wenn der Ordner verschickt wurde) meldet macOS evtl.,
           dass die Datei nicht geöffnet werden kann. Dann: Rechtsklick → „Öffnen“ → „Öffnen“.

  Windows: Doppelklick auf „Vorschau starten.bat“

Es öffnet sich ein Terminal-Fenster (das ist der kleine lokale Server) und dein Browser
mit der Website. Zum Beenden das Terminal-Fenster schließen.

Benötigt: python3 (auf dem Mac meist vorhanden) oder Node.js.

Hinweis: Diese Vorschau ist ein Schnappschuss vom ${new Date().toLocaleString('de-DE')}.
Links zum Teilen zeigen bereits auf die spätere Adresse https://jeskodorner.github.io.
`;

const cmdPath = path.join(OUT, 'Vorschau starten.command');
await fs.writeFile(cmdPath, command);
await fs.chmod(cmdPath, 0o755);
await fs.writeFile(path.join(OUT, 'Vorschau starten.bat'), bat.replace(/\n/g, '\r\n'));
await fs.writeFile(path.join(OUT, 'LIESMICH.txt'), readme);

// Zip zum Verschicken (ditto erhält auf dem Mac die Ausführbarkeit der Startdatei)
const zipPath = path.join(ROOT, 'vorschau.zip');
await fs.rm(zipPath, { force: true });
if (process.platform === 'darwin') {
  execFileSync('ditto', ['-c', '-k', '--keepParent', OUT, zipPath]);
}

const size = execFileSync('du', ['-sh', OUT]).toString().split('\t')[0];
console.log(`
${c.green('✓ Vorschau-Ordner fertig:')} ${path.relative(ROOT, OUT)}/  (${size})
  Öffnen: Doppelklick auf „vorschau/Vorschau starten.command“
${process.platform === 'darwin' ? `  Zum Verschicken: ${path.relative(ROOT, zipPath)}` : ''}
`);
