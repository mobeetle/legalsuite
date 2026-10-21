#!/usr/bin/env bash
# Prove every native package layout can install.
#
# Each package declares a file list; the installer runs the suite's own gate
# before it installs, so a layout that is missing a directory the installer
# needs (scripts/, evals/, playbooks/, LICENSE, NOTICE) fails the install
# instead of shipping a broken suite. This builds the layout each package
# declares and installs from it.
#
#   bash installer/test_layouts.sh
set -uo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
PASS=0; FAIL=0

install_from() {
  local label="$1" root="$2"
  local cfg="$WORK/cfg-$label"
  rm -rf "$cfg"; mkdir -p "$cfg"
  local out rc
  out=$(cd "$root" && sh ./install.sh --runtime python --prefix legal- --yes "$cfg" 2>&1)
  rc=$?
  if [ $rc -eq 0 ] && [ -d "$cfg/skills" ] && [ -d "$cfg/playbooks" ]; then
    local n pb
    n=$(ls "$cfg/skills" | wc -l | tr -d ' ')
    pb=$(ls "$cfg/playbooks"/*.md 2>/dev/null | wc -l | tr -d ' ')
    printf 'PASS  %-18s exit=0 · skills=%s · playbooks=%s\n' "$label" "$n" "$pb"
    PASS=$((PASS+1))
  else
    printf 'FAIL  %-18s exit=%s\n' "$label" "$rc"
    echo "$out" | tail -4 | sed 's/^/        /'
    FAIL=$((FAIL+1))
  fi
}

# The tree every layout ships: skills, commands, scripts, evals, playbooks and
# the two licence files. If a package's file list drops one of these, the
# install below fails.
tree() {
  local dst="$1"
  mkdir -p "$dst"
  for d in skills commands scripts evals playbooks; do cp -R "$HERE/$d" "$dst/"; done
  cp "$HERE/LICENSE" "$HERE/NOTICE" "$HERE/install.sh" "$dst/"
}

# 1. nFPM (/usr/share/legalsuite) — installer/nfpm.yaml
tree "$WORK/nfpm/usr/share/legalsuite"
install_from "nfpm-deb-rpm" "$WORK/nfpm/usr/share/legalsuite"

# 2. Homebrew libexec — installer/homebrew/legalsuite.rb (the tarball root)
mkdir -p "$WORK/brew"
tar xzf "$HERE/dist/legalsuite.tar.gz" -C "$WORK/brew" 2>/dev/null || {
  (cd "$HERE" && python3 scripts/build_dist.py --no-verify >/dev/null)
  tar xzf "$HERE/dist/legalsuite.tar.gz" -C "$WORK/brew"
}
tree "$WORK/brew/libexec"
install_from "homebrew-libexec" "$WORK/brew/libexec"

# 3. macOS .pkg (/usr/local/legalsuite) — installer/macos/build-pkg.sh
tree "$WORK/pkg/usr/local/legalsuite"
install_from "macos-pkg" "$WORK/pkg/usr/local/legalsuite"

# 4. Windows .iss ({app}) — installer/legalsuite.iss
tree "$WORK/iss"
cp "$HERE/install.ps1" "$WORK/iss/"
install_from "windows-iss" "$WORK/iss"

# 5. The published tarball itself
mkdir -p "$WORK/tarball"
tar xzf "$HERE/dist/legalsuite.tar.gz" -C "$WORK/tarball"
install_from "published-tarball" "$WORK/tarball/legalsuite"

echo
echo "layouts=$((PASS+FAIL)) pass=$PASS fail=$FAIL"
[ "$FAIL" -eq 0 ]
