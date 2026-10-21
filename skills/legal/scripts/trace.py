#!/usr/bin/env python3
"""Fact and authority traceability check for legal work product (stdlib only).

Finds trace refs in an ARTIFACT -- `[F12]`, `[E3]`, `[X4]`, `[I1.b]`, `[A2]`,
lists `[F1, F3]`, `[AUTH:A2]` -- and resolves them against the matter
registers: facts.md (## Facts / Events / Evidence / Issues tables) and
authorities.md (citation ledger). Flags unknown IDs, facts without evidence,
reliance on contested facts, unverified authorities and untraced `[AUTH]`.

    trace.py ARTIFACT [--facts FACTS.md] [--authorities AUTHORITIES.md] [--json] [--strict]
    trace.py --demo                # runnable self-check

Exit 0 normally; --strict exits 1 when any check fails (warnings never block).
Inputs: ARTIFACT may be .txt, .md or .docx; registers are Markdown tables.

Ceiling: it checks that a ref points at a register row in the right state,
not that the row actually supports the sentence citing it.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path

from doctext import read_text

ID = r"[FEXIA]\d+(?:\.[a-z0-9]+)?"
REF_RE = re.compile(rf"\[(?:AUTH:)?({ID}(?:\s*,\s*{ID})*)\]")
AUTH_TAG_RE = re.compile(r"\[AUTH\]")
EMPTY = {"", "—", "–", "-", "none", "n/a"}
YES = {"y", "yes", "ano", "true"}
# I5: the two flag species are not provenance tags; a demotion must be recorded;
# a claimed pass must have a run behind it.
SEV_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}
WRONG_FLAG = re.compile(r"\[(Verify|VERIFY|Review|REVIEW)\]")
# A reason must name something: "unjustified:" is not a reason (the lookbehind
# keeps "justified:" from matching inside it).
REASON = re.compile(r"(?<![a-z])(?:reason|floor|justified|demoted because)\s*[:=]\s*\S+", re.I)
CHECK_CLAIM = re.compile(r"\b([A-Za-z_][A-Za-z_]*)\s*(?:[:=]\s*)?(✓|✗|pass|fail)(?![A-Za-z])", re.I)
CHECKS_SEG = re.compile(r"checks?\s*:\s*([^.\n·]*)", re.I)


def parse_tables(text: str) -> dict[str, dict]:
    """Every Markdown table row keyed by its ID cell; columns by lowercase header."""
    rows: dict[str, dict] = {}
    header, section = None, ""
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("#"):
            section, header = s.lstrip("#").strip(), None
            continue
        if not s.startswith("|"):
            header = None
            continue
        # ponytail: escaped pipes inside cells are not supported
        cells = [c.strip() for c in s.strip("|").split("|")]
        if header is None:
            header = [c.lower() for c in cells]
        elif not all(set(c) <= set("-: ") for c in cells):
            row = dict(zip(header, cells))
            rid = row.get("id") or cells[0]
            if rid:
                rows[rid] = {**row, "_section": section}
    return rows


def _issue(check, level, line, detail):
    return {"check": check, "level": level, "line": line, "detail": detail}


def trace(artifact: str, facts: dict | None, auths: dict | None,
          upstream: dict | None = None, verification: dict | None = None) -> dict:
    issues, seen = [], set()
    cited_f, cited_a = set(), set()

    def add(check, level, line, detail):
        if detail not in seen:   # one report per distinct problem, first line wins
            seen.add(detail)
            issues.append(_issue(check, level, line, detail))

    for n, line in enumerate(artifact.splitlines(), 1):
        ids = [i.strip() for m in REF_RE.finditer(line) for i in m.group(1).split(",")]
        if AUTH_TAG_RE.search(line) and not any(i.startswith("A") for i in ids):
            add("untraced", "warn", n, f"untraced authority: [AUTH] on line {n} has no A-ref")
        for rid in ids:
            reg, name = (auths, "authorities") if rid.startswith("A") else (facts, "facts")
            (cited_a if rid.startswith("A") else cited_f).add(rid)
            if reg is None:
                add("register", "warn", n, f"[{rid}]: {name} register not provided")
                continue
            row = reg.get(rid)
            if row is None:
                add("ref", "fail", n, f"[{rid}] not found in {name} register")
            elif rid.startswith("A"):
                res = row.get("result", "").lower()
                if res == "partial":
                    add("authority", "warn", n, f"[{rid}] only partially verified")
                elif res != "verified":
                    add("authority", "fail", n, f"[{rid}] authority not verified (result: {res or 'empty'})")
            elif rid.startswith("F"):
                if row.get("evidence", "").strip().lower() in EMPTY:
                    add("evidence", "warn", n, f"[{rid}] fact without evidence")
                if row.get("contested", "").strip().lower() in YES:
                    add("contested", "warn", n, f"[{rid}] relies on contested fact")
    # tag integrity: Facts carry a provenance tag, never a flag species
    for rid, row in (facts or {}).items():
        toks = set(re.findall(r"\w+", (row.get("tag") or "").lower()))
        if row["_section"] == "Facts" and toks & {"verify", "review"}:
            add("tag", "fail", 0, f"[{rid}] Tag cell holds a flag species, not a provenance tag")
    for m in WRONG_FLAG.finditer(artifact):
        add("tag", "warn", artifact.count("\n", 0, m.start()) + 1,
            f"flag species {m.group()!r} must be lowercase [verify] / [review]")

    # severity floor: a downstream demotion must be recorded
    for rid, row in (upstream or {}).items():
        up = SEV_RANK.get((row.get("severity") or "").strip().strip("[]").lower())
        if up is None:
            continue
        for n, line in enumerate(artifact.splitlines(), 1):
            if not re.search(rf"\b{re.escape(rid)}\b", line):
                continue
            here = [SEV_RANK[s.lower()] for s in re.findall(r"\[(CRITICAL|HIGH|MEDIUM|LOW)\]", line, re.I)]
            if here and max(here) < up and not REASON.search(line):
                add("floor", "fail", n,
                    f"demoted {rid} below upstream severity {row['severity']} without a recorded reason")

    # no unrun pass: a claimed check must have a run behind it
    segs = CHECKS_SEG.findall(artifact)
    if segs and verification is None:
        # An unrecorded pass is a claim, not evidence: it fails, it does not warn.
        add("unrun", "fail", 0, "artifact claims checks passed but no verification record was provided")
    else:
        recorded = {rid.lower(): (row.get("result") or row.get("status") or "").strip().lower()
                    for rid, row in (verification or {}).items()}
        for seg in segs:
            for name, mark in CHECK_CLAIM.findall(seg):
                if mark.lower() in ("✓", "pass") and recorded.get(name.lower()) != "pass":
                    add("unrun", "fail", 0,
                        f"claims check {name!r} passed but the verification record does not show pass")

    unverified = sorted(r for r, row in (auths or {}).items()
                        if row.get("result", "").lower() in ("unverified", "failed"))
    return {"ok": not any(i["level"] == "fail" for i in issues), "issues": issues,
            "stats": {"facts_cited": len(cited_f), "authorities_cited": len(cited_a),
                      "unverified_authorities": unverified}}


FACTS_DEMO = """# Facts register
## Facts
| ID | Proposition | Source anchor | Tag | Asserted by | Contested | Evidence |
|---|---|---|---|---|---|---|
| F1 | Contract signed 1. 3. 2025 | smlouva.pdf p1 | [DOC] | client | N | X1 |
| F2 | Goods were defective | email 5. 4. | [USER] | client | ano | X2 |
| F3 | Notice sent orally | call | [USER] | client | N | — |
## Events
| ID | Date | Precision | Actor | Act | Facts | Source |
|---|---|---|---|---|---|---|
| E1 | 2025-03-01 | day | both | signing | F1 | smlouva.pdf |
## Evidence
| ID | Item | Type | Supports | Weakens | Authenticity | Held by | Status |
|---|---|---|---|---|---|---|---|
| X1 | smlouva.pdf | document | F1 | | original | client | held |
## Issues
| ID | Issue | Element | Burden | Standard | Facts | Evidence | Status |
|---|---|---|---|---|---|---|---|
| I1.a | Defect | existence | buyer | preponderance | F2 | X2 | open |
"""
AUTH_DEMO = """## Ledger
| ID | Citation | Proposition | Source | Retrieved | In force at EPOCH | Quote | Weight | Status | Result | Extra |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 | § 2099 OZ | seller liable for defects | zakonyprolidi | 2026-10-01 | Y | "..." | binding | ok | verified | x |
| A2 | 23 Cdo 1/2020 | notice must be timely | nsoud.cz | 2026-10-01 | Y | | persuasive | ok | partial | |
| A3 | 33 Odo 9/2005 | oral notice suffices | memory | | ? | | | | unverified | |
"""


def _demo() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        f, a = Path(tmp) / "facts.md", Path(tmp) / "authorities.md"
        f.write_text(FACTS_DEMO, encoding="utf-8")
        a.write_text(AUTH_DEMO, encoding="utf-8")
        facts, auths = parse_tables(read_text(f)), parse_tables(read_text(a))
    assert facts["I1.a"]["_section"] == "Issues" and auths["A2"]["result"] == "partial"
    clean = "Smlouva byla uzavřena [F1, E1] a prodávající odpovídá [AUTH:A1] [I1.a] [X1].\n"
    r = trace(clean, facts, auths)
    assert r["ok"] and r["issues"] == [], r
    assert r["stats"] == {"facts_cited": 4, "authorities_cited": 1,
                          "unverified_authorities": ["A3"]}, r["stats"]
    art = ("Vady byly [F2]. Oznámení [F3] stačí [A3].\n"
           "Včasnost [A2]; viz též [F9].\n"
           "Judikatura to potvrzuje [AUTH].\n")
    got = {(i["check"], i["level"], i["detail"]) for i in trace(art, facts, auths)["issues"]}
    assert got == {("contested", "warn", "[F2] relies on contested fact"),
                   ("evidence", "warn", "[F3] fact without evidence"),
                   ("authority", "fail", "[A3] authority not verified (result: unverified)"),
                   ("authority", "warn", "[A2] only partially verified"),
                   ("ref", "fail", "[F9] not found in facts register"),
                   ("untraced", "warn", "untraced authority: [AUTH] on line 3 has no A-ref")}, got
    r = trace("Bod [F1] a [A1].", None, None)
    assert r["ok"] and [i["detail"] for i in r["issues"]] == [
        "[F1]: facts register not provided", "[A1]: authorities register not provided"], r
    # I5: severity floor, unrun pass, tag integrity
    up = parse_tables("## Findings\n| ID | Finding | Severity |\n|---|---|---|\n| G1 | cap | HIGH |\n")
    bad = trace("Finding G1 [LOW] -- harmless.\n", None, None, up, None)
    assert ("floor", "fail") in {(i["check"], i["level"]) for i in bad["issues"]}, bad
    ok = trace("Finding G1 [LOW] -- reason: de minimis for this deal.\n", None, None, up, None)
    assert not [i for i in ok["issues"] if i["check"] == "floor"], ok
    ver = parse_tables("## Record\n| ID | Result |\n|---|---|\n| structure | pass |\n")
    unrun = trace("Done - checks: structure \u2713, scan \u2713 - assumed: none.\n", None, None, None, ver)
    assert any(i["check"] == "unrun" and i["level"] == "fail" and "scan" in i["detail"]
               for i in unrun["issues"]), unrun
    tagged = parse_tables("## Facts\n| ID | Proposition | Tag | Evidence |\n|---|---|---|---|\n"
                          "| F1 | x | [verify] | X1 |\n")
    assert any(i["check"] == "tag" and i["level"] == "fail" for i in trace("x [F1]", tagged, None)["issues"])
    assert any(i["check"] == "tag" for i in trace("See [Verify] this.", None, None)["issues"])
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("artifact", nargs="?", help=".txt, .md or .docx work product")
    ap.add_argument("--facts", help="matter facts.md register")
    ap.add_argument("--authorities", help="matter authorities.md citation ledger")
    ap.add_argument("--upstream", help="findings register with a Severity column (severity floor)")
    ap.add_argument("--verification", help="verification-<artifact>.md record (no unrun passes)")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--strict", action="store_true", help="exit 1 if any check fails")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.artifact:
        ap.error("need ARTIFACT (or --demo)")
    facts = parse_tables(read_text(args.facts)) if args.facts else None
    auths = parse_tables(read_text(args.authorities)) if args.authorities else None
    upstream = parse_tables(read_text(args.upstream)) if args.upstream else None
    verification = parse_tables(read_text(args.verification)) if args.verification else None
    res = trace(read_text(args.artifact), facts, auths, upstream, verification)
    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        for i in res["issues"]:
            print(f"{i['level'].upper():<4} {i['check']:<9} L{i['line']:<4} {i['detail']}")
        print("trace: OK" if res["ok"] else "trace: FAIL", res["stats"])
    return 1 if args.strict and not res["ok"] else 0


if __name__ == "__main__":
    sys.exit(main())
