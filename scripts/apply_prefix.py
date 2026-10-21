#!/usr/bin/env python3
"""Apply a skill-name prefix to a staged copy of the suite (stdlib only).

The suite's IDs are namespaced by a prefix whose default is `legal-`:
the engine is the prefix stem (`legal`) and the doors are `<prefix>research`,
`<prefix>review`, `<prefix>dispute`, `<prefix>project`. This rewrites a staged
copy (skills/ + commands/) to a different prefix, so install.sh can ask for one.

It rewrites, surgically:
  - skill directory names and command file names
  - the frontmatter `name:` of every skill
  - backticked engine name `legal`           -> `<stem>`
  - engine paths `../legal/`                 -> `../<stem>/`
  - door / alias tokens (backticked or bare) -> the new prefix

The English word "legal" in prose is never touched.

Run:
    python3 scripts/apply_prefix.py --prefix acme- --root STAGE
    python3 scripts/apply_prefix.py --selftest
"""
import argparse
import re
import shutil
import sys
from pathlib import Path

OLD_STEM = "legal"
# old token -> new suffix (stem for the engine is handled separately)
DOOR_SUFFIX = {
    "legal-intake": "intake",
    "legal-research": "research",
    "legal-ground": "research",  # alias
    "legal-review": "review",
    "legal-drafting": "drafting",
    "legal-dispute": "dispute",
    "legal-project": "project",
}


def normalize(prefix: str) -> str:
    if prefix and not prefix.endswith("-"):
        prefix += "-"
    return prefix


def rewrite_text(text: str, prefix: str) -> str:
    stem = prefix.rstrip("-") or OLD_STEM
    text = text.replace("`legal`", f"`{stem}`")
    text = text.replace("../legal/", f"../{stem}/")
    text = re.sub(r"^name: legal$", f"name: {stem}", text, flags=re.M)
    for old, suffix in DOOR_SUFFIX.items():
        text = text.replace(old, prefix + suffix)
    return text


def rename(name: str, prefix: str) -> str:
    stem = prefix.rstrip("-") or OLD_STEM
    if name in (OLD_STEM, OLD_STEM + ".md"):
        return stem + name[len(OLD_STEM):]
    if name.startswith(OLD_STEM + "-"):
        return prefix + name[len(OLD_STEM) + 1:]
    return name


def apply(root: Path, prefix: str) -> None:
    prefix = normalize(prefix)
    if prefix == "legal-":
        return  # default: identity, nothing to do
    for sub in ("skills", "commands"):
        base = root / sub
        if not base.is_dir():
            continue
        for p in sorted(base.iterdir()):
            new = rename(p.name, prefix)
            if new != p.name:
                p.rename(base / new)
    for md in list((root).rglob("*.md")):
        md.write_text(rewrite_text(md.read_text(encoding="utf-8"), prefix), encoding="utf-8")


def selftest() -> int:
    t = "Load `legal` then `legal-review`/`legal-ground`; read ../legal/scripts/scan.py.\nname: legal"
    out = rewrite_text(t, "acme-")
    assert "`acme` then `acme-review`/`acme-research`" in out, out
    assert "../acme/scripts/scan.py" in out, out
    assert "name: acme" in out, out
    for stale in ("`legal`", "`legal-review`", "`legal-ground`", "../legal/", "name: legal"):
        assert stale not in out, f"prefix left {stale!r} behind: {out}"
    assert rewrite_text("the legal advice", "acme-") == "the legal advice"
    assert rename("legal-matter", "acme-") == "acme-matter"
    assert rename("legal", "acme-") == "acme"
    # the default prefix keeps the door tokens and normalises the alias
    assert "`legal` then `legal-review`/`legal-research`" in rewrite_text(t, "legal-"), rewrite_text(t, "legal-")
    print("demo ok")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--prefix", default="legal-")
    ap.add_argument("--root", type=Path)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.root:
        ap.error("--root is required (unless --selftest)")
    apply(a.root, a.prefix)
    return 0


if __name__ == "__main__":
    sys.exit(main())
