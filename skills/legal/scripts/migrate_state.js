#!/usr/bin/env node
"use strict";
/* Migrate a pre-schema matter state.json to the current schema (builtins
 * only: fs, path). Port of migrate_state.py. Exit 0 when already current
 * or migrated cleanly; 1 if the result would still be schema-invalid
 * (nothing is written in that case). */
const fs = require("fs");
const path = require("path");
const { CURRENT_SUITE, validate } = require("./matter.js");

const STANCE_KEYS = ["mode", "risk", "path", "jurisdiction", "epoch", "interests",
  "posture", "audience", "language", "checks", "fan_out", "playbook"];
const ACTIVE_STATUS = new Set(["todo", "in_progress", "review", "done", "deferred", "blocked"]);
const MOVED_OUT = new Set([...STANCE_KEYS, "gate_plan", "packets", "runs", "active_items", "suite_version"]);

function statusOf(s) {
  s = (s || "").trim().toLowerCase().replace(/-/g, " ");
  if (ACTIVE_STATUS.has(s)) return s;
  const pairs = [["done", "done"], ["progress", "in_progress"], ["review", "review"],
    ["defer", "deferred"], ["block", "blocked"]];
  for (const [word, val] of pairs) {
    if (s.includes(word)) return val;
  }
  return "todo";
}

function gatePlan(g) {
  if (g !== null && typeof g === "object" && !Array.isArray(g)) return g;
  const s = String(g === undefined || g === null ? "" : g);
  return { current_gate: s, approved: s.trim().toLowerCase().startsWith("approved"),
    checkpoints: [], note: s };
}

function packetsOf(p) {
  if (Array.isArray(p)) {
    return p.map((row, n) => {
      const r = (row !== null && typeof row === "object" && !Array.isArray(row))
        ? Object.assign({}, row) : { id: String(row) };
      if (!("id" in r)) r.id = `P${n + 1}`;
      if (!("agent" in r)) r.agent = "";
      if (!("status" in r)) r.status = "queued";
      return r;
    });
  }
  if (p !== null && typeof p === "object") {
    return Object.entries(p).map(([k, v]) => ({
      id: String(k), agent: "",
      status: (v !== null && typeof v === "object" && !Array.isArray(v))
        ? (v.status || "queued") : String(v),
    }));
  }
  return [];
}

function runsOf(r) {
  const out = [];
  for (let i = 0; i < (r || []).length; i++) {
    const row = r[i];
    const d = (row !== null && typeof row === "object" && !Array.isArray(row))
      ? Object.assign({}, row) : {};
    if (!("id" in d)) d.id = `run-${i + 1}`;
    if (!("date" in d)) d.date = "";
    if (!("skill" in d)) d.skill = "";
    out.push(d);
  }
  return out;
}

function activeOf(a) {
  const out = [];
  for (const row of a || []) {
    const d = (row !== null && typeof row === "object" && !Array.isArray(row))
      ? Object.assign({}, row) : {};
    d.id = ("id" in d) ? d.id : "";
    d.status = statusOf(d.status || "");
    out.push(d);
  }
  return out;
}

function utcNowSeconds() {
  return new Date().toISOString().replace(/\.\d+Z$/, "+00:00");
}

function migrate(state) {
  const out = {};
  for (const k of Object.keys(state)) {
    if (!MOVED_OUT.has(k)) out[k] = state[k];
  }
  out.matter = ("matter" in state) ? state.matter : "";
  const stance = (state.stance !== null && typeof state.stance === "object" && !Array.isArray(state.stance))
    ? Object.assign({}, state.stance) : {};
  for (const k of STANCE_KEYS) {
    if ((k in state) && !(k in stance)) stance[k] = state[k];
  }
  out.stance = stance;
  out.gate_plan = gatePlan(state.gate_plan);
  if ("packets" in state) out.packets = packetsOf(state.packets);
  if ("runs" in state) out.runs = runsOf(state.runs);
  if ("active_items" in state) out.active_items = activeOf(state.active_items);
  out.suite_version = CURRENT_SUITE;
  out.updated_at = utcNowSeconds();
  return out;
}

function assert(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (typeof msg === "string" ? msg : JSON.stringify(msg)));
}

function demo() {
  const legacy = { matter: "legacy", mode: "research", risk: "analytical", path: "architect",
    jurisdiction: "CZ", audience: "lawyer", interests: "neutral",
    gate_plan: "approved 2026-01-01",
    packets: { p1: { status: "integrated" } },
    runs: [{ gate: "G0" }, { gate: "G1" }],
    active_items: [{ id: "W1", status: "evidence done" }] };
  assert(validate(legacy).length, "the fixture must be invalid under the current schema");
  const nw = migrate(legacy);
  assert(validate(nw).length === 0, JSON.stringify(validate(nw)));
  assert(nw.stance.mode === "research" && nw.gate_plan.approved === true);
  assert(JSON.stringify(nw.packets) === JSON.stringify([{ id: "p1", agent: "", status: "integrated" }]),
    JSON.stringify(nw.packets));
  assert(nw.runs[0].id === "run-1" && nw.runs[0].skill === "");
  assert(nw.active_items[0].status === "done");
  assert(nw.suite_version === CURRENT_SUITE);
  assert(migrate(nw).stance.mode === "research", "migration must be idempotent");
  console.log("demo ok");
  return 0;
}

function parse(argv) {
  const out = { dir: null, dry_run: false, json: false, demo: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--demo") out.demo = true;
    else if (a === "--dry-run" || a === "--dry_run") out.dry_run = true;
    else if (a === "--json") out.json = true;
    else if (a === "--dir") out.dir = argv[++i];
    else if (a.startsWith("--dir=")) out.dir = a.slice("--dir=".length);
    else return { error: `unknown argument ${JSON.stringify(a)}` };
    if (a.startsWith("--dir") && out.dir === undefined) return { error: "missing value for --dir" };
  }
  return out;
}

function main(argv) {
  const args = parse(argv === undefined ? process.argv.slice(2) : argv);
  if (args.error) { console.error(`error: ${args.error}`); return 2; }
  if (args.demo) return demo();
  if (!args.dir) { console.error("error: need --dir (or --demo)"); return 2; }

  const p = path.join(args.dir, "state.json");
  let state;
  try {
    state = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch (e) {
    console.error(`error: ${e.message}`);
    return 1;
  }
  if (!validate(state).length) {
    console.log(args.json
      ? JSON.stringify({ path: p, ok: true, changed: false }, null, 2)
      : `already current: ${p}`);
    return 0;
  }

  const nw = migrate(state);
  const errs = validate(nw);
  if (errs.length) {
    if (args.json) {
      console.log(JSON.stringify({ path: p, ok: false, errors_after: errs }, null, 2));
    } else {
      console.error("error: migration left schema errors (refusing to write):");
      for (const e of errs) console.error(`  ${e}`);
    }
    return 1;
  }
  if (args.dry_run) {
    console.log(args.json
      ? JSON.stringify({ path: p, ok: true, changed: true, dry_run: true }, null, 2)
      : `would migrate ${p}`);
    return 0;
  }

  const backup = p + ".bak";
  fs.writeFileSync(backup, JSON.stringify(state, null, 2) + "\n", "utf-8");
  fs.writeFileSync(p, JSON.stringify(nw, null, 2) + "\n", "utf-8");
  console.log(args.json
    ? JSON.stringify({ path: p, ok: true, changed: true, backup }, null, 2)
    : `migrated ${p} (backup ${path.basename(backup)})`);
  return 0;
}

module.exports = { migrate, CURRENT_SUITE };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
