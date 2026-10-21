#!/usr/bin/env node
"use strict";
/* Generate the fact-map views (chronology, claims matrix, gaps) from facts.md.
 *
 * A view is derived data: regenerated from `facts.md`, never hand-edited.
 * Each output opens with the regeneration banner so a stale copy is obvious.
 */
const fs = require("fs");
const path = require("path");
const { FACTS_DEMO, parse_tables } = require("./trace.js");

const OPEN = new Set(["missing", "open", "disputed", "conceded"]);
const EVIDENCE_RISK = new Set(["to obtain", "requested", "at risk", "unavailable"]);
const CONTESTS = new Set(["y", "yes", "ano", "true", "?"]);
const TITLES = {
  chronology: ["Chronology", "chronology.md"],
  claims: ["Claims and defences matrix", "claims-matrix.md"],
  gaps: ["Gaps", "gaps.md"],
};

function rowsIn(rows, section) {
  return Object.values(rows).filter((r) => r["_section"] === section);
}

function isEmpty(v) {
  return ["", "—", "–", "-", "none", "n/a"].includes((v || "").trim().toLowerCase());
}

function table(cols, data) {
  const out = ["| " + cols.join(" | ") + " |", "|" + "---|".repeat(cols.length)];
  for (const row of data) {
    out.push("| " + cols.map((c) => String(row[c.toLowerCase()] || "").replace(/\|/g, "\\|").trim()).join(" | ") + " |");
  }
  return out;
}

function banner() {
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `_Generated from facts.md on ${day}. Edit facts.md, then regenerate._`;
}

function risk(rows) {
  const facts = rowsIn(rows, "Facts");
  const evidence = rowsIn(rows, "Evidence");
  const issues = rowsIn(rows, "Issues");
  const contested = facts.filter((f) => CONTESTS.has((f["contested"] || "").trim().toLowerCase()));
  const unevidenced = facts.filter((f) => isEmpty(f["evidence"]));
  const atRisk = evidence.filter((e) => EVIDENCE_RISK.has((e["status"] || "").trim().toLowerCase()));
  const openElems = issues.filter((i) => OPEN.has((i["status"] || "").trim().toLowerCase()));
  return [contested, unevidenced, atRisk, openElems];
}

function build(rows) {
  const events = rowsIn(rows, "Events");
  const issues = rowsIn(rows, "Issues");
  const [contested, unevidenced, atRisk, openElems] = risk(rows);

  let chron = ["# Chronology\n\n" + banner() + "\n", "## Events\n"];
  chron = chron.concat(table(["ID", "Date", "Precision", "Actor", "Act", "Facts", "Source"],
    [...events].sort((a, b) => String(a["date"] || "") < String(b["date"] || "") ? -1
      : String(a["date"] || "") > String(b["date"] || "") ? 1
      : String(a["id"] || "") < String(b["id"] || "") ? -1
      : String(a["id"] || "") > String(b["id"] || "") ? 1 : 0)));
  chron.push("\n## Gaps and inconsistencies\n");
  chron = chron.concat(contested.length
    ? contested.map((f) => `- contested fact \`${f["id"]}\` — ${f["proposition"] || ""}`) : ["- none"]);
  chron = chron.concat(unevidenced.length
    ? unevidenced.map((f) => `- fact \`${f["id"]}\` has no evidence — ${f["proposition"] || ""}`) : ["- none"]);
  chron = chron.concat(atRisk.length
    ? atRisk.map((e) => `- evidence \`${e["id"]}\` is \`${e["status"]}\``) : ["- none"]);

  let claims = ["# Claims and defences matrix\n\n" + banner() + "\n"];
  claims = claims.concat(table(["ID", "Issue", "Element", "Burden", "Standard", "Facts", "Evidence", "Status"], issues));

  let gaps = ["# Gaps\n\n" + banner() + "\n", "## Open issue elements\n"];
  gaps = gaps.concat(openElems.length
    ? openElems.map((i) => `- \`${i["id"]}\` ${i["element"] || ""} — \`${i["status"]}\` (burden: ${i["burden"] || "—"})`) : ["- none"]);
  gaps.push("\n## Facts without evidence\n");
  gaps = gaps.concat(unevidenced.length
    ? unevidenced.map((f) => `- \`${f["id"]}\` — ${f["proposition"] || ""}`) : ["- none"]);
  gaps.push("\n## Evidence to obtain or at risk\n");
  gaps = gaps.concat(atRisk.length
    ? atRisk.map((e) => `- \`${e["id"]}\` ${e["item"] || ""} — \`${e["status"]}\``) : ["- none"]);

  return {
    chronology: chron.join("\n") + "\n",
    claims: claims.join("\n") + "\n",
    gaps: gaps.join("\n") + "\n",
  };
}

function assertOk(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (msg === undefined ? "" : (typeof msg === "string" ? msg : JSON.stringify(msg))));
}

function demo() {
  const rows = parse_tables(FACTS_DEMO);
  const v = build(rows);
  assertOk(JSON.stringify(Object.keys(v).sort()) === JSON.stringify(["chronology", "claims", "gaps"]), Object.keys(v));
  assertOk(v["chronology"].includes("| E1 | 2025-03-01 | day | both | signing | F1 | smlouva.pdf |"), v["chronology"]);
  assertOk(v["chronology"].includes("contested fact `F2`"), v["chronology"]);
  assertOk(v["chronology"].includes("fact `F3` has no evidence"), v["chronology"]);
  assertOk(v["claims"].includes("| I1.a | Defect |"), v["claims"]);
  assertOk(v["gaps"].includes("`I1.a` existence — `open`"), v["gaps"]);
  assertOk(JSON.stringify(build(parse_tables(FACTS_DEMO))) === JSON.stringify(v), "views must be deterministic");
  assertOk(v["gaps"].includes("Generated from facts.md"), "banner");
  console.log("demo ok");
  return 0;
}

function main(argv) {
  const args = argv || process.argv.slice(2);
  let factsPath = null;
  let only = null;
  let out = null;
  let json = false;
  let isDemo = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") json = true;
    else if (a === "--demo") isDemo = true;
    else if (a === "--facts" || a === "--only" || a === "--out") {
      const v = args[++i];
      if (v === undefined || (a !== "--out" && v.startsWith("-") && a !== "--facts")) {
        process.stderr.write(`views.js: error: option ${a} needs a value\n`);
        return 2;
      }
      if (a === "--facts") factsPath = v;
      else if (a === "--only") only = v;
      else out = v;
    } else if (a.startsWith("-")) {
      process.stderr.write(`views.js: error: unknown option ${a}\n`);
      return 2;
    } else {
      process.stderr.write(`views.js: error: unexpected argument ${a}\n`);
      return 2;
    }
  }
  if (isDemo) return demo();
  if (only !== null && !Object.prototype.hasOwnProperty.call(TITLES, only)) {
    process.stderr.write(`views.js: error: option --only: invalid choice: ${only} (choose from chronology, claims, gaps)\n`);
    return 2;
  }
  if (!factsPath) {
    process.stderr.write("usage: views.js --facts FACTS.md\n");
    process.stderr.write("views.js: error: need --facts FACTS.md (or --demo)\n");
    return 2;
  }
  let rows;
  try {
    rows = parse_tables(fs.readFileSync(factsPath, "utf8"));
  } catch (e) {
    process.stderr.write(`error: ${(e && e.message) || e}\n`);
    return 1;
  }
  let views = build(rows);
  if (only) views = { [only]: views[only] };
  if (out) {
    const dest = out;
    fs.mkdirSync(dest, { recursive: true });
    const written = {};
    for (const name of Object.keys(views)) {
      const f = path.join(dest, TITLES[name][1]);
      fs.writeFileSync(f, views[name], "utf8");
      written[name] = f;
    }
    if (json) console.log(JSON.stringify(written, null, 2));
    else console.log(Object.values(written).map((p) => `wrote ${p}`).join("\n"));
  } else if (json) {
    console.log(JSON.stringify(views, null, 2));
  } else {
    process.stdout.write(Object.values(views).join("\n\n"));
  }
  return 0;
}

module.exports = { build, TITLES };

if (require.main === module) process.exitCode = main();
