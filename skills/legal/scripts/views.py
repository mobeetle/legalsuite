#!/usr/bin/env python3
"""Generate the fact-map views (chronology, claims matrix, gaps) from facts.md.

A view is *derived data*: regenerated from `facts.md`, never hand-edited
(`references/fact-map.md`, §Views). Each output opens with the regeneration
banner so a stale copy is obvious.

    views.py --facts FACTS.md [--only chronology|claims|gaps] [--out DIR] [--json]
    views.py --demo

Ceiling: it renders the registers it is given; it never judges whether the
evidence meets the standard of proof (fact-map.md: "surface, don't decide").
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date
from pathlib import Path

from trace import FACTS_DEMO, parse_tables

OPEN = {"missing", "open", "disputed", "conceded"}
EVIDENCE_RISK = {"to obtain", "requested", "at risk", "unavailable"}
CONTESTS = {"y", "yes", "ano", "true", "?"}
TITLES = {"chronology": ("Chronology", "chronology.md"),
          "claims": ("Claims and defences matrix", "claims-matrix.md"),
          "gaps": ("Gaps", "gaps.md")}


def _rows(rows: dict, section: str) -> list[dict]:
    return [r for r in rows.values() if r["_section"] == section]


def _empty(v: str) -> bool:
    return (v or "").strip().lower() in ("", "—", "–", "-", "none", "n/a")


def _table(cols: tuple[str, ...], data: list[dict]) -> list[str]:
    out = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for row in data:
        out.append("| " + " | ".join((row.get(c.lower(), "") or "").replace("|", "\\|").strip()
                                     for c in cols) + " |")
    return out


def _banner() -> str:
    return f"_Generated from facts.md on {date.today().isoformat()}. Edit facts.md, then regenerate._"


def _risk(rows: dict) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    facts, events = _rows(rows, "Facts"), _rows(rows, "Events")
    evidence, issues = _rows(rows, "Evidence"), _rows(rows, "Issues")
    contested = [f for f in facts if (f.get("contested") or "").strip().lower() in CONTESTS]
    unevidenced = [f for f in facts if _empty(f.get("evidence"))]
    at_risk = [e for e in evidence if (e.get("status") or "").strip().lower() in EVIDENCE_RISK]
    open_elems = [i for i in issues if (i.get("status") or "").strip().lower() in OPEN]
    return contested, unevidenced, at_risk, open_elems


def build(rows: dict) -> dict[str, str]:
    facts, events = _rows(rows, "Facts"), _rows(rows, "Events")
    evidence, issues = _rows(rows, "Evidence"), _rows(rows, "Issues")
    contested, unevidenced, at_risk, open_elems = _risk(rows)

    chron = [f"# Chronology\n\n{_banner()}\n", "## Events\n"]
    chron += _table(("ID", "Date", "Precision", "Actor", "Act", "Facts", "Source"),
                    sorted(events, key=lambda r: (r.get("date", ""), r.get("id", ""))))
    chron += ["\n## Gaps and inconsistencies\n"]
    chron += [f"- contested fact `{f['id']}` — {f.get('proposition', '')}" for f in contested] or ["- none"]
    chron += [f"- fact `{f['id']}` has no evidence — {f.get('proposition', '')}" for f in unevidenced] or ["- none"]
    chron += [f"- evidence `{e['id']}` is `{e.get('status')}`" for e in at_risk] or ["- none"]

    claims = [f"# Claims and defences matrix\n\n{_banner()}\n"]
    claims += _table(("ID", "Issue", "Element", "Burden", "Standard", "Facts", "Evidence", "Status"),
                     issues)

    gaps = [f"# Gaps\n\n{_banner()}\n", "## Open issue elements\n"]
    gaps += [f"- `{i['id']}` {i.get('element', '')} — `{i.get('status')}` "
             f"(burden: {i.get('burden') or '—'})" for i in open_elems] or ["- none"]
    gaps += ["\n## Facts without evidence\n"]
    gaps += [f"- `{f['id']}` — {f.get('proposition', '')}" for f in unevidenced] or ["- none"]
    gaps += ["\n## Evidence to obtain or at risk\n"]
    gaps += [f"- `{e['id']}` {e.get('item', '')} — `{e.get('status')}`" for e in at_risk] or ["- none"]

    return {"chronology": "\n".join(chron) + "\n",
            "claims": "\n".join(claims) + "\n",
            "gaps": "\n".join(gaps) + "\n"}


def _demo() -> int:
    rows = parse_tables(FACTS_DEMO)
    v = build(rows)
    assert set(v) == {"chronology", "claims", "gaps"}, set(v)
    assert "| E1 | 2025-03-01 | day | both | signing | F1 | smlouva.pdf |" in v["chronology"]
    assert "contested fact `F2`" in v["chronology"], v["chronology"]
    assert "fact `F3` has no evidence" in v["chronology"], v["chronology"]
    assert "| I1.a | Defect |" in v["claims"], v["claims"]
    assert "`I1.a` existence — `open`" in v["gaps"], v["gaps"]
    assert build(parse_tables(FACTS_DEMO)) == v, "views must be deterministic"
    assert "Generated from facts.md" in v["gaps"]
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--facts", help="matter facts.md register")
    ap.add_argument("--only", choices=sorted(TITLES), help="emit one view")
    ap.add_argument("--out", help="write <view>.md files into this directory")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.facts:
        ap.error("need --facts FACTS.md (or --demo)")
    try:
        rows = parse_tables(Path(args.facts).read_text(encoding="utf-8"))
    except OSError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    views = build(rows)
    if args.only:
        views = {args.only: views[args.only]}
    if args.out:
        dest = Path(args.out)
        dest.mkdir(parents=True, exist_ok=True)
        written = {}
        for name, text in views.items():
            f = dest / TITLES[name][1]
            f.write_text(text, encoding="utf-8")
            written[name] = str(f)
        print(json.dumps(written, indent=2) if args.json else
              "\n".join(f"wrote {p}" for p in written.values()))
    elif args.json:
        print(json.dumps(views, ensure_ascii=False, indent=2))
    else:
        print("\n\n".join(views.values()), end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
