#!/usr/bin/env python3
"""Citation-ledger rows for a matter: append an authority, resolve its result (stdlib only).

The ledger is a matter's `authorities.md` in the format of
`references/citation-ledger.md`. `add` appends a row with a monotonic `A<n>` id;
`verify` sets a row's `Result` (and Source/Retrieved) once it has been checked
against source. This is the backing script for the local MCP tools `ledger_add`
and `ledger_verify` (IMPROVEMENT-PLAN §1A.1).

    ledger.py add    --dir DIR --citation C --proposition P [--source S] [--retrieved D]
                     [--in-force V] [--quote Q] [--weight W] [--status ST] [--result R] [--json]
    ledger.py verify --dir DIR --id A1 --result verified [--source S] [--retrieved D] [--json]
    ledger.py --demo

Exit 0 normally; exit 1 on a bad enum, a missing row, or no ledger table.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from datetime import date
from pathlib import Path

COLS = ("ID", "Citation", "Proposition", "Source", "Retrieved", "In force at EPOCH",
        "Quote", "Weight", "Status", "Result")
RESULTS = ("verified", "partial", "unverified", "failed")
WEIGHTS = ("binding", "persuasive", "commentary", "lead")
STATUSES = ("in force", "amended", "repealed", "good law", "overruled", "doubted", "unknown")
ROW_RE = re.compile(r"^\|\s*(A\d+)\s*\|")


def _blank_ledger() -> str:
    return ("# Authorities\n\n| " + " | ".join(COLS) + " |\n"
            + "|" + "---|" * len(COLS) + "\n")


def _header(text: str) -> tuple[list[str], int | None, list[str] | None]:
    lines = text.splitlines()
    for i, ln in enumerate(lines):
        cells = [c.strip().lower() for c in ln.strip().strip("|").split("|")]
        if cells[:1] == ["id"] and "result" in cells:
            return lines, i, cells
    return lines, None, None


def _row_line(rid: str, row: dict) -> str:
    return "| " + " | ".join(str(row.get(c, "")).replace("|", "\\|") for c in COLS) + " |"


def add(dir_: str, row: dict) -> str:
    """Append a row; returns the assigned id."""
    p = Path(dir_) / "authorities.md"
    text = p.read_text(encoding="utf-8") if p.is_file() else _blank_ledger()
    lines, h, _ = _header(text)
    if h is None:
        text = _blank_ledger()
        lines, h, _ = _header(text)
    ids = [int(m.group(1)[1:]) for ln in lines if (m := ROW_RE.match(ln))]
    rid = f"A{(max(ids) + 1) if ids else 1}"
    line = _row_line(rid, {"ID": rid, **row})
    last = max((i for i, ln in enumerate(lines) if ln.lstrip().startswith("|")), default=h)
    lines.insert(last + 1, line)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return rid


def verify(dir_: str, rid: str, result: str, source: str = "", retrieved: str = "") -> None:
    p = Path(dir_) / "authorities.md"
    lines, h, cells = _header(p.read_text(encoding="utf-8"))
    if h is None or cells is None:
        raise ValueError("no citation-ledger table in authorities.md")
    idx = {c: i for i, c in enumerate(cells)}
    for i, ln in enumerate(lines):
        if (m := ROW_RE.match(ln)) and m.group(1) == rid:
            parts = [c.strip() for c in ln.strip().strip("|").split("|")]
            parts += [""] * (len(cells) - len(parts))
            parts[idx["result"]] = result
            if source:
                parts[idx["source"]] = source
            if retrieved:
                parts[idx["retrieved"]] = retrieved
            lines[i] = "| " + " | ".join(parts) + " |"
            p.write_text("\n".join(lines) + "\n", encoding="utf-8")
            return
    raise ValueError(f"row {rid} not found in the ledger")


def _demo() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        rid = add(tmp, {"Citation": "§ 1 [STATUTE]", "Proposition": "the rule",
                        "Source": "<URL>", "Retrieved": date.today().isoformat(),
                        "Quote": "match", "Weight": "binding", "Status": "in force",
                        "Result": "unverified"})
        assert rid == "A1", rid
        rid2 = add(tmp, {"Citation": "A-2", "Proposition": "second"})
        assert rid2 == "A2", rid2
        verify(tmp, "A1", "verified", source="<URL>", retrieved="2026-10-12")
        text = (Path(tmp) / "authorities.md").read_text(encoding="utf-8")
        assert "| A1 | § 1 [STATUTE] | the rule |" in text, text
        assert text.count("| verified |") == 1 and "| A1 |" in text
        # append-only: the earlier rows are untouched by a later add
        add(tmp, {"Citation": "A-3", "Proposition": "third"})
        assert (Path(tmp) / "authorities.md").read_text(encoding="utf-8").count("| A1 |") == 1
        try:
            verify(tmp, "A9", "verified")
        except ValueError as e:
            assert "A9" in str(e)
        else:
            raise AssertionError("expected ValueError")
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd")

    a = sub.add_parser("add", help="append an authority row")
    a.add_argument("--dir", required=True)
    a.add_argument("--citation", required=True)
    a.add_argument("--proposition", required=True)
    a.add_argument("--source", default="")
    a.add_argument("--retrieved", default="")
    a.add_argument("--in-force", dest="in_force", default="")
    a.add_argument("--quote", default="—")
    a.add_argument("--weight", default="")
    a.add_argument("--status", default="unknown")
    a.add_argument("--result", default="unverified")
    a.add_argument("--json", action="store_true")

    v = sub.add_parser("verify", help="set a row's Result")
    v.add_argument("--dir", required=True)
    v.add_argument("--id", required=True)
    v.add_argument("--result", required=True)
    v.add_argument("--source", default="")
    v.add_argument("--retrieved", default="")
    v.add_argument("--json", action="store_true")

    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if args.cmd == "add":
        if args.result not in RESULTS:
            print(f"error: --result {args.result!r} not one of {list(RESULTS)}", file=sys.stderr)
            return 1
        if args.weight and args.weight not in WEIGHTS:
            print(f"error: --weight {args.weight!r} not one of {list(WEIGHTS)}", file=sys.stderr)
            return 1
        if args.status not in STATUSES:
            print(f"error: --status {args.status!r} not one of {list(STATUSES)}", file=sys.stderr)
            return 1
        row = {"Citation": args.citation, "Proposition": args.proposition, "Source": args.source,
               "Retrieved": args.retrieved or date.today().isoformat(), "In force at EPOCH": args.in_force,
               "Quote": args.quote, "Weight": args.weight, "Status": args.status, "Result": args.result}
        try:
            rid = add(args.dir, row)
        except OSError as e:
            print(f"error: {e}", file=sys.stderr)
            return 1
        print(json.dumps({"ok": True, "id": rid}, indent=2) if args.json else f"added {rid}")
        return 0
    if args.cmd == "verify":
        if args.result not in RESULTS:
            print(f"error: --result {args.result!r} not one of {list(RESULTS)}", file=sys.stderr)
            return 1
        try:
            verify(args.dir, args.id, args.result, args.source, args.retrieved)
        except (OSError, ValueError) as e:
            print(f"error: {e}", file=sys.stderr)
            return 1
        print(json.dumps({"ok": True, "id": args.id, "result": args.result}, indent=2)
              if args.json else f"{args.id}: {args.result}")
        return 0
    ap.error("need a command (add|verify) or --demo")


if __name__ == "__main__":
    sys.exit(main())
