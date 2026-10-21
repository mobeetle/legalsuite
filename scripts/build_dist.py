#!/usr/bin/env python3
"""Build the distribution archive from this source tree (stdlib only).

    python3 scripts/build_dist.py [--out dist] [--no-verify]

Runs `verify_suite.py` first, so a broken tree never ships, then writes:

    dist/legalsuite.tar.gz    one bundle — the whole skill set: the 6 doors +
                              engine (references, regimes, jurisdictions,
                              scripts), the commands, the open playbooks
                              (authoring templates + README) and the installers
                              (install.sh / install.ps1).

There is a single public bundle and nothing is withheld: the whole suite,
its playbooks and its licence ship. The paid side is the work behind them
(authoring depth, integration, data preparation, certification) — see
`legalskills.cz` and `playbooks/README.md`.
"""
import argparse
import os
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Directories and files never shipped in the archive.
SKIP_DIRS = {".git", ".idea", ".workflow", ".inspiration", ".venv",
             "node_modules", "dist", "__pycache__", "fixtures"}
SKIP_FILES = {".DS_Store"}
SKIP_SUFFIX = (".pyc",)

# Top-level entries of the bundle.
TOP = {"skills", "commands", "scripts", "evals", "playbooks", "README.md",
       "LICENSE", "NOTICE", "install.sh", "install.ps1"}

# Playbooks shipped in the public bundle (all of them — nothing is withheld).


def shipped(rel: Path) -> bool:
    """A file that the archive may carry."""
    if rel.name in SKIP_FILES or rel.name.endswith(SKIP_SUFFIX):
        return False
    return not any(p in SKIP_DIRS for p in rel.parts)


def walk() -> list[Path]:
    rels = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            rel = Path(dirpath, f).relative_to(ROOT)
            if shipped(rel):
                rels.append(rel)
    return sorted(rels)


def suite_files() -> list[Path]:
    """The whole public skill set: everything under TOP."""
    return [rel for rel in walk() if rel.parts[0] in TOP]


def write_archive(entries: list[tuple[str, Path]], out_file: Path) -> Path:
    """entries: (arcname, source Path). Writes a single .tar.gz."""
    with tarfile.open(out_file, "w:gz") as tf:
        for arcname, src in entries:
            tf.add(src, arcname=arcname)
    return out_file


# The archive must be able to install itself: the installer calls these.
REQUIRED = (
    "legalsuite/install.sh",
    "legalsuite/install.ps1",
    "legalsuite/LICENSE",
    "legalsuite/NOTICE",
    "legalsuite/scripts/verify_suite.py",
    "legalsuite/scripts/apply_prefix.py",
    "legalsuite/scripts/build_dist.py",
    "legalsuite/skills/legal/SKILL.md",
    "legalsuite/commands/legal.md",
    "legalsuite/playbooks/_template.md",
    "legalsuite/playbooks/_template-intake-matrix.md",
    "legalsuite/playbooks/nda-recipient-cz.md",
    "legalsuite/evals/run.py",
)


def assert_archive(path: Path) -> None:
    """Prove the artifact is installable and carries its licence.

    Bite: a missing top-level entry (scripts/, an installer, the licence or
    the NOTICE) now fails the build instead of surfacing at first install.
    Apache-2.0 §4(a)/(d): the licence and the NOTICE must travel with the
    archive.
    """
    with tarfile.open(path) as tf:
        names = set(tf.getnames())
    missing = [n for n in REQUIRED if n not in names]
    assert not missing, f"archive is not installable — missing {missing}"
    print(f"legalsuite: archive verified ({len(names)} entries, required entries present)")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist", help="output directory (default: dist)")
    ap.add_argument("--no-verify", action="store_true", help="skip verify_suite.py")
    args = ap.parse_args()

    if not args.no_verify:
        print("verify_suite.py …")
        res = subprocess.run([sys.executable, "scripts/verify_suite.py"], cwd=ROOT)
        if res.returncode != 0:
            print("verify_suite failed — not building.", file=sys.stderr)
            return 1

    out = ROOT / args.out
    out.mkdir(parents=True, exist_ok=True)

    files = [("legalsuite/" + r.as_posix(), ROOT / r) for r in suite_files()]
    written = write_archive(files, out / "legalsuite.tar.gz")
    assert_archive(written)

    print(f"legalsuite: {len(files)} files")
    print(f"  {written.relative_to(ROOT)}  ({written.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
