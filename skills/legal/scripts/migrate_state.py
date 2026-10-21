#!/usr/bin/env python3
"""Migrate a pre-schema matter `state.json` to the current schema (stdlib only).

The schema evolved: flat stance fields moved into a `stance` object; a string
`gate_plan` became an object; `packets` became an array of `{id, agent, status}`;
`runs` rows gained `id`/`date`/`skill`; `active_items` statuses are now an enum.
This rewrites one matter's state to the current shape, **conserving** what it can
and recording what it could not map. The original is backed up first.

    migrate_state.py --dir DIR [--dry-run] [--json]
    migrate_state.py --demo            # runnable self-check

Exit 0 when the matter is already current or migrates cleanly; exit 1 if the
result would still be schema-invalid (nothing is written in that case).
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from matter import CURRENT_SUITE, validate

STANCE_KEYS = ("mode", "risk", "path", "jurisdiction", "epoch", "interests",
               "posture", "audience", "language", "checks", "fan_out", "playbook")
ACTIVE_STATUS = {"todo", "in_progress", "review", "done", "deferred", "blocked"}
MOVED_OUT = STANCE_KEYS + ("gate_plan", "packets", "runs", "active_items", "suite_version")


def _status(s: str) -> str:
    s = (s or "").strip().lower().replace("-", " ")
    if s in ACTIVE_STATUS:
        return s
    for word, val in (("done", "done"), ("progress", "in_progress"), ("review", "review"),
                      ("defer", "deferred"), ("block", "blocked")):
        if word in s:
            return val
    return "todo"


def _gate_plan(g):
    if isinstance(g, dict):
        return g
    s = str(g or "")
    return {"current_gate": s, "approved": s.strip().lower().startswith("approved"),
            "checkpoints": [], "note": s}


def _packets(p):
    if isinstance(p, list):
        out = []
        for i, row in enumerate(p, 1):
            r = dict(row) if isinstance(row, dict) else {"id": str(row)}
            r.setdefault("id", f"P{i}")
            r.setdefault("agent", "")
            r.setdefault("status", "queued")
            out.append(r)
        return out
    if isinstance(p, dict):
        return [{"id": str(k), "agent": "",
                 "status": (v or {}).get("status", "queued") if isinstance(v, dict) else str(v)}
                for k, v in p.items()]
    return []


def _runs(r):
    out = []
    for i, row in enumerate(r or [], 1):
        d = dict(row) if isinstance(row, dict) else {}
        d.setdefault("id", f"run-{i}")
        d.setdefault("date", "")
        d.setdefault("skill", "")
        out.append(d)
    return out


def _active(a):
    out = []
    for row in a or []:
        d = dict(row) if isinstance(row, dict) else {}
        d["id"] = d.get("id", "")
        d["status"] = _status(d.get("status", ""))
        out.append(d)
    return out


def migrate(state: dict) -> dict:
    out = {k: v for k, v in state.items() if k not in MOVED_OUT}
    out["matter"] = state.get("matter", "")
    stance = dict(state["stance"]) if isinstance(state.get("stance"), dict) else {}
    for k in STANCE_KEYS:
        if k in state:
            stance.setdefault(k, state[k])
    out["stance"] = stance
    out["gate_plan"] = _gate_plan(state.get("gate_plan"))
    if "packets" in state:
        out["packets"] = _packets(state["packets"])
    if "runs" in state:
        out["runs"] = _runs(state["runs"])
    if "active_items" in state:
        out["active_items"] = _active(state["active_items"])
    out["suite_version"] = CURRENT_SUITE
    out["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return out


def _demo() -> int:
    legacy = {"matter": "legacy", "mode": "research", "risk": "analytical", "path": "architect",
              "jurisdiction": "CZ", "audience": "lawyer", "interests": "neutral",
              "gate_plan": "approved 2026-01-01",
              "packets": {"p1": {"status": "integrated"}},
              "runs": [{"gate": "G0"}, {"gate": "G1"}],
              "active_items": [{"id": "W1", "status": "evidence done"}]}
    assert validate(legacy), "the fixture must be invalid under the current schema"
    new = migrate(legacy)
    assert validate(new) == [], validate(new)
    assert new["stance"]["mode"] == "research" and new["gate_plan"]["approved"] is True
    assert new["packets"] == [{"id": "p1", "agent": "", "status": "integrated"}], new["packets"]
    assert new["runs"][0]["id"] == "run-1" and new["runs"][0]["skill"] == ""
    assert new["active_items"][0]["status"] == "done"
    assert new["suite_version"] == CURRENT_SUITE
    assert migrate(new)["stance"]["mode"] == "research", "migration must be idempotent"
    print("demo ok")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dir", help="matter folder holding state.json")
    ap.add_argument("--dry-run", action="store_true", help="report, write nothing")
    ap.add_argument("--json", action="store_true", help="machine output")
    ap.add_argument("--demo", action="store_true", help="run the self-check")
    args = ap.parse_args(argv)
    if args.demo:
        return _demo()
    if not args.dir:
        ap.error("need --dir (or --demo)")

    p = Path(args.dir) / "state.json"
    try:
        state = json.loads(p.read_text(encoding="utf-8"))
    except OSError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    if not validate(state):
        print(json.dumps({"path": str(p), "ok": True, "changed": False}, indent=2)
              if args.json else f"already current: {p}")
        return 0

    new = migrate(state)
    errs = validate(new)
    if errs:
        if args.json:
            print(json.dumps({"path": str(p), "ok": False, "errors_after": errs}, indent=2))
        else:
            print("error: migration left schema errors (refusing to write):", file=sys.stderr)
            for e in errs:
                print(f"  {e}", file=sys.stderr)
        return 1
    if args.dry_run:
        print(json.dumps({"path": str(p), "ok": True, "changed": True, "dry_run": True}, indent=2)
              if args.json else f"would migrate {p}")
        return 0

    backup = p.with_name(p.name + ".bak")
    backup.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    p.write_text(json.dumps(new, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"path": str(p), "ok": True, "changed": True, "backup": str(backup)}, indent=2)
          if args.json else f"migrated {p} (backup {backup.name})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
