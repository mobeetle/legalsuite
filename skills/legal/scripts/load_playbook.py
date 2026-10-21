#!/usr/bin/env python3
"""Playbook loader and checker for the legal suite (stdlib only).

Find, load, list and check: given a playbook SLUG (or explicit path), find
the first matching `<slug>.md` and print it; `--check` validates it against
the legalsuite playbook format 2 and scans it for leaked client facts.
In-skill authoring (`configure.md`) drafts playbooks with `status: draft` for
human sign-off; full bespoke authoring is also offered as a service.

    load_playbook.py <slug> [--root DIR]... [--json]
    load_playbook.py --list [--json]
    load_playbook.py --check <slug|path> [--json] [--strict]
    load_playbook.py --demo            # runnable self-check

Search order: explicit path > --root dirs > $LEGALSUITE_PLAYBOOKS
(os.pathsep-separated) > ./.legal/playbooks/ > suite playbooks/ >
~/.legal/playbooks/. First hit wins.

Exit 0 on hit (even when status is draft -- the warning goes to stderr and
the agent surfaces it at the checkpoint, the loader never blocks).
Exit 1 when the slug is not found; available slugs are listed on stderr.
--check --strict exits 1 when any check fails.

Ceiling: the leak scan is pattern-based (emails, phones, IČO, rodné číslo,
accounts, company names); it cannot recognise a client by description.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
from datetime import date
from pathlib import Path

from substance import tokens

# Source checkout: <repo>/skills/legal/scripts -> <repo>/playbooks.
# Installed layout: <config>/skills/legal/scripts -> <config>/playbooks. Same expression.
SUITE_PLAYBOOKS = Path(__file__).resolve().parents[3] / "playbooks"
USER_PLAYBOOKS = Path.home() / ".legal" / "playbooks"

REQUIRED_KEYS = ("name", "format", "scope", "jurisdiction", "role", "version", "status",
                 "owner", "updated", "review_by")
REQUIRED_SECTIONS = ("Scope", "Positions", "Red flags", "Provenance")
OTHER_SECTIONS = ("Clause library", "Standard definitions", "Negotiation sequence",
                  "Jurisdiction notes")
POSITION_COLS = ("ID", "Clause / issue", "Req", "Preferred (GREEN)", "Fallback (YELLOW)",
                 "Walk-away (RED)", "Approver", "Rationale")
RATING_RE = re.compile(r"\b(GREEN|YELLOW|RED)\b")
NEGATED = re.compile(r"(?:\bno|\bnot|without|never|\bnone of)\s+(?:\w+\s+){0,2}$", re.I)


def ratings(text: str) -> list[str]:
    """RATING tokens that are actually asserted, not negated mentions."""
    out = []
    for m in RATING_RE.finditer(text):
        if NEGATED.search(text[max(0, m.start() - 40):m.start()]):
            continue
        out.append(m.group(1))
    return out
POS_REF_RE = re.compile(r"\bP\d+[a-z]?\b")
LEAKS = [
    ("email", r"[\w.+-]+@[\w-]+\.[\w.-]+"),
    ("phone", r"\+\d{1,3}(?:\s?\d){8,}|(?<![\d/-])\d{3}\s\d{3}\s\d{3}(?![\d/])"),
    ("IČO", r"(?:IČO?|NIP|KRS|SIRET|SIREN|HRB|HRA|USt-IdNr\.?|REGON)\s*:?\s*\d{6,14}\b"),
    ("rodné číslo", r"(?<![\d/])\d{6}/\d{3,4}\b"),
    ("IBAN", r"\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b"),
    ("bank account", r"(?<![\w/-])(?:\d{1,6}-)?\d{2,10}/\d{4}\b"),
    ("company name", r"[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽÄÖÜŚŁŻŹĆŃ][\w&-]*,?\s+(?:spol\.\s?s\s?r\.\s?o\.|s\.\s?r\.\s?o\."
                     r"|a\.\s?s\.|v\.\s?o\.\s?s\.|k\.\s?s\.|GmbH|AG\b|KG\b|OHG\b|UG\b|Ltd\b\.?|PLC\b|LLP\b"
                     r"|Inc\.|Corp\.|LLC\b|SE\b|S\.A\.S\.?|S\.A\.R\.L\.?|S\.A\.|S\.L\.|Sp\.\s?z\s?o\.\s?o\.|S\.p\.A\.|N\.V\.|B\.V\.)"),
]
# ponytail: statute / EU act / case numbers look like bank accounts; skipped by context
_NOT_ACCOUNT = re.compile(r"(?:\(EU\)|\(ES\)|č\.|No\.?|Cdo|Odo|Cmo|Co|ÚS|As|Ads|Afs)\s*$")


def default_roots() -> list[Path]:
    env = [Path(p) for p in os.environ.get("LEGALSUITE_PLAYBOOKS", "").split(os.pathsep) if p]
    return env + [Path.cwd() / ".legal" / "playbooks", SUITE_PLAYBOOKS, USER_PLAYBOOKS]


def _date(s: str) -> date | None:
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


def _stale(meta: dict) -> bool:
    d = _date(meta.get("review_by", ""))
    return bool(d and d < date.today())


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Split a leading --- YAML-ish block into metadata + body. No YAML lib."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end < 0:
        return {}, text
    meta: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        if key:
            meta[key] = val.split("#", 1)[0].strip()
    return meta, text[end + 4:].lstrip("\n")


def find_all(slug: str, roots: list[Path]) -> Path | None:
    for root in roots:
        cand = root / f"{slug}.md"
        if cand.is_file():
            return cand
    return None


def list_all(roots: list[Path]) -> list[dict]:
    """Deduplicated by slug, first root wins. Skips _template.md."""
    seen: dict[str, dict] = {}
    for root in roots:
        if not root.is_dir():
            continue
        for f in sorted(root.glob("*.md")):
            slug = f.stem
            if slug in seen or slug.startswith("_") or slug.lower() == "readme":
                continue
            meta, _ = parse_frontmatter(f.read_text(encoding="utf-8"))
            seen[slug] = {"slug": slug, "path": str(f),
                          "status": meta.get("status", "unknown"),
                          "version": meta.get("version", ""),
                          "review_by": meta.get("review_by", ""), "stale": _stale(meta)}
    return list(seen.values())


def load(ref: str, roots: list[Path]) -> tuple[dict, str, Path]:
    p = Path(ref)
    if p.is_file():
        path = p
    else:
        found = find_all(ref.strip(), roots)
        if found is None:
            avail = [e["slug"] for e in list_all(roots)]
            hint = f"available: {', '.join(avail)}" if avail else "no playbooks found"
            raise FileNotFoundError(f"playbook {ref!r} not found ({hint})")
        path = found
    meta, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
    return meta, path.read_text(encoding="utf-8"), path


def _key(s: str) -> str:
    return re.sub(r"\s+", "", s.lower())


def check(text: str) -> list[dict]:
    """Format-2 validation + client-fact leak scan. Issues: {level, detail}."""
    issues = []
    add = lambda level, detail: issues.append({"level": level, "detail": detail})   # noqa: E731
    meta, body = parse_frontmatter(text)
    for k in REQUIRED_KEYS:
        if not meta.get(k):
            add("fail", f"frontmatter: missing {k}")
    status = meta.get("status", "")
    if status and status not in ("draft", "approved", "retired"):
        add("fail", f"frontmatter: status {status!r} not draft|approved|retired")
    if status == "approved" and not (meta.get("approved_by") and _date(meta.get("approved_at", ""))):
        add("fail", "frontmatter: approved without approved_by / approved_at (YYYY-MM-DD)")
    if status in ("draft", "retired"):
        add("warn", f"status is {status}")
    for k in ("updated", "review_by"):
        if meta.get(k) and not _date(meta[k]):
            add("warn", f"frontmatter: {k} {meta[k]!r} is not YYYY-MM-DD")
    if _stale(meta):
        add("warn", f"stale: review_by {meta['review_by']} is in the past")

    secs = {m.group(1).strip(): m.end() for m in re.finditer(r"^##\s+(.+)$", body, re.M)}
    for s in REQUIRED_SECTIONS + OTHER_SECTIONS:
        if s not in secs:
            add("fail" if s in REQUIRED_SECTIONS else "warn", f"missing section: ## {s}")

    ids = set()
    if "Positions" in secs:
        block = re.split(r"^##\s", body[secs["Positions"]:], maxsplit=1, flags=re.M)[0]
        rows = [[c.strip() for c in l.strip().strip("|").split("|")]
                for l in block.splitlines() if l.strip().startswith("|")]
        head = [_key(c) for c in rows[0]] if rows else []
        missing = [c for c in POSITION_COLS if _key(c) not in head]
        if missing:
            add("fail", f"Positions table missing columns: {', '.join(missing)}")
        else:
            col = {c: head.index(_key(c)) for c in POSITION_COLS}
            for r in rows[1:]:
                if all(set(c) <= set("-: ") for c in r):
                    continue   # separator row
                cell = lambda c: r[col[c]] if col[c] < len(r) else ""   # noqa: E731
                rid = cell("ID")
                if not rid or rid in ids:
                    add("fail", f"Positions: {'empty' if not rid else 'duplicate'} ID {rid!r}")
                ids.add(rid)
                if cell("Req").lower() not in ("must", "should", "optional"):
                    add("warn", f"Positions {rid}: Req {cell('Req')!r} not must|should|optional")
                if cell("Preferred (GREEN)") in ("", "-", "—") or cell("Walk-away (RED)") in ("", "-", "—"):
                    add("warn", f"Positions {rid}: Preferred and Walk-away must both be filled")
    for m in re.finditer(r"^###\s+(\S+)\s+[—–-]", body, re.M):
        if m.group(1) not in ids:
            add("fail", f"Clause library: ### {m.group(1)} has no matching position ID")

    offset = text[:len(text) - len(body)].count("\n")
    line = lambda pos: body.count("\n", 0, pos) + 1 + offset   # noqa: E731
    for label, rx in LEAKS:
        for m in re.finditer(rx, body):
            if label == "bank account" and (_NOT_ACCOUNT.search(body[max(0, m.start() - 12):m.start()])
                                            or re.match(r"\s*Sb\.", body[m.end():])):
                continue
            add("fail", f"leak: {label} {m.group()!r} (line {line(m.start())})")
    for (cat, val) in tokens(body):
        if cat in ("date", "money"):
            add("warn", f"{cat} {val!r} may be a deal-specific fact; universalise unless it is "
                        f"a policy threshold")
    return issues


def positions_of(text: str) -> dict[str, list[str]]:
    """The bound playbook's Positions table keyed by ID ({} when it has none)."""
    _, body = parse_frontmatter(text)
    m = re.search(r"^##\s+Positions\s*$", body, re.M)
    if not m:
        return {}
    block = re.split(r"^##\s", body[m.end():], maxsplit=1, flags=re.M)[0]
    rows = [[c.strip() for c in l.strip().strip("|").split("|")]
            for l in block.splitlines() if l.strip().startswith("|")]
    if len(rows) < 2:
        return {}
    head = [_key(c) for c in rows[0]]
    if _key("ID") not in head:
        return {}
    i = head.index(_key("ID"))
    return {r[i]: r for r in rows[1:]
            if i < len(r) and r[i] and not all(set(c) <= set("-: ") for c in r)}


def bind(artifact: str, positions: dict[str, list[str]]) -> list[dict]:
    """No positions -> no ratings: ratings need a bound playbook and known IDs."""
    issues = []
    rated = ratings(artifact)
    refs = sorted(set(POS_REF_RE.findall(artifact)))
    if rated and not positions:
        issues.append({"level": "fail",
                       "detail": f"artifact rates {len(rated)} finding(s) but no playbook is "
                                 "bound; no positions, no ratings"})
    if positions:
        unknown = [r for r in refs if r not in positions]
        if unknown:
            issues.append({"level": "fail",
                           "detail": f"position refs not in the bound playbook: {', '.join(unknown)}"})
    return issues


VALID = """---
name: NDA recipient
format: legalsuite-playbook/2
scope: mutual NDA — recipient side
jurisdiction: CZ
role: recipient
version: 1.0
status: approved
owner: head of commercial
approved_by: GC
approved_at: 2026-09-01
updated: 2026-09-01
review_by: 2099-01-01
---
# NDA recipient
## Scope
Mutual and one-way NDAs under Czech law (zákon č. 89/2012 Sb.; Regulation (EU) 2016/679).
## Positions
| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Term | must | 2 years | 3 years | over 5 years | GC | market |
## Clause library
### P1 — Term
Preferred wording:
> The obligations last two years.
## Standard definitions
## Red flags
Uncapped penalty.
## Negotiation sequence
## Jurisdiction notes
## Provenance
12 signed NDAs, reviewed by GC.
"""


def _demo() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        r = Path(tmp)
        (r / "saas.md").write_text(
            "---\nname: SaaS\nversion: 1.0\nstatus: approved\nupdated: 2026-10-01\n---\n\n# SaaS\n",
            encoding="utf-8")
        (r / "nda.md").write_text(
            "---\nname: NDA\nversion: 0.1\nstatus: draft\nreview_by: 2020-01-01\n---\n\n# NDA\n",
            encoding="utf-8")
        meta, text, path = load("saas", [r])
        assert meta["status"] == "approved" and path.name == "saas.md", (meta, path)
        assert text.startswith("---"), text[:20]
        entries = list_all([r])
        assert [e["slug"] for e in entries] == ["nda", "saas"], entries
        assert [e["stale"] for e in entries] == [True, False], entries
        try:
            load("missing", [r])
        except FileNotFoundError as e:
            assert "nda, saas" in str(e), e
        else:
            raise AssertionError("expected FileNotFoundError")
        os.environ["LEGALSUITE_PLAYBOOKS"] = str(r)
        assert load("nda", default_roots())[2].parent == r
    assert check(VALID) == [], check(VALID)
    leaky = VALID.replace("12 signed NDAs", "Deal with Alfa Beta s.r.o., jan.novak@alfa.cz, "
                                            "price 250 000 Kč, signed 1. 3. 2026")
    fails = [i["detail"] for i in check(leaky) if i["level"] == "fail"]
    assert any(d.startswith("leak: email") for d in fails), fails
    assert any(d.startswith("leak: company name 'Beta s.r.o.'") for d in fails), fails
    warns = [i["detail"] for i in check(leaky) if i["level"] == "warn"]
    assert any(d.startswith("money '250 000 Kč'") for d in warns), warns
    stale = check(VALID.replace("review_by: 2099-01-01", "review_by: 2020-01-01"))
    assert stale == [{"level": "warn", "detail": "stale: review_by 2020-01-01 is in the past"}], stale
    broken = check(VALID.replace("status: approved", "status: draft").replace("## Red flags", "")
                   .replace("### P1", "### P9").replace("| P1 | Term | must", "| P1 | Term | maybe"))
    assert {"fail", "warn"} == {i["level"] for i in broken} and len(broken) == 4, broken
    # I6: no positions -> no ratings
    pos = positions_of(VALID)
    assert set(pos) == {"P1"}, pos
    assert any("no positions, no ratings" in i["detail"] for i in bind("Stance: GREEN (P1).\n", {}))
    assert any("P9" in i["detail"] for i in bind("Stance: YELLOW (P9).\n", pos))
    assert bind("Stance: GREEN (P1).\n", pos) == []
    assert bind("No ratings here.\n", {}) == []
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("ref", nargs="?", help="playbook slug or explicit .md path")
    ap.add_argument("--root", action="append", default=[],
                    help="extra search directory (repeatable, checked first)")
    ap.add_argument("--list", action="store_true", help="list available playbooks")
    ap.add_argument("--check", metavar="REF", help="validate format + scan for client facts")
    ap.add_argument("--bind", metavar="ARTIFACT", help="check an artifact against a bound playbook")
    ap.add_argument("--playbook", help="--bind: the bound playbook slug (omit to model none bound)")
    ap.add_argument("--strict", action="store_true", help="--check/--bind: exit 1 on any fail")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)

    if args.demo:
        return _demo()

    roots = [Path(d) for d in args.root] + default_roots()

    if args.list:
        entries = list_all(roots)
        if args.json:
            print(json.dumps(entries, ensure_ascii=False, indent=2))
        else:
            for e in entries:
                ver = f" v{e['version']}" if e["version"] else ""
                stale = " STALE" if e["stale"] else ""
                print(f"{e['slug']:<24} [{e['status']}{ver}] review_by={e['review_by'] or '-'}"
                      f"{stale} {e['path']}")
            if not entries:
                print("no playbooks found", file=sys.stderr)
        return 0

    if args.check:
        try:
            _, text, path = load(args.check, roots)
        except FileNotFoundError as e:
            print(f"error: {e}", file=sys.stderr)
            return 1
        issues = check(text)
        ok = not any(i["level"] == "fail" for i in issues)
        if args.json:
            print(json.dumps({"path": str(path), "ok": ok, "issues": issues},
                             ensure_ascii=False, indent=2))
        else:
            for i in issues:
                print(f"{i['level'].upper():<4} {i['detail']}")
            print("check: OK" if ok else "check: FAIL")
        return 1 if args.strict and not ok else 0

    if args.bind:
        positions: dict[str, list[str]] = {}
        if args.playbook:
            try:
                _, text, _ = load(args.playbook, roots)
            except FileNotFoundError as e:
                print(f"error: {e}", file=sys.stderr)
                return 1
            positions = positions_of(text)
        try:
            artifact = Path(args.bind).read_text(encoding="utf-8")
        except OSError as e:
            print(f"error: {e}", file=sys.stderr)
            return 1
        issues = bind(artifact, positions)
        ok = not any(i["level"] == "fail" for i in issues)
        if args.json:
            print(json.dumps({"artifact": args.bind, "playbook": args.playbook or None,
                              "ok": ok, "issues": issues}, ensure_ascii=False, indent=2))
        else:
            for i in issues:
                print(f"{i['level'].upper():<4} {i['detail']}")
            print("bind: OK" if ok else "bind: FAIL")
        return 1 if args.strict and not ok else 0

    if not args.ref:
        ap.error("need SLUG or PATH (or --list, --check, or --demo)")

    try:
        meta, text, path = load(args.ref, roots)
    except FileNotFoundError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1

    if meta.get("status") == "draft":
        print(f"warning: playbook {path.stem!r} is draft (unapproved) -- "
              f"positions need human sign-off", file=sys.stderr)

    if args.json:
        print(json.dumps({"slug": path.stem, "path": str(path),
                           "status": meta.get("status", "unknown"),
                           "version": meta.get("version", ""),
                           "jurisdiction": meta.get("jurisdiction", ""),
                           "content": text}, ensure_ascii=False, indent=2))
    else:
        print(text, end="" if text.endswith("\n") else "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
