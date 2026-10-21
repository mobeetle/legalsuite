#!/usr/bin/env node
// Apply a skill-name prefix to a staged copy of the suite (no dependencies).
// Mirrors scripts/apply_prefix.py: renames skill dirs + command files, rewrites
// frontmatter name:, `legal` -> `<stem>`, ../legal/ -> ../<stem>/, door tokens.
"use strict";
const fs = require("fs");
const path = require("path");

const OLD_STEM = "legal";
const DOOR_SUFFIX = {
  "legal-intake": "intake",
  "legal-research": "research",
  "legal-ground": "research",
  "legal-review": "review",
  "legal-drafting": "drafting",
  "legal-dispute": "dispute",
  "legal-project": "project",
};

function normalize(prefix) {
  if (prefix && !prefix.endsWith("-")) prefix += "-";
  return prefix;
}
function rewriteText(text, prefix) {
  const stem = prefix.replace(/-$/, "") || OLD_STEM;
  text = text.split("`legal`").join(`\`${stem}\``);
  text = text.split("../legal/").join(`../${stem}/`);
  text = text.replace(/^name: legal$/gm, `name: ${stem}`);
  for (const [old, suffix] of Object.entries(DOOR_SUFFIX))
    text = text.split(old).join(prefix + suffix);
  return text;
}
function rename(name, prefix) {
  const stem = prefix.replace(/-$/, "") || OLD_STEM;
  if (name === OLD_STEM || name === OLD_STEM + ".md") return stem + name.slice(OLD_STEM.length);
  if (name.startsWith(OLD_STEM + "-")) return prefix + name.slice(OLD_STEM.length + 1);
  return name;
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith(".md")) out.push(p);
  }
  return out;
}
function apply(root, prefix) {
  prefix = normalize(prefix);
  if (prefix === "legal-") return;
  for (const sub of ["skills", "commands"]) {
    const base = path.join(root, sub);
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base)) {
      const next = rename(name, prefix);
      if (next !== name) fs.renameSync(path.join(base, name), path.join(base, next));
    }
  }
  for (const f of walk(root))
    fs.writeFileSync(f, rewriteText(fs.readFileSync(f, "utf8"), prefix));
}
function selftest() {
  const t = "Load `legal` then `legal-review`/`legal-ground`; read ../legal/scripts/scan.py.\nname: legal";
  const out = rewriteText(t, "acme-");
  const assert = require("assert");
  assert.ok(out.includes("`acme` then `acme-review`/`acme-research`"), out);
  assert.ok(out.includes("../acme/scripts/scan.py"), out);
  assert.ok(out.includes("name: acme"), out);
  for (const stale of ["`legal`", "`legal-review`", "`legal-ground`", "../legal/", "name: legal"]) {
    assert.ok(!out.includes(stale), `prefix left ${stale} behind: ${out}`);
  }
  assert.strictEqual(rewriteText("the legal advice", "acme-"), "the legal advice");
  assert.strictEqual(rename("legal-matter", "acme-"), "acme-matter");
  console.log("demo ok");
}
function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest") || args.includes("--demo")) return selftest();
  let prefix = "legal-", root = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--prefix") prefix = args[++i];
    else if (args[i] === "--root") root = args[++i];
  }
  if (!root) { console.error("--root is required (unless --selftest)"); process.exit(2); }
  apply(root, prefix);
}
if (require.main === module) main();
module.exports = { rewriteText, rename, apply };
