#!/usr/bin/env python3
"""legalsuite eval runner (stdlib only).

A case either runs a suite script on planted input (mechanical, verified here)
or describes a skill run graded against a rubric (model, listed here). The
manifest `evals/manifest.json` is the single inventory: every case directory is
listed once as mechanical or model, and the counts are asserted, so deleting or
adding a case can never leave the suite green by accident.

    python3 evals/run.py               # mechanical cases run; model cases listed
    python3 evals/run.py --mechanical  # mechanical only (verify_suite.py uses this)
    python3 evals/run.py --engine DIR  # parity: run against another engine's scripts
    python3 evals/run.py --list        # inventory only

Exit 0 all mechanical pass and the manifest matches; 1 a case failed or the
inventory is inconsistent; 2 usage.
"""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent / "skills" / "legal" / "scripts"
MANIFEST = HERE / "manifest.json"

ALLOWED_SPEC = {"title", "kind", "run", "json", "expect", "why"}
# Every predicate here has a bite test in cases/: a wrong implementation fails.
ALLOWED_EXPECT = {
    "ok", "keys", "keys_nonempty", "flip_categories", "flip_categories_exact",
    "dropped_categories", "dropped_categories_exact", "fail_checks_all",
    "fail_checks_any", "fail_checks_exact", "warn_checks_all", "warn_checks_exact",
    "min_fails", "detail_contains_all", "exit", "stdout_contains", "stdout_absent",
}


def _ids(res: dict, level: str) -> set:
    return {i.get("check") for i in res.get("issues", []) if i.get("level") == level}


def check(res: dict, exp: dict) -> list[str]:
    """Compare one script result against one expectation. Unknown keys fail."""
    errs: list[str] = []
    unknown = set(exp) - ALLOWED_EXPECT
    if unknown:
        return [f"unknown expectation key(s) {sorted(unknown)} — a typo must not pass"]
    if "ok" in exp and res.get("ok") != exp["ok"]:
        errs.append(f"ok={res.get('ok')} expected {exp['ok']}")

    for k in exp.get("keys", []):
        if k not in res:
            errs.append(f"missing key {k!r} (got {sorted(res)})")
    for k in exp.get("keys_nonempty", []):
        v = res.get(k)
        if not v:
            errs.append(f"key {k!r} empty ({v!r})")

    flips = {f.get("category") for f in res.get("flips", [])}
    dropped = {d.get("category") for d in res.get("dropped", [])}
    fails, warns = _ids(res, "fail"), _ids(res, "warn")
    for c in exp.get("flip_categories", []):
        if c not in flips:
            errs.append(f"no {c!r} flip (got {sorted(flips)})")
    if "flip_categories_exact" in exp and flips != set(exp["flip_categories_exact"]):
        errs.append(f"flips {sorted(flips)} != expected {sorted(exp['flip_categories_exact'])}")
    for c in exp.get("dropped_categories", []):
        if c not in dropped:
            errs.append(f"no {c!r} drop (got {sorted(dropped)})")
    if "dropped_categories_exact" in exp and dropped != set(exp["dropped_categories_exact"]):
        errs.append(f"drops {sorted(dropped)} != expected {sorted(exp['dropped_categories_exact'])}")

    for c in exp.get("fail_checks_all", []):
        if c not in fails:
            errs.append(f"no failing {c!r} check (got {sorted(fails)})")
    if exp.get("fail_checks_any") and not fails & set(exp["fail_checks_any"]):
        errs.append(f"none of {exp['fail_checks_any']} failed (got {sorted(fails)})")
    if "fail_checks_exact" in exp and fails != set(exp["fail_checks_exact"]):
        errs.append(f"failing checks {sorted(fails)} != expected {sorted(exp['fail_checks_exact'])}")
    for c in exp.get("warn_checks_all", []):
        if c not in warns:
            errs.append(f"no {c!r} warning (got {sorted(warns)})")
    if "warn_checks_exact" in exp and warns != set(exp["warn_checks_exact"]):
        errs.append(f"warnings {sorted(warns)} != expected {sorted(exp['warn_checks_exact'])}")

    # ok:false must name at least one failure — when the result carries issues at
    # all (substance.py reports flips/drops, not issues).
    floor = exp.get("min_fails", 1 if exp.get("ok") is False and "issues" in res and not (
        "fail_checks_exact" in exp or "fail_checks_all" in exp or "fail_checks_any" in exp) else 0)
    if floor and len([i for i in res.get("issues", []) if i.get("level") == "fail"]) < floor:
        errs.append(f"ok=false but fewer than {floor} failing check(s)")

    details = " | ".join(str(i.get("detail", "")) for i in res.get("issues", []))
    for s in exp.get("detail_contains_all", []):
        if s not in details:
            errs.append(f"no issue detail contains {s!r} (got {details[:160]!r})")
    return errs


def run_case(case: Path, scripts: Path) -> list[str]:
    try:
        spec = json.loads((case / "expect.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        return [f"unreadable expect.json: {e}"]
    unknown = set(spec) - ALLOWED_SPEC
    if unknown:
        return [f"unknown spec key(s) {sorted(unknown)}"]
    script, *args = spec["run"]
    target = scripts / script
    if not target.is_file():
        return [f"case names a missing script {script}"]
    p = subprocess.run([sys.executable, str(target), *args],
                       cwd=case, capture_output=True, text=True)
    if not spec.get("json", True):
        errs = []
        if "exit" in spec["expect"] and p.returncode != spec["expect"]["exit"]:
            errs.append(f"exit {p.returncode} expected {spec['expect']['exit']}")
        for s in spec["expect"].get("stdout_contains", []):
            if s not in p.stdout:
                errs.append(f"stdout missing {s!r}")
        for s in spec["expect"].get("stdout_absent", []):
            if s in p.stdout:
                errs.append(f"stdout must not contain {s!r}")
        return errs
    try:
        res = json.loads(p.stdout)
    except json.JSONDecodeError:
        return [f"no JSON from {script}: {(p.stderr or p.stdout).strip()[:200]}"]
    return check(res, spec["expect"])


def inventory() -> tuple[dict, list[str]]:
    """Manifest vs directories: every case listed once, nothing orphaned."""
    errs: list[str] = []
    man = json.loads(MANIFEST.read_text(encoding="utf-8"))
    listed = {**{n: "mechanical" for n in man["mechanical"]},
              **{n: "model" for n in man["model"]}}
    on_disk = {p.name for p in (HERE / "cases").iterdir() if p.is_dir()}
    dupes = set(man["mechanical"]) & set(man["model"])
    if dupes:
        errs.append(f"listed as both mechanical and model: {sorted(dupes)}")
    for n in sorted(on_disk - set(listed)):
        errs.append(f"case {n} is not in evals/manifest.json")
    for n, kind in sorted(listed.items()):
        d = HERE / "cases" / n
        if not d.is_dir():
            errs.append(f"manifest names a missing case {n}")
        elif kind == "mechanical" and not (d / "expect.json").is_file():
            errs.append(f"mechanical case {n} has no expect.json")
        elif kind == "model" and not (d / "rubric.md").is_file():
            errs.append(f"model case {n} has no rubric.md")
    return man, errs


def main() -> int:
    argv = sys.argv[1:]
    scripts = SCRIPTS
    if "--engine" in argv:
        scripts = Path(argv[argv.index("--engine") + 1]).resolve()
    mechanical_only = "--mechanical" in argv
    man, errs = inventory()
    if "--list" in argv:
        print(json.dumps(man, indent=2))
        return 1 if errs else 0

    passed = 0
    total = len(man["mechanical"])   # the manifest count, never the survivors
    for name in sorted(man["mechanical"]):
        if not (HERE / "cases" / name).is_dir():
            print(f"FAIL {name}\n     - case directory missing (listed in the manifest)")
            continue            # already named in errs; never a silent skip
        case_errors = run_case(HERE / "cases" / name, scripts)
        passed += not case_errors
        print(f"{'FAIL' if case_errors else 'ok  '} {name}"
              + "".join(f"\n     - {e}" for e in case_errors))
    if not mechanical_only:
        print("\nModel cases (run the skill, then grade against the rubric):" if man["model"]
              else "\nModel cases: none")
        for name in sorted(man["model"]):
            head = (HERE / "cases" / name / "rubric.md").read_text(encoding="utf-8").splitlines()[0]
            print(f"  {name}: {head.lstrip('# ')}")
    for e in errs:
        print(f"INVENTORY - {e}")
    print(f"\nmechanical {passed}/{total} · model {len(man['model'])} listed · "
          f"inventory {'ok' if not errs else 'FAIL'}")
    return 0 if passed == total and not errs else 1


if __name__ == "__main__":
    sys.exit(main())
