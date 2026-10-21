#!/usr/bin/env python3
"""Wave-4 end-to-end check against the acceptance corpus (plan §4).  [stdlib only]

Runs the mechanical gates over the sibling corpus at `../legalczech/.legal/` when
it is present, and skips cleanly otherwise. It does not grade prose — that is a
rubric plus an agent/human run. It proves the scripts still run on real matter
folders, and reports any state-schema drift it finds instead of hiding it.

    python3 evals/corpus.py
Exit 1 only if a gate that must run errors; state-schema drift is reported.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SCRIPTS = ROOT / "skills" / "legal" / "scripts"
CORPUS = ROOT.parent / "legalczech" / ".legal"


def run(*args) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, *map(str, args)],
                          capture_output=True, text=True, cwd=ROOT)


def main() -> int:
    if not CORPUS.is_dir():
        print(f"corpus check: skipped (no {CORPUS})")
        return 77   # a skip is not a pass
    matters = sorted(d for d in CORPUS.iterdir() if (d / "state.json").is_file())
    if not matters:
        print(f"corpus check: skipped (no matters in {CORPUS})")
        return 77

    failed = legacy = 0
    for m in matters:
        cells = []
        # state.json: a *legacy* (pre-schema) shape is recognised and counted;
        # anything unrecognised is a real failure.
        s = run(SCRIPTS / "matter.py", "state", "--dir", m, "--json")
        try:
            kind = json.loads(s.stdout or "{}").get("kind")
        except Exception:
            kind = None
        if kind == "legacy":
            legacy += 1
            cells.append("state legacy")
        elif kind == "valid":
            cells.append("state ok")
        else:
            failed += 1
            cells.append("state INVALID")

        facts = m / "facts.md"
        if facts.is_file():
            v = run(SCRIPTS / "views.py", "--facts", facts, "--json")
            try:
                keys = set(json.loads(v.stdout))
            except Exception:
                keys = set()
            ok = v.returncode == 0 and keys == {"chronology", "claims", "gaps"}
            cells.append("views ok" if ok else "views FAIL")
            failed += not ok

        memo = next(iter(sorted(m.glob("memo-*.md"))), None)
        if memo:
            t = run(SCRIPTS / "trace.py", memo, "--facts", facts,
                    "--authorities", m / "authorities.md", "--json")
            ok = t.returncode == 0 and t.stdout.lstrip().startswith("{")
            cells.append("trace ok" if ok else "trace FAIL")
            failed += not ok

        # preflight always exits 0 by design; judge the STATUS it reports.
        p = run(SCRIPTS / "preflight.py", "--dir", m, "--json")
        try:
            status = json.loads(p.stdout or "{}").get("status")
        except Exception:
            status = None
        ok = status in ("configured", "provisional")
        cells.append(f"preflight {status}" if ok else f"preflight {status or 'NO STATUS'}")
        failed += not ok

        print(f"{m.name:<28} " + " · ".join(cells))

    print(f"\ncorpus: {len(matters)} matter(s); {failed} gate failure(s); "
          f"{legacy} legacy (pre-schema) state")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
