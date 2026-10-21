#!/usr/bin/env python3
"""Screen-contract lint for what is shown in the TUI (stdlib only).

The rendered turn is governed by `references/display.md`: ASCII-only map box,
hard wrap at 76 cols, no markdown table over 4 columns, and a closing pair on
every turn -- a `FILES` link block, then a `=== WHERE WE ARE` Progress box as the
final block, with nothing after it. Prose alone is ignored by the model that
wrote it, so this makes the contract executable. Run it on the markdown about to
be pasted into chat, not on the suite's own spec files (whose instructional
grammar is deliberately non-ASCII).

    display.py FILE [--json] [--strict]
    display.py --emit files    --paths A,B,C          # FILES link block
    display.py --emit progress --door D --artifact A --step S [--step S ...]
    display.py --emit reviewer_note [--sources ...] [--read ...]
    display.py --demo              # runnable self-check

`--emit` prints the exact closing-pair block shapes from `references/display.md`
(FILES, Progress box, reviewer note) so the model does not re-type the
furniture; `display.py FILE` still lints a pasted turn.

Exit 0 normally; --strict exits 1 when any check fails (the width and progress
rules never block -- they warn). Inputs: .txt, .md or .docx.

Ceiling: line-based, so it judges the artifact, not the rendering. It cannot
see how wide the user's terminal actually is, and it flags glyphs anywhere in
the file -- a screen artifact quoting a Unicode tree will trip it by design. The
progress rule keys on the `FILES` block (or a legacy `-> full:` tail), so it
judges a whole turn, not a fragment of one.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from doctext import read_text

# Box-drawing (U+2500-U+257F) and arrows (U+2190-U+21FF), plus the pointer
# triangles display.md names. `●` is excluded: it is the blank marker, not a tree glyph.
GLYPH_RE = re.compile("[\u2500-\u257f\u2190-\u21ff\u25ba\u25c4\u25b2\u25bc]")
SEP_RE = re.compile(r"^\|?[\s:|-]+\|[\s:|-]*$")
# A turn closes with the display.md closing pair: a `FILES` link block, then the
# fenced Progress box as the last block. All three markers are plain ASCII.
FILES_RE = re.compile(r"^FILES\s*$")
TAIL_RE = re.compile(r"^-> full:\s")  # legacy single-path tail, still detected
PROGRESS_RE = re.compile(r"^=== WHERE WE ARE =+\s*$")
WIDTH = 76
MAX_COLS = 4


def _issue(check, level, line, detail):
    return {"check": check, "level": level, "line": line, "detail": detail}


def glyphs(lines):
    return [_issue("glyphs", "fail", n, f"non-ASCII {m.group()!r} -- map box is ASCII-only (|-- +-- -> <->)")
            for n, line in enumerate(lines, 1)
            for m in [GLYPH_RE.search(line)] if m]


def tables(lines):
    issues = []
    for n in range(len(lines) - 1):
        head = lines[n].strip()
        if not head.startswith("|") or not SEP_RE.match(lines[n + 1].strip()):
            continue
        cols = [c for c in head.strip("|").split("|")]
        if len(cols) > MAX_COLS:
            issues.append(_issue("table", "fail", n + 1,
                                 f"{len(cols)}-column table -- {MAX_COLS} max on screen, else a vertical list"))
    return issues


def widths(lines):
    issues, fenced = [], False
    for n, line in enumerate(lines, 1):
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if fenced and len(line) > WIDTH:
            issues.append(_issue("width", "warn", n, f"{len(line)} cols in a fenced block -- wrap at {WIDTH}"))
    return issues


def progress(lines):
    """A turn must close with the Progress box (display.md). A turn is an
    artifact that carries a `FILES` link block (or a legacy `-> full:` tail); a
    deliverable pasted on its own carries neither and is not judged here."""
    box = next((n for n, line in enumerate(lines) if PROGRESS_RE.match(line)), None)
    turn_at = next((n for n, line in enumerate(lines)
                    if FILES_RE.match(line) or TAIL_RE.match(line)), None)
    if box is None:
        if turn_at is None:
            return []
        return [_issue("progress", "warn", turn_at + 1,
                       "turn has a `FILES`/tail but no `=== WHERE WE ARE` Progress box (display.md)")]
    # The box is the last block: nothing but blanks may follow its closing fence.
    close = next((n for n in range(box + 1, len(lines))
                  if lines[n].lstrip().startswith("```")), None)
    after = close + 1 if close is not None else box + 1
    trailing = [n for n in range(after, len(lines)) if lines[n].strip()]
    if trailing:
        return [_issue("progress", "warn", trailing[0] + 1,
                       "content after the Progress box -- it must close the turn (display.md)")]
    return []


def check(text: str) -> dict:
    lines = text.splitlines()
    issues = glyphs(lines) + tables(lines) + widths(lines) + progress(lines)
    return {"ok": not any(i["level"] == "fail" for i in issues), "issues": issues,
            "stats": {"lines": len(lines),
                      "fails": sum(i["level"] == "fail" for i in issues),
                      "warns": sum(i["level"] == "warn" for i in issues)}}


# --- emit: the fixed closing furniture (display.md block templates) -----------
PROGRESS_HEAD = "=== WHERE WE ARE " + "=" * 26
PROGRESS_SEP = "-" * 43
_STEP_RE = re.compile(r"^\s*(done|now|todo|next|x)\s*[:.)]\s*(.*)$", re.I)
_MARK = {"done": ("[x]", "done"), "x": ("[x]", "done"),
         "now": ("[>]", "<- now"),
         "todo": ("[ ]", "next"), "next": ("[ ]", "next")}


def emit_files(paths: list[str]) -> str:
    """The FILES block: one link per file, then the same absolute path in code."""
    out = ["FILES"]
    for p in paths:
        if not Path(p).exists():
            print(f"warn: file does not exist (link anyway): {p}", file=sys.stderr)
        target = f"<{p}>" if " " in p else p
        out.append(f"- [{Path(p).name}]({target})")
        out.append(f"  `{p}`")
    return "\n".join(out)


def emit_progress(door: str, artifact: str, findings: int, steps: list[str],
                  now: str, so_far: str, nxt: str, goal: str = "", done: str = "") -> str:
    """The Progress box: fenced, the final block, one marker per step."""
    body = [PROGRESS_HEAD, f"{door} · {artifact} · {findings} findings"]
    if goal:
        body.append(f"{'goal:':<10}{goal}")
    if done:
        body.append(f"{'done:':<10}{done}")
    for i, s in enumerate(steps, 1):
        m = _STEP_RE.match(s)
        mark, anno = _MARK[m.group(1).lower()] if m else ("[ ]", "next")
        text = m.group(2).strip() if m else s.strip()
        body.append(f"{f'{mark} {i}. {text}':<22}  {anno}")
    body += [PROGRESS_SEP,
             f"{'now:':<10}{now}", f"{'so far:':<10}{so_far}", f"{'-> next:':<10}{nxt}"]
    return "```text\n" + "\n".join(body) + "\n```"


def emit_reviewer_note(sources: str = "", read: str = "", flagged: str = "",
                       currency: str = "", before: str = "", clean: bool = False) -> str:
    """The reviewer note: one blockquote; collapses to one line when clean."""
    fields = [("Sources", sources), ("Read", read), ("Flagged for your judgment", flagged),
              ("Currency", currency), ("Before relying", before)]
    given = [(k, v) for k, v in fields if v]
    if clean or not given:
        one = " · ".join(v for _, v in given) or "full read · no flags · ready for your eyes"
        return f"> **⚠️ Reviewer note:** {one}"
    return "\n".join(["> **⚠️ Reviewer note**"] + [f"> - **{k}:** {v}" for k, v in given])


def _demo() -> int:
    # Closing pair: FILES links, then the Progress box as the last block.
    good = ("```text\n"
            "[Matter: acme]\n"
            "|-- Symbols\n"
            "|   +-- Norm: \"DPH\" -- § 2 zak. 235/2004 (base §3)\n"
            "+-- Trace[T1]: counterparty.amends(removes DPH)\n"
            "        ESTABLISHES_BOUNDARY: NOT(no DPH)\n"
            "```\n"
            "| Issue | Severity | Fix |\n"
            "|---|---|---|\n"
            "| Cap | [HIGH] | strike |\n"
            "FILES\n"
            "- [findings.md](/tmp/acme/findings.md)\n"
            "  `/tmp/acme/findings.md`\n"
            "```text\n"
            "=== WHERE WE ARE ==========================\n"
            "legal-review · nda.md · 1 finding\n"
            "[x] 1. Plan            done\n"
            "[>] 2. Findings        <- now\n"
            "[ ] 3. Redline         next\n"
            "-------------------------------------------\n"
            "now:      Vat clause stands (base agreement)\n"
            "so far:   plan approved, map built\n"
            "-> next:  Redline — say \"go\"\n"
            "```\n")
    r = check(good)
    assert r["ok"] and r["issues"] == [], r["issues"]

    bad = good.replace("|-- Symbols", "├─ Symbols").replace("+-- Trace", "└─ Trace")
    bad = bad.replace("| Issue | Severity | Fix |\n|---|---|---|",
                      "| Clause | Actor | Condition | Effect | Tag |\n|---|---|---|---|---|")
    bad = bad.replace("FILES\n", "```text\n" + "x" * 90 + "\n```\nFILES\n")  # over-width, before the box
    got = {(i["check"], i["level"]) for i in check(bad)["issues"]}
    assert got == {("glyphs", "fail"), ("table", "fail"), ("width", "warn")}, got

    # A turn (has FILES) with no Progress box warns; a plain deliverable with
    # neither marker is not judged.
    turn = "Short answer.\nFILES\n- [memo.md](/tmp/acme/memo.md)\n"
    pr = check(turn)
    assert pr["ok"] and [i["check"] for i in pr["issues"]] == ["progress"], pr["issues"]
    assert check("Blank [● price] and § 5, s.r.o. stay legal.")["ok"]

    # The box must be the last block: content after it warns.
    tl = check(good + "stray line after the box\n")
    assert [i["check"] for i in tl["issues"]] == ["progress"], tl["issues"]
    assert "after the Progress box" in tl["issues"][0]["detail"], tl["issues"]

    # emit: the fixed blocks match display.md byte-for-shape.
    assert emit_files(["/tmp/acme/memo.docx"]) == \
        "FILES\n- [memo.docx](/tmp/acme/memo.docx)\n  `/tmp/acme/memo.docx`"
    assert "- [plan.md](</tmp/My Dir/plan.md>)" in emit_files(["/tmp/My Dir/plan.md"])
    box = emit_progress("legal-review", "nda.md", 3, ["done:Plan", "now:Findings", "next:Redline"],
                        "findings drafted", "plan approved", 'Redline — say "go"')
    bl = box.splitlines()
    assert bl[0] == "```text" and bl[1] == PROGRESS_HEAD == "=== WHERE WE ARE =========================="
    assert bl[2] == "legal-review · nda.md · 3 findings"
    assert bl[3].startswith("[x] 1. Plan") and bl[3].endswith("done"), bl[3]
    assert "[>] 2. Findings" in box and "<- now" in box
    assert "[ ] 3. Redline" in box and bl[-2].startswith("-> next:") and box.endswith("```")
    # Goal lines: omitted by default (old calls byte-identical), emitted when given.
    plain = emit_progress("legal-review", "nda.md", 3, ["done:Plan"],
                          "findings drafted", "plan approved", 'Redline — say "go"')
    assert "goal:" not in plain and "done:" not in plain
    with_goal = emit_progress("legal-review", "nda.md", 3, ["done:Plan"],
                              "findings drafted", "plan approved", 'Redline — say "go"',
                              goal="decide signability", done="verdict [OPEN] — 0/1")
    assert "\ngoal:     decide signability\n" in with_goal
    assert "\ndone:     verdict [OPEN] — 0/1\n" in with_goal
    assert check(with_goal)["ok"]
    note = emit_reviewer_note(sources="CourtListener verified", read="pages 1-50 of 200",
                              flagged="2 [review]", currency="searched — nothing found",
                              before="ready for your eyes")
    assert note.startswith("> **⚠️ Reviewer note**\n> - **Sources:**")
    assert emit_reviewer_note(clean=True) == \
        "> **⚠️ Reviewer note:** full read · no flags · ready for your eyes"
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("doc", nargs="?", help=".txt, .md or .docx")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--strict", action="store_true", help="exit 1 if any check fails")
    ap.add_argument("--emit", choices=["files", "progress", "reviewer_note"],
                    help="emit a closing-pair block instead of linting")
    ap.add_argument("--paths", help="comma-separated absolute paths (--emit files)")
    ap.add_argument("--path", action="append", default=[], help="absolute path (repeatable)")
    ap.add_argument("--door", default="", help="door, e.g. legal-review (--emit progress)")
    ap.add_argument("--artifact", default="", help="artifact name (--emit progress)")
    ap.add_argument("--findings", type=int, default=0, help="finding count (--emit progress)")
    ap.add_argument("--step", action="append", default=[],
                    help="step, marked `done:|now:|next:` (repeatable, --emit progress)")
    ap.add_argument("--now", default="", help="now: line")
    ap.add_argument("--so-far", default="", help="so far: line")
    ap.add_argument("--next", default="", help="-> next: line")
    ap.add_argument("--goal", default="", help="goal: line (--emit progress)")
    ap.add_argument("--done", default="", help="done: line (--emit progress)")
    ap.add_argument("--sources", default="")
    ap.add_argument("--read", default="")
    ap.add_argument("--flagged", default="")
    ap.add_argument("--currency", default="")
    ap.add_argument("--before-relying", default="")
    ap.add_argument("--clean", action="store_true", help="collapse the note to one line")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if args.emit:
        if args.emit == "files":
            paths = list(args.path) + ([p for p in args.paths.split(",") if p] if args.paths else [])
            if not paths:
                ap.error("--emit files needs --paths or --path")
            print(emit_files(paths))
        elif args.emit == "progress":
            print(emit_progress(args.door, args.artifact, args.findings, args.step,
                                args.now, args.so_far, args.next, args.goal, args.done))
        else:
            print(emit_reviewer_note(args.sources, args.read, args.flagged,
                                     args.currency, args.before_relying, args.clean))
        return 0
    if not args.doc:
        ap.error("need DOC, --emit, or --demo")
    res = check(read_text(args.doc))
    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        for i in res["issues"]:
            print(f"{i['level'].upper():<4} {i['check']:<6} L{i['line']:<4} {i['detail']}")
        print("display: OK" if res["ok"] else "display: FAIL", res["stats"])
    return 1 if args.strict and not res["ok"] else 0


if __name__ == "__main__":
    sys.exit(main())
