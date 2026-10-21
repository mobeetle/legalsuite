#!/usr/bin/env python3
"""Link check for legal documents: are the incorporated URLs live? (stdlib only)

A URL a document incorporates by reference -- product terms, a policy, an
authority's portal -- is an authority in substance, so it is checked like one.
`links.py` extracts every http(s) URL and, unless --no-net, fetches each and
reports its status: live, redirecting (the shipped URL is stale) or dead.

    links.py DOC [--json] [--strict] [--no-net] [--timeout SECONDS] [--demo]

Exit 0 normally; --strict exits 1 when any link fails (unreachable is a warn).
Inputs: .txt, .md or .docx (accepted view).

Ceiling: a reachable URL is not a correct one -- this proves the address
resolves, not that the page says what the document claims. Read the page
(`ground.md`) and record the verified URL as a ledger row; a wrong-but-live URL
is caught there, not here.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request

from doctext import read_text

URL_RE = re.compile(r"https?://[^\s<>\"')\]]+")
TRAIL = ".,;:"
UA = {"User-Agent": "legalsuite-link-check/1.0"}


def find_urls(text: str) -> list[tuple[int, str]]:
    """Deduplicated (line, url) pairs, first occurrence wins."""
    out, seen = [], set()
    for n, line in enumerate(text.splitlines(), 1):
        for m in URL_RE.finditer(line):
            url = m.group().rstrip(TRAIL)
            if url not in seen:
                seen.add(url)
                out.append((n, url))
    return out


def status_issue(line: int, url: str, code, final: str):
    """Map a probe result to an issue, or None when the link is live and clean."""
    if code is None:
        return {"check": "unreachable", "level": "warn", "line": line,
                "detail": f"{url} could not be fetched -- not checked against the live page"}
    if 200 <= code < 300:
        if final.rstrip("/") != url.rstrip("/"):
            return {"check": "redirect", "level": "warn", "line": line,
                    "detail": f"{url} redirects to {final} -- use the final URL"}
        return None
    return {"check": "dead-link", "level": "fail", "line": line,
            "detail": f"{url} -> HTTP {code}"}


def probe(url: str, timeout: float):
    """(status, final-url); status None when unreachable. HEAD, GET on 403/405/501."""
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers=UA)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.geturl()
        except urllib.error.HTTPError as e:
            if method == "HEAD" and e.code in (403, 405, 501):
                continue          # HEAD refused -- retry with GET
            return e.code, url
        except Exception:
            if method == "GET":
                return None, url
    return None, url


def check(text: str, fetch: bool = True, timeout: float = 10.0) -> dict:
    pairs = find_urls(text)
    stats = {"links": len(pairs), "live": 0, "redirected": 0, "failed": 0, "unreachable": 0}
    issues = []
    if fetch:
        for line, url in pairs:
            code, final = probe(url, timeout)
            it = status_issue(line, url, code, final)
            if it is None:
                stats["live"] += 1
            else:
                stats[{"redirect": "redirected", "dead-link": "failed",
                       "unreachable": "unreachable"}[it["check"]]] += 1
                issues.append(it)
    return {"ok": not any(i["level"] == "fail" for i in issues), "issues": issues,
            "stats": stats, "urls": [u for _, u in pairs]}


def _fixture(name: str):
    from pathlib import Path
    p = Path(__file__).with_name("fixtures") / name
    return p.read_text(encoding="utf-8") if p.exists() else None


def _demo() -> int:
    bad = "See https://a.example/x. and https://a.example/x, then https://b.example/y"
    assert find_urls(bad) == [(1, "https://a.example/x"), (1, "https://b.example/y")], find_urls(bad)
    assert status_issue(0, "u", 200, "u") is None
    assert status_issue(0, "u", 200, "u2")["check"] == "redirect"
    assert status_issue(0, "u", 404, "u")["level"] == "fail"
    assert status_issue(0, "u", None, "u")["level"] == "warn"
    r = check(bad, fetch=False)
    assert r["ok"] and r["stats"]["links"] == 2 and len(r["urls"]) == 2, r
    # matter fixture: the wrong JetBrains URL the user fixed by hand
    badfix = _fixture("gsi-rev2-excerpt.md")
    goodfix = _fixture("gsi-rev2-clean.md")
    if badfix is not None and goodfix is not None:
        assert "https://www.jetbrains.com/legal/docs/terms/" in check(badfix, fetch=False)["urls"]
        assert "https://www.jetbrains.com/legal/#terms-and-agreements" in \
            check(goodfix, fetch=False)["urls"]
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("doc", nargs="?", help=".txt, .md or .docx")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--strict", action="store_true", help="exit 1 if any check fails")
    ap.add_argument("--no-net", action="store_true", help="extract URLs only, do not fetch")
    ap.add_argument("--timeout", type=float, default=10.0, help="per-request seconds")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.doc:
        ap.error("need DOC (or --demo)")
    res = check(read_text(args.doc), fetch=not args.no_net, timeout=args.timeout)
    if args.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        if args.no_net:
            for u in res["urls"]:
                print(u)
        for i in res["issues"]:
            print(f"{i['level'].upper():<4} {i['check']:<12} L{i['line']:<4} {i['detail']}")
        print("links: OK" if res["ok"] else "links: FAIL", res["stats"])
    return 1 if args.strict and not res["ok"] else 0


if __name__ == "__main__":
    sys.exit(main())
