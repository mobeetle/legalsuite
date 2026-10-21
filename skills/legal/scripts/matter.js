#!/usr/bin/env node
"use strict";
/* Matter-folder state and register adapter (builtins only: fs, path).
 * Port of matter.py. Validates state.json against
 * ../references/state-schema.json (minimal subset: type/required/enum/
 * properties/items). Backs matter_state/matter_update/register_write/
 * packet_status. Exit 0 normally; 1 on invalid state or violating write. */
const fs = require("fs");
const path = require("path");

const SCHEMA = path.join(__dirname, "..", "references", "state-schema.json");
const NAME_RE = /^[A-Za-z0-9_-]+$/;
const CURRENT_SUITE = "1.0";
const LEGACY_KEYS = new Set(["mode", "risk", "path", "jurisdiction", "epoch",
  "interests", "posture", "audience", "language"]);

function schema() {
  return JSON.parse(fs.readFileSync(SCHEMA, "utf-8"));
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function jsTypeName(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function checkType(v, t) {
  switch (t) {
    case "object": return isPlainObject(v);
    case "array": return Array.isArray(v);
    case "string": return typeof v === "string";
    case "boolean": return typeof v === "boolean";
    case "integer": return Number.isInteger(v);
    case "number": return typeof v === "number";
    default: return true;
  }
}

function walk(value, sch, p, errs) {
  const t = sch.type;
  if (t) {
    if (!checkType(value, t)) {
      errs.push(`${p}: expected ${t}, got ${jsTypeName(value)}`);
      return;
    }
  }
  if (Object.prototype.hasOwnProperty.call(sch, "enum")) {
    if (!sch.enum.includes(value)) {
      errs.push(`${p}: ${JSON.stringify(value)} is not one of ${JSON.stringify(sch.enum)}`);
    }
  }
  if (t === "object") {
    for (const req of sch.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, req)) {
        errs.push(`${p}: missing required key ${JSON.stringify(req)}`);
      }
    }
    const props = sch.properties || {};
    for (const k of Object.keys(value)) {
      if (Object.prototype.hasOwnProperty.call(props, k)) {
        walk(value[k], props[k], `${p}.${k}`, errs);
      }
    }
  } else if (t === "array") {
    const item = sch.items;
    if (item) {
      for (let i = 0; i < value.length; i++) {
        walk(value[i], item, `${p}[${i}]`, errs);
      }
    }
  }
}

function validate(state, sch) {
  const errs = [];
  walk(state, sch || schema(), "$", errs);
  return errs;
}

function classify(state, errs) {
  if (!errs.length) {
    const v = isPlainObject(state) ? state.suite_version : undefined;
    return (!v || v === CURRENT_SUITE) ? "valid" : "unknown_version";
  }
  if (isPlainObject(state) && !("stance" in state) &&
      Object.keys(state).some((k) => LEGACY_KEYS.has(k))) {
    return "legacy";
  }
  const v = isPlainObject(state) ? state.suite_version : undefined;
  if (v && v !== CURRENT_SUITE) return "unknown_version";
  return "invalid";
}

function deepMerge(base, patch) {
  if (isPlainObject(base) && isPlainObject(patch)) {
    const out = Object.assign({}, base);
    for (const k of Object.keys(patch)) {
      out[k] = (k in base) ? deepMerge(base[k], patch[k]) : patch[k];
    }
    return out;
  }
  return patch;
}

function loadPatch(arg) {
  const text = arg.startsWith("@")
    ? fs.readFileSync(arg.slice(1), "utf-8")
    : arg;
  return JSON.parse(text);
}

function statePath(d) {
  return path.join(d, "state.json");
}

function readState(d) {
  return JSON.parse(fs.readFileSync(statePath(d), "utf-8"));
}

function writeState(d, state) {
  fs.writeFileSync(statePath(d), JSON.stringify(state, null, 2) + "\n", "utf-8");
}

function utcNowSeconds() {
  return new Date().toISOString().replace(/\.\d+Z$/, "+00:00");
}

function isTable(lines) {
  for (let n = 0; n + 1 < lines.length; n++) {
    const s = lines[n + 1].trim();
    if (s.startsWith("|") && s.includes("-") &&
        [...s].every((c) => "|:- ".includes(c))) {
      if (lines[n].trim().startsWith("|")) return true;
    }
  }
  return false;
}

function appendRows(file, rows) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf-8") : "";
  const lines = text.split("\n");
  // drop trailing empty element from split when text ends with newline,
  // mirroring Python splitlines() for table detection
  const detect = (text.endsWith("\n") ? lines.slice(0, -1) : lines);
  const table = isTable(detect);
  const added = [];
  for (const r of rows) {
    if (table) {
      const cells = Array.isArray(r) ? r : [r];
      added.push("| " + cells.map((c) => String(c)).join(" | ") + " |");
    } else {
      added.push(typeof r === "string" ? r : JSON.stringify(r));
    }
  }
  if (!added.length) return 0;
  const prefix = (text && !text.endsWith("\n")) ? "\n" : "";
  fs.appendFileSync(file, prefix + added.join("\n") + "\n", "utf-8");
  return added.length;
}

function emit(obj, asJson, ok, human) {
  if (asJson) {
    console.log(JSON.stringify(obj, null, 2));
  } else if (ok) {
    console.log(human);
    console.log(JSON.stringify(
      Object.prototype.hasOwnProperty.call(obj, "state") ? obj.state : obj, null, 2));
  } else {
    for (const e of obj.errors || []) console.error(`error: ${e}`);
  }
  return ok ? 0 : 1;
}

function cmdState(args) {
  let state;
  try {
    state = readState(args.dir);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      console.error(`error: no state.json in ${args.dir}`);
      return 1;
    }
    throw e;
  }
  const errs = validate(state);
  const kind = classify(state, errs);
  if (args.json) {
    console.log(JSON.stringify({ ok: kind === "valid", kind,
      path: statePath(args.dir), errors: errs, state }, null, 2));
  } else if (kind === "valid") {
    console.log(`state valid: ${statePath(args.dir)}`);
  } else if (kind === "legacy") {
    console.log(`legacy state (pre-schema): ${statePath(args.dir)}; ` +
      "migrate with scripts/migrate_state.py --dir <matter>");
  } else if (kind === "unknown_version") {
    console.log(`state suite_version ${JSON.stringify(state.suite_version)} != ${CURRENT_SUITE}: ` +
      `${statePath(args.dir)}`);
  } else {
    for (const e of errs) console.error(`error: ${e}`);
  }
  return kind === "invalid" ? 1 : 0;
}

function cmdUpdate(args) {
  let state;
  try {
    state = readState(args.dir);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      console.error(`error: no state.json in ${args.dir} (create it first)`);
      return 1;
    }
    throw e;
  }
  if (classify(state, validate(state)) === "legacy") {
    console.error("error: legacy state (pre-schema); run " +
      `scripts/migrate_state.py --dir ${args.dir} first`);
    return 1;
  }
  let patch;
  try {
    patch = loadPatch(args.patch);
  } catch (e) {
    console.error(`error: bad --patch: ${e.message}`);
    return 1;
  }
  if (!isPlainObject(patch)) {
    console.error("error: --patch must be a JSON object");
    return 1;
  }
  const merged = deepMerge(state, patch);
  merged.updated_at = utcNowSeconds();
  const errs = validate(merged);
  if (errs.length) return emit({ ok: false, errors: errs }, args.json, false, "");
  writeState(args.dir, merged);
  return emit({ ok: true, path: statePath(args.dir), errors: [], state: merged },
    args.json, true, `state updated: ${statePath(args.dir)}`);
}

function cmdRegister(args) {
  if (!NAME_RE.test(args.name)) {
    console.error(`error: bad register name ${JSON.stringify(args.name)}`);
    return 1;
  }
  let rows;
  try {
    const text = args.rows.startsWith("@")
      ? fs.readFileSync(args.rows.slice(1), "utf-8")
      : args.rows;
    rows = JSON.parse(text);
  } catch (e) {
    console.error(`error: bad --rows: ${e.message}`);
    return 1;
  }
  if (!Array.isArray(rows)) {
    console.error("error: --rows must be a JSON array");
    return 1;
  }
  const p = path.join(args.dir, `${args.name}.md`);
  const n = appendRows(p, rows);
  return emit({ ok: true, register: args.name, path: p, appended: n, errors: [] },
    args.json, true, `register ${args.name}: appended ${n} row(s) -> ${p}`);
}

function packetEnum(sch) {
  return (sch || schema()).properties.packets.items.properties.status.enum;
}

function cmdPacket(args) {
  const statuses = packetEnum();
  if (!statuses.includes(args.status)) {
    console.error(`error: --status ${JSON.stringify(args.status)} not one of ${JSON.stringify(statuses)}`);
    return 1;
  }
  let state;
  try {
    state = readState(args.dir);
  } catch (e) {
    if (e && e.code === "ENOENT") {
      console.error(`error: no state.json in ${args.dir}`);
      return 1;
    }
    throw e;
  }
  if (classify(state, validate(state)) === "legacy") {
    console.error("error: legacy state (pre-schema); run " +
      `scripts/migrate_state.py --dir ${args.dir} first`);
    return 1;
  }
  if (!Array.isArray(state.packets)) state.packets = [];
  const found = state.packets.find((pp) => pp && pp.id === args.id);
  if (found) found.status = args.status;
  else state.packets.push({ id: args.id, agent: "", status: args.status });
  const errs = validate(state);
  if (errs.length) return emit({ ok: false, errors: errs }, args.json, false, "");
  writeState(args.dir, state);
  return emit({ ok: true, id: args.id, status: args.status,
    path: statePath(args.dir), errors: [] },
    args.json, true, `packet ${args.id}: ${args.status}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (msg || ""));
}

function quiet(fn) {
  const lo = console.log, le = console.error;
  console.log = () => {}; console.error = () => {};
  try { return fn(); } finally { console.log = lo; console.error = le; }
}

function tmpDir() {
  const base = process.env.TMPDIR || "/tmp";
  return fs.mkdtempSync(path.join(base, "matter-"));
}

function rmDir(d) {
  fs.rmSync(d, { recursive: true, force: true });
}

function demo() {
  const tmp = tmpDir();
  try {
    const good = { matter: "demo",
      stance: { mode: "review", risk: "analytical", path: "architect" },
      gate_plan: { current_gate: "G0", approved: false, checkpoints: [] },
      packets: [{ id: "P1", agent: "sub", status: "queued" }] };
    fs.writeFileSync(path.join(tmp, "state.json"), JSON.stringify(good), "utf-8");
    assert(JSON.stringify(validate(good)) === "[]", JSON.stringify(validate(good)));

    const bad = JSON.parse(JSON.stringify(good));
    bad.stance.mode = "nonsense";
    assert(validate(bad).some((e) => e.includes("stance.mode")), JSON.stringify(validate(bad)));
    const badp = JSON.parse(JSON.stringify(good));
    badp.packets[0].status = "lost";
    assert(validate(badp).some((e) => e.includes("packets[0].status")), JSON.stringify(validate(badp)));

    quiet(() => {
      assert(cmdUpdate({ dir: tmp, patch: '{"stance":{"risk":"high"}}', json: true }) === 0);
      assert(JSON.parse(fs.readFileSync(path.join(tmp, "state.json"), "utf-8")).stance.risk === "high");
      assert(cmdPacket({ dir: tmp, id: "P1", status: "running", json: true }) === 0);
      assert(cmdPacket({ dir: tmp, id: "P2", status: "queued", json: true }) === 0);
      assert(cmdPacket({ dir: tmp, id: "P1", status: "lost", json: true }) === 1);
    });
    const st = JSON.parse(fs.readFileSync(path.join(tmp, "state.json"), "utf-8"));
    const got = {};
    for (const pp of st.packets) got[pp.id] = pp.status;
    assert(JSON.stringify(got) === JSON.stringify({ P1: "running", P2: "queued" }), JSON.stringify(got));

    const tbl = path.join(tmp, "issue-log.md");
    fs.writeFileSync(tbl, "| ID | Issue |\n|---|---|\n| I1 | old |\n", "utf-8");
    const before = fs.readFileSync(tbl, "utf-8");
    quiet(() => {
      assert(cmdRegister({ dir: tmp, name: "issue-log",
        rows: '[["I2","new"],["I3","more"]]', json: true }) === 0);
    });
    const after = fs.readFileSync(tbl, "utf-8");
    assert(after.startsWith(before), after);
    assert(after.includes("| I2 | new |") && after.includes("| I3 | more |"), after);

    const hist = path.join(tmp, "history.md");
    fs.writeFileSync(hist, "- 2026-10-01 · intake · opened\n", "utf-8");
    quiet(() => {
      assert(cmdRegister({ dir: tmp, name: "history",
        rows: '["- 2026-10-02 · tools · web search"]', json: true }) === 0);
    });
    const h = fs.readFileSync(hist, "utf-8").split("\n").filter((l) => l.length);
    assert(h[0] === "- 2026-10-01 · intake · opened" &&
      h[h.length - 1] === "- 2026-10-02 · tools · web search", JSON.stringify(h));
  } finally {
    rmDir(tmp);
  }
  console.log("demo ok");
  return 0;
}

function usageError(msg) {
  console.error(`error: ${msg}`);
  console.error("usage: matter.js (state|update|register|packet) [--dir DIR] [options] | matter.js --demo");
  return 2;
}

function parse(argv) {
  const out = { cmd: null, dir: null, patch: null, name: null, rows: null,
    id: null, status: null, json: false, demo: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--demo") out.demo = true;
    else if (a === "--json") out.json = true;
    else if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      let k, v;
      if (eq !== -1) { k = a.slice(2, eq); v = a.slice(eq + 1); }
      else { k = a.slice(2); v = argv[++i]; }
      if (v === undefined) return { error: `missing value for --${k}` };
      if (k === "dir") out.dir = v;
      else if (k === "patch") out.patch = v;
      else if (k === "name") out.name = v;
      else if (k === "rows") out.rows = v;
      else if (k === "id") out.id = v;
      else if (k === "status") out.status = v;
      else return { error: `unknown option --${k}` };
    } else rest.push(a);
  }
  if (rest.length) out.cmd = rest[0];
  return out;
}

function main(argv) {
  const args = parse(argv === undefined ? process.argv.slice(2) : argv);
  if (args.error) return usageError(args.error);
  if (args.demo) return demo();
  if (!args.cmd) return usageError("need a command (state|update|register|packet) or --demo");
  if (args.cmd === "state") {
    if (!args.dir) return usageError("need --dir");
    return cmdState(args);
  }
  if (args.cmd === "update") {
    if (!args.dir) return usageError("need --dir");
    if (args.patch === null) return usageError("need --patch");
    return cmdUpdate(args);
  }
  if (args.cmd === "register") {
    if (!args.dir) return usageError("need --dir");
    if (!args.name) return usageError("need --name");
    if (args.rows === null) return usageError("need --rows");
    return cmdRegister(args);
  }
  if (args.cmd === "packet") {
    if (!args.dir) return usageError("need --dir");
    if (!args.id) return usageError("need --id");
    if (!args.status) return usageError("need --status");
    return cmdPacket(args);
  }
  return usageError(`unknown command ${JSON.stringify(args.cmd)} (state|update|register|packet)`);
}

module.exports = { schema, validate, classify, deepMerge, loadPatch,
  packetEnum, CURRENT_SUITE, LEGACY_KEYS };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
