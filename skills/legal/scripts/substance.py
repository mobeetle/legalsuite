#!/usr/bin/env python3
"""Substance-preservation check for legal redlines (stdlib only).

Compares an ORIGINAL document against a REVISED/redlined one and reports
protected tokens -- money, percentages, dates, durations, statutory
references, quoted strings, and bare numbers -- that the revision dropped or
introduced. A semantic layer then aligns sentences and flags silent flips a
token count cannot see: modal (shall -> may), negation, connector
(and -> or), standard (reasonable -> sole discretion) and party swaps.

Dropped tokens and flips are the danger signal. Added tokens are reported
too, since drafting legitimately adds language. This tool reports; the
mode/agent adjudicates. Inputs: .txt, .md or .docx (accepted view).

    substance.py ORIGINAL REVISED [--json] [--strict] [--no-semantic] [--party NAME]...
    substance.py --text-orig TEXT --text-rev TEXT [--json]
    substance.py --demo            # runnable self-check

Exit 0 normally; --strict exits 1 when any protected token is dropped or a
semantic flip is found, so the script can run as a blocking check.

Ceiling: a curated regex set and lexicon, not a legal parser. It can miss
unlisted notation, cannot tell a legitimate deletion from a lost one, and
only sees flips inside sentences similar enough to align (ratio >= 0.6).
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from collections import Counter
from functools import lru_cache

from doctext import read_text

NUM = r"\d{1,3}(?:[  .,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?"
EN_MONTHS = ("January|February|March|April|May|June|July|August|September|"
             "October|November|December")
CZ_MONTHS = ("ledna|února|března|dubna|května|června|července|srpna|září|"
             "října|listopadu|prosince")
INTL_MONTHS = ("Januar|Jänner|Februar|März|Mai|Juni|Juli|Oktober|Dezember|"
               "janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|"
               "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|"
               "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia|"
               "januára|februára|apríla|mája|júna|júla|augusta|septembra|októbra|novembra|decembra")
CURRENCIES = r"Kč|CZK|EUR|USD|GBP|CHF|PLN|SEK|NOK|DKK|CAD|AUD|JPY|HUF|RON|€|\$|£|zł|Fr\."
PRE_CURRENCIES = r"\b(?:EUR|CZK|USD|GBP|CHF|PLN|SEK|NOK|DKK|CAD|AUD|JPY|HUF|RON|Kč|zł|Fr\.)|€|\$|£"
UNITS = (r"(?:(?:calendar|business|working)\s+)?(?:days?|weeks?|months?|years?|hours?)"
         r"|(?:(?:pracovních|kalendářních)\s+)?(?:dnů|dní|dny|den|týdnů|týdny|týden|"
         r"měsíců|měsíce|měsíc|let|roků|roky|rok|hodin[ay]?)"
         r"|(?:Werk|Arbeits|Kalender)?(?:[Tt]ag(?:en|e)?|[Ww]ochen?|[Mm]onat(?:en|e)?|[Jj]ahr(?:en|e)?|[Ss]tunden?)"
         r"|jours?(?:\s+ouvrés|\s+ouvrables|\s+calendaires)?|semaines?|mois|ans?|années?|heures?"
         r"|días?(?:\s+hábiles|\s+naturales)?|semanas?|meses|años?|horas?"
         r"|(?:dni\s+roboczych|dni\s+kalendarzowych|dni|tygodni|miesięcy|lat|godzin)")

# Leftmost alternative wins, so more specific categories precede `number`.
TOKEN_RE = re.compile(
    rf"(?P<money>\d[\d  .,]*\s?(?:{CURRENCIES})"
    rf"|(?:{PRE_CURRENCIES})\s?(?:{NUM}))"
    r"|(?P<percent>\d[\d  .,]*\s?%)"
    rf"|(?P<date>\d{{1,2}}\.\s*\d{{1,2}}\.\s*\d{{4}}|\d{{4}}-\d{{2}}-\d{{2}}"
    rf"|\d{{1,2}}(?:st|nd|rd|th)?\.?\s+(?:de\s+)?(?:{EN_MONTHS}|{CZ_MONTHS}|{INTL_MONTHS})\s+(?:de\s+)?\d{{4}}"
    rf"|(?:{EN_MONTHS})\s+\d{{1,2}}(?:st|nd|rd|th)?,?\s+\d{{4}})"
    rf"|(?P<duration>(?:{NUM})\s+(?:{UNITS})\b)"
    r"|(?P<ref>§\s*\d+[a-zA-Z]?|\b(?:čl|odst|písm|art|Art|Artikel|Abs|Absatz|Ziff|article|alinéa|artículo|apartado|ust|pkt)\.?\s*\d+|\bArticle\s+\d+)"
    r"|(?P<quote>[\"„“][^\"„“\n]{2,}[\"“”])"
    r"|(?P<number>\b\d[\d  .,]*\b)"
)

_WS = re.compile(r"\s+")


def tokens(text: str) -> Counter:
    """Multiset of (category, normalised value) protected tokens."""
    out: Counter = Counter()
    for m in TOKEN_RE.finditer(text):
        cat = m.lastgroup
        val = _WS.sub(" ", m.group()).strip()
        out[(cat, val)] += 1
    return out


def compare(original: str, revised: str):
    a, b = tokens(original), tokens(revised)
    dropped = a - b   # Counter subtraction drops non-positive counts
    added = b - a
    return a, b, dropped, added


def _fmt(counter: Counter) -> list[dict]:
    rows = [{"category": c, "value": v, "count": n}
            for (c, v), n in sorted(counter.items())]
    return rows


# --- semantic layer -------------------------------------------------------
# (category, lemma, regex). Order matters: longer phrases before their parts.
_I = "(?i:{})"
LEXICON = [
    ("modal", "shall not", _I.format(r"shall\s+not")), ("modal", "shall", _I.format("shall")),
    ("modal", "must not", _I.format(r"must\s+not")), ("modal", "must", _I.format("must")),
    ("modal", "may not", _I.format(r"may\s+not")),
    ("modal", "may", _I.format(r"(?<!\d )may(?!\s+\d)")),
    ("modal", "will not", _I.format(r"will\s+not|won't")), ("modal", "will", _I.format("will")),
    ("modal", "is not entitled to", _I.format(r"(?:is|are)\s+not\s+entitled\s+to")),
    ("modal", "is entitled to", _I.format(r"(?:is|are)\s+entitled\s+to")),
    ("modal", "agrees to", _I.format(r"agrees?\s+to")),
    ("modal", "undertakes to", _I.format(r"undertakes?\s+to")),
    ("modal", "není povinen", _I.format(r"(?:není|nejsou)\s+povin(?:en|na|no|ni|ny)")),
    ("modal", "je povinen", _I.format(r"(?:je|jsou)\s+povin(?:en|na|no|ni|ny)")),
    ("modal", "není oprávněn", _I.format(r"(?:není|nejsou)\s+oprávněn[aoiy]?")),
    ("modal", "je oprávněn", _I.format(r"(?:je|jsou)\s+oprávněn[aoiy]?")),
    ("modal", "nemá právo", _I.format(r"nem(?:á|ají)\s+právo")),
    ("modal", "má právo", _I.format(r"m(?:á|ají)\s+právo")),
    ("modal", "nemusí", _I.format("nemus(?:í|ejí)")), ("modal", "musí", _I.format("mus(?:í|ejí)")),
    ("modal", "nesmí", _I.format("nesm(?:í|ějí)")), ("modal", "smí", _I.format("sm(?:í|ějí)")),
    ("modal", "nemůže", _I.format("nemůže|nemohou")), ("modal", "může", _I.format("může|mohou")),
    ("modal", "zavazuje se", _I.format(r"zavazuj[eí]\s+se|se\s+zavazuj[eí]")),
    ("modal", "darf nicht", _I.format(r"(?:darf|dürfen)\s+nicht")),
    ("modal", "muss nicht", _I.format(r"(?:muss|müssen)\s+nicht")),
    ("modal", "ist nicht verpflichtet", _I.format(r"(?:ist|sind)\s+nicht\s+verpflichtet")),
    ("modal", "verpflichtet sich", _I.format(r"verpflichte[tn]\s+sich")),
    ("modal", "muss", _I.format(r"muss|müssen")),
    ("modal", "hat zu", _I.format(r"(?:hat|haben)\s+zu")),
    ("modal", "darf", _I.format(r"darf|dürfen")),
    ("modal", "kann", _I.format(r"kann|können")),
    ("modal", "ne doit pas", _I.format(r"ne\s+(?:doit|doivent)\s+pas")),
    ("modal", "ne peut pas", _I.format(r"ne\s+(?:peut|peuvent)\s+pas")),
    ("modal", "n'est pas tenu", _I.format(r"(?:n['’]est|ne\s+sont)\s+pas\s+tenu[es]?")),
    ("modal", "s'engage à", _I.format(r"s['’]engage(?:nt)?\s+à")),
    ("modal", "doit", _I.format(r"doit|doivent")),
    ("modal", "est tenu", _I.format(r"(?:est|sont)\s+tenu[es]?")),
    ("modal", "peut", _I.format(r"peut|peuvent")),
    ("modal", "no deberá", _I.format(r"no\s+deberán?")),
    ("modal", "no podrá", _I.format(r"no\s+podrán?")),
    ("modal", "se obliga a", _I.format(r"se\s+obliga(?:n)?\s+a")),
    ("modal", "deberá", _I.format(r"deberán?")),
    ("modal", "debe", _I.format(r"deben?")),
    ("modal", "podrá", _I.format(r"podrán?")),
    ("modal", "puede", _I.format(r"pueden?")),
    ("modal", "nie może", _I.format(r"nie\s+(?:może|mogą)")),
    ("modal", "nie jest zobowiązany", _I.format(r"nie\s+(?:jest|są)\s+zobowiązan[yiaeo]")),
    ("modal", "zobowiązuje się", _I.format(r"zobowiązuj[eą]\s+się")),
    ("modal", "musi", _I.format(r"musi|muszą")),
    ("modal", "jest zobowiązany", _I.format(r"(?:jest|są)\s+zobowiązan[yiaeo]")),
    ("modal", "może", _I.format(r"może|mogą")),
    ("standard", "commercially reasonable efforts",
     _I.format(r"commercially\s+reasonable\s+efforts")),
    ("standard", "reasonable efforts", _I.format(r"reasonable\s+efforts")),
    ("standard", "best efforts", _I.format(r"best\s+efforts")),
    ("standard", "reasonably", _I.format("reasonably")),
    ("standard", "reasonable", _I.format("reasonable")),
    ("standard", "sole discretion", _I.format(r"sole\s+discretion")),
    ("standard", "absolute discretion", _I.format(r"absolute\s+discretion")),
    ("standard", "good faith", _I.format(r"good\s+faith")),
    ("standard", "materially", _I.format("materially")), ("standard", "material", _I.format("material")),
    ("standard", "přiměřený", _I.format(r"přiměřen\w*")),
    ("standard", "vlastní uvážení",
     _I.format(r"(?:dle|podle)\s+(?:svého\s+)?vlastního\s+uvážení")),
    ("standard", "výlučné uvážení",
     _I.format(r"(?:(?:dle|podle)\s+(?:svého\s+)?)?výlučného\s+uvážení")),
    ("standard", "veškeré úsilí", _I.format(r"veškeré\s+úsilí")),
    ("standard", "nejlepší úsilí", _I.format(r"nejlepší\s+úsilí")),
    ("standard", "v dobré víře", _I.format(r"v\s+dobré\s+víře")),
    ("standard", "podstatný", _I.format(r"podstatn\w*")),
    ("standard", "nach eigenem Ermessen", _I.format(r"nach\s+eigenem\s+Ermessen")),
    ("standard", "nach billigem Ermessen", _I.format(r"nach\s+billigem\s+Ermessen")),
    ("standard", "angemessen", _I.format(r"angemessen\w*")),
    ("standard", "wesentlich", _I.format(r"wesentlich\w*")),
    ("standard", "à sa seule discrétion", _I.format(r"à\s+(?:sa|leur)\s+seule\s+discrétion")),
    ("standard", "raisonnablement", _I.format("raisonnablement")),
    ("standard", "raisonnable", _I.format(r"raisonnables?")),
    ("standard", "exclusiva discreción", _I.format(r"exclusiva\s+discreción")),
    ("standard", "razonable", _I.format(r"razonables?|razonablemente")),
    ("standard", "według własnego uznania", _I.format(r"według\s+własnego\s+uznania")),
    ("standard", "uzasadniony", _I.format(r"uzasadnion\w*")),
    ("connector", "and/or", _I.format("and/or")), ("connector", "and", _I.format("and")),
    ("connector", "or", _I.format("or")), ("connector", "unless", _I.format("unless")),
    ("connector", "except", _I.format("except")),
    ("connector", "provided that", _I.format(r"provided\s+that")),
    ("connector", "subject to", _I.format(r"subject\s+to")),
    ("connector", "notwithstanding", _I.format("notwithstanding")),
    ("connector", "bez ohledu na", _I.format(r"bez\s+ohledu\s+na")),
    ("connector", "anebo", _I.format("anebo")), ("connector", "nebo", _I.format("nebo")),
    ("connector", "či", _I.format("či")), ("connector", "ledaže", _I.format("ledaže")),
    ("connector", "s výjimkou", _I.format(r"s\s+výjimkou")),
    ("connector", "kromě", _I.format("kromě")), ("connector", "pokud", _I.format("pokud")),
    ("connector", "za předpokladu", _I.format(r"za\s+předpokladu")),
    ("connector", "und/oder", _I.format("und/oder")), ("connector", "oder", _I.format("oder")),
    ("connector", "sofern nicht", _I.format(r"sofern\s+nicht")),
    ("connector", "es sei denn", _I.format(r"es\s+sei\s+denn")),
    ("connector", "et/ou", _I.format("et/ou")), ("connector", "sauf", _I.format("sauf")),
    ("connector", "à moins que", _I.format(r"à\s+moins\s+que")),
    ("connector", "y/o", _I.format("y/o")), ("connector", "salvo", _I.format("salvo")),
    ("connector", "a menos que", _I.format(r"a\s+menos\s+que")),
    ("connector", "oraz", _I.format("oraz")), ("connector", "lub", _I.format("lub")),
    ("connector", "chyba że", _I.format(r"chyba\s+że")),
    ("connector", "a", "a"), ("connector", "i", "i"),   # Czech-only, see _CZ_ONLY
    ("negation", "not", _I.format("not")), ("negation", "no", _I.format(r"no(?!\.\s*\d)")),
    ("negation", "never", _I.format("never")), ("negation", "nor", _I.format("nor")),
    ("negation", "neither", _I.format("neither")), ("negation", "without", _I.format("without")),
    ("negation", "nikoli", _I.format("nikoliv?")), ("negation", "nikdy", _I.format("nikdy")),
    ("negation", "žádný", _I.format(r"žádn\w*")), ("negation", "ani", _I.format("ani")),
    ("negation", "bez", _I.format("bez")),
    ("negation", "nicht", _I.format("nicht")),
    ("negation", "kein", _I.format(r"kein(?:e[mnrs]?)?")),
    ("negation", "niemals", _I.format("niemals")),
    ("negation", "ohne", _I.format("ohne")),
    ("negation", "ne pas", _I.format(r"ne\s+pas")),
    ("negation", "jamais", _I.format("jamais")),
    ("negation", "sans", _I.format("sans")),
    ("negation", "nunca", _I.format("nunca")),
    ("negation", "sin", _I.format("sin")),
    ("negation", "nie", _I.format("nie")),
    ("negation", "nigdy", _I.format("nigdy")),
]
EN_PARTIES = ("Disclosing Party|Receiving Party|Buyer|Seller|Purchaser|Vendor|Licensor|"
              "Licensee|Provider|Customer|Client|Supplier|Contractor|Lessor|Lessee|"
              "Landlord|Tenant|Employer|Employee|Discloser|Recipient|Lender|Borrower|"
              "Guarantor|Verkäufer|Käufer|Auftraggeber|Auftragnehmer|Vermieter|Mieter|"
              "Lizenzgeber|Lizenznehmer|Arbeitgeber|Arbeitnehmer|Darlehensgeber|Darlehensnehmer|"
              "Vendeur|Acheteur|Prestataire|Bailleur|Preneur|Vendedor|Comprador|Arrendador|Arrendatario|"
              "Sprzedający|Kupujący|Wykonawca|Zamawiający").split("|")
# Czech defined-party stems (case-sensitive, inflected forms by stem).
CZ_PARTIES = [
    ("Zástavní věřitel", r"Zástavní\w*\s+věřitel\w*"), ("Kupující", r"Kupující\w*"),
    ("Prodávající", r"Prodávající\w*"), ("Pronajímatel", r"Pronajímatel\w*"),
    ("Nájemce", r"Nájemc\w*"), ("Objednatel", r"Objednatel\w*"),
    ("Zhotovitel", r"Zhotovitel\w*"), ("Poskytovatel", r"Poskytovatel\w*"),
    ("Uživatel", r"Uživatel\w*"), ("Nabyvatel", r"Nabyvatel\w*"),
    ("Zaměstnavatel", r"Zaměstnavatel\w*"), ("Zaměstnanec", r"Zaměstnan(?:ec|ce|ci|cem|cům|cích)"),
    ("Dodavatel", r"Dodavatel\w*"), ("Odběratel", r"Odběratel\w*"), ("Věřitel", r"Věřitel\w*"),
    ("Dlužník", r"Dlužník\w*"), ("Ručitel", r"Ručitel\w*"), ("Příkazce", r"Příkazc\w*"),
    ("Příkazník", r"Příkazník\w*"), ("Zástavce", r"Zástavc\w*"), ("Půjčitel", r"Půjčitel\w*"),
    ("Vydlužitel", r"Vydlužitel\w*"), ("Úvěrující", r"Úvěrující\w*"),
    ("Úvěrovaný", r"Úvěrovan\w*"),
]
_CZ_ONLY = {("connector", "a"), ("connector", "i")}   # English "a" is an article
_CZ_CHARS = re.compile("[ěščřžůťďňĚŠČŘŽŮŤĎŇ]")


@lru_cache(maxsize=8)
def _lexicon_re(parties: tuple[str, ...] = ()):
    entries = [(c, l, p) for c, l, p in LEXICON]
    entries += [("party", n, re.escape(n) + r"\w*") for n in sorted(parties, key=len, reverse=True)]
    entries += [("party", n, re.escape(n) + r"s?") for n in EN_PARTIES]
    entries += [("party", l, p) for l, p in CZ_PARTIES]
    alts = "|".join(f"(?P<g{i}>{p})" for i, (_, _, p) in enumerate(entries))
    return re.compile(rf"(?<!\w)(?:{alts})(?!\w)"), [(c, l) for c, l, _ in entries]


def signature(sentence: str, cz: bool, parties: tuple[str, ...] = ()) -> list[tuple[str, str]]:
    rx, meta = _lexicon_re(parties)
    sig = [meta[int(m.lastgroup[1:])] for m in rx.finditer(sentence)]
    return sig if cz else [t for t in sig if t not in _CZ_ONLY]


_SPLIT = re.compile(r'(?<=[.;:])\s+(?=[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ„"(])')
_ABBR = {"čl.", "odst.", "písm.", "e.g.", "i.e.", "zák.", "č.", "tzv.", "resp.", "srov.",
         "no.", "art.", "s.r.o.", "a.s.", "inc.", "ltd.", "mr.", "ms.", "dr.", "cf.", "vs."}


def sentences(text: str) -> list[str]:
    # ponytail: regex splitter + abbreviation merge; a real segmenter if this misfires
    out: list[str] = []
    for line in text.splitlines():
        prev_abbr = False
        for piece in _SPLIT.split(line.strip()):
            piece = piece.strip()
            if prev_abbr and out:
                out[-1] += " " + piece
            elif piece:
                out.append(piece)
            prev_abbr = bool(piece) and piece.split()[-1].lower().lstrip("(„\"") in _ABBR
    return out


def _flip(o: str, r: str, so, sr) -> dict:
    """Trim the common prefix/suffix; the first differing token names the category."""
    p = 0
    while p < min(len(so), len(sr)) and so[p] == sr[p]:
        p += 1
    s = 0
    while s < min(len(so), len(sr)) - p and so[-1 - s] == sr[-1 - s]:
        s += 1
    frm, to = so[p:len(so) - s], sr[p:len(sr) - s]
    return {"category": (frm or to)[0][0], "original": o[:200], "revised": r[:200],
            "from": [l for _, l in frm], "to": [l for _, l in to]}


def flips(original: str, revised: str, parties: tuple[str, ...] = ()) -> list[dict]:
    a, b = sentences(original), sentences(revised)
    same = set(a) & set(b)
    cands = [s for s in b if s not in same]
    out = []
    for o in a:
        if o in same:
            continue
        # ponytail: O(n*m) best-match scan, fine for contract-sized inputs
        best, score = None, 0.0
        for r in cands:
            sm = difflib.SequenceMatcher(None, o, r, autojunk=False)
            if sm.real_quick_ratio() >= 0.6 and sm.quick_ratio() >= 0.6 and sm.ratio() > score:
                best, score = r, sm.ratio()
        if best is not None and score >= 0.6:
            cz = bool(_CZ_CHARS.search(o + best))
            so, sr = signature(o, cz, parties), signature(best, cz, parties)
            if so != sr:
                out.append(_flip(o, best, so, sr))
            continue
        so = signature(o, bool(_CZ_CHARS.search(o)), parties)
        keep = [l for c, l in so if c in ("modal", "party")]
        if keep:
            out.append({"category": "unmatched", "original": o[:200], "revised": "",
                        "from": keep, "to": []})
    return out


def report(original: str, revised: str, semantic: bool = True,
           parties: tuple[str, ...] = ()) -> dict:
    _, _, dropped, added = compare(original, revised)
    fl = flips(original, revised, tuple(parties)) if semantic else []
    return {
        "dropped": _fmt(dropped),
        "added": _fmt(added),
        "flips": fl,
        "ok": not dropped and not fl,
    }


def _demo() -> int:
    orig = ("Nájem je 10 000 Kč měsíčně, splatný do 1. 5. 2024 podle § 5 "
            "odst. 2; strana uvedla „bez omezení“.")
    rev = ("Nájem je 12 000 Kč měsíčně, splatný do 1. 5. 2024 podle § 5 "
           "odst. 2; strana uvedla „bez omezení“.")
    dropped, added = compare(orig, rev)[2:]
    assert dropped == Counter({("money", "10 000 Kč"): 1}), dropped
    assert added == Counter({("money", "12 000 Kč"): 1}), added

    # refs/dates/quotes survive unchanged: nothing dropped here
    assert report(orig, orig)["ok"] is True
    # losing the amount and the date are drops
    lost = report(orig, "bez čísel")["dropped"]
    cats = {r["category"] for r in lost}
    assert {"money", "date"} <= cats, lost

    def drop(o, r):
        return [(d["category"], d["value"]) for d in report(o, r)["dropped"]]
    assert drop("Price EUR 1,000.00.", "Price EUR 1,500.00.") == [("money", "EUR 1,000.00")]
    assert drop("Lhůta do 1. ledna 2025.", "Lhůta do 1. února 2025.") == [("date", "1. ledna 2025")]
    assert drop("Splatnost 30 dnů.", "Splatnost 14 dnů.") == [("duration", "30 dnů")]
    for s, cat in [("€10", "money"), ("$5", "money"), ("USD 2 000", "money"), ("Kč 100", "money"),
                   ("1 January 2025", "date"), ("January 1, 2025", "date"),
                   ("1st January 2025", "date"), ("15 business days", "duration"),
                   ("15 pracovních dnů", "duration"), ("3 roky", "duration"), ("48 hours", "duration")]:
        assert list(tokens(s)) == [(cat, s)], (s, tokens(s))

    def flip(o, r, **kw):
        fl = report(o, r, **kw)["flips"]
        assert len(fl) == 1, (o, r, fl)
        return fl[0]["category"], fl[0]["from"], fl[0]["to"]
    assert flip("Seller shall deliver the goods.", "Seller may deliver the goods.") == \
        ("modal", ["shall"], ["may"])
    assert flip("Seller shall deliver the goods.", "Seller shall not deliver the goods.")[1:] == \
        (["shall"], ["shall not"])
    assert flip("Buyer shall pay the price and the costs.",
                "Buyer shall pay the price or the costs.")[0] == "connector"
    c, f, t = flip("Seller shall indemnify Buyer.", "Buyer shall indemnify Seller.")
    assert (c, f, t) == ("party", ["Seller", "shall", "Buyer"], ["Buyer", "shall", "Seller"])
    assert flip("Buyer may terminate the agreement acting reasonably.",
                "Buyer may terminate the agreement in its sole discretion.")[0] == "standard"
    assert flip("Prodávající je povinen dodat zboží do skladu.",
                "Prodávající může dodat zboží do skladu.") == ("modal", ["je povinen"], ["může"])
    assert flip("Verkäufer muss die Ware liefern.",
                "Verkäufer kann die Ware liefern.") == ("modal", ["muss"], ["kann"])
    assert drop("Preis CHF 5,000 und £200.", "Preis CHF 6,000 und GBP 300.") == \
        [("money", "CHF 5,000"), ("money", "£200")]
    assert flip("Acme shall pay.", "Beta shall pay.", parties=("Acme", "Beta"))[0] == "party"
    two = "The Seller shall deliver the goods. The Buyer shall pay the price."
    assert report(two, two) == {"dropped": [], "added": [], "flips": [], "ok": True}
    swapped = "The Buyer shall pay the price. The Seller shall deliver the goods."
    assert report(two, swapped)["flips"] == [], report(two, swapped)
    assert flip("Seller shall deliver.", "Completely different text here.")[0] == "unmatched"
    assert sentences("Viz čl. V odst. 2. Další věta; Third: Fourth") == \
        ["Viz čl. V odst. 2.", "Další věta;", "Third:", "Fourth"]
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("original", nargs="?", help="Path to original document file")
    ap.add_argument("revised", nargs="?", help="Path to revised document file")
    ap.add_argument("--text-orig", help="Direct text of original (alternative to file)")
    ap.add_argument("--text-rev", help="Direct text of revised (alternative to file)")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 if any protected token was dropped or a flip found")
    ap.add_argument("--no-semantic", action="store_true", help="skip the semantic flip layer")
    ap.add_argument("--party", action="append", default=[],
                    help="extra party name/alias (repeatable, case-sensitive prefix)")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)

    if args.demo:
        return _demo()

    orig_text = args.text_orig if args.text_orig is not None else (read_text(args.original) if args.original else None)
    rev_text = args.text_rev if args.text_rev is not None else (read_text(args.revised) if args.revised else None)

    if orig_text is None or rev_text is None:
        ap.error("need ORIGINAL and REVISED (as files or via --text-orig / --text-rev, or --demo)")

    res = report(orig_text, rev_text, not args.no_semantic, tuple(args.party))

    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        if res["ok"]:
            print("substance-preservation: OK (no dropped protected tokens, no flips)")
        for r in res["dropped"]:
            print(f"DROP  {r['category']:<8} {r['value']!r} x{r['count']}")
        for r in res["added"]:
            print(f"ADD   {r['category']:<8} {r['value']!r} x{r['count']}")
        for f in res["flips"]:
            where = f["revised"] or f["original"]
            print(f"FLIP  {f['category']}  {' '.join(f['from'])!r} -> "
                  f"{' '.join(f['to'])!r}  in: {where[:120]}")

    if args.strict and (res["dropped"] or res["flips"]):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
