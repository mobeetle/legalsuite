#!/usr/bin/env python3
"""House-style check for legal documents (stdlib only).

Deterministic house-style rules on one document -- separate from structure.py,
which checks integrity, not style:

  thematic-break  fail  a `---` / `***` rule between paragraphs
  list-punct      fail  a bullet glyph in front of a `(a)` / `(i)` item
  ampersand       warn  `&` in running text (spell it out as "and")
  banned-word     warn  a filler word the house avoids ("strictly" by default)

The four rules the house fixed by hand. `&` inside a URL, an XML entity or a
closed compound (M&A, R&D, AT&T) is left alone; the canonical legal
collocations "strictly necessary/confidential/prohibited" are exempt; fenced
code blocks and YAML front-matter are skipped. Add matter words with --ban or
the profile's house-style list (`references/capabilities/style.md`).

    style.py DOC [--json] [--strict] [--ban WORD]... [--demo]

Exit 0 normally; --strict exits 1 when any check fails (warnings never block).
Inputs: .txt, .md or .docx (accepted view).

Ceiling: line-based regexes, not a document model. "Use `strictly` less often"
is a judgement; only the default list is caught, and a legitimate use must be
exempted with --ban off / the profile list.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from doctext import read_text

BREAK_RE = re.compile(r"^[-*_]{3,}$")
LIST_RE = re.compile(r"^\s*[-*+]\s+\((?:[0-9]+|[a-z]|[ivxlc]+)\)\s")
URL_RE = re.compile(r"https?://\S+")
ENTITY_RE = re.compile(r"&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);")
FENCE_RE = re.compile(r"^\s*```")
DEFAULT_BANS = ("strictly",)
# ponytail: fixed exemption list, not a linguistics model; add collocations as they bite
EXEMPT_RE = re.compile(r"strictly\s+(?:necessary|confidential|prohibited|speaking|limited)", re.I)


def _issue(check, level, line, detail):
    return {"check": check, "level": level, "line": line, "detail": detail}


def _body_lines(lines):
    """Line numbers not inside a fence, and not inside YAML front-matter."""
    fm_end = -1
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                fm_end = i
                break
    fenced, out = False, []
    for i, line in enumerate(lines, 1):
        if i - 1 <= fm_end:
            continue
        if FENCE_RE.match(line):
            fenced = not fenced       # the fence line itself is structural, not text
            continue
        if not fenced:
            out.append((i, line))
    return out


def _ampersand(line):
    """True when the line has an `&` in running text (not URL/entity/compound)."""
    scan = URL_RE.sub("", line)
    idxs = [m.start() for m in re.finditer("&", scan)]
    for i in idxs:
        if ENTITY_RE.match(scan, i):
            continue
        left = scan[i - 1] if i > 0 else ""
        right = scan[i + 1] if i + 1 < len(scan) else ""
        if left.isspace() or right.isspace() or left == "" or right == "":
            return True
    return False


def check(text: str, bans=()) -> dict:
    lines = text.splitlines()
    words = tuple(DEFAULT_BANS) + tuple(w for w in bans if w not in DEFAULT_BANS)
    issues, stats = [], {"breaks": 0, "listpunctuation": 0, "ampersands": 0, "banned": 0}
    for n, line in _body_lines(lines):
        s = line.strip()
        if BREAK_RE.match(s):
            stats["breaks"] += 1
            issues.append(_issue("thematic-break", "fail", n, f"thematic break {s!r}"))
            continue
        m = LIST_RE.match(line)
        if m:
            stats["listpunctuation"] += 1
            issues.append(_issue("list-punct", "fail", n,
                                 f"bullet before enumerator {m.group().strip()!r}"))
        if _ampersand(line):
            stats["ampersands"] += 1
            issues.append(_issue("ampersand", "warn", n, f"'&' in running text: {s[:80]}"))
        scan = EXEMPT_RE.sub("", URL_RE.sub("", line))
        for w in words:
            if re.search(r"(?<!\w)" + re.escape(w) + r"(?!\w)", scan, re.I):
                stats["banned"] += 1
                issues.append(_issue("banned-word", "warn", n, f"avoid {w!r}: {s[:80]}"))
    return {"ok": not any(i["level"] == "fail" for i in issues), "issues": issues, "stats": stats}


def _fixture(name: str):
    p = Path(__file__).with_name("fixtures") / name
    return p.read_text(encoding="utf-8") if p.exists() else None


def _demo() -> int:
    dirty = ("# PARTNERSHIP & PILOT AGREEMENT\n"
             "\n"
             "---\n"
             "\n"
             "1.2. **Definitions:**\n"
             "- (a) \"Affiliate\" means any entity that controls a Party.\n"
             "- (b) \"Wholesale Price\" means List Price minus the discount.\n"
             "\n"
             "---\n"
             "\n"
             "5.3. ALL TECHNOLOGY IS PROVIDED STRICTLY \"AS IS.\"\n"
             "5.4. See https://www.jetbrains.com/legal/?a=1&b=2 and M&A, R&D, AT&T.\n"
             "7.1. This relationship is strictly non-exclusive.\n"
             "9.1. Data is strictly necessary for the deal.\n")
    got = {(i["check"], i["level"]) for i in check(dirty)["issues"]}
    assert ("thematic-break", "fail") in got, got
    assert ("list-punct", "fail") in got, got
    assert ("ampersand", "warn") in got, got
    assert ("banned-word", "warn") in got, got
    r = check(dirty)
    assert r["stats"]["breaks"] == 2, r["stats"]
    assert r["stats"]["listpunctuation"] == 2, r["stats"]
    assert r["stats"]["ampersands"] == 1, r["stats"]      # URL & and compounds ignored
    assert r["stats"]["banned"] == 2, r["stats"]          # "strictly necessary" exempt
    assert not r["ok"]

    clean = ("# PARTNERSHIP AND PILOT AGREEMENT\n"
             "\n"
             "1.2. **Definitions:**\n"
             "(a) \"Affiliate\" means any entity that controls a Party.\n"
             "(b) \"Wholesale Price\" means List Price minus the discount.\n"
             "\n"
             "5.3. ALL TECHNOLOGY IS PROVIDED \"AS IS.\"\n"
             "5.4. See https://www.jetbrains.com/legal/#terms-and-agreements and M&A, R&D.\n"
             "7.1. This relationship is non-exclusive.\n"
             "9.1. Data is strictly necessary for the deal.\n"
             "9.2. Use of Data is not required.\n"
             "9.3. Each Party acts as an independent controller under applicable law.\n")
    rc = check(clean)
    assert rc["issues"] == [], rc["issues"]

    # matter fixture: the v. 20261015 Rev 2 excerpt the user corrected by hand
    bad = _fixture("gsi-rev2-excerpt.md")
    good = _fixture("gsi-rev2-clean.md")
    if bad is not None and good is not None:
        gb = {(i["check"], i["level"]) for i in check(bad)["issues"]}
        assert {("thematic-break", "fail"), ("list-punct", "fail"),
                ("ampersand", "warn"), ("banned-word", "warn")} <= gb, gb
        assert check(good)["issues"] == [], check(good)["issues"]
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("doc", nargs="?", help=".txt, .md or .docx")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--strict", action="store_true", help="exit 1 if any check fails")
    ap.add_argument("--ban", action="append", default=[], metavar="WORD",
                    help="further filler word(s) to avoid (repeatable)")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.doc:
        ap.error("need DOC (or --demo)")
    res = check(read_text(args.doc), args.ban)
    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        for i in res["issues"]:
            print(f"{i['level'].upper():<4} {i['check']:<14} L{i['line']:<4} {i['detail']}")
        print("style: OK" if res["ok"] else "style: FAIL", res["stats"])
    return 1 if args.strict and not res["ok"] else 0


if __name__ == "__main__":
    sys.exit(main())
