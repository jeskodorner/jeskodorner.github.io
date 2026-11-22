#!/bin/bash
# Baut das Mac-Programm „Fotos aufbereiten.app“ (ein Droplet): Ordner oder Fotos im Finder darauf ziehen, die fertigen
# Web-Versionen landen daneben in „<Name> – fertig“ (scripts/prepare-folder.mjs). Neu bauen, wenn das Projekt
# verschoben wurde:  bash scripts/make-app.sh
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
APP="$DIR/Fotos aufbereiten.app"
TMP="$(mktemp -t droplet).applescript"
cat > "$TMP" <<APPLESCRIPT
on open theItems
	set projectDir to "$DIR"
	set nodePath to "$NODE"
	set args to ""
	repeat with i in theItems
		set args to args & " " & quoted form of POSIX path of i
	end repeat
	display notification "Die Fotos werden aufbereitet …" with title "Fotos aufbereiten"
	try
		set out to do shell script "cd " & quoted form of projectDir & " && " & quoted form of nodePath & " scripts/prepare-folder.mjs --open" & args & " 2>&1"
		set lastLine to last paragraph of out
		display notification lastLine with title "Fotos aufbereiten"
	on error errMsg
		display dialog "Das hat nicht geklappt:" & return & return & errMsg buttons {"OK"} default button 1 with icon caution with title "Fotos aufbereiten"
	end try
end open

on run
	display dialog "Zieh einen Ordner mit Fotos (oder einzelne Fotos) auf dieses Symbol." & return & return & "Die fertigen Web-Versionen – 2400 px, ohne GPS – landen daneben im Ordner „… – fertig“. Die Originale bleiben unverändert." buttons {"OK"} default button 1 with title "Fotos aufbereiten"
end run
APPLESCRIPT
rm -rf "$APP"
osacompile -o "$APP" "$TMP"
rm -f "$TMP"
echo "Fertig: $APP"
