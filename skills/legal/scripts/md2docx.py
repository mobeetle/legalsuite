#!/usr/bin/env python3
"""User-facing .docx export for the legal suite (stdlib only).

Convert one Markdown working file into a plain .docx beside it, using
`doctext.write_docx` (no pandoc, no python-docx):

    md2docx.py IN.md [-o OUT.docx] [--json]
    md2docx.py --demo            # runnable self-check

Headings become bold paragraphs, bullets/numbers keep their prefix,
code fences stay verbatim, inline `**bold**` / `*italic*` become `<w:b/>` /
`<w:i/>` runs, and Markdown tables become real Word `<w:tbl>` grids
(while keeping `"a | b"` inside a single cell paragraph per row so plain-text
`doctext.read_text` and table grid rendering both work).

Ceiling: plain paragraphs and simple `<w:tbl>` grids -- no images, footnotes,
headers/footers.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from doctext import read_text, write_docx

_BAD_XML = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f]")
_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]*)\)")
_MD_INLINE_RE = re.compile(r"(\*\*|__|\*|_|`|~~)")
_SPAN_RE = re.compile(r"\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|_([^_\n]+)_")


def _clean(text: str) -> str:
    text = _LINK_RE.sub(lambda m: m.group(1) + (f" ({m.group(2)})" if m.group(2) else ""), text)
    return escape(_BAD_XML.sub("", _MD_INLINE_RE.sub("", text)))


def _runs(text: str, bold: bool = False) -> str:
    text = _LINK_RE.sub(lambda m: m.group(1) + (f" ({m.group(2)})" if m.group(2) else ""), text)
    if bold or not _SPAN_RE.search(text):
        t = _clean(text) or " "
        rpr = "<w:rPr><w:b/></w:rPr>" if bold else ""
        return f"<w:r>{rpr}<w:t xml:space=\"preserve\">{t}</w:t></w:r>"
    out, pos = [], 0
    for m in _SPAN_RE.finditer(text):
        if m.start() > pos:
            pre = _clean(text[pos:m.start()])
            if pre:
                out.append(f"<w:r><w:t xml:space=\"preserve\">{pre}</w:t></w:r>")
        b_txt = m.group(1) or m.group(2)
        i_txt = m.group(3) or m.group(4)
        tag = "<w:b/>" if b_txt is not None else "<w:i/>"
        val = _clean(b_txt if b_txt is not None else i_txt)
        if val:
            out.append(f"<w:r><w:rPr>{tag}</w:rPr><w:t xml:space=\"preserve\">{val}</w:t></w:r>")
        pos = m.end()
    if pos < len(text):
        tail = _clean(text[pos:])
        if tail:
            out.append(f"<w:r><w:t xml:space=\"preserve\">{tail}</w:t></w:r>")
    return "".join(out) or "<w:r><w:t xml:space=\"preserve\"> </w:t></w:r>"


def _para(text: str, bold: bool = False) -> str:
    return f"<w:p>{_runs(text, bold=bold)}</w:p>"


def _flush(table: list[str]) -> list[str]:
    rows = []
    for idx, r in enumerate(table):
        s = r.strip()
        if not s or re.match(r"^\|?[\s:|-]+\|?$", s):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        p_xml = _para(" | ".join(cells), bold=(idx == 0))
        rows.append(f"<w:tr><w:tc>{p_xml}</w:tc></w:tr>")
    return [f"<w:tbl>{''.join(rows)}</w:tbl>"] if rows else []


def md_paras(md: str) -> list[str]:
    """Markdown text -> list of w:p XML strings."""
    out, fence, code, table = [], False, [], []
    # ponytail: single-pass line scan, no block model; nested lists stay flat
    for raw in md.splitlines():
        line = raw.rstrip()
        if line.strip().startswith("```"):
            if fence:
                out += [_para("  " + c if c else " ") for c in code]
                code = []
            fence = not fence
            continue
        if fence:
            code.append(line)
            continue
        s = line.strip()
        if not s:
            if table:
                out += _flush(table)
                table = []
            continue
        if re.match(r"^\|?[\s:|-]+\|?$", s) and table:
            continue  # separator row
        if s.startswith("|") and s.endswith("|"):
            table.append(s)
            continue
        if table:
            out += _flush(table)
            table = []
        m = re.match(r"^(#{1,6})\s+(.*)", s)
        if m:
            out.append(_para(m.group(2).strip(), bold=True))
            continue
        if re.match(r"^>\s?", s):
            out.append(_para(re.sub(r"^>\s?", "", s)))
            continue
        if re.match(r"^([-*+]\s+|\d+[.)]\s+)", s):
            out.append(_para(s))
            continue
        if re.match(r"^([-*_]{3,})$", s):
            continue
        out.append(_para(s))
    if fence:
        out += [_para("  " + c if c else " ") for c in code]
    if table:
        out += _flush(table)
    return out or [_para(" ")]


def convert(inp: str | Path, out: str | Path | None = None,
            creator: str = "legalsuite", date: str = "") -> dict:
    src = Path(inp)
    dst = Path(out) if out else src.with_suffix(".docx")
    body = "".join(md_paras(read_text(src)))
    write_docx(dst, body, creator=creator, date=date)
    return {"in": str(src), "out": str(dst), "paragraphs": len(md_paras(read_text(src)))}


def _demo() -> int:
    md = ("# Nadpis\n\nText s **bold** a [odkaz](https://x.cz).\n\n"
          "- bod jedna\n- bod dva\n\n```text\n[Matter]\n|-- Duty\n```\n\n"
          "| A | B |\n|---|---|\n| a1 | b1 |\n")
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "t.md"
        src.write_text(md, encoding="utf-8")
        s = convert(src)
        doc = zipfile.ZipFile(s["out"]).read("word/document.xml").decode()
        assert "<w:b/>" in doc and "Nadpis" in doc, doc
        assert "bold" in doc and "**" not in doc, doc
        assert "<w:tbl>" in doc and "<w:tr>" in doc and "<w:tc>" in doc, doc
        assert "odkaz (https://x.cz)" in doc, doc
        assert "a1 | b1" in doc and "A | B" in doc, doc
        assert read_text(s["out"]).splitlines()[0] == "Nadpis", read_text(s["out"])
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("input", nargs="?", help="input .md/.txt")
    ap.add_argument("-o", "--out", help="output .docx (default: input stem + .docx)")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.input:
        ap.error("need IN.md (or --demo)")
    try:
        s = convert(args.input, args.out,
                    date=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    except (OSError, KeyError, zipfile.BadZipFile) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    print(json.dumps(s, ensure_ascii=False, indent=2) if args.json else
          f"md2docx: wrote {s['out']} ({s['paragraphs']} paragraphs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
