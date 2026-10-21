#!/usr/bin/env python3
"""Document-integrity check for contracts and pleadings (stdlib only).

Deterministic checks on one document: clause numbering (gaps, duplicates),
internal cross-references that do not resolve, defined terms (duplicate,
unused, lowercase use, likely undefined, scope leak, overlap), `[●]` blanks
without a blanks schedule (a warning, not a blocker), and leftover drafting
notes. English and Czech conventions.

    structure.py DOC [--json] [--strict]
    structure.py --demo            # runnable self-check

Exit 0 normally; --strict exits 1 when any check fails (warnings never block).
Inputs: .txt, .md or .docx (accepted view).

Ceiling: line-based regexes, not a document model. Auto-numbered Word lists
carry no visible numbers in the text and are invisible here; in-clause
numbered lists that restart at 1. can look like duplicates.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

from doctext import read_text

ROMAN = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100}
ARTICLE_RE = re.compile(r"^\W*(?:Článek|Čl\.|Article|Section|Artikel|Art\.|Artículo|Artykuł)\s+(\d{1,3}|[IVXLC]+)\b")
CLAUSE_RE = re.compile(r"^[#*\s]*(?:(\d{1,3}(?:\.\d{1,3})+)\.?\s|(\d{1,3})[.)]\s)")
XREF_RE = re.compile(
    r"(?<!\w)(?:[Cc]lauses?|[Ss]ections?|[Aa]rticles?|čl\.|článek|článku|článkem|článků|"
    r"odst\.|odstavec|odstavce|odstavci|bod|bodu|bodě|"
    r"Artikel|[Aa]rt\.|[Aa]bsatz|[Aa]bs\.|[Zz]iffer|[Zz]iff\.|alinéa|"
    r"[Aa]rtículos?|[Aa]partados?|[Cc]láusulas?|[Aa]rtykuł\w*|ust\.|pkt\.?)\s+(\d{1,3}(?:\.\d{1,3})*|[IVXLC]+)\b")
SCHED_REF_RE = re.compile(
    r"(?<!\w)(?:Schedule|Annex|Appendix|Exhibit|Příloh[auyeo]\w*|Anlagen?|Anhangs?|Anhänge|Annexes?|Anexos?|Załącznik\w*)\s+(?:(?:č\.|nr\.?|n°)\s*)?(\d{1,3}|[A-Z])\b")
SCHED_HEAD_RE = re.compile(
    r"^\W*(?:Schedule|Annex|Appendix|Exhibit|Příloha|Anlage|Anhang|Annexe|Anexo|Załącznik)\s+(?:(?:č\.|nr\.?|n°)\s*)?(\d{1,3}|[A-Z])\b")
STATUTE_RE = re.compile(r"Sb\.|zákon|\bOZ\b|\bZOK\b|\bZP\b|\bOSŘ\b|Regulation|Directive|"
                        r"GDPR|\bAct\b|nařízení|směrnice")
DEF_RE = re.compile(
    r"[\"“„«]([^\"“”„»\n]{1,60})[\"”“»]\s+(?:means|shall mean|znamená|se rozumí|bezeichnet|bedeutet|désigne|signifie|significa|oznacza)"
    r"|\((?:(?:the|der|die|das|le|la|l['’]|les|el|los|las)\s+)?[\"“„«]([^\"“”„»\n]{1,60})[\"”“»]\)"
    r"|\((?:dále (?:jen|také)\s+(?:jako\s+)?|(?:nachfolgend|im Folgenden)\s+(?:auch\s+)?|ci-après\s+(?:dénommée?s?\s+)?(?:le\s+|la\s+|l['’]|les\s+)?|en adelante,?\s+(?:el\s+|la\s+|los\s+|las\s+)?|dalej\s+(?:jako\s+|zwany\s+|zwana\s+)?)[\"“„«]([^\"“”„»\n]{1,60})[\"”“»]\)")
BLANK_RE = re.compile(r"\[●[^\]]*\]")
BLANKS_HEAD_RE = re.compile(r"^\W*(?:Blanks schedule|Seznam nevyplněných údajů|Blanks|Offene Punkte|Annexe des blancs|Anexo de blancos|Lista braków)\b", re.I)
HEAD_RE = re.compile(r"^#{1,6}\s+(.*)$")
PART_RE = re.compile(r"^(Annex|Schedule|Appendix|Exhibit|Part|Anlage|Anhang|Annexe|Anexo|Załącznik)\b", re.I)
NOTE_RE = re.compile(r"\[(?:Drafting note|Pozn\. k návrhu|Note de rédaction|Nota de redacción|Anmerkung|Uwaga):")
TITLE_RE = re.compile(r"(?<![A-Za-z])[A-Z][a-z]+(?:\s+(?:of\s+)?[A-Z][a-z]+)*")
QUOTED_RE = re.compile(r"[\"“„]([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][^\"“”„\n]{1,60})[\"”“]")
_CZ_CHARS = re.compile("[ěščřžůťďňĚŠČŘŽŮŤĎŇ]")
STOP = set(("January February March April May June July August September October November "
            "December Monday Tuesday Wednesday Thursday Friday Saturday Sunday Czech "
            "Republic English Prague Praha Europe European Union EU Clause Section Article "
            "Schedule Annex Appendix Exhibit The This That If In On At By To For Any All Each No "
            "Where When Upon Under").split())


def _num(s: str) -> int:
    if s.isdigit():
        return int(s)
    vals = [ROMAN[c] for c in s]   # subtractive roman: IV = 5 - 1
    return sum(-v if i + 1 < len(vals) and v < vals[i + 1] else v for i, v in enumerate(vals))


def _issue(check, level, line, detail):
    return {"check": check, "level": level, "line": line, "detail": detail}


def numbering(lines):
    """Clause labels found + gap/duplicate issues, per parent level."""
    issues, labels, seen, art = [], set(), {}, None
    for n, line in enumerate(lines, 1):
        m = ARTICLE_RE.match(line)
        if m:
            parent, idx = "", _num(m.group(1))
            art = str(idx)
            labels.add(art)
        else:
            m = CLAUSE_RE.match(line)
            if not m:
                continue
            if m.group(1):
                parent, _, last = m.group(1).rpartition(".")
                idx = int(last)
                labels.add(m.group(1))
            else:   # bare "N." restarts under each Článek / Article heading
                idx = int(m.group(2))
                parent = f"art{art}" if art else ""
                labels.update({str(idx), f"{art}.{idx}" if art else str(idx)})
        got = seen.setdefault(parent, [])
        label = f"{parent.replace('art', 'Čl. ')}/{idx}" if parent.startswith("art") else \
            (f"{parent}.{idx}" if parent else str(idx))
        if idx in got:
            issues.append(_issue("numbering", "fail", n, f"duplicate clause number {label}"))
        elif idx != (got[-1] if got else 0) + 1:
            issues.append(_issue("numbering", "fail", n,
                                 f"numbering gap before {label} (previous {got[-1] if got else 'none'})"))
        got.append(idx)
    return issues, labels


def xrefs(lines, labels):
    heads = {SCHED_HEAD_RE.match(l).group(1) for l in lines if SCHED_HEAD_RE.match(l)}
    issues, count = [], 0
    for n, line in enumerate(lines, 1):
        for m in XREF_RE.finditer(line):
            after, before = line[m.end():m.end() + 25], line[max(0, m.start() - 12):m.start()]
            # ponytail: § refs and statute-tailed refs are statutory, never checked here
            if STATUTE_RE.search(after) or re.search(r"§\s*\d+\w*\s*$", before):
                continue
            count += 1
            num = m.group(1)
            num = str(_num(num)) if not num[0].isdigit() else num
            if num not in labels and not any(l.endswith("." + num) for l in labels):
                issues.append(_issue("xref", "fail", n, f"{m.group()!r} does not resolve"))
        for m in SCHED_REF_RE.finditer(line):
            if not line[:m.start()].strip(" #*\t"):
                continue   # the heading itself
            count += 1
            if m.group(1) not in heads:
                issues.append(_issue("xref", "fail", n, f"{m.group()!r} has no matching heading"))
    return issues, count


def _stem(term: str) -> str:
    """Czech-tolerant pattern: each long word may inflect at its last 1-2 letters."""
    parts = [re.escape(w[:-2] if len(w) > 5 else w[:-1]) + r"\w*" if len(w) >= 4 else re.escape(w)
             for w in term.split()]
    return r"(?<!\w)" + r"\s+".join(parts) + r"(?!\w)"


def parts(lines):
    """Per-line schedule label: the heading text when a heading opens an annex
    or schedule, '' otherwise (general body). A section heading resets to ''."""
    cur, out = "", []
    for line in lines:
        m = HEAD_RE.match(line)
        if m:
            text = m.group(1).strip()
            cur = text if PART_RE.match(text) else ""
        out.append(cur)
    return out


def _part_at(pmap, text, pos):
    n = text.count("\n", 0, pos)
    return pmap[n] if 0 <= n < len(pmap) else ""


def _overlaps(defs):
    """Whole-word prefix pairs (Referral Commission / Referral Commission
    Percentage): one concept, one term."""
    out, terms = [], list(defs)
    for i, a in enumerate(terms):
        for b in terms[i + 1:]:
            if b.lower().startswith(a.lower() + " ") or a.lower().startswith(b.lower() + " "):
                out.append((a, b))
    return out


def definitions(text, lines):
    issues, defs = [], {}
    line_of = lambda pos: text.count("\n", 0, pos) + 1   # noqa: E731
    pmap = parts(lines)
    for m in DEF_RE.finditer(text):
        term = next(g for g in m.groups() if g).strip()
        if term in defs:
            issues.append(_issue("definitions", "fail", line_of(m.start()), f"{term!r} defined twice"))
            continue
        defs[term] = m.end()
    for term, end in defs.items():
        rest = text[end:]
        if not re.search(_stem(term), rest):
            issues.append(_issue("definitions", "warn", line_of(end), f"{term!r} defined but never used"))
        if len(term) > 1 and term[0].isupper() and not term.isupper():
            low = len(re.findall(r"(?<!\w)" + re.escape(term.lower()) + r"(?!\w)", rest))
            if low:
                issues.append(_issue("definitions", "warn", line_of(end),
                                     f"{term!r} used in lowercase {low}x"))
        used_in = [_part_at(pmap, text, end + m.start()) for m in re.finditer(_stem(term), rest)]
        if used_in and all(used_in) and len(set(used_in)) == 1 and not _part_at(pmap, text, end):
            issues.append(_issue("definitions", "warn", line_of(end),
                                 f"{term!r} used only in {used_in[0]!r}; move the definition to that schedule"))
    for a, b in _overlaps(defs):
        issues.append(_issue("definitions", "warn", line_of(defs[b]),
                             f"{b!r} overlaps {a!r}; use one term"))
    issues += undefined(text, lines, defs)
    return issues, defs


def undefined(text, lines, defs):
    """Likely defined terms used without a definition (warn, capped at 20)."""
    seen: Counter = Counter()
    first: dict[str, int] = {}
    if _CZ_CHARS.search(text):
        # ponytail: Czech capitalises less predictably -- only quoted capitalised terms count
        for m in QUOTED_RE.finditer(text):
            t = m.group(1).strip()
            if t not in defs:
                seen[t] = len(re.findall(_stem(t), text))
                first.setdefault(t, text.count("\n", 0, m.start()) + 1)
    else:
        for n, line in enumerate(lines, 1):
            s = line.strip()
            if len(s) < 60 and not s.endswith((".", ";", ",")):
                continue   # headings and titles
            for m in TITLE_RE.finditer(line):
                pre = line[:m.start()].rstrip()
                words = m.group().split()
                while words and words[0] in STOP:   # "The Recipient" -> "Recipient"
                    words.pop(0)
                t = " ".join(words)
                if not t or not pre or pre.endswith((".", "!", "?", ":", "(", "|", "-", "\"", "“", "„")) \
                        or set(t.split()) <= STOP or any(t.startswith(d) for d in defs):
                    continue
                seen[t] += 1
                first.setdefault(t, n)
    hits = [t for t, c in seen.most_common() if c >= 2][:20]
    return [_issue("definitions", "warn", first[t], f"{t!r} looks like a defined term but has no definition")
            for t in hits]


def check(text: str) -> dict:
    lines = text.splitlines()
    issues, labels = numbering(lines)
    xi, nx = xrefs(lines, labels)
    di, defs = definitions(text, lines)
    issues += xi + di
    blanks = [(n, m.group()) for n, l in enumerate(lines, 1) for m in BLANK_RE.finditer(l)]
    issues += [_issue("blanks", "warn", n, f"blank {b}") for n, b in blanks]
    if blanks and not any(BLANKS_HEAD_RE.match(l) for l in lines):
        issues.append(_issue("blanks", "warn", blanks[0][0], "blanks without schedule"))
    notes = [n for n, l in enumerate(lines, 1) for _ in NOTE_RE.finditer(l)]
    if notes:
        issues.append(_issue("notes", "warn", notes[0],
                             f"{len(notes)} drafting note(s) -- annotated version, not clean"))
    return {"ok": not any(i["level"] == "fail" for i in issues), "issues": issues,
            "stats": {"clauses": len(labels), "definitions": len(defs), "xrefs": nx,
                      "blanks": len(blanks), "notes": len(notes)}}


def _demo() -> int:
    clean = ("1. Definitions\n"
             "1.1 Acme s.r.o. (the \"Discloser\") and Beta a.s. (the \"Recipient\") agree as follows.\n"
             "1.2 \"Confidential Information\" means any information disclosed by the Discloser.\n"
             "1.3 The Recipient shall keep Confidential Information secret as set out in clause 2.1.\n"
             "2. Obligations\n"
             "2.1 The Recipient shall comply with Schedule 1 and Section 5 of the Act.\n"
             "Schedule 1 Security\n")
    r = check(clean)
    assert r["ok"] and r["issues"] == [], r["issues"]
    assert r["stats"] == {"clauses": 6, "definitions": 3, "xrefs": 2, "blanks": 0, "notes": 0}, r["stats"]

    dirty = ("1. Definitions\n"
             "1.1 \"Confidential Information\" means any information marked as such.\n"
             "1.3 \"Term\" means three years. \"Term\" means five years.\n"
             "1.3 \"Fee\" means [● amount] payable to the Provider under the Master Agreement.\n"
             "2. The Recipient shall protect confidential information under clause 9.4 and the "
             "Master Agreement.\n"
             "[Drafting note: check Term.]\n")
    got = {(i["check"], i["level"], i["detail"]) for i in check(dirty)["issues"]}
    for want in [("numbering", "fail", "numbering gap before 1.3 (previous 1)"),
                 ("numbering", "fail", "duplicate clause number 1.3"),
                 ("xref", "fail", "'clause 9.4' does not resolve"),
                 ("definitions", "fail", "'Term' defined twice"),
                 ("definitions", "warn", "'Fee' defined but never used"),
                 ("definitions", "warn", "'Confidential Information' used in lowercase 1x"),
                 ("definitions", "warn", "'Master Agreement' looks like a defined term but has no definition"),
                 ("blanks", "warn", "blank [● amount]"),
                 ("blanks", "warn", "blanks without schedule"),
                 ("notes", "warn", "1 drafting note(s) -- annotated version, not clean")]:
        assert want in got, (want, got)

    cz = ("Článek I\nSmluvní strany\n"
          "1. Společnost Alfa (dále jen „Prodávající“) a Beta (dále jen „Kupující“).\n"
          "2. Prodávající prodává Kupujícímu zboží podle čl. II odst. 1 a Přílohy č. 1.\n"
          "Článek II\nCena\n"
          "1. Kupující zaplatí cenu [●] podle § 2 odst. 3 OZ a odst. 4 zákona o DPH.\n"
          "3. Kupující dále postupuje podle čl. IV a Přílohy č. 2.\n"
          "Příloha č. 1 Specifikace\n")
    r = check(cz)
    got = {(i["check"], i["detail"]) for i in r["issues"]}
    assert got == {("numbering", "numbering gap before Čl. 2/3 (previous 1)"),
                   ("xref", "'čl. IV' does not resolve"),
                   ("xref", "'Přílohy č. 2' has no matching heading"),
                   ("blanks", "blank [●]"), ("blanks", "blanks without schedule")}, got
    assert check(cz + "Seznam nevyplněných údajů\n")["stats"]["blanks"] == 1

    de_fr = ("Artikel 1\n"
             "1.1 Alfa GmbH (nachfolgend „Verkäufer“) und Beta SAS (ci-après «Acheteur»).\n"
             "1.2 „Vertrauliche Informationen“ bezeichnet alle Unterlagen gemäss Ziff. 1.1 und Anlage 1.\n"
             "1.3 Verkäufer liefert an Acheteur Vertrauliche Informationen nach Art. 5 und Annexe 2.\n"
             "[Anmerkung: prüfen]\n"
             "Anlage 1 Spezifikation\n")
    rdf = check(de_fr)
    got_df = {(i["check"], i["detail"]) for i in rdf["issues"]}
    assert ("xref", "'Art. 5' does not resolve") in got_df, got_df
    assert ("xref", "'Annexe 2' has no matching heading") in got_df, got_df
    assert ("notes", "1 drafting note(s) -- annotated version, not clean") in got_df, got_df
    assert rdf["stats"]["definitions"] == 3, rdf["stats"]

    # matter fixture: pathway terms in the general definitions, near-duplicate
    # definitions, and undefined capitalised terms (v. 20261015 Rev 2)
    terms = Path(__file__).with_name("fixtures") / "gsi-rev2-terms.md"
    if terms.exists():
        ti = check(terms.read_text(encoding="utf-8"))["issues"]
        details = [i["detail"] for i in ti if i["check"] == "definitions"]
        assert any("used only in 'Annex B" in d for d in details), details
        assert any("overlaps" in d for d in details), details
        assert any("no definition" in d for d in details), details
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("doc", nargs="?", help=".txt, .md or .docx")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--strict", action="store_true", help="exit 1 if any check fails")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.doc:
        ap.error("need DOC (or --demo)")
    res = check(read_text(args.doc))
    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        for i in res["issues"]:
            print(f"{i['level'].upper():<4} {i['check']:<11} L{i['line']:<4} {i['detail']}")
        print("structure: OK" if res["ok"] else "structure: FAIL", res["stats"])
    return 1 if args.strict and not res["ok"] else 0


if __name__ == "__main__":
    sys.exit(main())
