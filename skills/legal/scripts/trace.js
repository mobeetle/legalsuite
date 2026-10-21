#!/usr/bin/env node
"use strict";
/* Fact and authority traceability check for legal work product (stdlib only).
 *
 * Finds trace refs in an ARTIFACT -- `[F12]`, `[E3]`, `[X4]`, `[I1.b]`, `[A2]`,
 * lists `[F1, F3]`, `[AUTH:A2]` -- and resolves them against the matter
 * registers: facts.md (## Facts / Events / Evidence / Issues tables) and
 * authorities.md (citation ledger). Flags unknown IDs, facts without evidence,
 * reliance on contested facts, unverified authorities and untraced `[AUTH]`.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { read_text } = require("./doctext.js");

const ID_SRC = "[FEXIA]\\d+(?:\\.[a-z0-9]+)?";
const REF_SRC = "\\[(?:AUTH:)?(" + ID_SRC + "(?:\\s*,\\s*" + ID_SRC + ")*)\\]";
const AUTH_TAG_RE = /\[AUTH\]/;
const EMPTY = new Set(["", "—", "–", "-", "none", "n/a"]);
const YES = new Set(["y", "yes", "ano", "true"]);
// I5: the two flag species are not provenance tags; a demotion must be recorded;
// a claimed pass must have a run behind it.
const SEV_RANK = { low: 0, medium: 1, high: 2, critical: 3 };
const WRONG_FLAG_SRC = "\\[(Verify|VERIFY|Review|REVIEW)\\]";
// A reason must name something: "unjustified:" is not a reason.
const REASON_RE = /(?<![a-z])(?:reason|floor|justified|demoted because)\s*[:=]\s*\S+/i;
const CHECK_CLAIM_SRC = "\\b([A-Za-z_][A-Za-z_]*)\\s*(?:[:=]\\s*)?(✓|✗|pass|fail)(?![A-Za-z])";
const CHECKS_SEG_SRC = "checks?\\s*:\\s*([^.\n·]*)";

function parse_tables(text) {
  // Every Markdown table row keyed by its ID cell; columns by lowercase header.
  const rows = {};
  let header = null;
  let section = "";
  for (const line of String(text).split(/\r\n|\r|\n/)) {
    const s = line.trim();
    if (s.startsWith("#")) {
      section = s.replace(/^#+/, "").trim();
      header = null;
      continue;
    }
    if (!s.startsWith("|")) {
      header = null;
      continue;
    }
    // ponytail: escaped pipes inside cells are not supported
    const use = stripPipes(s).split("|").map((c) => c.trim());
    if (header === null) {
      header = use.map((c) => c.toLowerCase());
    } else if (!use.every((c) => [...c].every((ch) => ch === "-" || ch === ":" || ch === " ")) || use.length === 0) {
      const row = {};
      for (let i = 0; i < header.length; i++) row[header[i]] = use[i] !== undefined ? use[i] : "";
      const rid = row["id"] || use[0];
      if (rid) rows[rid] = Object.assign({}, row, { _section: section });
    }
  }
  return rows;
}

function stripPipes(s) {
  let a = 0;
  let b = s.length;
  while (a < b && s[a] === "|") a++;
  while (b > a && s[b - 1] === "|") b--;
  return s.slice(a, b);
}

function issue(check, level, line, detail) {
  return { check, level, line, detail };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pyRepr(s) {
  return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

function trace(artifact, facts, auths, upstream, verification) {
  if (upstream === undefined) upstream = null;
  if (verification === undefined) verification = null;
  const issues = [];
  const seen = new Set();
  const citedF = new Set();
  const citedA = new Set();

  function add(check, level, line, detail) {
    if (!seen.has(detail)) {
      // one report per distinct problem, first line wins
      seen.add(detail);
      issues.push(issue(check, level, line, detail));
    }
  }

  const lines = String(artifact).split(/\r\n|\r|\n/);
  lines.forEach((line, idx) => {
    const n = idx + 1;
    const ids = [];
    const re = new RegExp(REF_SRC, "g");
    let m;
    while ((m = re.exec(line)) !== null) {
      for (const part of m[1].split(",")) ids.push(part.trim());
    }
    if (AUTH_TAG_RE.test(line) && !ids.some((i) => i.startsWith("A"))) {
      add("untraced", "warn", n, `untraced authority: [AUTH] on line ${n} has no A-ref`);
    }
    for (const rid of ids) {
      const isA = rid.startsWith("A");
      const reg = isA ? auths : facts;
      const name = isA ? "authorities" : "facts";
      (isA ? citedA : citedF).add(rid);
      if (reg === null || reg === undefined) {
        add("register", "warn", n, `[${rid}]: ${name} register not provided`);
        continue;
      }
      const row = reg[rid];
      if (row === undefined) {
        add("ref", "fail", n, `[${rid}] not found in ${name} register`);
      } else if (rid.startsWith("A")) {
        const res = (row["result"] || "").toLowerCase();
        if (res === "partial") {
          add("authority", "warn", n, `[${rid}] only partially verified`);
        } else if (res !== "verified") {
          add("authority", "fail", n, `[${rid}] authority not verified (result: ${res || "empty"})`);
        }
      } else if (rid.startsWith("F")) {
        if (EMPTY.has((row["evidence"] || "").trim().toLowerCase())) {
          add("evidence", "warn", n, `[${rid}] fact without evidence`);
        }
        if (YES.has((row["contested"] || "").trim().toLowerCase())) {
          add("contested", "warn", n, `[${rid}] relies on contested fact`);
        }
      }
    }
  });
  // tag integrity: Facts carry a provenance tag, never a flag species
  for (const rid of Object.keys(facts || {})) {
    const row = facts[rid];
    const toks = new Set(((row["tag"] || "").toLowerCase().match(/\w+/g) || []));
    if (row["_section"] === "Facts" && (toks.has("verify") || toks.has("review"))) {
      add("tag", "fail", 0, `[${rid}] Tag cell holds a flag species, not a provenance tag`);
    }
  }
  {
    const re = new RegExp(WRONG_FLAG_SRC, "g");
    let m;
    while ((m = re.exec(artifact)) !== null) {
      const ln = artifact.slice(0, m.index).split("\n").length;
      add("tag", "warn", ln, `flag species ${pyRepr(m[0])} must be lowercase [verify] / [review]`);
    }
  }

  // severity floor: a downstream demotion must be recorded
  for (const rid of Object.keys(upstream || {})) {
    const row = upstream[rid];
    const sevRaw = String(row["severity"] || "").trim().replace(/^[\[\]]+|[\[\]]+$/g, "").toLowerCase();
    const up = SEV_RANK[sevRaw];
    if (up === undefined) continue;
    lines.forEach((line, idx) => {
      const n = idx + 1;
      if (!new RegExp("\\b" + escapeRegExp(rid) + "\\b").test(line)) return;
      const here = [...line.matchAll(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]/gi)].map((x) => SEV_RANK[x[1].toLowerCase()]);
      if (here.length && Math.max(...here) < up && !REASON_RE.test(line)) {
        add("floor", "fail", n, `demoted ${rid} below upstream severity ${row["severity"]} without a recorded reason`);
      }
    });
  }

  // no unrun pass: a claimed check must have a run behind it
  const segs = [...String(artifact).matchAll(new RegExp(CHECKS_SEG_SRC, "gi"))].map((m) => m[1]);
  if (segs.length && (verification === null || verification === undefined)) {
    add("unrun", "fail", 0, "artifact claims checks passed but no verification record was provided");
  } else {
    const recorded = {};
    for (const rid of Object.keys(verification || {})) {
      const row = verification[rid];
      recorded[rid.toLowerCase()] = String(row["result"] || row["status"] || "").trim().toLowerCase();
    }
    for (const seg of segs) {
      for (const cm of seg.matchAll(new RegExp(CHECK_CLAIM_SRC, "gi"))) {
        const cname = cm[1];
        const mark = cm[2];
        if ((mark === "✓" || mark.toLowerCase() === "pass") && recorded[cname.toLowerCase()] !== "pass") {
          add("unrun", "fail", 0, `claims check ${pyRepr(cname)} passed but the verification record does not show pass`);
        }
      }
    }
  }

  const unverified = Object.keys(auths || {})
    .filter((r) => ["unverified", "failed"].includes((auths[r]["result"] || "").toLowerCase()))
    .sort();
  return {
    ok: !issues.some((i) => i.level === "fail"),
    issues,
    stats: { facts_cited: citedF.size, authorities_cited: citedA.size, unverified_authorities: unverified },
  };
}

const FACTS_DEMO = "# Facts register\n## Facts\n| ID | Proposition | Source anchor | Tag | Asserted by | Contested | Evidence |\n|---|---|---|---|---|---|---|\n| F1 | Contract signed 1. 3. 2025 | smlouva.pdf p1 | [DOC] | client | N | X1 |\n| F2 | Goods were defective | email 5. 4. | [USER] | client | ano | X2 |\n| F3 | Notice sent orally | call | [USER] | client | N | — |\n## Events\n| ID | Date | Precision | Actor | Act | Facts | Source |\n|---|---|---|---|---|---|---|\n| E1 | 2025-03-01 | day | both | signing | F1 | smlouva.pdf |\n## Evidence\n| ID | Item | Type | Supports | Weakens | Authenticity | Held by | Status |\n|---|---|---|---|---|---|---|---|\n| X1 | smlouva.pdf | document | F1 | | original | client | held |\n## Issues\n| ID | Issue | Element | Burden | Standard | Facts | Evidence | Status |\n|---|---|---|---|---|---|---|---|\n| I1.a | Defect | existence | buyer | preponderance | F2 | X2 | open |\n";
const AUTH_DEMO = "## Ledger\n| ID | Citation | Proposition | Source | Retrieved | In force at EPOCH | Quote | Weight | Status | Result | Extra |\n|---|---|---|---|---|---|---|---|---|---|---|\n| A1 | § 2099 OZ | seller liable for defects | zakonyprolidi | 2026-10-01 | Y | \"...\" | binding | ok | verified | x |\n| A2 | 23 Cdo 1/2020 | notice must be timely | nsoud.cz | 2026-10-01 | Y | | persuasive | ok | partial | |\n| A3 | 33 Odo 9/2005 | oral notice suffices | memory | | ? | | | | unverified | |\n";

function assertOk(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (msg === undefined ? "" : (typeof msg === "string" ? msg : JSON.stringify(msg))));
}

function demo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "trace-"));
  let facts;
  let auths;
  try {
    const f = path.join(tmp, "facts.md");
    const a = path.join(tmp, "authorities.md");
    fs.writeFileSync(f, FACTS_DEMO, "utf8");
    fs.writeFileSync(a, AUTH_DEMO, "utf8");
    facts = parse_tables(read_text(f));
    auths = parse_tables(read_text(a));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  assertOk(facts["I1.a"]["_section"] === "Issues" && auths["A2"]["result"] === "partial", "registers");
  const clean = "Smlouva byla uzavřena [F1, E1] a prodávající odpovídá [AUTH:A1] [I1.a] [X1].\n";
  const r = trace(clean, facts, auths);
  assertOk(r["ok"] && r["issues"].length === 0, r);
  assertOk(JSON.stringify(r["stats"]) === JSON.stringify({ facts_cited: 4, authorities_cited: 1, unverified_authorities: ["A3"] }), r["stats"]);
  const art = "Vady byly [F2]. Oznámení [F3] stačí [A3].\nVčasnost [A2]; viz též [F9].\nJudikatura to potvrzuje [AUTH].\n";
  const got = new Set(trace(art, facts, auths)["issues"].map((i) => JSON.stringify([i["check"], i["level"], i["detail"]])));
  const want = new Set(
    [
      ["contested", "warn", "[F2] relies on contested fact"],
      ["evidence", "warn", "[F3] fact without evidence"],
      ["authority", "fail", "[A3] authority not verified (result: unverified)"],
      ["authority", "warn", "[A2] only partially verified"],
      ["ref", "fail", "[F9] not found in facts register"],
      ["untraced", "warn", "untraced authority: [AUTH] on line 3 has no A-ref"],
    ].map((t) => JSON.stringify(t))
  );
  assertOk(JSON.stringify([...got].sort()) === JSON.stringify([...want].sort()), [...got]);
  const r2 = trace("Bod [F1] a [A1].", null, null);
  assertOk(r2["ok"] && JSON.stringify(r2["issues"].map((i) => i["detail"])) === JSON.stringify(["[F1]: facts register not provided", "[A1]: authorities register not provided"]), r2);
  // I5: severity floor, unrun pass, tag integrity
  const up = parse_tables("## Findings\n| ID | Finding | Severity |\n|---|---|---|\n| G1 | cap | HIGH |\n");
  const bad = trace("Finding G1 [LOW] -- harmless.\n", null, null, up, null);
  assertOk(bad["issues"].some((i) => i["check"] === "floor" && i["level"] === "fail"), bad);
  const ok = trace("Finding G1 [LOW] -- reason: de minimis for this deal.\n", null, null, up, null);
  assertOk(!ok["issues"].some((i) => i["check"] === "floor"), ok);
  const ver = parse_tables("## Record\n| ID | Result |\n|---|---|\n| structure | pass |\n");
  const unrun = trace("Done - checks: structure ✓, scan ✓ - assumed: none.\n", null, null, null, ver);
  assertOk(unrun["issues"].some((i) => i["check"] === "unrun" && i["level"] === "fail" && i["detail"].includes("scan")), unrun);
  const tagged = parse_tables("## Facts\n| ID | Proposition | Tag | Evidence |\n|---|---|---|---|\n| F1 | x | [verify] | X1 |\n");
  assertOk(trace("x [F1]", tagged, null)["issues"].some((i) => i["check"] === "tag" && i["level"] === "fail"), "tag fail");
  assertOk(trace("See [Verify] this.", null, null)["issues"].some((i) => i["check"] === "tag"), "tag warn");
  console.log("demo ok");
  return 0;
}

function pyStatsRepr(stats) {
  return (
    "{'facts_cited': " + stats.facts_cited +
    ", 'authorities_cited': " + stats.authorities_cited +
    ", 'unverified_authorities': [" + stats.unverified_authorities.map(pyRepr).join(", ") + "]}"
  );
}

function main(argv) {
  const args = argv || process.argv.slice(2);
  let artifact = null;
  let factsPath = null;
  let authPath = null;
  let upPath = null;
  let verPath = null;
  let json = false;
  let strict = false;
  let isDemo = false;
  const needsVal = new Set(["--facts", "--authorities", "--upstream", "--verification"]);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") json = true;
    else if (a === "--strict") strict = true;
    else if (a === "--demo") isDemo = true;
    else if (needsVal.has(a)) {
      const v = args[++i];
      if (v === undefined || v.startsWith("-")) {
        process.stderr.write(`trace.js: error: option ${a} needs a value\n`);
        return 2;
      }
      if (a === "--facts") factsPath = v;
      else if (a === "--authorities") authPath = v;
      else if (a === "--upstream") upPath = v;
      else verPath = v;
    } else if (a.startsWith("-")) {
      process.stderr.write(`trace.js: error: unknown option ${a}\n`);
      return 2;
    } else if (artifact === null) artifact = a;
    else {
      process.stderr.write(`trace.js: error: unexpected argument ${a}\n`);
      return 2;
    }
  }
  if (isDemo) return demo();
  if (!artifact) {
    process.stderr.write("usage: trace.js ARTIFACT [--facts FACTS.md]\n");
    process.stderr.write("trace.js: error: need ARTIFACT (or --demo)\n");
    return 2;
  }
  let facts = null;
  let auths = null;
  let upstream = null;
  let verification = null;
  try {
    if (factsPath) facts = parse_tables(read_text(factsPath));
    if (authPath) auths = parse_tables(read_text(authPath));
    if (upPath) upstream = parse_tables(read_text(upPath));
    if (verPath) verification = parse_tables(read_text(verPath));
  } catch (e) {
    process.stderr.write(`error: ${(e && e.message) || e}\n`);
    return 1;
  }
  let artText;
  try {
    artText = read_text(artifact);
  } catch (e) {
    process.stderr.write(`error: ${(e && e.message) || e}\n`);
    return 1;
  }
  const res = trace(artText, facts, auths, upstream, verification);
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    for (const i of res["issues"]) {
      console.log(`${i["level"].toUpperCase().padEnd(4)} ${i["check"].padEnd(9)} ${("L" + i["line"]).padEnd(5)} ${i["detail"]}`);
    }
    console.log((res["ok"] ? "trace: OK " : "trace: FAIL ") + pyStatsRepr(res["stats"]));
  }
  return strict && !res["ok"] ? 1 : 0;
}

module.exports = { parse_tables, trace, FACTS_DEMO, AUTH_DEMO };

if (require.main === module) process.exitCode = main();
