# legalsuite native packages (unsigned — no signing certificate yet).
#
# The bootstraps are the primary distribution (they carry the runtime logic):
#   install.sh   macOS / Linux (sh): --runtime auto|python|node, --yes,
#                --no-runtime-install; offers winget/brew/apt/dnf/apk installs.
#   install.ps1  Windows (PowerShell 5.1+): same flags as -Runtime/-Yes.
#
# The wrappers below call the bootstraps so every path installs the same tree:
#
#   Linux (.deb/.rpm, one YAML):  npx? no — `nfpm package --config installer/nfpm.yaml`
#     needs: go install github.com/goreleaser/nfpm/v2/cmd/nfpm@latest
#     output: dist/legalsuite_2.0.0_amd64.deb + .rpm (skills+commands+scripts,
#     postinstall prints the install.sh hint; no daemons, no root files outside
#     /usr/share/legalsuite + a /usr/bin/legalsuite-install symlink).
#
#   Windows (Inno Setup 6, unsigned .exe):
#     needs: Inno Setup 6 (iscc) on Windows.
#     build: iscc installer/legalsuite.iss
#     output: dist/legalsuite-setup-2.0.0.exe — ships the tree + runs install.ps1
#     silently; SmartScreen will warn until a code-signing cert exists (see below).
#
#   macOS (.pkg + .dmg, unsigned):
#     build: bash installer/macos/build-pkg.sh  # pkgbuild + productbuild + hdiutil
#     output: dist/legalsuite-2.0.0.pkg (+ .dmg wrapper). Gatekeeper will gate
#     unsigned pkgs — right-click Open / `sudo installer -pkg`. Signing later:
#     Developer-ID Installer cert + `productsign`, then `notarytool submit`.
#
#   Homebrew (no cert needed): `brew install --HEAD` from installer/homebrew/
#     or tap legalskills/legalsuite. Formula just clones + runs install.sh.
#
# Signing (when you have certs — not now):
#   Windows: signtool sign /a /t http://timestamp.digicert.com dist/*.exe
#   macOS:   productsign --sign "Developer ID Installer: …" in.pkg signed.pkg
#            xcrun notarytool submit signed.pkg --wait, then `xcrun stapler staple`.
# Until then every wrapper prints "unsigned build" at install time.
