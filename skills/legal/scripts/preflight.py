#!/usr/bin/env python3
"""Pre-flight context for the legal suite: profile, packs, matter (stdlib only).

Reads the practice profile (`.legal/profile.md` else `~/.legal/profile.md`),
the data packs under `skills/legal/{jurisdictions,regimes}/` front-matter
(`review_by`), and detects the matter folder. Reports whether the run is
`configured` (profile present, no `[PLACEHOLDER]`/`[PENDING]` gaps) or
`provisional`, which packs are stale, and the stance defaults the profile
carries. Backs the local MCP `preflight` tool (IMPROVEMENT-PLAN §1A.1).

    preflight.py [--dir DIR] [--json]
    preflight.py --demo            # runnable self-check

Exit 0 normally. It reports; it never writes and never decides.

Ceiling: front-matter and stance parsing are line/regex based, matching the
templates in `references/profile.md` — a profile written in another shape
yields no stance defaults, not an error.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from datetime import date
from pathlib import Path

ENGINE = Path(__file__).resolve().parent.parent
PACK_KINDS = ("jurisdictions", "regimes")
STANCE_KEYS = ("JURISDICTION", "LANGUAGE", "POSTURE", "AUDIENCE", "RISK")
GAPS = ("[PLACEHOLDER]", "[PENDING]")
_MATTER_FILES = ("state.json", "matter.md")
_FM = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
_STANCE = re.compile(r"\b([A-Z][A-Z_]{2,})\s*=\s*([^=]+?)(?=\s{2,}[A-Z][A-Z_]{2,}\s*=|$)")


def frontmatter(text: str) -> dict:
    m = _FM.match(text)
    if not m:
        return {}
    meta = {}
    for line in m.group(1).splitlines():
        k, sep, v = line.partition(":")
        if sep and not line.startswith(" "):
            meta[k.strip()] = v.strip().strip('"')
    return meta


def packs() -> list[dict]:
    out = []
    for kind in PACK_KINDS:
        for p in sorted((ENGINE / kind).glob("[!_]*.md")):
            meta = frontmatter(p.read_text(encoding="utf-8"))
            rb = meta.get("review_by", "")
            stale = bool(rb) and date.fromisoformat(rb[:10]) < date.today()
            out.append({"kind": kind, "code": meta.get("code", p.stem),
                        "review_by": rb, "stale": stale, "path": str(p)})
    return out


def find_profile(d: Path, matter: Path | None) -> Path | None:
    cands = []
    if matter is not None:
        cands.append(matter.parent / "profile.md")     # <root>/.legal/profile.md
    cands += [d / ".legal" / "profile.md", d / "profile.md", Path.home() / ".legal" / "profile.md"]
    return next((c for c in cands if c.is_file()), None)


def detect_matter(d: Path) -> Path | None:
    if any((d / f).is_file() for f in _MATTER_FILES):
        return d
    legal = d / ".legal"
    if legal.is_dir():
        for sub in sorted(p for p in legal.iterdir() if p.is_dir()):
            if any((sub / f).is_file() for f in _MATTER_FILES):
                return sub
    return None


def stance_defaults(text: str) -> dict:
    out = {}
    for line in text.splitlines():
        for m in _STANCE.finditer(line):
            if m.group(1) in STANCE_KEYS:
                out[m.group(1)] = m.group(2).strip().strip("<>").strip()
    return out


def preflight(d: Path) -> dict:
    matter = detect_matter(d)
    profile = find_profile(d, matter)
    gaps: list[str] = []
    stance: dict = {}
    if profile is not None:
        text = profile.read_text(encoding="utf-8")
        gaps = [g for g in GAPS if g in text]
        stance = stance_defaults(text)
    status = "configured" if profile is not None and not gaps else "provisional"
    return {"status": status, "profile": str(profile) if profile else None,
            "matter": str(matter) if matter else None, "gaps": gaps,
            "stance": stance, "packs": packs()}


def _human(r: dict) -> None:
    print(f"preflight: {r['status'].upper()}")
    print(f"profile:   {r['profile'] or '(none — provisional defaults)'}")
    print(f"matter:    {r['matter'] or '(not detected)'}")
    if r["gaps"]:
        print(f"gaps:      {', '.join(r['gaps'])}")
    if r["stance"]:
        print("stance:    " + "  ".join(f"{k}={v}" for k, v in r["stance"].items()))
    for p in r["packs"]:
        flag = "STALE" if p["stale"] else "fresh"
        print(f"pack:      {p['kind'][:-1]:<12} {p['code']:<16} review_by {p['review_by']}  [{flag}]")


def _demo() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        # fresh directory: no profile -> provisional
        assert preflight(d)["status"] == "provisional"
        # a profile with a gap stays provisional; the gap is reported
        (d / ".legal").mkdir()
        (d / ".legal" / "profile.md").write_text(
            "# Practice profile\n## Defaults for the stance\n"
            "JURISDICTION = <cz>      LANGUAGE = <cs>\nPOSTURE = <balanced>     AUDIENCE = <lawyer>\n"
            "Owner: [PLACEHOLDER]\n", encoding="utf-8")
        r = preflight(d)
        assert r["status"] == "provisional" and r["gaps"] == ["[PLACEHOLDER]"], r
        # configured profile: stance extracted, no gaps
        (d / ".legal" / "profile.md").write_text(
            "# Practice profile\n## Defaults for the stance\n"
            "JURISDICTION = <cz>      LANGUAGE = <cs; commentary en>\n"
            "POSTURE = <balanced>     AUDIENCE = <lawyer>\n", encoding="utf-8")
        r = preflight(d)
        assert r["status"] == "configured" and r["gaps"] == [], r
        assert r["stance"] == {"JURISDICTION": "cz", "LANGUAGE": "cs; commentary en",
                               "POSTURE": "balanced", "AUDIENCE": "lawyer"}, r["stance"]
        # matter detection: a `.legal/<slug>/state.json` is found
        (d / ".legal" / "acme").mkdir()
        (d / ".legal" / "acme" / "state.json").write_text("{}", encoding="utf-8")
        assert preflight(d)["matter"].endswith("acme"), preflight(d)["matter"]
    # real packs parse: every one carries a review_by date
    ps = packs()
    assert ps and all(p["review_by"] for p in ps), ps
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dir", default=".", help="matter folder or its parent (default: cwd)")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 unless the practice profile is configured")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    r = preflight(Path(args.dir))
    if args.json:
        print(json.dumps(r, ensure_ascii=False, indent=2))
    else:
        _human(r)
    return 1 if args.strict and r.get("status") != "configured" else 0


if __name__ == "__main__":
    sys.exit(main())
