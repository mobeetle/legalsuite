#!/usr/bin/env python3
"""Plain-text extraction for the legal suite scripts (stdlib only).

`read_text(path)` returns the text of a .txt/.md/.docx file. For .docx it is
the *accepted* view: inserted tracked text kept, deleted tracked text
(`w:delText`) dropped, a deleted paragraph mark merges into the next
paragraph, one line per paragraph (table cells included, in body
order). Shared by substance/structure/trace/scan/redline.

    doctext.py FILE [--json]       # print the extracted text
    doctext.py --demo              # runnable self-check

Exit 0 normally; 1 when the file cannot be read.

Ceiling: body text only -- headers, footers, footnotes, text boxes in shapes
and field results beyond their visible `w:t` are not separated out.
"""
from __future__ import annotations

import argparse
import json
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


def docx_parts(path) -> dict[str, bytes]:
    """Every zip member of a .docx, name -> bytes."""
    with zipfile.ZipFile(path) as z:
        return {n: z.read(n) for n in z.namelist()}


def _para_text(p) -> str:
    out = []
    # ponytail: p.iter() also descends into nested text-box paragraphs; fine for review text
    for el in p.iter():
        if el.tag == W + "t":
            out.append(el.text or "")
        elif el.tag == W + "tab":
            out.append("\t")
        elif el.tag in (W + "br", W + "cr"):
            out.append("\n")
        # w:delText is simply never collected -> accepted view
    return "".join(out)


def docx_text(data: bytes) -> str:
    """Accepted-view text of a word/document.xml payload."""
    body = ET.fromstring(data).find(W + "body")
    if body is None:
        return ""
    out, carry = [], ""
    for p in body.iter(W + "p"):
        text = carry + _para_text(p)
        if p.find(f"{W}pPr/{W}rPr/{W}del") is not None:
            carry = text   # deleted paragraph mark: accepting merges into the next one
            continue
        out.append(text)
        carry = ""
    return "\n".join(out + ([carry] if carry else []))


def read_text(path) -> str:
    p = Path(path)
    if p.suffix.lower() == ".docx":
        with zipfile.ZipFile(p) as z:
            return docx_text(z.read("word/document.xml"))
    return p.read_text(encoding="utf-8-sig")


CONTENT_TYPES = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    '<Default Extension="xml" ContentType="application/xml"/>'
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    '</Types>')
ROOT_RELS = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    '</Relationships>')


def core_xml(creator: str = "legalsuite", date: str = "") -> str:
    d = (f'<dcterms:created xsi:type="dcterms:W3CDTF">{escape(date)}</dcterms:created>'
         if date else "")
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:creator>{escape(creator)}</dc:creator>'
            f'<cp:lastModifiedBy>{escape(creator)}</cp:lastModifiedBy>{d}'
            '</cp:coreProperties>')


def write_docx(path, body_xml: str, extra: dict[str, str | bytes] | None = None,
               creator: str = "legalsuite", date: str = "") -> None:
    """Minimal valid .docx from a w:body inner XML string (plus extra parts)."""
    doc = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           f'<w:document xmlns:w="{W_NS}"><w:body>{body_xml}</w:body></w:document>')
    parts = {"[Content_Types].xml": CONTENT_TYPES, "_rels/.rels": ROOT_RELS,
             "word/document.xml": doc, "docProps/core.xml": core_xml(creator, date)}
    parts.update(extra or {})
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)


def _demo() -> int:
    body = ('<w:p><w:r><w:t xml:space="preserve">Kupující zaplatí </w:t></w:r>'
            '<w:del w:id="1" w:author="x" w:date="2026-01-01T00:00:00Z"><w:r>'
            '<w:delText>100 Kč</w:delText></w:r></w:del>'
            '<w:ins w:id="2" w:author="x" w:date="2026-01-01T00:00:00Z"><w:r>'
            '<w:t>120 Kč</w:t></w:r></w:ins><w:r><w:tab/><w:t>„ok“</w:t></w:r></w:p>'
            '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>cell</w:t><w:br/><w:t>2</w:t></w:r></w:p>'
            '</w:tc></w:tr></w:tbl><w:p><w:pPr><w:rPr><w:del w:id="3" w:author="x" '
            'w:date="2026-01-01T00:00:00Z"/></w:rPr></w:pPr><w:r><w:t>e</w:t></w:r></w:p>'
            '<w:p><w:r><w:t>nd</w:t></w:r></w:p>')
    with tempfile.TemporaryDirectory() as tmp:
        f = Path(tmp) / "t.docx"
        write_docx(f, body)
        txt = read_text(f)
        assert txt == "Kupující zaplatí 120 Kč\t„ok“\ncell\n2\nend", repr(txt)
        assert "100" not in txt
        assert "word/document.xml" in docx_parts(f)
        m = Path(tmp) / "t.md"
        m.write_bytes("﻿Čl. 1 text".encode("utf-8"))
        assert read_text(m) == "Čl. 1 text"
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("file", nargs="?", help=".txt, .md or .docx")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.file:
        ap.error("need FILE (or --demo)")
    try:
        text = read_text(args.file)
    except (OSError, KeyError, zipfile.BadZipFile, ET.ParseError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    print(json.dumps({"path": args.file, "text": text}, ensure_ascii=False, indent=2)
          if args.json else text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
