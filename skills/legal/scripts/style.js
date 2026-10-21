#!/usr/bin/env node
'use strict';
/* House-style check for legal documents (stdlib only).
 *
 * Deterministic house-style rules on one document -- separate from
 * structure.js, which checks integrity, not style:
 *
 *   thematic-break  fail  a `---` / `***` rule between paragraphs
 *   list-punct      fail  a bullet glyph in front of a `(a)` / `(i)` item
 *   ampersand       warn  `&` in running text (spell it out as "and")
 *   banned-word     warn  a filler word the house avoids ("strictly" default)
 *
 * The four rules the house fixed by hand. `&` inside a URL, an XML entity or a
 * closed compound (M&A, R&D, AT&T) is left alone; the canonical legal
 * collocations "strictly necessary/confidential/prohibited" are exempt; fenced
 * code blocks and YAML front-matter are skipped. Add matter words with --ban or
 * the profile's house-style list (references/capabilities/style.md).
 *
 *     style.js DOC [--json] [--strict] [--ban WORD]... [--demo]
 *
 * Exit 0 normally; --strict exits 1 when any check fails (warnings never block).
 * Inputs: .txt, .md or .docx (accepted view).
 *
 * Ceiling: line-based regexes, not a document model. "Use `strictly` less
 * often" is a judgement; only the default list is caught, and a legitimate use
 * must be exempted with --ban off / the profile list.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let read_text;
try {
  const d = require('./doctext.js');
  if (d && typeof d.read_text === 'function') read_text = d.read_text;
  else throw new Error('doctext.js has no read_text');
} catch (e) {
  read_text = (p) => {
    if (String(p).toLowerCase().endsWith('.docx')) {
      throw new Error(`cannot read .docx without ./doctext.js: ${p}`);
    }
    const s = fs.readFileSync(String(p), 'utf8');
    return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
  };
}

const BREAK_RE = /^[-*_]{3,}$/;
const LIST_RE = /^\s*[-*+]\s+\((?:[0-9]+|[a-z]|[ivxlc]+)\)\s/;
const URL_RE = /https?:\/\/\S+/g;
const ENTITY_RE = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/;
const FENCE_RE = /^\s*```/;
const DEFAULT_BANS = ['strictly'];
// ponytail: fixed exemption list, not a linguistics model; add collocations as they bite
const EXEMPT_RE = /strictly\s+(?:necessary|confidential|prohibited|speaking|limited)/gi;

function issue(check, level, line, detail) {
  return { check, level, line, detail };
}

function bodyLines(lines) {
  // Line numbers not inside a fence, and not inside YAML front-matter.
  let fmEnd = -1;
  if (lines.length && lines[0].trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') { fmEnd = i; break; }
    }
  }
  let fenced = false;
  const out = [];
  lines.forEach((line, ix) => {
    const i = ix + 1;
    if (ix <= fmEnd) return;
    if (FENCE_RE.test(line)) { fenced = !fenced; return; }
    if (!fenced) out.push([i, line]);
  });
  return out;
}

function ampersand(line) {
  // True when the line has an `&` in running text (not URL/entity/compound).
  const scan = line.replace(URL_RE, '');
  for (let i = 0; i < scan.length; i++) {
    if (scan[i] !== '&') continue;
    const tail = scan.slice(i);
    if (ENTITY_RE.test(tail)) continue;
    const left = i > 0 ? scan[i - 1] : '';
    const right = i + 1 < scan.length ? scan[i + 1] : '';
    if (!left || !right || /\s/.test(left) || /\s/.test(right)) return true;
  }
  return false;
}

function check(text, bans) {
  const lines = String(text).split('\n');
  const words = DEFAULT_BANS.concat((bans || []).filter((w) => !DEFAULT_BANS.includes(w)));
  const issues = [];
  const stats = { breaks: 0, listpunctuation: 0, ampersands: 0, banned: 0 };
  for (const [n, line] of bodyLines(lines)) {
    const s = line.trim();
    if (BREAK_RE.test(s)) {
      stats.breaks++;
      issues.push(issue('thematic-break', 'fail', n, `thematic break '${s}'`));
      continue;
    }
    const m = LIST_RE.exec(line);
    if (m) {
      stats.listpunctuation++;
      issues.push(issue('list-punct', 'fail', n, `bullet before enumerator '${m[0].trim()}'`));
    }
    if (ampersand(line)) {
      stats.ampersands++;
      issues.push(issue('ampersand', 'warn', n, `'&' in running text: ${s.slice(0, 80)}`));
    }
    const scan = line.replace(URL_RE, '').replace(EXEMPT_RE, '');
    for (const w of words) {
      const re = new RegExp(`(?<!\\w)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\w)`, 'i');
      if (re.test(scan)) {
        stats.banned++;
        issues.push(issue('banned-word', 'warn', n, `avoid '${w}': ${s.slice(0, 80)}`));
      }
    }
  }
  return { ok: !issues.some((i) => i.level === 'fail'), issues, stats };
}

function fixture(name) {
  const p = path.join(__dirname, 'fixtures', name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function demo() {
  const dirty = ('# PARTNERSHIP & PILOT AGREEMENT\n' +
    '\n' +
    '---\n' +
    '\n' +
    '1.2. **Definitions:**\n' +
    '- (a) "Affiliate" means any entity that controls a Party.\n' +
    '- (b) "Wholesale Price" means List Price minus the discount.\n' +
    '\n' +
    '---\n' +
    '\n' +
    '5.3. ALL TECHNOLOGY IS PROVIDED STRICTLY "AS IS."\n' +
    '5.4. See https://www.jetbrains.com/legal/?a=1&b=2 and M&A, R&D, AT&T.\n' +
    '7.1. This relationship is strictly non-exclusive.\n' +
    '9.1. Data is strictly necessary for the deal.\n');
  const got = new Set(check(dirty).issues.map((i) => JSON.stringify([i.check, i.level])));
  for (const want of [['thematic-break', 'fail'], ['list-punct', 'fail'],
    ['ampersand', 'warn'], ['banned-word', 'warn']]) {
    assert.ok(got.has(JSON.stringify(want)), JSON.stringify(want));
  }
  const r = check(dirty);
  assert.strictEqual(r.stats.breaks, 2, JSON.stringify(r.stats));
  assert.strictEqual(r.stats.listpunctuation, 2, JSON.stringify(r.stats));
  assert.strictEqual(r.stats.ampersands, 1, JSON.stringify(r.stats));   // URL & and compounds ignored
  assert.strictEqual(r.stats.banned, 2, JSON.stringify(r.stats));       // "strictly necessary" exempt
  assert.ok(!r.ok);

  const clean = ('# PARTNERSHIP AND PILOT AGREEMENT\n' +
    '\n' +
    '1.2. **Definitions:**\n' +
    '(a) "Affiliate" means any entity that controls a Party.\n' +
    '(b) "Wholesale Price" means List Price minus the discount.\n' +
    '\n' +
    '5.3. ALL TECHNOLOGY IS PROVIDED "AS IS."\n' +
    '5.4. See https://www.jetbrains.com/legal/#terms-and-agreements and M&A, R&D.\n' +
    '7.1. This relationship is non-exclusive.\n' +
    '9.1. Data is strictly necessary for the deal.\n' +
    '9.2. Use of Data is not required.\n' +
    '9.3. Each Party acts as an independent controller under applicable law.\n');
  const rc = check(clean);
  assert.deepStrictEqual(rc.issues, []);

  // matter fixture: the v. 20261015 Rev 2 excerpt the user corrected by hand
  const bad = fixture('gsi-rev2-excerpt.md');
  const good = fixture('gsi-rev2-clean.md');
  if (bad !== null && good !== null) {
    const gb = new Set(check(bad).issues.map((i) => JSON.stringify([i.check, i.level])));
    for (const want of [['thematic-break', 'fail'], ['list-punct', 'fail'],
      ['ampersand', 'warn'], ['banned-word', 'warn']]) {
      assert.ok(gb.has(JSON.stringify(want)), JSON.stringify(want));
    }
    assert.deepStrictEqual(check(good).issues, []);
  }
  console.log('demo ok');
  return 0;
}

function main(argv) {
  let doc = null, json = false, strict = false, runDemo = false;
  const bans = [];
  const fail = (msg) => {
    process.stderr.write(`style.js: error: ${msg}\n`);
    process.exit(2);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--strict') strict = true;
    else if (a === '--demo') runDemo = true;
    else if (a === '--ban') { if (i + 1 >= argv.length) fail('--ban needs WORD'); bans.push(argv[++i]); }
    else if (a === '--help' || a === '-h') {
      console.log('usage: style.js DOC [--json] [--strict] [--ban WORD]...');
      return 0;
    } else if (a.startsWith('-')) fail(`unrecognized arguments: ${a}`);
    else if (doc === null) doc = a;
    else fail(`unrecognized arguments: ${a}`);
  }
  if (runDemo) return demo();
  if (!doc) fail('need DOC (or --demo)');
  const res = check(read_text(doc), bans);
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    for (const it of res.issues) {
      console.log(`${it.level.toUpperCase().padEnd(4)} ${it.check.padEnd(14)} ` +
        `L${String(it.line).padEnd(4)} ${it.detail}`);
    }
    const stats = '{' + Object.entries(res.stats).map(([k, v]) => `'${k}': ${v}`).join(', ') + '}';
    console.log(`${res.ok ? 'style: OK' : 'style: FAIL'} ${stats}`);
  }
  return strict && !res.ok ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`error: ${e.message}\n`);
    process.exit(1);
  }
}

module.exports = { check };
