#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");

const SUITE_PLAYBOOKS = path.resolve(__dirname, "..", "..", "..", "playbooks");
const USER_PLAYBOOKS = path.join(os.homedir(), ".legal", "playbooks");

const REQUIRED_KEYS = ["name", "format", "scope", "jurisdiction", "role", "version", "status",
  "owner", "updated", "review_by"];
const REQUIRED_SECTIONS = ["Scope", "Positions", "Red flags", "Provenance"];
const OTHER_SECTIONS = ["Clause library", "Standard definitions", "Negotiation sequence",
  "Jurisdiction notes"];
const POSITION_COLS = ["ID", "Clause / issue", "Req", "Preferred (GREEN)", "Fallback (YELLOW)",
  "Walk-away (RED)", "Approver", "Rationale"];
const RATING_RE = /\b(GREEN|YELLOW|RED)\b/g;
const NEGATED = /(?:\bno|\bnot|without|never|\bnone of)\s+(?:\w+\s+){0,2}$/i;
// RATING tokens actually asserted; "no GREEN ratings" is not a rating.
function ratings(text) {
  const out = [];
  const re = new RegExp(RATING_RE.source, "g");
  let m;
  while ((m = re.exec(text))) {
    if (NEGATED.test(text.slice(Math.max(0, m.index - 40), m.index))) continue;
    out.push(m[1]);
  }
  return out;
}
const POS_REF_RE = /\bP\d+[a-z]?\b/g;
const LEAKS = [
  ["email", "[\\w.+-]+@[\\w-]+\\.[\\w.-]+"],
  ["phone", "\\+\\d{1,3}(?:\\s?\\d){8,}|(?<![\\d/-])\\d{3}\\s\\d{3}\\s\\d{3}(?![\\d/])"],
  ["IČO", "(?:IČO?|NIP|KRS|SIRET|SIREN|HRB|HRA|USt-IdNr\\.?|REGON)\\s*:?\\s*\\d{6,14}\\b"],
  ["rodné číslo", "(?<![\\d/])\\d{6}/\\d{3,4}\\b"],
  ["IBAN", "\\b[A-Z]{2}\\d{2}(?:\\s?[A-Z0-9]{4}){3,7}\\b"],
  ["bank account", "(?<![\\w/-])(?:\\d{1,6}-)?\\d{2,10}/\\d{4}\\b"],
  ["company name", "[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽÄÖÜŚŁŻŹĆŃ][\\w&-]*,?\\s+(?:spol\\.\\s?s\\s?r\\.\\s?o\\.|s\\.\\s?r\\.\\s?o\\.|a\\.\\s?s\\.|v\\.\\s?o\\.\\s?s\\.|k\\.\\s?s\\.|GmbH|AG\\b|KG\\b|OHG\\b|UG\\b|Ltd\\b\\.?|PLC\\b|LLP\\b|Inc\\.|Corp\\.|LLC\\b|SE\\b|S\\.A\\.S\\.?|S\\.A\\.R\\.L\\.?|S\\.A\\.|S\\.L\\.|Sp\\.\\s?z\\s?o\\.\\s?o\\.|S\\.p\\.A\\.|N\\.V\\.|B\\.V\\.)"],
];
const NOT_ACCOUNT = /(?:\(EU\)|\(ES\)|č\.|No\.?|Cdo|Odo|Cmo|Co|ÚS|As|Ads|Afs)\s*$/;

// --- protected-token scan (substance.tokens equivalent: date + money warns) ---
const NUM = "\\d{1,3}(?:[  .,]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?";
const EN_MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
const CZ_MONTHS = "ledna|února|března|dubna|května|června|července|srpna|září|října|listopadu|prosince";
const UNITS = "(?:(?:calendar|business|working)\\s+)?(?:days?|weeks?|months?|years?|hours?)|(?:(?:pracovních|kalendářních)\\s+)?(?:dnů|dní|dny|den|týdnů|týdny|týden|měsíců|měsíce|měsíc|let|roků|roky|rok|hodin[ay]?)";
const TOKEN_RE = new RegExp(
  "(?<money>\\d[\\d  .,]*\\s?(?:Kč|CZK|EUR|USD|€|\\$)|(?:\\b(?:EUR|CZK|USD|Kč)|€|\\$)\\s?(?:" + NUM + "))" +
  "|(?<percent>\\d[\\d  .,]*\\s?%)" +
  "|(?<date>\\d{1,2}\\.\\s*\\d{1,2}\\.\\s*\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}(?:st|nd|rd|th)?\\.?\\s+(?:" + EN_MONTHS + "|" + CZ_MONTHS + ")\\s+\\d{4}|(?:" + EN_MONTHS + ")\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4})" +
  "|(?<duration>(?:" + NUM + ")\\s+(?:" + UNITS + ")\\b)" +
  "|(?<ref>§\\s*\\d+[a-zA-Z]?|\\b(?:čl|odst|písm|art)\\.?\\s*\\d+|\\bArticle\\s+\\d+)" +
  "|(?<quote>[\"„“][^\"„“\\n]{2,}[\"“”])" +
  "|(?<number>\\b\\d[\\d  .,]*\\b)",
  "g");
const TOKEN_CATS = ["money", "percent", "date", "duration", "ref", "quote", "number"];
function tokens(text) {
  const seen = new Map();
  for (const m of text.matchAll(TOKEN_RE)) {
    const cat = TOKEN_CATS.find((k) => m.groups[k] !== undefined);
    const val = m[0].replace(/\s+/g, " ").trim();
    const key = cat + "\u0000" + val;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  return [...seen.keys()].map((k) => k.split("\u0000"));
}

function pyRepr(s) {
  s = String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  return s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replace(/'/g, "\\'")}'`;
}

function defaultRoots() {
  const env = (process.env.LEGALSUITE_PLAYBOOKS || "").split(path.delimiter).filter((p) => p);
  return [...env, path.join(process.cwd(), ".legal", "playbooks"), SUITE_PLAYBOOKS, USER_PLAYBOOKS];
}

function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return s;
}
function todayStr() {
  const t = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}
function isStale(meta) {
  const d = parseDate(meta.review_by || "");
  return Boolean(d && d < todayStr());
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return [{}, text];
  const end = text.indexOf("\n---", 4);
  if (end < 0) return [{}, text];
  const meta = {};
  for (const line of text.slice(4, end).split("\n")) {
    if (!line.includes(":")) continue;
    const i = line.indexOf(":");
    const key = line.slice(0, i).trim();
    if (key) meta[key] = line.slice(i + 1).split("#")[0].trim();
  }
  return [meta, text.slice(end + 4).replace(/^\n+/, "")];
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch (e) { return false; }
}
function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch (e) { return false; }
}

function findAll(slug, roots) {
  for (const root of roots) {
    const cand = path.join(root, `${slug}.md`);
    if (isFile(cand)) return cand;
  }
  return null;
}

function listAll(roots) {
  const seen = new Map();
  for (const root of roots) {
    if (!isDir(root)) continue;
    for (const f of fs.readdirSync(root).sort()) {
      if (!f.toLowerCase().endsWith(".md")) continue;
      const slug = path.basename(f, path.extname(f));
      if (seen.has(slug) || slug.startsWith("_") || slug.toLowerCase() === "readme") continue;
      const [meta] = parseFrontmatter(fs.readFileSync(path.join(root, f), "utf-8"));
      seen.set(slug, {
        slug, path: path.join(root, f),
        status: meta.status || "unknown",
        version: meta.version || "",
        review_by: meta.review_by || "",
        stale: isStale(meta),
      });
    }
  }
  return [...seen.values()];
}

function load(ref, roots) {
  let file;
  if (isFile(ref)) file = ref;
  else {
    const found = findAll(String(ref).trim(), roots);
    if (found === null) {
      const avail = listAll(roots).map((e) => e.slug);
      const hint = avail.length ? `available: ${avail.join(", ")}` : "no playbooks found";
      throw new Error(`playbook ${pyRepr(ref)} not found (${hint})`);
    }
    file = found;
  }
  const text = fs.readFileSync(file, "utf-8");
  const [meta] = parseFrontmatter(text);
  return [meta, text, file];
}

function key(s) { return s.toLowerCase().replace(/\s+/g, ""); }

function check(text) {
  const issues = [];
  const add = (level, detail) => issues.push({ level, detail });
  const [meta, body] = parseFrontmatter(text);
  for (const k of REQUIRED_KEYS) if (!meta[k]) add("fail", `frontmatter: missing ${k}`);
  const status = meta.status || "";
  if (status && !["draft", "approved", "retired"].includes(status))
    add("fail", `frontmatter: status ${pyRepr(status)} not draft|approved|retired`);
  if (status === "approved" && !(meta.approved_by && parseDate(meta.approved_at || "")))
    add("fail", "frontmatter: approved without approved_by / approved_at (YYYY-MM-DD)");
  if (status === "draft" || status === "retired") add("warn", `status is ${status}`);
  for (const k of ["updated", "review_by"]) {
    if (meta[k] && !parseDate(meta[k])) add("warn", `frontmatter: ${k} ${pyRepr(meta[k])} is not YYYY-MM-DD`);
  }
  if (isStale(meta)) add("warn", `stale: review_by ${meta.review_by} is in the past`);

  const secs = {};
  for (const m of body.matchAll(/^##\s+(.+)$/gm)) secs[m[1].trim()] = m.index + m[0].length;
  for (const s of [...REQUIRED_SECTIONS, ...OTHER_SECTIONS]) {
    if (!(s in secs)) add(s && REQUIRED_SECTIONS.includes(s) ? "fail" : "warn", `missing section: ## ${s}`);
  }

  const ids = new Set();
  if ("Positions" in secs) {
    const block = body.slice(secs.Positions).split(/^##\s/m)[0];
    const rows = block.split("\n").filter((l) => l.trim().startsWith("|"))
      .map((l) => l.trim().replace(/^\|+|\|+$/g, "").split("|").map((c) => c.trim()));
    const head = rows.length ? rows[0].map(key) : [];
    const missing = POSITION_COLS.filter((c) => !head.includes(key(c)));
    if (missing.length) add("fail", `Positions table missing columns: ${missing.join(", ")}`);
    else {
      const col = {};
      for (const c of POSITION_COLS) col[c] = head.indexOf(key(c));
      const cell = (r, c) => (col[c] < r.length ? r[col[c]] : "");
      for (const r of rows.slice(1)) {
        if (r.every((c) => /^[-: ]*$/.test(c))) continue;
        const rid = cell(r, "ID");
        if (!rid || ids.has(rid)) add("fail", `Positions: ${!rid ? "empty" : "duplicate"} ID ${pyRepr(rid)}`);
        ids.add(rid);
        if (!["must", "should", "optional"].includes(cell(r, "Req").toLowerCase()))
          add("warn", `Positions ${rid}: Req ${pyRepr(cell(r, "Req"))} not must|should|optional`);
        if (["", "-", "—"].includes(cell(r, "Preferred (GREEN)")) || ["", "-", "—"].includes(cell(r, "Walk-away (RED)")))
          add("warn", `Positions ${rid}: Preferred and Walk-away must both be filled`);
      }
    }
  }
  for (const m of body.matchAll(/^###\s+(\S+)\s+[—–-]/gm)) {
    if (!ids.has(m[1])) add("fail", `Clause library: ### ${m[1]} has no matching position ID`);
  }

  const offset = (text.slice(0, text.length - body.length).match(/\n/g) || []).length;
  const lineOf = (pos) => (body.slice(0, pos).match(/\n/g) || []).length + 1 + offset;
  for (const [label, rx] of LEAKS) {
    const re = new RegExp(rx, "g");
    for (const m of body.matchAll(re)) {
      if (label === "bank account" && (NOT_ACCOUNT.test(body.slice(Math.max(0, m.index - 12), m.index)) ||
        /^\s*Sb\./.test(body.slice(m.index + m[0].length)))) continue;
      add("fail", `leak: ${label} ${pyRepr(m[0])} (line ${lineOf(m.index)})`);
    }
  }
  for (const [cat, val] of tokens(body)) {
    if (cat === "date" || cat === "money")
      add("warn", `${cat} ${pyRepr(val)} may be a deal-specific fact; universalise unless it is a policy threshold`);
  }
  return issues;
}

function positionsOf(text) {
  const [, body] = parseFrontmatter(text);
  const m = body.match(/^##\s+Positions\s*$/m);
  if (!m) return {};
  const block = body.slice(m.index + m[0].length).split(/^##\s/m)[0];
  const rows = block.split("\n").filter((l) => l.trim().startsWith("|"))
    .map((l) => l.trim().replace(/^\|+|\|+$/g, "").split("|").map((c) => c.trim()));
  if (rows.length < 2) return {};
  const head = rows[0].map(key);
  if (!head.includes(key("ID"))) return {};
  const i = head.indexOf(key("ID"));
  const out = {};
  for (const r of rows.slice(1)) {
    if (i < r.length && r[i] && !r.every((c) => /^[-: ]*$/.test(c))) out[r[i]] = r;
  }
  return out;
}

function bind(artifact, positions) {
  const issues = [];
  const rated = ratings(artifact);
  const refs = [...new Set(artifact.match(POS_REF_RE) || [])].sort();
  if (rated.length && Object.keys(positions).length === 0) {
    issues.push({
      level: "fail",
      detail: `artifact rates ${rated.length} finding(s) but no playbook is bound; no positions, no ratings`,
    });
  }
  if (Object.keys(positions).length) {
    const unknown = refs.filter((r) => !(r in positions));
    if (unknown.length)
      issues.push({ level: "fail", detail: `position refs not in the bound playbook: ${unknown.join(", ")}` });
  }
  return issues;
}

const VALID = `---
name: NDA recipient
format: legalsuite-playbook/2
scope: mutual NDA — recipient side
jurisdiction: CZ
role: recipient
version: 1.0
status: approved
owner: head of commercial
approved_by: GC
approved_at: 2026-09-01
updated: 2026-09-01
review_by: 2099-01-01
---
# NDA recipient
## Scope
Mutual and one-way NDAs under Czech law (zákon č. 89/2012 Sb.; Regulation (EU) 2016/679).
## Positions
| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Term | must | 2 years | 3 years | over 5 years | GC | market |
## Clause library
### P1 — Term
Preferred wording:
> The obligations last two years.
## Standard definitions
## Red flags
Uncapped penalty.
## Negotiation sequence
## Jurisdiction notes
## Provenance
12 signed NDAs, reviewed by GC.
`;

function demo() {
  const assert = require("assert");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "playbook-"));
  const prevEnv = process.env.LEGALSUITE_PLAYBOOKS;
  try {
    const r = tmp;
    fs.writeFileSync(path.join(r, "saas.md"),
      "---\nname: SaaS\nversion: 1.0\nstatus: approved\nupdated: 2026-10-01\n---\n\n# SaaS\n", "utf-8");
    fs.writeFileSync(path.join(r, "nda.md"),
      "---\nname: NDA\nversion: 0.1\nstatus: draft\nreview_by: 2020-01-01\n---\n\n# NDA\n", "utf-8");
    const [meta, text, p] = load("saas", [r]);
    assert.ok(meta.status === "approved" && path.basename(p) === "saas.md", JSON.stringify([meta, p]));
    assert.ok(text.startsWith("---"), text.slice(0, 20));
    const entries = listAll([r]);
    assert.deepStrictEqual(entries.map((e) => e.slug), ["nda", "saas"]);
    assert.deepStrictEqual(entries.map((e) => e.stale), [true, false]);
    assert.throws(() => load("missing", [r]), (e) => {
      assert.ok(String(e.message).includes("nda, saas"), e.message);
      return true;
    });
    process.env.LEGALSUITE_PLAYBOOKS = r;
    assert.strictEqual(path.dirname(load("nda", defaultRoots())[2]), r);
  } finally {
    if (prevEnv === undefined) delete process.env.LEGALSUITE_PLAYBOOKS;
    else process.env.LEGALSUITE_PLAYBOOKS = prevEnv;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  assert.deepStrictEqual(check(VALID), []);
  const leaky = VALID.replace("12 signed NDAs", "Deal with Alfa Beta s.r.o., jan.novak@alfa.cz, price 250 000 Kč, signed 1. 3. 2026");
  const fails = check(leaky).filter((x) => x.level === "fail").map((x) => x.detail);
  assert.ok(fails.some((d) => d.startsWith("leak: email")), JSON.stringify(fails));
  assert.ok(fails.some((d) => d.startsWith("leak: company name 'Beta s.r.o.'")), JSON.stringify(fails));
  const warns = check(leaky).filter((x) => x.level === "warn").map((x) => x.detail);
  assert.ok(warns.some((d) => d.startsWith("money '250 000 Kč'")), JSON.stringify(warns));
  const stale = check(VALID.replace("review_by: 2099-01-01", "review_by: 2020-01-01"));
  assert.deepStrictEqual(stale, [{ level: "warn", detail: "stale: review_by 2020-01-01 is in the past" }]);
  const broken = check(VALID.replace("status: approved", "status: draft").replace("## Red flags", "")
    .replace("### P1", "### P9").replace("| P1 | Term | must", "| P1 | Term | maybe"));
  assert.deepStrictEqual(new Set(broken.map((x) => x.level)), new Set(["fail", "warn"]));
  assert.strictEqual(broken.length, 4, JSON.stringify(broken));
  const pos = positionsOf(VALID);
  assert.deepStrictEqual(new Set(Object.keys(pos)), new Set(["P1"]));
  assert.ok(bind("Stance: GREEN (P1).\n", {}).some((x) => x.detail.includes("no positions, no ratings")));
  assert.ok(bind("Stance: YELLOW (P9).\n", pos).some((x) => x.detail.includes("P9")));
  assert.deepStrictEqual(bind("Stance: GREEN (P1).\n", pos), []);
  assert.deepStrictEqual(bind("No ratings here.\n", {}), []);
  console.log("demo ok");
  return 0;
}

function usage() {
  return "usage: load_playbook.js <slug> [--root DIR]... [--json]\n       load_playbook.js --list [--json]\n       load_playbook.js --check <slug|path> [--json] [--strict]\n       load_playbook.js --demo";
}

function main(argv) {
  let ref = null, checkRef = null, bindArtifact = null, playbook = null;
  let list = false, strict = false, json = false, isDemo = false;
  const roots = [];
  const err = (m) => { console.error(`load_playbook.js: error: ${m}\n${usage()}`); process.exit(2); };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    const need = (k) => { if (++i >= argv.length) err(`${k} needs a value`); return argv[i]; };
    if (t === "--list") list = true;
    else if (t === "--strict") strict = true;
    else if (t === "--json") json = true;
    else if (t === "--demo") isDemo = true;
    else if (t === "--root") roots.push(need("--root"));
    else if (t === "--check") checkRef = need("--check");
    else if (t === "--bind") bindArtifact = need("--bind");
    else if (t === "--playbook") playbook = need("--playbook");
    else if (t === "-h" || t === "--help") { console.log(usage()); return 0; }
    else if (t.startsWith("-")) err(`unknown option ${t}`);
    else if (ref === null) ref = t;
    else err(`unexpected argument ${t}`);
  }
  if (isDemo) return demo();
  const allRoots = [...roots, ...defaultRoots()];

  if (list) {
    const entries = listAll(allRoots);
    if (json) console.log(JSON.stringify(entries, null, 2));
    else {
      for (const e of entries) {
        const ver = e.version ? ` v${e.version}` : "";
        const stale = e.stale ? " STALE" : "";
        console.log(`${e.slug.padEnd(24)} [${e.status}${ver}] review_by=${e.review_by || "-"}${stale} ${e.path}`);
      }
      if (!entries.length) console.error("no playbooks found");
    }
    return 0;
  }

  if (checkRef) {
    let text, file;
    try { [, text, file] = load(checkRef, allRoots); }
    catch (e) { console.error(`error: ${e.message}`); return 1; }
    const issues = check(text);
    const ok = !issues.some((x) => x.level === "fail");
    if (json) console.log(JSON.stringify({ path: file, ok, issues }, null, 2));
    else {
      for (const x of issues) console.log(`${x.level.toUpperCase().padEnd(4)} ${x.detail}`);
      console.log(ok ? "check: OK" : "check: FAIL");
    }
    return strict && !ok ? 1 : 0;
  }

  if (bindArtifact) {
    let positions = {};
    if (playbook) {
      try { positions = positionsOf(load(playbook, allRoots)[1]); }
      catch (e) { console.error(`error: ${e.message}`); return 1; }
    }
    let artifact;
    try { artifact = fs.readFileSync(bindArtifact, "utf-8"); }
    catch (e) { console.error(`error: ${e.message}`); return 1; }
    const issues = bind(artifact, positions);
    const ok = !issues.some((x) => x.level === "fail");
    if (json) console.log(JSON.stringify({ artifact: bindArtifact, playbook: playbook || null, ok, issues }, null, 2));
    else {
      for (const x of issues) console.log(`${x.level.toUpperCase().padEnd(4)} ${x.detail}`);
      console.log(ok ? "bind: OK" : "bind: FAIL");
    }
    return strict && !ok ? 1 : 0;
  }

  if (!ref) err("need SLUG or PATH (or --list, --check, or --demo)");
  let meta, text, file;
  try { [meta, text, file] = load(ref, allRoots); }
  catch (e) { console.error(`error: ${e.message}`); return 1; }
  if (meta.status === "draft")
    console.error(`warning: playbook ${pyRepr(path.basename(file, ".md"))} is draft (unapproved) -- positions need human sign-off`);
  if (json) {
    console.log(JSON.stringify({
      slug: path.basename(file, ".md"), path: file,
      status: meta.status || "unknown", version: meta.version || "",
      jurisdiction: meta.jurisdiction || "", content: text,
    }, null, 2));
  } else process.stdout.write(text.endsWith("\n") ? text : text + "\n");
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { check, bind, load, listAll, positionsOf, parseFrontmatter, defaultRoots };
