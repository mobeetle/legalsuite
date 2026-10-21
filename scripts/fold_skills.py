#!/usr/bin/env python3
"""One-time migration: fold the legalsuite mode skills into 5 doors (stdlib only).

Maps today's 13 skills into 5 visible doors:

  legal           engine + intake                       (references/modes/intake.md)
  legal-research  grounding (door as-is; no folded modes)
  legal-review    review + draft, negotiate, diligence, comply
  legal-dispute   dispute (door as-is; no folded modes)
  legal-project   matter (renamed) + handoff, debrief

Removes legal-playbook (its authoring is a paid service; playbook *consumption*
stays in the engine). The folded mode SKILL.md bodies become plain reference
files read on demand; relative paths are rewritten relative to the door's base
directory.

This is a structural transform. Door descriptions and router sections are added
by editor afterwards.

Run:
    python3 scripts/fold_skills.py --dry-run
    python3 scripts/fold_skills.py
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
COMMANDS = ROOT / "commands"

# door -> [(mode, source skill dir), ...]
DOORS = {
    "legal": [("intake", "legal-intake")],
    "legal-research": [],
    "legal-review": [
        ("draft", "legal-draft"),
        ("negotiate", "legal-negotiate"),
        ("diligence", "legal-diligence"),
        ("comply", "legal-comply"),
    ],
    "legal-dispute": [],
    "legal-project": [("handoff", "legal-handoff"), ("debrief", "legal-debrief")],
}
RENAMES = {"legal-matter": "legal-project"}  # dir rename, frontmatter name follows
REMOVE = ["legal-playbook"]

FRONT = re.compile(r"^---\n.*?\n---\n", re.DOTALL)
# intra-skill reference that lives in the source skill's references/ dir
INTRA_REF = re.compile(r"(?<![/\w-])references/([\w./-]+\.\w+)")


def split_frontmatter(text: str) -> tuple[str, str]:
    m = FRONT.match(text)
    return (m.group(0), text[m.end():]) if m else ("", text)


def rewrite_refs(body: str, mode: str, src: Path) -> str:
    """Point the mode's own references/ files at references/modes/<mode>/."""
    def sub(m: re.Match) -> str:
        rel = m.group(1)
        if rel.startswith("modes/"):
            return m.group(0)
        if (src / "references" / rel).exists():
            return f"references/modes/{mode}/{rel}"
        return m.group(0)

    return INTRA_REF.sub(sub, body)


def main() -> int:
    dry = "--dry-run" in sys.argv
    log = (lambda *a: print("(dry) " + " ".join(map(str, a)))) if dry else (lambda *a: print(*a))

    if not (SKILLS / "legal-playbook").is_dir():
        print("already folded (skills/legal-playbook absent); nothing to do.")
        return 0

    # 1. rename matter -> project
    for old, new in RENAMES.items():
        if (SKILLS / old).is_dir():
            log(f"rename skills/{old} -> skills/{new}")
            if not dry:
                (SKILLS / old).rename(SKILLS / new)
                f = SKILLS / new / "SKILL.md"
                text = f.read_text(encoding="utf-8")
                f.write_text(re.sub(rf"^name: {re.escape(old)}$", f"name: {new}", text, flags=re.M),
                             encoding="utf-8")

    # 2. fold each mode into its door
    for door, modes in DOORS.items():
        for mode, srcname in modes:
            src = SKILLS / srcname
            assert (src / "SKILL.md").is_file(), f"missing {src}/SKILL.md"
            _, body = split_frontmatter((src / "SKILL.md").read_text(encoding="utf-8"))
            body = rewrite_refs(body, mode, src)
            dest_dir = SKILLS / door / "references" / "modes"
            dest = dest_dir / f"{mode}.md"
            log(f"fold {srcname}/SKILL.md -> {door}/references/modes/{mode}.md")
            if not dry:
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest.write_text(body.lstrip("\n"), encoding="utf-8")
                if (src / "references").is_dir():
                    sub_dest = dest_dir / mode
                    for p in (src / "references").iterdir():
                        sub_dest.mkdir(parents=True, exist_ok=True)
                        log(f"  move {srcname}/references/{p.name} -> {mode}/{p.name}")
                        if not dry:
                            shutil.move(str(p), str(sub_dest / p.name))
                shutil.rmtree(src)
            log(f"  remove skills/{srcname}/")

    # 3. drop legal-playbook
    for name in REMOVE:
        if (SKILLS / name).is_dir():
            log(f"remove skills/{name}/")
            if not dry:
                shutil.rmtree(SKILLS / name)
        cmd = COMMANDS / f"{name}.md"
        if cmd.is_file():
            log(f"remove commands/{name}.md")
            if not dry:
                cmd.unlink()

    log("fold complete." + ("" if dry else " Now edit door descriptions/routers, engine, commands, docs."))
    return 0


if __name__ == "__main__":
    sys.exit(main())
