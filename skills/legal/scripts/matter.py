#!/usr/bin/env python3
"""Matter-folder state and register adapter for the legal suite (stdlib only).

Reads and writes the machine state and the append-only registers a matter
folder holds (`references/matter-folder.md`), validating `state.json` against
`references/state-schema.json`. This is the backing script for the local MCP
tools `matter_state`, `matter_update`, `register_write` and `packet_status`
(IMPROVEMENT-PLAN §1A.1); the model judges, this reports and enforces the
mechanical invariants (schema, append-only).

    matter.py state    --dir DIR [--json]
    matter.py update   --dir DIR --patch JSON|@FILE [--json]
    matter.py register --dir DIR --name REGISTER --rows JSON [--json]
    matter.py packet   --dir DIR --id ID --status STATUS [--json]
    matter.py --demo               # runnable self-check

Exit 0 normally; exit 1 when the state is invalid or a write would violate the
schema. `register` never rewrites an existing line; it only appends.

Ceiling: a deliberately small JSON-schema subset (type / required / enum /
properties / items), enough for state-schema.json; not a general validator.
"""
from __future__ import annotations

import argparse
import contextlib
import io
import json
import re
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path


@contextlib.contextmanager
def _quiet():
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        yield

SCHEMA = Path(__file__).resolve().parent.parent / "references" / "state-schema.json"
NAME_RE = re.compile(r"^[A-Za-z0-9_-]+$")   # register/file slug, no path tricks
CURRENT_SUITE = "1.0"
# A pre-schema state put the stance flat and held none of these as an object.
LEGACY_KEYS = {"mode", "risk", "path", "jurisdiction", "epoch", "interests",
               "posture", "audience", "language"}
_TYPES = {"object": dict, "array": list, "string": str, "boolean": bool,
          "integer": int, "number": (int, float)}


def schema() -> dict:
    return json.loads(SCHEMA.read_text(encoding="utf-8"))


def _walk(value, sch: dict, path: str, errs: list[str]) -> None:
    """Minimal structural validation of `value` against one schema node."""
    t = sch.get("type")
    if t:
        py = _TYPES.get(t)
        bad = py is not None and not isinstance(value, py)
        if t == "integer" and isinstance(value, bool):
            bad = True
        if bad:
            errs.append(f"{path}: expected {t}, got {type(value).__name__}")
            return
    if "enum" in sch and value not in sch["enum"]:
        errs.append(f"{path}: {value!r} is not one of {sch['enum']}")
    if t == "object":
        for req in sch.get("required", []):
            if req not in value:
                errs.append(f"{path}: missing required key {req!r}")
        props = sch.get("properties", {})
        for k, v in value.items():
            if k in props:
                _walk(v, props[k], f"{path}.{k}", errs)
    elif t == "array":
        item = sch.get("items")
        if item:
            for i, v in enumerate(value):
                _walk(v, item, f"{path}[{i}]", errs)


def validate(state, sch: dict | None = None) -> list[str]:
    errs: list[str] = []
    _walk(state, sch or schema(), "$", errs)
    return errs


def classify(state, errs: list[str]) -> str:
    """valid | legacy | unknown_version | invalid -- old is not corrupt."""
    if not errs:
        v = state.get("suite_version") if isinstance(state, dict) else None
        return "valid" if not v or v == CURRENT_SUITE else "unknown_version"
    if isinstance(state, dict) and "stance" not in state and (LEGACY_KEYS & set(state)):
        return "legacy"
    v = state.get("suite_version") if isinstance(state, dict) else None
    if v and v != CURRENT_SUITE:
        return "unknown_version"
    return "invalid"


def deep_merge(base, patch):
    """Recursive merge; lists and scalars replace, only dicts recurse."""
    if isinstance(base, dict) and isinstance(patch, dict):
        out = dict(base)
        for k, v in patch.items():
            out[k] = deep_merge(base[k], v) if k in base else v
        return out
    return patch


def load_patch(argument: str):
    text = Path(argument[1:]).read_text(encoding="utf-8") if argument.startswith("@") else argument
    return json.loads(text)


def _state_path(d: str) -> Path:
    return Path(d) / "state.json"


def read_state(d: str) -> dict:
    return json.loads(_state_path(d).read_text(encoding="utf-8"))


def write_state(d: str, state: dict) -> None:
    _state_path(d).write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n",
                              encoding="utf-8")


def _is_table(lines: list[str]) -> bool:
    """A Markdown table header is a `|`-row followed by a `|---|` separator."""
    for n in range(len(lines) - 1):
        s = lines[n + 1].strip()
        if s.startswith("|") and "-" in s and set(s) <= set("|:- "):
            if lines[n].strip().startswith("|"):
                return True
    return False


def append_rows(path: Path, rows: list) -> int:
    """Append to a register. Existing lines are never touched (append-only)."""
    text = path.read_text(encoding="utf-8") if path.is_file() else ""
    lines = text.splitlines()
    table = _is_table(lines)
    new = []
    for r in rows:
        if table:
            cells = r if isinstance(r, list) else [r]
            new.append("| " + " | ".join(str(c) for c in cells) + " |")
        else:
            new.append(r if isinstance(r, str) else json.dumps(r, ensure_ascii=False))
    if not new:
        return 0
    with path.open("a", encoding="utf-8") as f:
        if text and not text.endswith("\n"):
            f.write("\n")
        f.write("\n".join(new) + "\n")
    return len(new)


def _emit(obj: dict, as_json: bool, ok: bool, human: str) -> int:
    if as_json:
        print(json.dumps(obj, ensure_ascii=False, indent=2))
    else:
        if ok:
            print(human)
            print(json.dumps(obj.get("state", obj), ensure_ascii=False, indent=2))
        else:
            for e in obj.get("errors", []):
                print(f"error: {e}", file=sys.stderr)
    return 0 if ok else 1


def cmd_state(args) -> int:
    try:
        state = read_state(args.dir)
    except FileNotFoundError:
        print(f"error: no state.json in {args.dir}", file=sys.stderr)
        return 1
    errs = validate(state)
    kind = classify(state, errs)
    if args.json:
        print(json.dumps({"ok": kind == "valid", "kind": kind, "path": str(_state_path(args.dir)),
                          "errors": errs, "state": state}, ensure_ascii=False, indent=2))
    elif kind == "valid":
        print(f"state valid: {_state_path(args.dir)}")
    elif kind == "legacy":
        print(f"legacy state (pre-schema): {_state_path(args.dir)}; "
              "migrate with scripts/migrate_state.py --dir <matter>")
    elif kind == "unknown_version":
        print(f"state suite_version {state.get('suite_version')!r} != {CURRENT_SUITE}: "
              f"{_state_path(args.dir)}")
    else:
        for e in errs:
            print(f"error: {e}", file=sys.stderr)
    return 1 if kind == "invalid" else 0


def cmd_update(args) -> int:
    try:
        state = read_state(args.dir)
    except FileNotFoundError:
        print(f"error: no state.json in {args.dir} (create it first)", file=sys.stderr)
        return 1
    if classify(state, validate(state)) == "legacy":
        print("error: legacy state (pre-schema); run "
              f"scripts/migrate_state.py --dir {args.dir} first", file=sys.stderr)
        return 1
    try:
        patch = load_patch(args.patch)
    except (OSError, json.JSONDecodeError) as e:
        print(f"error: bad --patch: {e}", file=sys.stderr)
        return 1
    if not isinstance(patch, dict):
        print("error: --patch must be a JSON object", file=sys.stderr)
        return 1
    merged = deep_merge(state, patch)
    merged["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    errs = validate(merged)
    if errs:
        return _emit({"ok": False, "errors": errs}, args.json, False, "")
    write_state(args.dir, merged)
    return _emit({"ok": True, "path": str(_state_path(args.dir)), "errors": [], "state": merged},
                 args.json, True, f"state updated: {_state_path(args.dir)}")


def cmd_register(args) -> int:
    if not NAME_RE.match(args.name):
        print(f"error: bad register name {args.name!r}", file=sys.stderr)
        return 1
    try:
        rows = json.loads(args.rows) if not args.rows.startswith("@") else \
            json.loads(Path(args.rows[1:]).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"error: bad --rows: {e}", file=sys.stderr)
        return 1
    if not isinstance(rows, list):
        print("error: --rows must be a JSON array", file=sys.stderr)
        return 1
    path = Path(args.dir) / f"{args.name}.md"
    n = append_rows(path, rows)
    return _emit({"ok": True, "register": args.name, "path": str(path), "appended": n, "errors": []},
                 args.json, True, f"register {args.name}: appended {n} row(s) -> {path}")


def packet_enum(sch: dict | None = None) -> list[str]:
    return (sch or schema())["properties"]["packets"]["items"]["properties"]["status"]["enum"]


def cmd_packet(args) -> int:
    statuses = packet_enum()
    if args.status not in statuses:
        print(f"error: --status {args.status!r} not one of {statuses}", file=sys.stderr)
        return 1
    try:
        state = read_state(args.dir)
    except FileNotFoundError:
        print(f"error: no state.json in {args.dir}", file=sys.stderr)
        return 1
    if classify(state, validate(state)) == "legacy":
        print("error: legacy state (pre-schema); run "
              f"scripts/migrate_state.py --dir {args.dir} first", file=sys.stderr)
        return 1
    packets = state.setdefault("packets", [])
    for p in packets:
        if p.get("id") == args.id:
            p["status"] = args.status
            break
    else:
        packets.append({"id": args.id, "agent": "", "status": args.status})
    errs = validate(state)
    if errs:
        return _emit({"ok": False, "errors": errs}, args.json, False, "")
    write_state(args.dir, state)
    return _emit({"ok": True, "id": args.id, "status": args.status, "path": str(_state_path(args.dir)),
                  "errors": []}, args.json, True, f"packet {args.id}: {args.status}")


def _demo() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        d = Path(tmp)
        good = {"matter": "demo", "stance": {"mode": "review", "risk": "analytical", "path": "architect"},
                "gate_plan": {"current_gate": "G0", "approved": False, "checkpoints": []},
                "packets": [{"id": "P1", "agent": "sub", "status": "queued"}]}
        (d / "state.json").write_text(json.dumps(good), encoding="utf-8")
        assert validate(good) == [], validate(good)

        # schema catches a bad mode and a bad packet status
        bad = json.loads(json.dumps(good))
        bad["stance"]["mode"] = "nonsense"
        assert any("stance.mode" in e for e in validate(bad)), validate(bad)
        badp = json.loads(json.dumps(good))
        badp["packets"][0]["status"] = "lost"
        assert any("packets[0].status" in e for e in validate(badp)), validate(badp)

        # update deep-merges and writes
        with _quiet():
            assert cmd_update(argparse.Namespace(dir=str(d), patch='{"stance":{"risk":"high"}}', json=True)) == 0
            assert json.loads((d / "state.json").read_text())["stance"]["risk"] == "high"

            # packet status set, and a missing packet is created
            assert cmd_packet(argparse.Namespace(dir=str(d), id="P1", status="running", json=True)) == 0
            assert cmd_packet(argparse.Namespace(dir=str(d), id="P2", status="queued", json=True)) == 0
            assert cmd_packet(argparse.Namespace(dir=str(d), id="P1", status="lost", json=True)) == 1
        st = json.loads((d / "state.json").read_text())
        assert {p["id"]: p["status"] for p in st["packets"]} == {"P1": "running", "P2": "queued"}

        # table register: rows appended under the header, old lines untouched
        tbl = d / "issue-log.md"
        tbl.write_text("| ID | Issue |\n|---|---|\n| I1 | old |\n", encoding="utf-8")
        before = tbl.read_text()
        with _quiet():
            assert cmd_register(argparse.Namespace(dir=str(d), name="issue-log",
                                                   rows='[["I2","new"],["I3","more"]]', json=True)) == 0
        after = tbl.read_text()
        assert after.startswith(before), after
        assert after.count("| I2 | new |") == 1 and after.count("| I3 | more |") == 1

        # append-only text register (history): appends, never rewrites
        hist = d / "history.md"
        hist.write_text("- 2026-10-01 · intake · opened\n", encoding="utf-8")
        with _quiet():
            assert cmd_register(argparse.Namespace(dir=str(d), name="history",
                                                   rows='["- 2026-10-02 · tools · web search"]', json=True)) == 0
        h = hist.read_text().splitlines()
        assert h[0] == "- 2026-10-01 · intake · opened" and h[-1] == "- 2026-10-02 · tools · web search", h
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    sub = ap.add_subparsers(dest="cmd")

    p = sub.add_parser("state", help="read and validate state.json")
    p.add_argument("--dir", required=True, help="matter folder")
    p.add_argument("--json", action="store_true", help="machine output")
    p.set_defaults(func=cmd_state)

    p = sub.add_parser("update", help="deep-merge a patch into state.json")
    p.add_argument("--dir", required=True)
    p.add_argument("--patch", required=True, help="JSON object, or @file")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_update)

    p = sub.add_parser("register", help="append rows to a register (append-only)")
    p.add_argument("--dir", required=True)
    p.add_argument("--name", required=True, help="register name, without .md")
    p.add_argument("--rows", required=True, help="JSON array; strings = lines, arrays = table rows")
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_register)

    p = sub.add_parser("packet", help="set a packet's status")
    p.add_argument("--dir", required=True)
    p.add_argument("--id", required=True)
    p.add_argument("--status", required=True, choices=packet_enum())
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=cmd_packet)

    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not getattr(args, "func", None):
        ap.error("need a command (state|update|register|packet) or --demo")
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
