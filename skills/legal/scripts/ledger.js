#!/usr/bin/env node
"use strict";
/* Citation-ledger rows for a matter (builtins only: fs, path). Port of
 * ledger.py. `add` appends an authority row with monotonic A<n> id;
 * `verify` sets a row's Result (and Source/Retrieved). Exit 0 normally;
 * 1 on bad enum, missing row, or no ledger table. */
const fs = require("fs");
const path = require("path");

const COLS = ["ID", "Citation", "Proposition", "Source", "Retrieved",
  "In force at EPOCH", "Quote", "Weight", "Status", "Result"];
const RESULTS = ["verified", "partial", "unverified", "failed"];
const WEIGHTS = ["binding", "persuasive", "commentary", "lead"];
const STATUSES = ["in force", "amended", "repealed", "good law", "overruled", "doubted", "unknown"];
const ROW_RE = /^\|\s*(A\d+)\s*\|/;

function blankLedger() {
  return "# Authorities\n\n| " + COLS.join(" | ") + " |\n" +
    "|" + "---|".repeat(COLS.length) + "\n";
}

function stripPipes(s) {
  return s.replace(/^\|+|\|+$/g, "");
}

function header(text) {
  const lines = text.split("\n");
  // mirror splitlines(): trailing newline leaves a final "" element; keep as-is
  const use = text.endsWith("\n") ? lines.slice(0, -1).concat([""]) : lines;
  for (let i = 0; i < use.length; i++) {
    const cells = stripPipes(use[i].trim()).split("|").map((c) => c.trim().toLowerCase());
    if (cells[0] === "id" && cells.includes("result")) {
      return { lines: use[use.length - 1] === "" ? use.slice(0, -1) : use, h: i, cells };
    }
  }
  const kept = use[use.length - 1] === "" ? use.slice(0, -1) : use;
  return { lines: kept, h: null, cells: null };
}

function rowLine(rid, row) {
  return "| " + COLS.map((c) => String(row[c] !== undefined ? row[c] : "").replace(/\|/g, "\\|")).join(" | ") + " |";
}

function add(dir, row) {
  const p = path.join(dir, "authorities.md");
  let text = fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : blankLedger();
  let parsed = header(text);
  if (parsed.h === null) {
    text = blankLedger();
    parsed = header(text);
  }
  const ids = [];
  for (const ln of parsed.lines) {
    const m = ROW_RE.exec(ln);
    if (m) ids.push(parseInt(m[1].slice(1), 10));
  }
  const rid = `A${ids.length ? Math.max(...ids) + 1 : 1}`;
  const line = rowLine(rid, Object.assign({ ID: rid }, row));
  let last = parsed.h;
  for (let i = 0; i < parsed.lines.length; i++) {
    if (parsed.lines[i].trimStart().startsWith("|")) last = i;
  }
  parsed.lines.splice(last + 1, 0, line);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, parsed.lines.join("\n") + "\n", "utf-8");
  return rid;
}

function verify(dir, rid, result, source, retrieved) {
  source = source || ""; retrieved = retrieved || "";
  const p = path.join(dir, "authorities.md");
  const parsed = header(fs.readFileSync(p, "utf-8"));
  if (parsed.h === null || parsed.cells === null) {
    throw new Error("no citation-ledger table in authorities.md");
  }
  const idx = {};
  parsed.cells.forEach((c, i) => { idx[c] = i; });
  for (let i = 0; i < parsed.lines.length; i++) {
    const m = ROW_RE.exec(parsed.lines[i]);
    if (m && m[1] === rid) {
      let parts = stripPipes(parsed.lines[i].trim()).split("|").map((c) => c.trim());
      while (parts.length < parsed.cells.length) parts.push("");
      parts[idx["result"]] = result;
      if (source) parts[idx["source"]] = source;
      if (retrieved) parts[idx["retrieved"]] = retrieved;
      parsed.lines[i] = "| " + parts.join(" | ") + " |";
      fs.writeFileSync(p, parsed.lines.join("\n") + "\n", "utf-8");
      return;
    }
  }
  throw new Error(`row ${rid} not found in the ledger`);
}

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function assert(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (msg || ""));
}

function tmpDir() {
  const base = process.env.TMPDIR || "/tmp";
  return fs.mkdtempSync(path.join(base, "ledger-"));
}

function demo() {
  const tmp = tmpDir();
  try {
    const rid = add(tmp, { Citation: "§ 1 [STATUTE]", Proposition: "the rule",
      Source: "<URL>", Retrieved: todayIso(),
      Quote: "match", Weight: "binding", Status: "in force", Result: "unverified" });
    assert(rid === "A1", rid);
    const rid2 = add(tmp, { Citation: "A-2", Proposition: "second" });
    assert(rid2 === "A2", rid2);
    verify(tmp, "A1", "verified", "<URL>", "2026-10-12");
    const text = fs.readFileSync(path.join(tmp, "authorities.md"), "utf-8");
    assert(text.includes("| A1 | § 1 [STATUTE] | the rule |"), text);
    assert(text.split("| verified |").length - 1 === 1 && text.includes("| A1 |"), text);
    add(tmp, { Citation: "A-3", Proposition: "third" });
    const count = fs.readFileSync(path.join(tmp, "authorities.md"), "utf-8").split("| A1 |").length - 1;
    assert(count === 1, "A1 duplicated");
    let threw = false;
    try { verify(tmp, "A9", "verified"); }
    catch (e) { threw = String(e.message).includes("A9"); }
    assert(threw, "expected ValueError for A9");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log("demo ok");
  return 0;
}

function usageError(msg) {
  console.error(`error: ${msg}`);
  console.error("usage: ledger.js (add|verify) --dir DIR [options] | ledger.js --demo");
  return 2;
}

function parse(argv) {
  const out = { cmd: null, dir: null, citation: null, proposition: null,
    source: "", retrieved: "", in_force: "", quote: "—", weight: "",
    status: "unknown", result: null, id: null, json: false, demo: false };
  const rest = [];
  const VALUED = new Set(["dir", "citation", "proposition", "source", "retrieved",
    "in-force", "in_force", "quote", "weight", "status", "result", "id"]);
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
      if (!VALUED.has(k)) return { error: `unknown option --${k}` };
      if (k === "in-force") k = "in_force";
      out[k] = v;
    } else rest.push(a);
  }
  if (rest.length) out.cmd = rest[0];
  return out;
}

function main(argv) {
  const args = parse(argv === undefined ? process.argv.slice(2) : argv);
  if (args.error) return usageError(args.error);
  if (args.demo) return demo();
  if (args.cmd === "add") {
    if (!args.dir) return usageError("need --dir");
    if (!args.citation) return usageError("need --citation");
    if (!args.proposition) return usageError("need --proposition");
    const result = args.result === null ? "unverified" : args.result;
    if (!RESULTS.includes(result)) {
      console.error(`error: --result ${JSON.stringify(result)} not one of ${JSON.stringify(RESULTS)}`);
      return 1;
    }
    if (args.weight && !WEIGHTS.includes(args.weight)) {
      console.error(`error: --weight ${JSON.stringify(args.weight)} not one of ${JSON.stringify(WEIGHTS)}`);
      return 1;
    }
    if (!STATUSES.includes(args.status)) {
      console.error(`error: --status ${JSON.stringify(args.status)} not one of ${JSON.stringify(STATUSES)}`);
      return 1;
    }
    const row = { Citation: args.citation, Proposition: args.proposition,
      Source: args.source, Retrieved: args.retrieved || todayIso(),
      "In force at EPOCH": args.in_force, Quote: args.quote,
      Weight: args.weight, Status: args.status, Result: result };
    let rid;
    try { rid = add(args.dir, row); }
    catch (e) { console.error(`error: ${e.message}`); return 1; }
    console.log(args.json ? JSON.stringify({ ok: true, id: rid }, null, 2) : `added ${rid}`);
    return 0;
  }
  if (args.cmd === "verify") {
    if (!args.dir) return usageError("need --dir");
    if (!args.id) return usageError("need --id");
    if (!args.result) return usageError("need --result");
    if (!RESULTS.includes(args.result)) {
      console.error(`error: --result ${JSON.stringify(args.result)} not one of ${JSON.stringify(RESULTS)}`);
      return 1;
    }
    try { verify(args.dir, args.id, args.result, args.source, args.retrieved); }
    catch (e) { console.error(`error: ${e.message}`); return 1; }
    console.log(args.json
      ? JSON.stringify({ ok: true, id: args.id, result: args.result }, null, 2)
      : `${args.id}: ${args.result}`);
    return 0;
  }
  return usageError("need a command (add|verify) or --demo");
}

module.exports = { add, verify, COLS, RESULTS, WEIGHTS, STATUSES };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
