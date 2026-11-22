#!/bin/bash
# Baut das Mac-Programm „Fotos aufbereiten.app“ (Fenster mit Ablagefläche, Quelltext: scripts/app/FotosAufbereiten.swift).
# Ordner oder Fotos ins Fenster oder aufs Symbol im Dock ziehen; die fertigen Web-Versionen landen daneben in
# „<Name> – fertig“ (scripts/prepare-folder.mjs). Neu bauen, wenn das Projekt verschoben wurde:  bash scripts/make-app.sh
# Braucht die Command Line Tools von Apple (swiftc) und Node.
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"
APP="$DIR/Fotos aufbereiten.app"
WORK="$(mktemp -d)"
sed -e "s|__PROJECT_DIR__|$DIR|" -e "s|__NODE_PATH__|$NODE|" "$DIR/scripts/app/FotosAufbereiten.swift" > "$WORK/main.swift"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -parse-as-library -target arm64-apple-macos14 "$WORK/main.swift" -o "$APP/Contents/MacOS/Fotos aufbereiten"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Fotos aufbereiten</string>
  <key>CFBundleDisplayName</key><string>Fotos aufbereiten</string>
  <key>CFBundleIdentifier</key><string>de.jeskodorner.fotos-aufbereiten</string>
  <key>CFBundleExecutable</key><string>Fotos aufbereiten</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>14.0</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>CFBundleDocumentTypes</key><array>
    <dict><key>CFBundleTypeRole</key><string>Viewer</string>
      <key>LSItemContentTypes</key><array><string>public.folder</string><string>public.image</string></array></dict>
  </array>
</dict></plist>
PLIST
codesign --force --sign - "$APP" >/dev/null 2>&1 || true
rm -rf "$WORK"
echo "Fertig: $APP"
