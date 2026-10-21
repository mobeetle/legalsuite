#!/usr/bin/env node
"use strict";
/* Pre-flight context: profile, packs, matter (builtins only: fs, path).
 * Port of preflight.py. Reports configured/provisional, stale packs, and
 * stance defaults. It reports; it never writes and never decides. */
const fs = require("fs");
const path = require("path");

const ENGINE = path.join(__dirname, "..");
const PACK_KINDS = ["jurisdictions", "regimes"];
const STANCE_KEYS = ["JURISDICTION", "LANGUAGE", "POSTURE", "AUDIENCE", "RISK"];
const GAPS = ["[PLACEHOLDER]", "[PENDING]"];
const MATTER_FILES = ["state.json", "matter.md"];
const FM_RE = /^---\n(.*?)\n---\n/s;

function frontmatter(text) {
  const m = FM_RE.exec(text);
  if (!m) return {};
  const meta = {};
  for (const line of m[1].split("\n")) {
    const sep = line.indexOf(":");
    if (sep !== -1 && !line.startsWith(" ")) {
      const k = line.slice(0, sep).trim();
      const v = line.slice(sep + 1).trim().replace(/^"+|"+$/g, "");
      meta[k] = v;
    }
  }
  return meta;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function packs() {
  const out = [];
  for (const kind of PACK_KINDS) {
    const dir = path.join(ENGINE, kind);
    let files = [];
    try { files = fs.readdirSync(dir); } catch (e) { continue; }
    files = files.filter((f) => !f.startsWith("_") && f.endsWith(".md")).sort();
    for (const f of files) {
      const p = path.join(dir, f);
      const meta = frontmatter(fs.readFileSync(p, "utf-8"));
      const rb = meta.review_by || "";
      let stale = false;
      if (rb) {
        try { stale = rb.slice(0, 10) < todayIso(); } catch (e) { stale = false; }
      }
      out.push({ kind, code: meta.code || path.basename(f, ".md"),
        review_by: rb, stale, path: p });
    }
  }
  return out;
}

function homeDir() {
  return process.env.HOME || process.env.USERPROFILE || "/";
}

function findProfile(d, matter) {
  const cands = [];
  if (matter) cands.push(path.join(path.dirname(matter), "profile.md"));
  cands.push(path.join(d, ".legal", "profile.md"));
  cands.push(path.join(d, "profile.md"));
  cands.push(path.join(homeDir(), ".legal", "profile.md"));
  return cands.find((c) => { try { return fs.statSync(c).isFile(); } catch (e) { return false; }; }) || null;
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch (e) { return false; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch (e) { return false; }
}

function detectMatter(d) {
  if (MATTER_FILES.some((f) => isFile(path.join(d, f)))) return d;
  const legal = path.join(d, ".legal");
  if (isDir(legal)) {
    const subs = fs.readdirSync(legal).sort()
      .filter((s) => isDir(path.join(legal, s)));
    for (const sub of subs) {
      if (MATTER_FILES.some((f) => isFile(path.join(legal, sub, f)))) {
        return path.join(legal, sub);
      }
    }
  }
  return null;
}

function stanceDefaults(text) {
  const out = {};
  const re = /\b([A-Z][A-Z_]{2,})\s*=\s*([^=]+?)(?=\s{2,}[A-Z][A-Z_]{2,}\s*=|$)/g;
  for (const line of text.split("\n")) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (STANCE_KEYS.includes(m[1])) {
        out[m[1]] = m[2].trim().replace(/^[<>]+|[<>]+$/g, "").trim();
      }
    }
  }
  return out;
}

function preflight(d) {
  const matter = detectMatter(d);
  const profile = findProfile(d, matter);
  let gaps = [];
  let stance = {};
  if (profile !== null) {
    const text = fs.readFileSync(profile, "utf-8");
    gaps = GAPS.filter((g) => text.includes(g));
    stance = stanceDefaults(text);
  }
  const status = (profile !== null && !gaps.length) ? "configured" : "provisional";
  return { status, profile: profile || null, matter: matter || null,
    gaps, stance, packs: packs() };
}

function human(r) {
  console.log(`preflight: ${r.status.toUpperCase()}`);
  console.log(`profile:   ${r.profile || "(none — provisional defaults)"}`);
  console.log(`matter:    ${r.matter || "(not detected)"}`);
  if (r.gaps.length) console.log(`gaps:      ${r.gaps.join(", ")}`);
  if (Object.keys(r.stance).length) {
    console.log("stance:    " + Object.entries(r.stance).map(([k, v]) => `${k}=${v}`).join("  "));
  }
  for (const p of r.packs) {
    const flag = p.stale ? "STALE" : "fresh";
    console.log(`pack:      ${p.kind.slice(0, -1).padEnd(12)} ${String(p.code).padEnd(16)} review_by ${p.review_by}  [${flag}]`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (typeof msg === "string" ? msg : JSON.stringify(msg)));
}

function tmpDir() {
  const base = process.env.TMPDIR || "/tmp";
  return fs.mkdtempSync(path.join(base, "preflight-"));
}

function demo() {
  const tmp = tmpDir();
  try {
    assert(preflight(tmp).status === "provisional");
    fs.mkdirSync(path.join(tmp, ".legal"));
    fs.writeFileSync(path.join(tmp, ".legal", "profile.md"),
      "# Practice profile\n## Defaults for the stance\n" +
      "JURISDICTION = <cz>      LANGUAGE = <cs>\nPOSTURE = <balanced>     AUDIENCE = <lawyer>\n" +
      "Owner: [PLACEHOLDER]\n", "utf-8");
    let r = preflight(tmp);
    assert(r.status === "provisional" && JSON.stringify(r.gaps) === JSON.stringify(["[PLACEHOLDER]"]), JSON.stringify(r));
    fs.writeFileSync(path.join(tmp, ".legal", "profile.md"),
      "# Practice profile\n## Defaults for the stance\n" +
      "JURISDICTION = <cz>      LANGUAGE = <cs; commentary en>\n" +
      "POSTURE = <balanced>     AUDIENCE = <lawyer>\n", "utf-8");
    r = preflight(tmp);
    assert(r.status === "configured" && r.gaps.length === 0, JSON.stringify(r));
    assert(JSON.stringify(r.stance) === JSON.stringify({ JURISDICTION: "cz",
      LANGUAGE: "cs; commentary en", POSTURE: "balanced", AUDIENCE: "lawyer" }), JSON.stringify(r.stance));
    fs.mkdirSync(path.join(tmp, ".legal", "acme"));
    fs.writeFileSync(path.join(tmp, ".legal", "acme", "state.json"), "{}", "utf-8");
    assert(preflight(tmp).matter.endsWith("acme"), preflight(tmp).matter);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  const ps = packs();
  assert(ps.length && ps.every((p) => p.review_by), JSON.stringify(ps));
  console.log("demo ok");
  return 0;
}

function parse(argv) {
  const out = { dir: ".", json: false, demo: false, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--demo") out.demo = true;
    else if (a === "--strict") out.strict = true;
    else if (a === "--json") out.json = true;
    else if (a === "--dir") out.dir = argv[++i];
    else if (a.startsWith("--dir=")) out.dir = a.slice("--dir=".length);
    else if (a === "--help" || a === "-h") out.help = true;
    else return { error: `unknown argument ${JSON.stringify(a)}` };
    if (out.dir === undefined) return { error: "missing value for --dir" };
  }
  return out;
}

function main(argv) {
  const args = parse(argv === undefined ? process.argv.slice(2) : argv);
  if (args.error) { console.error(`error: ${args.error}`); return 2; }
  if (args.demo) return demo();
  const r = preflight(args.dir);
  if (args.json) console.log(JSON.stringify(r, null, 2));
  else human(r);
  return args.strict && r.status !== "configured" ? 1 : 0;
}

module.exports = { frontmatter, packs, findProfile, detectMatter, stanceDefaults, preflight };

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
