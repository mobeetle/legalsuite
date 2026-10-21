#!/bin/bash
# macOS unsigned .pkg + .dmg (Gatekeeper will gate until Developer-ID signed).
# Usage: bash installer/macos/build-pkg.sh  -> dist/legalsuite-2.0.0.pkg + .dmg
# Signed later: productsign --sign "Developer ID Installer: …" in.pkg signed.pkg
#   xcrun notarytool submit signed.pkg --wait && xcrun stapler staple signed.pkg
set -euo pipefail
VER="${1:-2.0.0}"
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
STAGE="$(mktemp -d)"; trap 'rm -rf "$STAGE"' EXIT
ROOT="$STAGE/root/usr/local/legalsuite"
mkdir -p "$ROOT"
for d in skills commands scripts evals playbooks; do cp -R "$HERE/$d" "$ROOT/"; done
cp "$HERE/LICENSE" "$HERE/NOTICE" "$HERE/install.sh" "$ROOT/"
mkdir -p "$HERE/dist"
PKG="$HERE/dist/legalsuite-$VER.pkg"
pkgbuild --root "$STAGE/root" --identifier cz.legalskills.legalsuite \
  --version "$VER" --install-location / "$PKG"
echo "unsigned pkg: $PKG (right-click Open to install; signing: see installer/README.md)"
if command -v hdiutil >/dev/null; then
  DMG="$HERE/dist/legalsuite-$VER.dmg"
  rm -f "$DMG"; hdiutil create -volname "legalsuite $VER (unsigned)" -srcfolder "$STAGE/root/usr/local/legalsuite" -ov -format UDZO "$DMG"
  echo "dmg: $DMG"
fi
