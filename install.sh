#!/bin/sh
# Install legalsuite skills + commands into an OpenCode config directory.
#
#   ./install.sh [--dry-run] [--prefix <p>] [--all-commands]
#                [--runtime auto|python|node] [--yes] [--no-runtime-install] [config-root]
#
# Installs the full plaintext skills; no MCP entry is written (there is no
# server — the scripts in skills/legal/scripts/ are invoked directly).
# --dry-run prints what would happen without changing anything.
# By default only the single `legal` router command is installed; the six
# door aliases (legal-intake, legal-research, legal-review, legal-drafting,
# legal-dispute, legal-project) stay in the source tree for --all-commands.
#
# --runtime selects the script flavor installed (default `auto`):
#   auto    prefer python3 (>=3.10) when present, else node (>=20), else ask
#   python  require python3, offering to install it when missing
#   node    require node, offering to install it when missing
# When the chosen runtime is missing the installer offers the OS-native install
# (winget / brew / apt,dns,apk / python.org,nodejs.org); --yes accepts it
# non-interactively, --no-runtime-install turns it into a hard error.
# $LEGALSUITE_RUNTIME overrides the flag. Node installs rewrite `*.py` script
# references to `*.js` in the staged skills; both flavors ship on disk.
#
# Default config root: $HOME/.config/opencode
# (OPENCODE_CONFIG points at a config *file*, so it is not used here.)
#
# The installer asks for a skill-name prefix (default `legal-`). Everything is
# staged and the prefix applied on the fly, so the source tree keeps the
# canonical `legal-` names. Set LEGALSUITE_PREFIX to skip the prompt.
# Existing skills/commands of the same name are moved aside, never clobbered.
set -eu

DRY=0
ALL_COMMANDS=0
PREFIX="${LEGALSUITE_PREFIX:-}"
RUNTIME="${LEGALSUITE_RUNTIME:-auto}"
ASSUME_YES=0
NO_RUNTIME_INSTALL=0
ROOT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift;;
    --all-commands) ALL_COMMANDS=1; shift;;
    --prefix) PREFIX="$2"; shift 2;;
    --runtime) RUNTIME="$2"; shift 2;;
    --yes|-y) ASSUME_YES=1; shift;;
    --no-runtime-install) NO_RUNTIME_INSTALL=1; shift;;
    -h|--help) sed -n '2,24p' "$0"; exit 0;;
    *) ROOT="$1"; shift;;
  esac
done
case "$RUNTIME" in auto|python|node) ;; *) printf 'unknown --runtime %s (auto|python|node)\n' "$RUNTIME" >&2; exit 2;; esac
ROOT="${ROOT:-$HOME/.config/opencode}"
HERE="$(cd "$(dirname "$0")" && pwd)"

# --- runtime detection -------------------------------------------------------
# ponytail: version compares as integers, no semver lib for a two-branch check
have_python() {
  command -v python3 >/dev/null 2>&1 || return 1
  _v="$(python3 -c 'import sys; print(sys.version_info[0]*100+sys.version_info[1])' 2>/dev/null)" || return 1
  [ "${_v:-0}" -ge 310 ] 2>/dev/null
}
have_node() {
  command -v node >/dev/null 2>&1 || return 1
  _v="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)" || return 1
  [ "${_v:-0}" -ge 20 ] 2>/dev/null
}
offer_install() {
  # $1 = python|node. Prints the OS-native command, prompts (or auto-accepts
  # with --yes), runs it. Returns 0 when the runtime is now present.
  if [ "$DRY" = 1 ]; then
    printf 'would: install the %s runtime (dry run makes no changes)\n' "$1"
    return 1
  fi
  _kind="$1"
  if [ "$NO_RUNTIME_INSTALL" = 1 ]; then
    printf 'legalsuite: %s runtime required but missing (--no-runtime-install).\n' "$_kind" >&2
    return 1
  fi
  _cmd=""
  case "$(uname -s)" in
    Darwin)
      if command -v brew >/dev/null 2>&1; then
        if [ "$_kind" = python ]; then _cmd="brew install python@3.12"; else _cmd="brew install node@20"; fi
      else
        _cmd="https://www.python.org/downloads/ or https://nodejs.org/"
      fi;;
    Linux)
      if command -v apt-get >/dev/null 2>&1; then
        if [ "$_kind" = python ]; then _cmd="sudo apt-get install -y python3"; else _cmd="sudo apt-get install -y nodejs"; fi
      elif command -v dnf >/dev/null 2>&1; then
        if [ "$_kind" = python ]; then _cmd="sudo dnf install -y python3"; else _cmd="sudo dnf install -y nodejs"; fi
      elif command -v apk >/dev/null 2>&1; then
        if [ "$_kind" = python ]; then _cmd="sudo apk add python3"; else _cmd="sudo apk add nodejs"; fi
      elif command -v pacman >/dev/null 2>&1; then
        if [ "$_kind" = python ]; then _cmd="sudo pacman -S --noconfirm python"; else _cmd="sudo pacman -S --noconfirm nodejs"; fi
      else
        _cmd="https://www.python.org/downloads/ or https://nodejs.org/"
      fi;;
    MINGW*|MSYS*|CYGWIN*|Windows_NT)
      if command -v winget >/dev/null 2>&1; then
        if [ "$_kind" = python ]; then _cmd="winget install -e --id Python.Python.3.12"; else _cmd="winget install -e --id OpenJS.NodeJS.LTS"; fi
      else
        _cmd="https://www.python.org/downloads/ or https://nodejs.org/"
      fi;;
    *) _cmd="https://www.python.org/downloads/ or https://nodejs.org/";;
  esac
  case "$_cmd" in http*)
    printf 'legalsuite: no %s runtime found. Install one from %s, then re-run.\n' "$_kind" "$_cmd" >&2
    return 1;;
  esac
  if [ "$ASSUME_YES" = 1 ]; then _ans="y"; else
    if [ -t 0 ]; then printf 'No %s runtime found. Install it now via `%s`? [y/N] ' "$_kind" "$_cmd"; read -r _ans || _ans=""; else _ans=""; fi
  fi
  case "$_ans" in y|Y|yes|YES) printf 'Running: %s\n' "$_cmd"; sh -c "$_cmd";; *) printf 'Skipped %s install; aborting.\n' "$_kind" >&2; return 1;; esac
  if [ "$_kind" = python ]; then have_python; else have_node; fi
}
pick_runtime() {
  case "$RUNTIME" in
    python) have_python || offer_install python || exit 2; printf 'python';;
    node) have_node || offer_install node || exit 2; printf 'node';;
    auto)
      if have_python; then printf 'python'
      elif have_node; then printf 'node'
      else
        printf 'legalsuite: neither python3 (>=3.10) nor node (>=20) found.\n' >&2
        if [ -t 0 ] && [ "$ASSUME_YES" = 0 ] && [ "$NO_RUNTIME_INSTALL" = 0 ]; then
          printf 'Install which? [python/node/N] '; read -r _c || _c=""
          case "$_c" in
            python|p) offer_install python || exit 2; printf 'python';;
            node|n) offer_install node || exit 2; printf 'node';;
            *) printf 'Aborting: install Python 3.10+ or Node 20+, then re-run.\n' >&2; exit 2;;
          esac
        else
          # Non-interactive: try python first, then node (each honors --yes).
          if offer_install python 2>/dev/null; then printf 'python'
          elif offer_install node 2>/dev/null; then printf 'node'
          else printf 'Aborting: install Python 3.10+ or Node 20+, then re-run.\n' >&2; exit 2; fi
        fi
      fi;;
  esac
}
SELECTED="$(pick_runtime)"
printf 'Runtime: %s\n' "$SELECTED"

# Verify suite integrity (canonical names) before installing.
# Python gate when python is present; otherwise smoke-test the JS demos.
if [ "$SELECTED" = python ]; then
  python3 "$HERE/scripts/verify_suite.py"
elif command -v python3 >/dev/null 2>&1; then
  # Python present: full gate (it already includes the JS demos when present).
  python3 "$HERE/scripts/verify_suite.py"
else
  for _s in "$HERE"/skills/legal/scripts/*.js; do
    [ -e "$_s" ] || break
    node "$_s" --demo >/dev/null || { printf 'legalsuite: %s --demo failed\n' "$_s" >&2; exit 2; }
  done
  printf 'JS demos ok (python gate skipped: no python3).\n'
fi

# Ask for the prefix interactively, defaulting to `legal-`
if [ -z "$PREFIX" ]; then
  if [ -t 0 ]; then
    printf 'Skill name prefix [legal-]: '
    read -r PREFIX || PREFIX=""
  fi
  [ -n "$PREFIX" ] || PREFIX="legal-"
fi
# Stage the suite and apply the prefix on the fly
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
# Copy the suite without caches or OS metadata (cp -R would carry __pycache__).
mkdir -p "$STAGE"
for _d in skills commands playbooks; do
  [ -d "$HERE/$_d" ] || continue
  ( cd "$HERE" && tar cf - --exclude='__pycache__' --exclude='.DS_Store' --exclude='*.pyc' "$_d" ) \
    | ( cd "$STAGE" && tar xf - )
done
if command -v python3 >/dev/null 2>&1; then
  python3 "$HERE/scripts/apply_prefix.py" --prefix "$PREFIX" --root "$STAGE"
elif [ -f "$HERE/scripts/apply_prefix.js" ]; then
  node "$HERE/scripts/apply_prefix.js" --prefix "$PREFIX" --root "$STAGE"
else
  printf 'legalsuite: need python3 or node with apply_prefix.js for staging.\n' >&2; exit 2
fi
# Node flavor: point script references at the .js implementations (both ship).
if [ "$SELECTED" = node ]; then
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$STAGE" <<'PY'
import re, sys
from pathlib import Path
stage = Path(sys.argv[1])
names = {"display","doctext","ledger","load_playbook","matter","md2docx","migrate_state","preflight","redline","scan","structure","substance","trace","views"}
pat = re.compile(r"\b(" + "|".join(sorted(names)) + r")\.py\b")
for md in stage.rglob("*.md"):
    t = md.read_text(encoding="utf-8")
    t2 = pat.sub(lambda m: m.group(1) + ".js", t)
    if t2 != t:
        md.write_text(t2, encoding="utf-8")
PY
  else
    # ponytail: sed fallback when python itself is missing — same known-name rewrite
    for _n in display doctext ledger load_playbook matter md2docx migrate_state preflight redline scan structure substance trace views; do
      grep -rl "${_n}\\.py" "$STAGE" --include="*.md" | while read -r _f; do sed -i.bak "s/${_n}\\.py/${_n}.js/g" "$_f"; rm -f "$_f.bak"; done
    done
  fi
  printf 'Node flavor: script references rewritten to *.js.\n'
fi

RUN_TS="$(date +%Y%m%d%H%M%S)"
BACKUP_DIR="$ROOT/.legalsuite-backups/$RUN_TS"

run() {
  if [ "$DRY" = 1 ]; then printf 'would: %s\n' "$*"; else "$@"; fi
}

backup() {
  target="$1"
  [ -e "$target" ] || return 0
  run mkdir -p "$BACKUP_DIR"
  bak="$BACKUP_DIR/$(basename "$target")"
  run mv "$target" "$bak"
  [ "$DRY" = 1 ] || printf 'backed up %s -> %s\n' "$target" "$bak"
}

printf 'Prefix: %s\n' "$PREFIX"
run mkdir -p "$ROOT/skills" "$ROOT/commands"

# Retire the pre-fold skill names (moved aside, never deleted)
LEGACY_SKILLS="legal-matter legal-intake legal-draft legal-negotiate legal-diligence legal-comply legal-handoff legal-debrief legal-playbook"
LEGACY_COMMANDS="legal-intake.md legal-draft.md legal-negotiate.md legal-diligence.md legal-comply.md legal-matter.md legal-handoff.md legal-debrief.md legal-question.md legal-brainstorm.md legal-setup.md legal-playbook.md"
for name in $LEGACY_SKILLS; do backup "$ROOT/skills/$name"; done
for name in $LEGACY_COMMANDS; do backup "$ROOT/commands/$name"; done

for d in "$STAGE"/skills/*/; do
  name="$(basename "$d")"
  backup "$ROOT/skills/$name"
  run cp -R "$d" "$ROOT/skills/$name"
done

# Playbooks: the policy layer the skills read (load_playbook.py resolves
# <config-root>/playbooks). Without them every review runs UNCOVERED.
if [ -d "$STAGE/playbooks" ]; then
  run mkdir -p "$ROOT/playbooks"
  for f in "$STAGE"/playbooks/*.md; do
    [ -e "$f" ] || continue
    run cp "$f" "$ROOT/playbooks/$(basename "$f")"
  done
fi

# Single-command surface: default installs only the router; --all-commands
# adds the six door aliases beside it. On a default install, previously
# installed aliases are retired (moved aside, never deleted).
STEM="${PREFIX%-}"; [ -n "$STEM" ] || STEM="legal"
if [ "$ALL_COMMANDS" = 1 ]; then
  for f in "$STAGE"/commands/*.md; do
    name="$(basename "$f")"
    backup "$ROOT/commands/$name"
    run cp "$f" "$ROOT/commands/$name"
  done
else
  for suffix in intake research review drafting dispute project; do
    backup "$ROOT/commands/$STEM-$suffix.md"
  done
  backup "$ROOT/commands/$STEM.md"
  run cp "$STAGE/commands/$STEM.md" "$ROOT/commands/$STEM.md"
fi

if [ "$DRY" = 1 ]; then
  printf 'Dry run complete: no changes made (%s).\n' "$ROOT"
else
  # Verify what was installed: every staged skill present, same file count,
  # router present, playbooks present. "Installed" without this is a claim.
  _n=0; _pb=0
  for d in "$STAGE"/skills/*/; do
    name="$(basename "$d")"; _n=$((_n + 1))
    [ -f "$ROOT/skills/$name/SKILL.md" ] || { printf 'verify: missing %s/skills/%s/SKILL.md\n' "$ROOT" "$name" >&2; exit 3; }
    _s=$(find "$d" -type f | wc -l | tr -d ' ')
    _r=$(find "$ROOT/skills/$name" -type f | wc -l | tr -d ' ')
    [ "$_s" = "$_r" ] || { printf 'verify: %s has %s files, installed %s\n' "$name" "$_s" "$_r" >&2; exit 3; }
  done
  [ "$_n" -ge 6 ] || { printf 'verify: expected 6 skills, installed %s\n' "$_n" >&2; exit 3; }
  if [ -d "$ROOT/playbooks" ]; then _pb=$(find "$ROOT/playbooks" -maxdepth 1 -name '*.md' | wc -l | tr -d ' '); fi
  [ "$_pb" -ge 1 ] || { printf 'verify: no playbooks installed in %s/playbooks (the skills read them from there)\n' "$ROOT" >&2; exit 3; }
  [ -f "$ROOT/commands/$STEM.md" ] || { printf 'verify: router %s/commands/%s.md missing\n' "$ROOT" "$STEM" >&2; exit 3; }
  printf 'Verified: %s skills, router %s.md, %s playbooks.\n' "$_n" "$STEM" "$_pb"
  printf 'Installed legalsuite into %s (skills + commands + playbooks, prefix %s).\n' "$ROOT" "$PREFIX"
fi
