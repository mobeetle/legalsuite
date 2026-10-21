#!/usr/bin/env python3
"""Python-vs-Node parity for the dual-runtime suite (stdlib only).

Runs every mechanical eval case twice — once with `python3 scripts/foo.py`,
once with `node scripts/foo.js` — and diffs the verdict (pass/fail per case),
not byte-identical stdout (banners carry today's date).

    python3 evals/parity_js.py
Exit 1 when any case passes on one runtime and fails on the other, or when a
.js side is missing for a .py case script.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run import check  # one predicate for both runners; a second copy drifts

HERE = Path(__file__).resolve().parent
PY_SCRIPTS = HERE.parent / "skills" / "legal" / "scripts"


def run_one(exe, script, args, cwd):
    p = subprocess.run([exe, str(script), *args], cwd=cwd,
                       capture_output=True, text=True)
    return p


def case_verdict(res_stdout, res_returncode, spec):
    if not spec.get("json", True):
        ok = True
        if "exit" in spec["expect"] and res_returncode != spec["expect"]["exit"]:
            ok = False
        for s in spec["expect"].get("stdout_contains", []):
            if s not in res_stdout:
                ok = False
        return ok
    try:
        res = json.loads(res_stdout)
    except json.JSONDecodeError:
        return False
    return not check(res, spec["expect"])


def main() -> int:
    if not shutil.which("node"):
        print("parity_js: 77 skipped (no node)")
        return 77   # a skip is not a pass: the caller reports it

    failed = missing = 0
    for case in sorted((HERE / "cases").iterdir()):
        spec_file = case / "expect.json"
        if not spec_file.is_file():
            continue
        spec = json.loads(spec_file.read_text(encoding="utf-8"))
        script, *args = spec["run"]
        py = PY_SCRIPTS / script
        js = PY_SCRIPTS / (Path(script).stem + ".js")
        if not js.is_file():
            print(f"missing {js.name} for {case.name}")
            missing += 1
            continue
        py_p = run_one(sys.executable, py, args, case)
        js_p = run_one("node", js, args, case)
        py_ok = case_verdict(py_p.stdout, py_p.returncode, spec)
        js_ok = case_verdict(js_p.stdout, js_p.returncode, spec)
        mark = "ok  " if py_ok == js_ok == True else ("FAIL " if not (py_ok and js_ok) else "DIVERGE")
        if mark != "ok  ":
            failed += 1
        print(f"{mark} {case.name} (py={'pass' if py_ok else 'FAIL'} js={'pass' if js_ok else 'FAIL'})")
    print(f"\nparity: {failed} divergent, {missing} missing js")
    return 1 if (failed or missing) else 0


if __name__ == "__main__":
    sys.exit(main())
