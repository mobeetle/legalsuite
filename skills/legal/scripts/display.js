#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

let readText;
try {
  const dt = require("./doctext.js");
  const fn = dt.read_text || dt.readText;
  if (typeof fn !== "function") throw new Error("no read_text");
  readText = (p) => fn(p);
} catch (e) {
  readText = (p) => fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, "");
}

const GLYPH_RE = /[\u2500-\u257F\u2190-\u21FF\u25BA\u25C4\u25B2\u25BC]/;
const SEP_RE = /^\|?[\s:|\-]+\|[\s:|\-]*$/;
const FILES_RE = /^FILES\s*$/;
const TAIL_RE = /^-> full:\s/;
const PROGRESS_RE = /^=== WHERE WE ARE =+\s*$/;
const WIDTH = 76;
const MAX_COLS = 4;

function issue(check, level, line, detail) {
  return { check, level, line, detail };
}

function splitLines(text) {
  if (text === "") return [];
  const parts = text.split(/\r\n|\r|\n/);
  if (/(?:\r\n|\r|\n)$/.test(text)) parts.pop();
  return parts;
}

function pyRepr(s) {
  s = String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  return s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/'/g, "\\'")}'`;
}

function glyphs(lines) {
  const out = [];
  lines.forEach((line, i) => {
    const m = GLYPH_RE.exec(line);
    if (m) out.push(issue("glyphs", "fail", i + 1,
      `non-ASCII ${pyRepr(m[0])} -- map box is ASCII-only (|-- +-- -> <->)`));
  });
  return out;
}

function tables(lines) {
  const out = [];
  for (let n = 0; n < lines.length - 1; n++) {
    const head = lines[n].trim();
    if (!head.startsWith("|") || !SEP_RE.test(lines[n + 1].trim())) continue;
    const cols = head.replace(/^\|+|\|+$/g, "").split("|");
    if (cols.length > MAX_COLS) out.push(issue("table", "fail", n + 1,
      `${cols.length}-column table -- ${MAX_COLS} max on screen, else a vertical list`));
  }
  return out;
}

function widths(lines) {
  const out = [];
  let fenced = false;
  lines.forEach((line, i) => {
    if (line.replace(/^\s*/, "").startsWith("```")) { fenced = !fenced; return; }
    if (fenced && [...line].length > WIDTH)
      out.push(issue("width", "warn", i + 1, `${[...line].length} cols in a fenced block -- wrap at ${WIDTH}`));
  });
  return out;
}

function progress(lines) {
  let box = null, turnAt = null;
  for (let n = 0; n < lines.length; n++) {
    if (box === null && PROGRESS_RE.test(lines[n])) box = n;
    if (turnAt === null && (FILES_RE.test(lines[n]) || TAIL_RE.test(lines[n]))) turnAt = n;
  }
  if (box === null) {
    if (turnAt === null) return [];
    return [issue("progress", "warn", turnAt + 1,
      "turn has a `FILES`/tail but no `=== WHERE WE ARE` Progress box (display.md)")];
  }
  let close = null;
  for (let n = box + 1; n < lines.length; n++) {
    if (lines[n].replace(/^\s*/, "").startsWith("```")) { close = n; break; }
  }
  const after = close !== null ? close + 1 : box + 1;
  const trailing = [];
  for (let n = after; n < lines.length; n++) if (lines[n].trim()) trailing.push(n);
  if (trailing.length)
    return [issue("progress", "warn", trailing[0] + 1,
      "content after the Progress box -- it must close the turn (display.md)")];
  return [];
}

function check(text) {
  const lines = splitLines(text);
  const issues = [...glyphs(lines), ...tables(lines), ...widths(lines), ...progress(lines)];
  return {
    ok: !issues.some((i) => i.level === "fail"),
    issues,
    stats: {
      lines: lines.length,
      fails: issues.filter((i) => i.level === "fail").length,
      warns: issues.filter((i) => i.level === "warn").length,
    },
  };
}

const PROGRESS_HEAD = "=== WHERE WE ARE " + "=".repeat(26);
const PROGRESS_SEP = "-".repeat(43);
const STEP_RE = /^\s*(done|now|todo|next|x)\s*[:.)]\s*(.*)$/i;
const MARK = {
  done: ["[x]", "done"], x: ["[x]", "done"],
  now: ["[>]", "<- now"],
  todo: ["[ ]", "next"], next: ["[ ]", "next"],
};

function emitFiles(paths) {
  const out = ["FILES"];
  for (const p of paths) {
    if (!fs.existsSync(p)) console.error(`warn: file does not exist (link anyway): ${p}`);
    const target = p.includes(" ") ? `<${p}>` : p;
    out.push(`- [${path.basename(p)}](${target})`);
    out.push(`  \`${p}\``);
  }
  return out.join("\n");
}

function emitProgress(door, artifact, findings, steps, now, soFar, nxt, goal = "", done = "") {
  const body = [PROGRESS_HEAD, `${door} · ${artifact} · ${findings} findings`];
  if (goal) body.push(`${"goal:".padEnd(10)}${goal}`);
  if (done) body.push(`${"done:".padEnd(10)}${done}`);
  steps.forEach((s, idx) => {
    const m = STEP_RE.exec(s);
    const key = m ? m[1].toLowerCase() : null;
    const [mark, anno] = (key && MARK[key]) || ["[ ]", "next"];
    const text = m ? m[2].trim() : s.trim();
    body.push(`${mark} ${idx + 1}. ${text}`.padEnd(22) + `  ${anno}`);
  });
  body.push(PROGRESS_SEP, `${"now:".padEnd(10)}${now}`, `${"so far:".padEnd(10)}${soFar}`, `${"-> next:".padEnd(10)}${nxt}`);
  return "```text\n" + body.join("\n") + "\n```";
}

function emitReviewerNote(sources = "", read = "", flagged = "", currency = "", before = "", clean = false) {
  const fields = [["Sources", sources], ["Read", read], ["Flagged for your judgment", flagged],
    ["Currency", currency], ["Before relying", before]];
  const given = fields.filter(([, v]) => v);
  if (clean || !given.length) {
    const one = given.map(([, v]) => v).join(" · ") || "full read · no flags · ready for your eyes";
    return `> **\u26A0\uFE0F Reviewer note:** ${one}`;
  }
  return ["> **\u26A0\uFE0F Reviewer note**", ...given.map(([k, v]) => `> - **${k}:** ${v}`)].join("\n");
}

function demo() {
  const assert = require("assert");
  const good = "```text\n" +
    "[Matter: acme]\n" +
    "|-- Symbols\n" +
    '|   +-- Norm: "DPH" -- § 2 zak. 235/2004 (base §3)\n' +
    "+-- Trace[T1]: counterparty.amends(removes DPH)\n" +
    "        ESTABLISHES_BOUNDARY: NOT(no DPH)\n" +
    "```\n" +
    "| Issue | Severity | Fix |\n" +
    "|---|---|---|\n" +
    "| Cap | [HIGH] | strike |\n" +
    "FILES\n" +
    "- [findings.md](/tmp/acme/findings.md)\n" +
    "  `/tmp/acme/findings.md`\n" +
    "```text\n" +
    "=== WHERE WE ARE ==========================\n" +
    "legal-review · nda.md · 1 finding\n" +
    "[x] 1. Plan            done\n" +
    "[>] 2. Findings        <- now\n" +
    "[ ] 3. Redline         next\n" +
    "-------------------------------------------\n" +
    "now:      Vat clause stands (base agreement)\n" +
    "so far:   plan approved, map built\n" +
    '-> next:  Redline — say "go"\n' +
    "```\n";
  const r = check(good);
  assert.ok(r.ok && r.issues.length === 0, JSON.stringify(r.issues));

  let bad = good.replace("|-- Symbols", "├─ Symbols").replace("+-- Trace", "└─ Trace");
  bad = bad.replace("| Issue | Severity | Fix |\n|---|---|---|",
    "| Clause | Actor | Condition | Effect | Tag |\n|---|---|---|---|---|");
  bad = bad.replace("FILES\n", "```text\n" + "x".repeat(90) + "\n```\nFILES\n");
  const got = new Set(check(bad).issues.map((i) => `${i.check}:${i.level}`));
  assert.deepStrictEqual(got, new Set(["glyphs:fail", "table:fail", "width:warn"]));

  const turn = "Short answer.\nFILES\n- [memo.md](/tmp/acme/memo.md)\n";
  const pr = check(turn);
  assert.ok(pr.ok && pr.issues.map((i) => i.check).join() === "progress", JSON.stringify(pr.issues));
  assert.ok(check("Blank [● price] and § 5, s.r.o. stay legal.").ok);

  const tl = check(good + "stray line after the box\n");
  assert.deepStrictEqual(tl.issues.map((i) => i.check), ["progress"]);
  assert.ok(tl.issues[0].detail.includes("after the Progress box"), JSON.stringify(tl.issues));

  assert.strictEqual(emitFiles(["/tmp/acme/memo.docx"]),
    "FILES\n- [memo.docx](/tmp/acme/memo.docx)\n  `/tmp/acme/memo.docx`");
  assert.ok(emitFiles(["/tmp/My Dir/plan.md"]).includes("- [plan.md](</tmp/My Dir/plan.md>)"));
  const box = emitProgress("legal-review", "nda.md", 3, ["done:Plan", "now:Findings", "next:Redline"],
    "findings drafted", "plan approved", 'Redline — say "go"');
  const bl = box.split("\n");
  assert.strictEqual(bl[0], "```text");
  assert.strictEqual(bl[1], PROGRESS_HEAD);
  assert.strictEqual(bl[1], "=== WHERE WE ARE ==========================");
  assert.strictEqual(bl[2], "legal-review · nda.md · 3 findings");
  assert.ok(bl[3].startsWith("[x] 1. Plan") && bl[3].endsWith("done"), bl[3]);
  assert.ok(box.includes("[>] 2. Findings") && box.includes("<- now"));
  assert.ok(box.includes("[ ] 3. Redline") && bl[bl.length - 2].startsWith("-> next:") && box.endsWith("```"));
  const plain = emitProgress("legal-review", "nda.md", 3, ["done:Plan"],
    "findings drafted", "plan approved", 'Redline — say "go"');
  assert.ok(!plain.includes("goal:") && !plain.includes("done:"));
  const withGoal = emitProgress("legal-review", "nda.md", 3, ["done:Plan"],
    "findings drafted", "plan approved", 'Redline — say "go"',
    "decide signability", "verdict [OPEN] — 0/1");
  assert.ok(withGoal.includes("\ngoal:     decide signability\n"));
  assert.ok(withGoal.includes("\ndone:     verdict [OPEN] — 0/1\n"));
  assert.ok(check(withGoal).ok);
  const note = emitReviewerNote("CourtListener verified", "pages 1-50 of 200",
    "2 [review]", "searched — nothing found", "ready for your eyes");
  assert.ok(note.startsWith("> **\u26A0\uFE0F Reviewer note**\n> - **Sources:**"));
  assert.strictEqual(emitReviewerNote("", "", "", "", "", true),
    "> **\u26A0\uFE0F Reviewer note:** full read · no flags · ready for your eyes");
  console.log("demo ok");
  return 0;
}

function usage() {
  return "usage: display.js FILE [--json] [--strict]\n       display.js --emit files --paths A,B,C\n       display.js --emit progress --door D --artifact A --step S [--step S ...]\n       display.js --emit reviewer_note [--sources ...] [--read ...] [--before ...] [--clean]\n       display.js --demo";
}

function main(argv) {
  const a = {
    doc: null, json: false, strict: false, emit: null, paths: null,
    path: [], door: "", artifact: "", findings: 0, step: [],
    now: "", soFar: "", next: "", goal: "", done: "", sources: "", read: "",
    flagged: "", currency: "", beforeRelying: "", clean: false, demo: false,
  };
  const err = (m) => { console.error(`display.js: error: ${m}\n${usage()}`); process.exit(2); };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    const need = (k) => { if (i + 1 >= argv.length) err(`${k} needs a value`); return argv[++i]; };
    if (t === "--json") a.json = true;
    else if (t === "--strict") a.strict = true;
    else if (t === "--clean") a.clean = true;
    else if (t === "--demo") a.demo = true;
    else if (t === "--emit") a.emit = need("--emit");
    else if (t === "--paths") a.paths = need("--paths");
    else if (t === "--path") a.path.push(need("--path"));
    else if (t === "--door") a.door = need("--door");
    else if (t === "--artifact") a.artifact = need("--artifact");
    else if (t === "--findings") { const v = parseInt(need("--findings"), 10); if (Number.isNaN(v)) err("--findings needs an integer"); a.findings = v; }
    else if (t === "--step") a.step.push(need("--step"));
    else if (t === "--now") a.now = need("--now");
    else if (t === "--so-far" || t === "--so_far") a.soFar = need(t);
    else if (t === "--next") a.next = need("--next");
    else if (t === "--goal") a.goal = need("--goal");
    else if (t === "--done") a.done = need("--done");
    else if (t === "--sources") a.sources = need("--sources");
    else if (t === "--read") a.read = need("--read");
    else if (t === "--flagged") a.flagged = need("--flagged");
    else if (t === "--currency") a.currency = need("--currency");
    else if (t === "--before" || t === "--before-relying" || t === "--before_relying") a.beforeRelying = need(t);
    else if (t === "-h" || t === "--help") { console.log(usage()); return 0; }
    else if (t.startsWith("-")) err(`unknown option ${t}`);
    else if (a.doc === null) a.doc = t;
    else err(`unexpected argument ${t}`);
  }
  if (a.demo) return demo();
  if (a.emit) {
    if (a.emit === "files") {
      const paths = [...a.path, ...((a.paths ? a.paths.split(",").filter((p) => p) : []))];
      if (!paths.length) err("--emit files needs --paths or --path");
      console.log(emitFiles(paths));
    } else if (a.emit === "progress") {
      console.log(emitProgress(a.door, a.artifact, a.findings, a.step, a.now, a.soFar, a.next, a.goal, a.done));
    } else if (a.emit === "reviewer_note") {
      console.log(emitReviewerNote(a.sources, a.read, a.flagged, a.currency, a.beforeRelying, a.clean));
    } else err("--emit must be files|progress|reviewer_note");
    return 0;
  }
  if (!a.doc) err("need DOC, --emit, or --demo");
  let text;
  try { text = readText(a.doc); } catch (e) { console.error(`error: ${e.message}`); return 1; }
  const res = check(text);
  if (a.json) console.log(JSON.stringify(res, null, 2));
  else {
    for (const x of res.issues) console.log(`${x.level.toUpperCase().padEnd(4)} ${x.check.padEnd(6)} L${String(x.line).padEnd(4)} ${x.detail}`);
    console.log(`${res.ok ? "display: OK" : "display: FAIL"} {'lines': ${res.stats.lines}, 'fails': ${res.stats.fails}, 'warns': ${res.stats.warns}}`);
  }
  return a.strict && !res.ok ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { check, emitFiles, emitProgress, emitReviewerNote };
