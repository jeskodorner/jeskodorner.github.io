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
property prefDomain : "de.jeskodorner.fotos-aufbereiten"

on watermarkOn()
	try
		return (do shell script "defaults read " & prefDomain & " wasserzeichen") is "1"
	on error
		return false
	end try
end watermarkOn

on open theItems
	set projectDir to "$DIR"
	set nodePath to "$NODE"
	if watermarkOn() then
		set wmFlag to " --wasserzeichen"
	else
		set wmFlag to " --ohne-wasserzeichen"
	end if
	set args to ""
	repeat with i in theItems
		set args to args & " " & quoted form of POSIX path of i
	end repeat
	display notification "Die Fotos werden aufbereitet …" with title "Fotos aufbereiten"
	try
		set out to do shell script "cd " & quoted form of projectDir & " && " & quoted form of nodePath & " scripts/prepare-folder.mjs --open" & wmFlag & args & " 2>&1"
		set lastLine to last paragraph of out
		display notification lastLine with title "Fotos aufbereiten"
	on error errMsg
		display dialog "Das hat nicht geklappt:" & return & return & errMsg buttons {"OK"} default button 1 with icon caution with title "Fotos aufbereiten"
	end try
end open

on run
	repeat
		if watermarkOn() then
			set stateText to "Wasserzeichen „© Jesko Dorner“: AN"
			set toggleButton to "Wasserzeichen aus"
		else
			set stateText to "Wasserzeichen „© Jesko Dorner“: AUS"
			set toggleButton to "Wasserzeichen an"
		end if
		set answer to button returned of (display dialog "So geht’s: einen Ordner mit Fotos (oder einzelne Fotos) im Finder auf das Symbol dieses Programms ziehen – im Dock oder im Projektordner. Die fertigen Web-Versionen (2400 px, ohne GPS) landen daneben im Ordner „… – fertig“. Die Originale bleiben unverändert." & return & return & stateText buttons {toggleButton, "OK"} default button "OK" with title "Fotos aufbereiten")
		if answer is "OK" then exit repeat
		if watermarkOn() then
			do shell script "defaults write " & prefDomain & " wasserzeichen -bool false"
		else
			do shell script "defaults write " & prefDomain & " wasserzeichen -bool true"
		end if
	end repeat
end run
APPLESCRIPT
rm -rf "$APP"
osacompile -o "$APP" "$TMP"
rm -f "$TMP"
echo "Fertig: $APP"
