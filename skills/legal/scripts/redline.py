#!/usr/bin/env python3
"""Word tracked-changes output for legal redlines (stdlib only).

compare -- diff ORIGINAL against REVISED (paragraph alignment, then a
           word-level diff inside replaced paragraphs) and write a .docx whose
           tracked changes, once accepted, give the revised text.
markup  -- convert the suite's inline convention `[DELETE: text]` /
           `[ADD: text]` (may span lines) into tracked deletions/insertions.

    redline.py ORIGINAL REVISED -o OUT.docx [--author NAME] [--date ISO8601] [--json]
    redline.py --markup FILE -o OUT.docx [--author NAME] [--date ISO8601] [--json]
    redline.py --demo              # runnable self-check

Exit 0 on success; 1 when an input cannot be read. Inputs: .txt, .md, .docx.
Every w:ins / w:del carries a unique w:id, w:author and w:date; metadata is
neutral (creator = --author, default "legalsuite").

Ceiling: writes a fresh document of plain paragraphs -- it does not preserve
the counterparty's original formatting, numbering or styles.
# ponytail: for a redline on their formatted file use Word Compare or the host's docx skill.
"""
from __future__ import annotations

import argparse
import difflib
import itertools
import json
import re
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from doctext import read_text, write_docx

# ponytail: nested brackets inside [DELETE: …]/[ADD: …] are not supported
MARK_RE = re.compile(r"\[(DELETE|ADD):[ \t]?(.*?)\]", re.S)
_BAD_XML = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f]")


class Ctx:
    """Shared revision attributes + a unique w:id counter."""

    def __init__(self, author: str, date: str):
        self.author, self.date, self.ids = escape(author, {'"': "&quot;"}), date, itertools.count(1)

    def attrs(self) -> str:
        return f'w:id="{next(self.ids)}" w:author="{self.author}" w:date="{self.date}"'


def _run(kind: str, text: str) -> str:
    tag = "w:delText" if kind == "del" else "w:t"
    pieces = [f'<{tag} xml:space="preserve">{escape(_BAD_XML.sub("", p))}</{tag}>' if p else ""
              for p in text.split("\t")]
    return f"<w:r>{'<w:tab/>'.join(pieces)}</w:r>"


def para_xml(runs, mark, ctx: Ctx, ppr_inner: str = "") -> str:
    """runs: [(plain|ins|del, text)]; mark: None|ins|del for the paragraph mark."""
    if mark and ppr_inner:
        ppr = f"<w:pPr>{ppr_inner}<w:rPr><w:{mark} {ctx.attrs()}/></w:rPr></w:pPr>"
    elif mark:
        ppr = f"<w:pPr><w:rPr><w:{mark} {ctx.attrs()}/></w:rPr></w:pPr>"
    elif ppr_inner:
        ppr = f"<w:pPr>{ppr_inner}</w:pPr>"
    else:
        ppr = ""
    body = []
    for kind, text in runs:
        r = _run(kind, text)
        body.append(r if kind == "plain" else f"<w:{kind} {ctx.attrs()}>{r}</w:{kind}>")
    return f"<w:p>{ppr}{''.join(body)}</w:p>"


def word_diff(a: str, b: str) -> list[tuple[str, str]]:
    ta, tb = re.findall(r"\s+|\S+", a), re.findall(r"\s+|\S+", b)
    runs = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
        if tag == "equal":
            runs.append(("plain", "".join(ta[i1:i2])))
            continue
        if i2 > i1:
            runs.append(("del", "".join(ta[i1:i2])))
        if j2 > j1:
            runs.append(("ins", "".join(tb[j1:j2])))
    return runs


def docx_pprs(path) -> list[str]:
    """Extract inner <w:pPr> XML per paragraph when ORIGINAL is a .docx."""
    if not path or Path(path).suffix.lower() != ".docx":
        return []
    try:
        doc = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8", "ignore")
    except Exception:
        return []
    out = []
    for pm in re.finditer(r"<w:p(?:\s[^>]*)?>([\s\S]*?)</w:p>", doc):
        m = re.search(r"<w:pPr(?:\s[^>]*)?>([\s\S]*?)</w:pPr>", pm.group(1))
        out.append(re.sub(r"<w:rPr>[\s\S]*?</w:rPr>", "", m.group(1)) if m else "")
    return out


def compare_paras(original: str, revised: str, orig_pprs: list[str] | None = None) -> list:
    a, b = original.splitlines(), revised.splitlines()
    pprs = orig_pprs or []
    ppr_at = lambda idx: pprs[idx] if 0 <= idx < len(pprs) else ""
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            out += [([("plain", p)], None, ppr_at(i1 + k)) for k, p in enumerate(a[i1:i2])]
            continue
        old, new = a[i1:i2], b[j1:j2]
        out += [(word_diff(o, n), None, ppr_at(i1 + k)) for k, (o, n) in enumerate(zip(old, new))]
        out += [([("del", o)] if o else [], "del", ppr_at(i1 + len(new) + k)) for k, o in enumerate(old[len(new):])]
        out += [([("ins", n)] if n else [], "ins", "") for n in new[len(old):]]
    return out


def markup_paras(text: str) -> list:
    segs, pos = [], 0
    for m in MARK_RE.finditer(text):
        segs += [("plain", text[pos:m.start()]), ("del" if m.group(1) == "DELETE" else "ins", m.group(2))]
        pos = m.end()
    segs.append(("plain", text[pos:]))
    paras, marks = [[]], []
    for kind, s in segs:
        for k, line in enumerate(s.split("\n")):
            if k:   # a line break inside a DELETE/ADD span is a tracked paragraph mark
                marks.append(None if kind == "plain" else kind)
                paras.append([])
            if line:
                paras[-1].append((kind, line))
    return list(zip(paras, marks + [None]))


def write(paras, out, author: str, date: str) -> dict:
    ctx = Ctx(author, date)
    body = "".join(para_xml(it[0], it[1], ctx, it[2] if len(it) > 2 else "") for it in paras)
    write_docx(out, body, creator=author, date=date)
    return {"out": str(out), "insertions": len(re.findall(r"<w:ins\b", body)),
            "deletions": len(re.findall(r"<w:del\b", body)), "paragraphs": len(paras)}


def accepted(markup: str) -> str:
    return MARK_RE.sub(lambda m: m.group(2) if m.group(1) == "ADD" else "", markup)


def _demo() -> int:
    orig = "Článek 1\nKupující zaplatí 100 Kč do 30 dnů.\nTento odstavec zmizí.\n\tKonec & <tag>."
    rev = "Článek 1\nKupující zaplatí 120 Kč do 14 dnů.\n\tKonec & <tag>.\nNový „odstavec“ navíc."
    date = "2026-10-10T00:00:00Z"
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "cmp.docx"
        s = write(compare_paras(orig, rev), out, "Jan <Novák>", date)
        doc = zipfile.ZipFile(out).read("word/document.xml").decode()
        assert s == {"out": str(out), "insertions": 4, "deletions": 4, "paragraphs": 5}, s
        assert doc.count("<w:ins ") == 4 and doc.count("<w:del ") == 4, doc
        ids = re.findall(r'w:id="(\d+)"', doc)
        assert len(ids) == len(set(ids)) == 8 and 'w:author="Jan &lt;Novák&gt;"' in doc
        assert "<w:delText xml:space=\"preserve\">100</w:delText>" in doc
        assert read_text(out) == rev, repr(read_text(out))

        mk = "Nájemce [DELETE: nesmí][ADD: smí] dům\npodnajmout.[DELETE:  Bez\nvýjimky.]\nKonec[ADD: \nNová věta.]"
        out2 = Path(tmp) / "mk.docx"
        s = write(markup_paras(mk), out2, "legalsuite", date)
        doc = zipfile.ZipFile(out2).read("word/document.xml").decode()
        assert (s["insertions"], s["deletions"], s["paragraphs"]) == (3, 4, 5), s
        assert read_text(out2) == accepted(mk) == "Nájemce smí dům\npodnajmout.\nKonec\nNová věta.", \
            repr(read_text(out2))
        assert "legalsuite" in zipfile.ZipFile(out2).read("docProps/core.xml").decode()
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("original", nargs="?", help="original .txt/.md/.docx (compare mode)")
    ap.add_argument("revised", nargs="?", help="revised .txt/.md/.docx (compare mode)")
    ap.add_argument("--markup", metavar="FILE", help="file with [DELETE: …]/[ADD: …] markup")
    ap.add_argument("-o", "--out", help="output .docx")
    ap.add_argument("--author", default="legalsuite", help="revision author (default legalsuite)")
    ap.add_argument("--date", help="revision date, ISO 8601 (default now, UTC)")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.out or not (args.markup or (args.original and args.revised)):
        ap.error("need ORIGINAL REVISED -o OUT.docx, or --markup FILE -o OUT.docx (or --demo)")
    date = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        paras = (markup_paras(read_text(args.markup)) if args.markup
                 else compare_paras(read_text(args.original), read_text(args.revised),
                                    docx_pprs(args.original)))
    except (OSError, KeyError, zipfile.BadZipFile) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    s = write(paras, args.out, args.author, date)
    print(json.dumps(s, ensure_ascii=False, indent=2) if args.json else
          f"redline: wrote {s['out']} ({s['insertions']} insertions, {s['deletions']} deletions, "
          f"{s['paragraphs']} paragraphs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
