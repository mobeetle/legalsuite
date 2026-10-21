#!/usr/bin/env node
'use strict';
/* Document-integrity check for contracts and pleadings (stdlib only).

Deterministic checks on one document: clause numbering (gaps, duplicates),
internal cross-references that do not resolve, defined terms (duplicate,
unused, lowercase use, likely undefined, scope leak, overlap), `[●]` blanks
without a blanks schedule (a warning, not a blocker), and leftover drafting
notes. English and Czech conventions.

    structure.js DOC [--json] [--strict]
    structure.js --demo            # runnable self-check

Exit 0 normally; --strict exits 1 when any check fails (warnings never block).
Inputs: .txt, .md or .docx (accepted view).

Ceiling: line-based regexes, not a document model. Auto-numbered Word lists
carry no visible numbers in the text and are invisible here; in-clause
numbered lists that restart at 1. can look like duplicates.
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
  const fs = require('fs');
  read_text = (p) => {
    if (String(p).toLowerCase().endsWith('.docx')) {
      throw new Error(`cannot read .docx without ./doctext.js: ${p}`);
    }
    const s = fs.readFileSync(String(p), 'utf8');
    return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
  };
}

// NOTE: \b is ASCII-only in JS. Where Python relies on Unicode word
// boundaries next to Czech letters (OSŘ, Blanks-head ů, xref lookbehind,
// stem patterns), this port uses [\p{L}\p{N}_] lookarounds instead --
// identical semantics to Python's re on str. Pure-ASCII \b is kept as-is.
const W = '[\\p{L}\\p{N}_]';
const ROMAN = { I: 1, V: 5, X: 10, L: 50, C: 100 };
const ARTICLE_RE = new RegExp('^\\W*(?:Článek|Čl\\.|Article|Section|Artikel|Art\\.|Artículo|Artykuł)\\s+(\\d{1,3}|[IVXLC]+)\\b', 'u');
const CLAUSE_RE = /^[#*\s]*(?:(\d{1,3}(?:\.\d{1,3})+)\.?\s|(\d{1,3})[.)]\s)/;
const XREF_RE = new RegExp(
  `(?<!${W})(?:[Cc]lauses?|[Ss]ections?|[Aa]rticles?|čl\\.|článek|článku|článkem|článků|` +
  `odst\\.|odstavec|odstavce|odstavci|bod|bodu|bodě|` +
  `Artikel|[Aa]rt\\.|[Aa]bsatz|[Aa]bs\\.|[Zz]iffer|[Zz]iff\\.|alinéa|` +
  `[Aa]rtículos?|[Aa]partados?|[Cc]láusulas?|[Aa]rtykuł${W}*|ust\\.|pkt\\.?)\\s+(\\d{1,3}(?:\\.\\d{1,3})*|[IVXLC]+)\\b`, 'gu');
const SCHED_REF_RE = new RegExp(
  `(?<!${W})(?:Schedule|Annex|Appendix|Exhibit|Příloh[auyeo]${W}*|Anlagen?|Anhangs?|Anhänge|Annexes?|Anexos?|Załącznik${W}*)\\s+(?:(?:č\\.|nr\\.?|n°)\\s*)?(\\d{1,3}|[A-Z])(?!${W})`, 'gu');
const SCHED_HEAD_RE = new RegExp(
  `^\\W*(?:Schedule|Annex|Appendix|Exhibit|Příloha|Anlage|Anhang|Annexe|Anexo|Załącznik)\\s+(?:(?:č\\.|nr\\.?|n°)\\s*)?(\\d{1,3}|[A-Z])(?!${W})`, 'u');
const STATUTE_RE = new RegExp(
  `Sb\\.|zákon|(?<!${W})(?:OZ|ZOK|ZP|OSŘ|Act)(?!${W})|Regulation|Directive|GDPR|nařízení|směrnice`, 'u');
const STATUTE_TAIL = new RegExp(`§\\s*\\d+${W}*\\s*$`, 'u');
const DEF_RE = new RegExp(
  `["“„«]([^"“”„»\\n]{1,60})["”“»]\\s+(?:means|shall mean|znamená|se rozumí|bezeichnet|bedeutet|désigne|signifie|significa|oznacza)` +
  `|\\((?:(?:the|der|die|das|le|la|l['’]|les|el|los|las)\\s+)?["“„«]([^"“”„»\\n]{1,60})["”“»]\\)` +
  `|\\((?:dále (?:jen|také)\\s+(?:jako\\s+)?|(?:nachfolgend|im Folgenden)\\s+(?:auch\\s+)?|ci-après\\s+(?:dénommée?s?\\s+)?(?:le\\s+|la\\s+|l['’]|les\\s+)?|en adelante,?\\s+(?:el\\s+|la\\s+|los\\s+|las\\s+)?|dalej\\s+(?:jako\\s+|zwany\\s+|zwana\\s+)?)["“„«]([^"“”„»\\n]{1,60})["”“»]\\)`, 'gu');
const BLANK_RE = /\[●[^\]]*\]/g;
const BLANKS_HEAD_RE = new RegExp(`^\\W*(?:Blanks schedule|Seznam nevyplněných údajů|Blanks|Offene Punkte|Annexe des blancs|Anexo de blancos|Lista braków)(?!${W})`, 'iu');
const HEAD_RE = /^#{1,6}\s+(.*)$/;
const PART_RE = new RegExp(`^(Annex|Schedule|Appendix|Exhibit|Part|Anlage|Anhang|Annexe|Anexo|Załącznik)(?!${W})`, 'iu');
const NOTE_RE = /\[(?:Drafting note|Pozn\. k návrhu|Note de rédaction|Nota de redacción|Anmerkung|Uwaga):/g;
const TITLE_RE = /(?<![A-Za-z])[A-Z][a-z]+(?:\s+(?:of\s+)?[A-Z][a-z]+)*/g;
const QUOTED_RE = new RegExp(`["“„]([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][^"“”„\\n]{1,60})["”“]`, 'gu');
const _CZ_CHARS = new RegExp('[ěščřžůťďňĚŠČŘŽŮŤĎŇ]', 'u');
const STOP = new Set(('January February March April May June July August September October November ' +
  'December Monday Tuesday Wednesday Thursday Friday Saturday Sunday Czech ' +
  'Republic English Prague Praha Europe European Union EU Clause Section Article ' +
  'Schedule Annex Appendix Exhibit The This That If In On At By To For Any All Each No ' +
  'Where When Upon Under').split(' '));

function num(s) {
  if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
  const vals = [...s].map((c) => ROMAN[c]);   // subtractive roman: IV = 5 - 1
  return vals.reduce((t, v, i) => t + (i + 1 < vals.length && v < vals[i + 1] ? -v : v), 0);
}

function issue(check, level, line, detail) {
  return { check, level, line, detail };
}

function numbering(lines) {
  // Clause labels found + gap/duplicate issues, per parent level.
  const issues = [], labels = new Set(), seen = {};
  let art = null;
  lines.forEach((line, ix) => {
    const n = ix + 1;
    let parent, idx;
    let m = ARTICLE_RE.exec(line);
    if (m) {
      parent = '';
      idx = num(m[1]);
      art = String(idx);
      labels.add(art);
    } else {
      m = CLAUSE_RE.exec(line);
      if (!m) return;
      if (m[1]) {
        const dot = m[1].lastIndexOf('.');
        parent = m[1].slice(0, dot);
        idx = parseInt(m[1].slice(dot + 1), 10);
        labels.add(m[1]);
      } else {   // bare "N." restarts under each Článek / Article heading
        idx = parseInt(m[2], 10);
        parent = art !== null && art !== undefined ? 'art' + art : '';
        labels.add(String(idx));
        if (art !== null && art !== undefined) labels.add(`${art}.${idx}`);
      }
    }
    const got = seen[parent] || (seen[parent] = []);
    const label = parent.startsWith('art') ? `${parent.replace('art', 'Čl. ')}/${idx}`
      : (parent ? `${parent}.${idx}` : String(idx));
    if (got.includes(idx)) {
      issues.push(issue('numbering', 'fail', n, `duplicate clause number ${label}`));
    } else if (idx !== (got.length ? got[got.length - 1] : 0) + 1) {
      issues.push(issue('numbering', 'fail', n,
        `numbering gap before ${label} (previous ${got.length ? got[got.length - 1] : 'none'})`));
    }
    got.push(idx);
  });
  return [issues, labels];
}

function xrefs(lines, labels) {
  const heads = new Set();
  for (const l of lines) {
    const m = SCHED_HEAD_RE.exec(l);
    if (m) heads.add(m[1]);
  }
  const issues = [];
  let count = 0;
  lines.forEach((line, ix) => {
    const n = ix + 1;
    for (const m of line.matchAll(XREF_RE)) {
      const after = line.slice(m.index + m[0].length, m.index + m[0].length + 25);
      const before = line.slice(Math.max(0, m.index - 12), m.index);
      // ponytail: § refs and statute-tailed refs are statutory, never checked here
      if (STATUTE_RE.test(after) || STATUTE_TAIL.test(before)) continue;
      count++;
      let r = m[1];
      if (!/^[0-9]/.test(r[0])) r = String(num(r));
      if (!labels.has(r) && ![...labels].some((l) => l.endsWith('.' + r))) {
        issues.push(issue('xref', 'fail', n, `'${m[0]}' does not resolve`));
      }
    }
    for (const m of line.matchAll(SCHED_REF_RE)) {
      if (line.slice(0, m.index).replace(/^[ #*\t]+|[ #*\t]+$/g, '') === '') {
        continue;   // the heading itself
      }
      count++;
      if (!heads.has(m[1])) {
        issues.push(issue('xref', 'fail', n, `'${m[0]}' has no matching heading`));
      }
    }
  });
  return [issues, count];
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stem(term) {
  // Czech-tolerant pattern: each long word may inflect at its last 1-2 letters.
  const parts = term.split(/\s+/).map((w) => {
    const len = [...w].length;
    if (len >= 4) {
      const chars = [...w];
      const cut = len > 5 ? chars.slice(0, -2).join('') : chars.slice(0, -1).join('');
      return escapeRegExp(cut) + `${W}*`;
    }
    return escapeRegExp(w);
  });
  return `(?<!${W})` + parts.join('\\s+') + `(?!${W})`;
}

function parts(lines) {
  // Per-line schedule label: the heading text when a heading opens an annex
  // or schedule, '' otherwise (general body). A section heading resets to ''.
  let cur = '';
  const out = [];
  for (const line of lines) {
    const m = HEAD_RE.exec(line);
    if (m) {
      const text = m[1].trim();
      cur = PART_RE.test(text) ? text : '';
    }
    out.push(cur);
  }
  return out;
}

function partAt(pmap, text, pos) {
  const n = (text.slice(0, pos).match(/\n/g) || []).length;
  return n >= 0 && n < pmap.length ? pmap[n] : '';
}

function overlaps(defs) {
  // Whole-word prefix pairs (Referral Commission / Referral Commission
  // Percentage): one concept, one term.
  const out = [], terms = [...defs.keys()];
  for (let i = 0; i < terms.length; i++) {
    for (let j = i + 1; j < terms.length; j++) {
      const a = terms[i], b = terms[j];
      if (b.toLowerCase().startsWith(a.toLowerCase() + ' ') ||
          a.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
        out.push([a, b]);
      }
    }
  }
  return out;
}

function definitions(text, lines) {
  const issues = [], defs = new Map();
  const lineOf = (pos) => (text.slice(0, pos).match(/\n/g) || []).length + 1;
  const pmap = parts(lines);
  for (const m of text.matchAll(DEF_RE)) {
    const term = (m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3]).trim();
    if (defs.has(term)) {
      issues.push(issue('definitions', 'fail', lineOf(m.index), `'${term}' defined twice`));
      continue;
    }
    defs.set(term, m.index + m[0].length);
  }
  for (const [term, end] of defs) {
    const rest = text.slice(end);
    if (!new RegExp(stem(term), 'u').test(rest)) {
      issues.push(issue('definitions', 'warn', lineOf(end), `'${term}' defined but never used`));
    }
    if (term.length > 1 && term[0] === term[0].toUpperCase() && term[0] !== term[0].toLowerCase() &&
        term !== term.toUpperCase()) {
      const low = [...rest.matchAll(new RegExp(`(?<!${W})` + escapeRegExp(term.toLowerCase()) + `(?!${W})`, 'gu'))].length;
      if (low) {
        issues.push(issue('definitions', 'warn', lineOf(end),
          `'${term}' used in lowercase ${low}x`));
      }
    }
    const usedIn = [...rest.matchAll(new RegExp(stem(term), 'gu'))].map((m) => partAt(pmap, text, end + m.index));
    if (usedIn.length && usedIn.every(Boolean) && new Set(usedIn).size === 1 &&
        !partAt(pmap, text, end)) {
      issues.push(issue('definitions', 'warn', lineOf(end),
        `'${term}' used only in '${usedIn[0]}'; move the definition to that schedule`));
    }
  }
  for (const [a, b] of overlaps(defs)) {
    issues.push(issue('definitions', 'warn', lineOf(defs.get(b)),
      `'${b}' overlaps '${a}'; use one term`));
  }
  issues.push(...undefinedTerms(text, lines, defs));
  return [issues, defs];
}

function undefinedTerms(text, lines, defs) {
  // Likely defined terms used without a definition (warn, capped at 20).
  const seen = new Map(), first = new Map();
  if (_CZ_CHARS.test(text)) {
    // ponytail: Czech capitalises less predictably -- only quoted capitalised terms count
    for (const m of text.matchAll(QUOTED_RE)) {
      const t = m[1].trim();
      if (!defs.has(t)) {
        seen.set(t, [...text.matchAll(new RegExp(stem(t), 'gu'))].length);
        if (!first.has(t)) first.set(t, (text.slice(0, m.index).match(/\n/g) || []).length + 1);
      }
    }
  } else {
    lines.forEach((line, ix) => {
      const n = ix + 1;
      const s = line.trim();
      if (s.length < 60 && !/[.;,]$/.test(s)) return;   // headings and titles
      for (const m of line.matchAll(TITLE_RE)) {
        const pre = line.slice(0, m.index).replace(/\s+$/, '');
        const words = m[0].split(/\s+/);
        while (words.length && STOP.has(words[0])) words.shift();   // "The Recipient" -> "Recipient"
        const t = words.join(' ');
        if (!t || !pre || /[.!?:(|"“„-]$/.test(pre) ||
            t.split(/\s+/).every((w) => STOP.has(w)) ||
            [...defs.keys()].some((d) => t.startsWith(d))) {
          continue;
        }
        seen.set(t, (seen.get(t) || 0) + 1);
        if (!first.has(t)) first.set(t, n);
      }
    });
  }
  const hits = [...seen.entries()].sort((a, b) => b[1] - a[1])
    .filter(([, c]) => c >= 2).slice(0, 20).map(([t]) => t);
  return hits.map((t) => issue('definitions', 'warn', first.get(t),
    `'${t}' looks like a defined term but has no definition`));
}

function check(text) {
  const lines = text.split('\n');
  const [numIssues, labels] = numbering(lines);
  const [xi, nx] = xrefs(lines, labels);
  const [di, defs] = definitions(text, lines);
  const issues = [...numIssues, ...xi, ...di];
  const blanks = [];
  lines.forEach((l, ix) => {
    for (const m of l.matchAll(BLANK_RE)) blanks.push([ix + 1, m[0]]);
  });
  for (const [n, b] of blanks) issues.push(issue('blanks', 'warn', n, `blank ${b}`));
  if (blanks.length && !lines.some((l) => BLANKS_HEAD_RE.test(l))) {
    issues.push(issue('blanks', 'warn', blanks[0][0], 'blanks without schedule'));
  }
  const notes = [];
  lines.forEach((l, ix) => {
    for (const _ of l.matchAll(NOTE_RE)) notes.push(ix + 1);
  });
  if (notes.length) {
    issues.push(issue('notes', 'warn', notes[0],
      `${notes.length} drafting note(s) -- annotated version, not clean`));
  }
  return {
    ok: !issues.some((i) => i.level === 'fail'),
    issues,
    stats: {
      clauses: labels.size, definitions: defs.size, xrefs: nx,
      blanks: blanks.length, notes: notes.length,
    },
  };
}

function demo() {
  const clean = ('1. Definitions\n' +
    '1.1 Acme s.r.o. (the "Discloser") and Beta a.s. (the "Recipient") agree as follows.\n' +
    '1.2 "Confidential Information" means any information disclosed by the Discloser.\n' +
    '1.3 The Recipient shall keep Confidential Information secret as set out in clause 2.1.\n' +
    '2. Obligations\n' +
    '2.1 The Recipient shall comply with Schedule 1 and Section 5 of the Act.\n' +
    'Schedule 1 Security\n');
  const r = check(clean);
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.issues, []);
  assert.deepStrictEqual(r.stats, { clauses: 6, definitions: 3, xrefs: 2, blanks: 0, notes: 0 });

  const dirty = ('1. Definitions\n' +
    '1.1 "Confidential Information" means any information marked as such.\n' +
    '1.3 "Term" means three years. "Term" means five years.\n' +
    '1.3 "Fee" means [● amount] payable to the Provider under the Master Agreement.\n' +
    '2. The Recipient shall protect confidential information under clause 9.4 and the ' +
    'Master Agreement.\n' +
    '[Drafting note: check Term.]\n');
  const got = new Set(check(dirty).issues.map((i) => JSON.stringify([i.check, i.level, i.detail])));
  for (const want of [['numbering', 'fail', 'numbering gap before 1.3 (previous 1)'],
      ['numbering', 'fail', 'duplicate clause number 1.3'],
      ['xref', 'fail', "'clause 9.4' does not resolve"],
      ['definitions', 'fail', "'Term' defined twice"],
      ['definitions', 'warn', "'Fee' defined but never used"],
      ['definitions', 'warn', "'Confidential Information' used in lowercase 1x"],
      ['definitions', 'warn', "'Master Agreement' looks like a defined term but has no definition"],
      ['blanks', 'warn', 'blank [● amount]'],
      ['blanks', 'warn', 'blanks without schedule'],
      ['notes', 'warn', '1 drafting note(s) -- annotated version, not clean']]) {
    assert.ok(got.has(JSON.stringify(want)), JSON.stringify(want));
  }

  const cz = ('Článek I\nSmluvní strany\n' +
    '1. Společnost Alfa (dále jen „Prodávající“) a Beta (dále jen „Kupující“).\n' +
    '2. Prodávající prodává Kupujícímu zboží podle čl. II odst. 1 a Přílohy č. 1.\n' +
    'Článek II\nCena\n' +
    '1. Kupující zaplatí cenu [●] podle § 2 odst. 3 OZ a odst. 4 zákona o DPH.\n' +
    '3. Kupující dále postupuje podle čl. IV a Přílohy č. 2.\n' +
    'Příloha č. 1 Specifikace\n');
  const rcz = check(cz);
  const gotCz = new Set(rcz.issues.map((i) => JSON.stringify([i.check, i.detail])));
  assert.deepStrictEqual(gotCz, new Set([
    ['numbering', 'numbering gap before Čl. 2/3 (previous 1)'],
    ['xref', "'čl. IV' does not resolve"],
    ['xref', "'Přílohy č. 2' has no matching heading"],
    ['blanks', 'blank [●]'], ['blanks', 'blanks without schedule'],
  ].map((x) => JSON.stringify(x))));
  assert.strictEqual(check(cz + 'Seznam nevyplněných údajů\n').stats.blanks, 1);

  const deFr = ('Artikel 1\n' +
    '1.1 Alfa GmbH (nachfolgend „Verkäufer“) und Beta SAS (ci-après «Acheteur»).\n' +
    '1.2 „Vertrauliche Informationen“ bezeichnet alle Unterlagen gemäss Ziff. 1.1 und Anlage 1.\n' +
    '1.3 Verkäufer liefert an Acheteur Vertrauliche Informationen nach Art. 5 und Annexe 2.\n' +
    '[Anmerkung: prüfen]\n' +
    'Anlage 1 Spezifikation\n');
  const rdf = check(deFr);
  const gotDf = new Set(rdf.issues.map((i) => JSON.stringify([i.check, i.detail])));
  assert.ok(gotDf.has(JSON.stringify(['xref', "'Art. 5' does not resolve"])), JSON.stringify([...gotDf]));
  assert.ok(gotDf.has(JSON.stringify(['xref', "'Annexe 2' has no matching heading"])), JSON.stringify([...gotDf]));
  assert.ok(gotDf.has(JSON.stringify(['notes', '1 drafting note(s) -- annotated version, not clean'])), JSON.stringify([...gotDf]));
  assert.strictEqual(rdf.stats.definitions, 3);

  // matter fixture: pathway terms in the general definitions, near-duplicate
  // definitions, and undefined capitalised terms (v. 20261015 Rev 2)
  const terms = path.join(__dirname, 'fixtures', 'gsi-rev2-terms.md');
  if (fs.existsSync(terms)) {
    const details = check(fs.readFileSync(terms, 'utf8')).issues
      .filter((i) => i.check === 'definitions').map((i) => i.detail);
    assert.ok(details.some((d) => d.includes("used only in 'Annex B")), details);
    assert.ok(details.some((d) => d.includes('overlaps')), details);
    assert.ok(details.some((d) => d.includes('no definition')), details);
  }
  console.log('demo ok');
  return 0;
}

function main(argv) {
  let doc = null, json = false, strict = false, runDemo = false;
  const fail = (msg) => {
    process.stderr.write(`structure.js: error: ${msg}\n`);
    process.exit(2);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--strict') strict = true;
    else if (a === '--demo') runDemo = true;
    else if (a === '--help' || a === '-h') {
      console.log('usage: structure.js DOC [--json] [--strict]');
      return 0;
    } else if (a.startsWith('-')) fail(`unrecognized arguments: ${a}`);
    else if (doc === null) doc = a;
    else fail(`unrecognized arguments: ${a}`);
  }
  if (runDemo) return demo();
  if (!doc) fail('need DOC (or --demo)');
  const res = check(read_text(doc));
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    for (const it of res.issues) {
      console.log(`${it.level.toUpperCase().padEnd(4)} ${it.check.padEnd(11)} L${String(it.line).padEnd(4)} ${it.detail}`);
    }
    const stats = '{' + Object.entries(res.stats).map(([k, v]) => `'${k}': ${v}`).join(', ') + '}';
    console.log(`${res.ok ? 'structure: OK' : 'structure: FAIL'} ${stats}`);
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

module.exports = { check, numbering, xrefs, definitions };
