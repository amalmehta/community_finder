#!/usr/bin/env bash
# Builds community_finder.app into mac/dist/.
# Requires only the Xcode command line tools (swiftc, iconutil, codesign).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"
APP_NAME="community_finder"
BUILD="$HERE/build"
DIST="$HERE/dist"
APP="$DIST/$APP_NAME.app"

rm -rf "$BUILD" "$APP"
mkdir -p "$BUILD" "$APP/Contents/MacOS" "$APP/Contents/Resources"

echo "→ compiling"
swiftc -O -target "$(uname -m)-apple-macos13.0" \
  "$HERE/Sources/StaticServer.swift" "$HERE/Sources/main.swift" \
  -o "$APP/Contents/MacOS/fyc"

echo "→ bundling the site"
mkdir -p "$APP/Contents/Resources/web"
cp "$ROOT/index.html" "$APP/Contents/Resources/web/"
cp -R "$ROOT/assets" "$ROOT/src" "$APP/Contents/Resources/web/"

echo "→ icon"
swift "$HERE/makeicon.swift" "$BUILD/AppIcon.iconset" >/dev/null
iconutil -c icns "$BUILD/AppIcon.iconset" -o "$APP/Contents/Resources/AppIcon.icns"

echo "→ Info.plist"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleExecutable</key><string>fyc</string>
  <key>CFBundleIdentifier</key><string>com.amalmehta.communityfinder</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>13.0</string>
  <key>LSApplicationCategoryType</key><string>public.app-category.lifestyle</string>
  <key>NSHighResolutionCapable</key><true/>
  <key>NSHumanReadableCopyright</key><string>community_finder</string>
</dict>
</plist>
PLIST

echo "→ signing (ad-hoc, local use)"
codesign --force --sign - --timestamp=none "$APP" >/dev/null 2>&1 || \
  echo "  (codesign skipped — the app still runs locally)"

echo
echo "Built: $APP"
echo "Open with:  open \"$APP\""
