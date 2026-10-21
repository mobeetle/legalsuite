#!/usr/bin/env node
'use strict';
/* Link check for legal documents: are the incorporated URLs live? (stdlib only)
 *
 * A URL a document incorporates by reference -- product terms, a policy, an
 * authority's portal -- is an authority in substance, so it is checked like
 * one. `links.js` extracts every http(s) URL and, unless --no-net, fetches each
 * and reports its status: live, redirecting (the shipped URL is stale) or dead.
 *
 *     links.js DOC [--json] [--strict] [--no-net] [--timeout SECONDS] [--demo]
 *
 * Exit 0 normally; --strict exits 1 when any link fails (unreachable is a warn).
 * Inputs: .txt, .md or .docx (accepted view).
 *
 * Ceiling: a reachable URL is not a correct one -- this proves the address
 * resolves, not that the page says what the document claims. Read the page
 * (ground.md) and record the verified URL as a ledger row.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

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

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;
const TRAIL = /[.,;:]+$/;
const UA = 'legalsuite-link-check/1.0';

function findUrls(text) {
  const out = [], seen = new Set();
  String(text).split('\n').forEach((line, ix) => {
    const n = ix + 1;
    for (const m of line.matchAll(URL_RE)) {
      const url = m[0].replace(TRAIL, '');
      if (!seen.has(url)) { seen.add(url); out.push([n, url]); }
    }
  });
  return out;
}

function statusIssue(line, url, code, final) {
  if (code === null || code === undefined) {
    return { check: 'unreachable', level: 'warn', line,
      detail: `${url} could not be fetched -- not checked against the live page` };
  }
  if (code >= 200 && code < 300) {
    if (final.replace(/\/+$/, '') !== url.replace(/\/+$/, '')) {
      return { check: 'redirect', level: 'warn', line,
        detail: `${url} redirects to ${final} -- use the final URL` };
    }
    return null;
  }
  return { check: 'dead-link', level: 'fail', line, detail: `${url} -> HTTP ${code}` };
}

function oneRequest(url, method, timeout, depth) {
  if (depth === undefined) depth = 0;
  return new Promise((resolve) => {
    let lib, parsed;
    try { parsed = new URL(url); lib = parsed.protocol === 'http:' ? http : https; }
    catch { return resolve({ code: null, final: url }); }
    const req = lib.request(url, { method, headers: { 'User-Agent': UA } }, (res) => {
      const status = res.statusCode;
      res.resume();
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && depth < 5) {
        let loc;
        try { loc = new URL(res.headers.location, url).toString(); }
        catch { loc = res.headers.location; }
        return resolve(oneRequest(loc, method, timeout, depth + 1));
      }
      resolve({ code: status, final: url });
    });
    req.on('error', () => resolve({ code: null, final: url }));
    req.setTimeout(timeout * 1000, () => { req.destroy(); resolve({ code: null, final: url }); });
    req.end();
  });
}

async function probe(url, timeout) {
  const r = await oneRequest(url, 'HEAD', timeout);
  if (r.code === 403 || r.code === 405 || r.code === 501) return oneRequest(url, 'GET', timeout);
  return r;
}

async function check(text, opts) {
  const fetch = !opts || opts.fetch !== false;
  const timeout = (opts && opts.timeout) || 10;
  const pairs = findUrls(text);
  const stats = { links: pairs.length, live: 0, redirected: 0, failed: 0, unreachable: 0 };
  const issues = [];
  if (fetch) {
    for (const [line, url] of pairs) {
      const { code, final } = await probe(url, timeout);
      const it = statusIssue(line, url, code, final);
      if (it === null) stats.live++;
      else {
        stats[{ redirect: 'redirected', 'dead-link': 'failed', unreachable: 'unreachable' }[it.check]]++;
        issues.push(it);
      }
    }
  }
  return { ok: !issues.some((i) => i.level === 'fail'), issues, stats, urls: pairs.map((p) => p[1]) };
}

function fixture(name) {
  const p = path.join(__dirname, 'fixtures', name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

async function demo() {
  const bad = 'See https://a.example/x. and https://a.example/x, then https://b.example/y';
  assert.deepStrictEqual(findUrls(bad),
    [[1, 'https://a.example/x'], [1, 'https://b.example/y']]);
  assert.strictEqual(statusIssue(0, 'u', 200, 'u'), null);
  assert.strictEqual(statusIssue(0, 'u', 200, 'u2').check, 'redirect');
  assert.strictEqual(statusIssue(0, 'u', 404, 'u').level, 'fail');
  assert.strictEqual(statusIssue(0, 'u', null, 'u').level, 'warn');
  const r = await check(bad, { fetch: false });
  assert.ok(r.ok && r.stats.links === 2 && r.urls.length === 2);
  // matter fixture: the wrong JetBrains URL the user fixed by hand
  const badfix = fixture('gsi-rev2-excerpt.md');
  const goodfix = fixture('gsi-rev2-clean.md');
  if (badfix !== null && goodfix !== null) {
    assert.ok((await check(badfix, { fetch: false })).urls
      .includes('https://www.jetbrains.com/legal/docs/terms/'));
    assert.ok((await check(goodfix, { fetch: false })).urls
      .includes('https://www.jetbrains.com/legal/#terms-and-agreements'));
  }
  console.log('demo ok');
  return 0;
}

async function main(argv) {
  let doc = null, json = false, strict = false, noNet = false, runDemo = false, timeout = 10;
  const fail = (msg) => {
    process.stderr.write(`links.js: error: ${msg}\n`);
    process.exit(2);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--strict') strict = true;
    else if (a === '--no-net') noNet = true;
    else if (a === '--demo') runDemo = true;
    else if (a === '--timeout') { if (i + 1 >= argv.length) fail('--timeout needs SECONDS'); timeout = parseFloat(argv[++i]); }
    else if (a === '--help' || a === '-h') {
      console.log('usage: links.js DOC [--json] [--strict] [--no-net] [--timeout SECONDS]');
      return 0;
    } else if (a.startsWith('-')) fail(`unrecognized arguments: ${a}`);
    else if (doc === null) doc = a;
    else fail(`unrecognized arguments: ${a}`);
  }
  if (runDemo) return demo();
  if (!doc) fail('need DOC (or --demo)');
  const res = await check(read_text(doc), { fetch: !noNet, timeout });
  if (json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    if (noNet) for (const u of res.urls) console.log(u);
    for (const it of res.issues) {
      console.log(`${it.level.toUpperCase().padEnd(4)} ${it.check.padEnd(12)} ` +
        `L${String(it.line).padEnd(4)} ${it.detail}`);
    }
    const stats = '{' + Object.entries(res.stats).map(([k, v]) => `'${k}': ${v}`).join(', ') + '}';
    console.log(`${res.ok ? 'links: OK' : 'links: FAIL'} ${stats}`);
  }
  return strict && !res.ok ? 1 : 0;
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => { process.exitCode = code; })
    .catch((e) => { process.stderr.write(`error: ${e.message}\n`); process.exitCode = 1; });
}

module.exports = { check, findUrls, statusIssue };
