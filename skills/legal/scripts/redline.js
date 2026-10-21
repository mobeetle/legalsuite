#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const CONTENT_TYPES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
  "</Types>";
const ROOT_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
  "</Relationships>";

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeXml(s).replace(/"/g, "&quot;");
}
function unescapeXml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
function coreXml(creator = "legalsuite", date = "") {
  const d = date ? `<dcterms:created xsi:type="dcterms:W3CDTF">${escapeXml(date)}</dcterms:created>` : "";
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:creator>${escapeXml(creator)}</dc:creator>` +
    `<cp:lastModifiedBy>${escapeXml(creator)}</cp:lastModifiedBy>${d}` +
    "</cp:coreProperties>";
}

const CRC_TABLE = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function buildZip(files) {
  const chunks = [], central = [];
  let offset = 0;
  for (const f of files) {
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, "utf-8");
    const name = Buffer.from(f.name, "utf-8");
    const crc = crc32(data), comp = zlib.deflateRawSync(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    chunks.push(lh, name, comp);
    central.push({ name, crc, compLen: comp.length, len: data.length, offset });
    offset += lh.length + name.length + comp.length;
  }
  const cdStart = offset, cdParts = [];
  for (const c of central) {
    const h = Buffer.alloc(46);
    h.writeUInt32LE(0x02014b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(20, 6);
    h.writeUInt16LE(0, 8); h.writeUInt16LE(8, 10); h.writeUInt16LE(0, 12); h.writeUInt16LE(0, 14);
    h.writeUInt32LE(c.crc, 16); h.writeUInt32LE(c.compLen, 20); h.writeUInt32LE(c.len, 24);
    h.writeUInt16LE(c.name.length, 28); h.writeUInt16LE(0, 30); h.writeUInt16LE(0, 32);
    h.writeUInt16LE(0, 34); h.writeUInt16LE(0, 36); h.writeUInt32LE(0, 38); h.writeUInt32LE(c.offset, 42);
    cdParts.push(h, c.name);
  }
  const cd = Buffer.concat(cdParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8); eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(cdStart, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, cd, eocd]);
}
function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip file");
  const count = buf.readUInt16LE(eocd + 10), cdOff = buf.readUInt32LE(eocd + 16);
  const parts = new Map();
  let p = cdOff;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad zip central directory");
    const method = buf.readUInt16LE(p + 10), compLen = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), comLen = buf.readUInt16LE(p + 32);
    const name = buf.toString("utf-8", p + 46, p + 46 + nameLen);
    const lhOff = buf.readUInt32LE(p + 42);
    const lnLen = buf.readUInt16LE(lhOff + 26), leLen = buf.readUInt16LE(lhOff + 28);
    const start = lhOff + 30 + lnLen + leLen;
    const comp = buf.subarray(start, start + compLen);
    parts.set(name, method === 8 ? zlib.inflateRawSync(comp) : Buffer.from(comp));
    p += 46 + nameLen + extraLen + comLen;
  }
  return parts;
}
function docxText(data) {
  const xml = Buffer.isBuffer(data) ? data.toString("utf-8") : data;
  const paras = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
  const out = [];
  let carry = "";
  for (const pXml of paras) {
    const ppr = pXml.match(/<w:pPr[\s>][\s\S]*?<\/w:pPr>/);
    const delMark = ppr && /<w:del[\s/>]/.test(ppr[0]);
    let text = "";
    const re = /<w:(t|delText|tab|br|cr)\b[^>]*\/?>(?:([^<]*)<\/w:\1>)?/g;
    let m;
    while ((m = re.exec(pXml)) !== null) {
      if (m[1] === "t") text += unescapeXml(m[2] || "");
      else if (m[1] === "tab") text += "\t";
      else if (m[1] === "br" || m[1] === "cr") text += "\n";
    }
    text = carry + text;
    if (delMark) { carry = text; continue; }
    out.push(text);
    carry = "";
  }
  if (carry) out.push(carry);
  return out.join("\n");
}

let doctext = null;
try { doctext = require("./doctext.js"); } catch (e) { doctext = null; }

function readText(p) {
  if (doctext) {
    const fn = doctext.read_text || doctext.readText;
    if (typeof fn === "function") return fn(p);
  }
  if (String(p).toLowerCase().endsWith(".docx")) {
    const parts = readZip(fs.readFileSync(p));
    const doc = parts.get("word/document.xml");
    if (!doc) throw new Error("word/document.xml missing");
    return docxText(doc);
  }
  return fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, "");
}
function inlineWriteDocx(outPath, bodyXml, creator, date) {
  const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:document xmlns:w="${W_NS}"><w:body>${bodyXml}</w:body></w:document>`;
  fs.writeFileSync(outPath, buildZip([
    { name: "[Content_Types].xml", data: CONTENT_TYPES },
    { name: "_rels/.rels", data: ROOT_RELS },
    { name: "word/document.xml", data: doc },
    { name: "docProps/core.xml", data: coreXml(creator, date) },
  ]));
}
function writeDocxFile(outPath, bodyXml, creator = "legalsuite", date = "") {
  if (doctext) {
    const fn = doctext.write_docx || doctext.writeDocx;
    if (typeof fn === "function") {
      try {
        if (fn.length >= 4) { fn(outPath, bodyXml, undefined, creator, date); return; }
        if (fn.length === 3) { fn(outPath, bodyXml, { creator, date }); return; }
        fn(outPath, bodyXml);
        return;
      } catch (e) { /* fall through to inline writer */ }
    }
  }
  inlineWriteDocx(outPath, bodyXml, creator, date);
}

// --- SequenceMatcher (difflib, autojunk=False, no junk) ---
function eqElt(x, y) { return x === y; }
class SeqMatcher {
  constructor(a, b) {
    this.a = a; this.b = b;
    this.b2j = new Map();
    for (let j = 0; j < b.length; j++) {
      const k = b[j];
      if (!this.b2j.has(k)) this.b2j.set(k, []);
      this.b2j.get(k).push(j);
    }
  }
  longestMatch(alo, ahi, blo, bhi) {
    const { a } = this;
    let besti = alo, bestj = blo, bestsize = 0;
    let j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const js = this.b2j.get(a[i]) || [];
      const newj2len = new Map();
      for (const j of js) {
        if (j < blo) continue;
        if (j >= bhi) break;
        const k = (j2len.get(j - 1) || 0) + 1;
        newj2len.set(j, k);
        if (k > bestsize) { besti = i - k + 1; bestj = j - k + 1; bestsize = k; }
      }
      j2len = newj2len;
    }
    while (besti > alo && bestj > blo && eqElt(a[besti - 1], this.b[besti - besti + bestj - 1])) { besti--; bestj--; bestsize++; }
    while (besti + bestsize < ahi && bestj + bestsize < bhi &&
      eqElt(a[besti + bestsize], this.b[bestj + bestsize])) bestsize++;
    return [besti, bestj, bestsize];
  }
  matchingBlocks() {
    const matches = [];
    const queue = [[0, this.a.length, 0, this.b.length]];
    while (queue.length) {
      const [alo, ahi, blo, bhi] = queue.pop();
      const [i, j, k] = this.longestMatch(alo, ahi, blo, bhi);
      if (k) {
        if (alo < i && blo < j) queue.push([alo, i, blo, j]);
        matches.push([i, j, k]);
        if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
      }
    }
    matches.sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]));
    let i1 = 0, j1 = 0, k1 = 0;
    const out = [];
    for (const [i2, j2, k2] of matches) {
      if (i1 + k1 === i2 && j1 + k1 === j2) k1 += k2;
      else {
        if (k1) out.push([i1, j1, k1]);
        i1 = i2; j1 = j2; k1 = k2;
      }
    }
    if (k1) out.push([i1, j1, k1]);
    out.push([this.a.length, this.b.length, 0]);
    return out;
  }
  opcodes() {
    const ops = [];
    let i = 0, j = 0;
    for (const [ai, bj, size] of this.matchingBlocks()) {
      let tag = null;
      if (i < ai && j < bj) tag = "replace";
      else if (i < ai) tag = "delete";
      else if (j < bj) tag = "insert";
      if (tag) ops.push([tag, i, ai, j, bj]);
      i = ai + size; j = bj + size;
      if (size) ops.push(["equal", ai, i, bj, j]);
    }
    return ops;
  }
}

const MARK_RE = /\[(DELETE|ADD):[ \t]?(.*?)\]/gs;

function Ctx(author, date) {
  return { author: escapeAttr(author), date, nextId: 1 };
}
function ctxAttrs(ctx) {
  return `w:id="${ctx.nextId++}" w:author="${ctx.author}" w:date="${ctx.date}"`;
}
function runXml(kind, text) {
  const tag = kind === "del" ? "w:delText" : "w:t";
  const pieces = text.split("\t").map((p) =>
    p ? `<${tag} xml:space="preserve">${escapeXml(p.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ""))}</${tag}>` : "");
  return `<w:r>${pieces.join("<w:tab/>")}</w:r>`;
}
function paraXml(runs, mark, ctx, pprInner = "") {
  let ppr = "";
  if (mark && pprInner) ppr = `<w:pPr>${pprInner}<w:rPr><w:${mark} ${ctxAttrs(ctx)}/></w:rPr></w:pPr>`;
  else if (mark) ppr = `<w:pPr><w:rPr><w:${mark} ${ctxAttrs(ctx)}/></w:rPr></w:pPr>`;
  else if (pprInner) ppr = `<w:pPr>${pprInner}</w:pPr>`;
  const body = runs.map(([kind, text]) => {
    const r = runXml(kind, text);
    return kind === "plain" ? r : `<w:${kind} ${ctxAttrs(ctx)}>${r}</w:${kind}>`;
  }).join("");
  return `<w:p>${ppr}${body}</w:p>`;
}
function docxPprs(p) {
  if (!p || !String(p).toLowerCase().endsWith(".docx")) return [];
  try {
    const parts = readZip(fs.readFileSync(p));
    const doc = (parts.get("word/document.xml") || Buffer.alloc(0)).toString("utf-8");
    const out = [];
    for (const pm of doc.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)) {
      const m = pm[1].match(/<w:pPr(?:\s[^>]*)?>([\s\S]*?)<\/w:pPr>/);
      out.push(m ? m[1].replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, "") : "");
    }
    return out;
  } catch (e) { return []; }
}
function wordDiff(a, b) {
  const ta = a.match(/\s+|\S+/g) || [], tb = b.match(/\s+|\S+/g) || [];
  const runs = [];
  for (const [tag, i1, i2, j1, j2] of new SeqMatcher(ta, tb).opcodes()) {
    if (tag === "equal") { runs.push(["plain", ta.slice(i1, i2).join("")]); continue; }
    if (i2 > i1) runs.push(["del", ta.slice(i1, i2).join("")]);
    if (j2 > j1) runs.push(["ins", tb.slice(j1, j2).join("")]);
  }
  return runs;
}
function splitLines(t) {
  if (t === "") return [];
  const parts = t.split(/\r\n|\r|\n/);
  if (/(?:\r\n|\r|\n)$/.test(t)) parts.pop();
  return parts;
}
function compareParas(original, revised, origPprs = []) {
  const a = splitLines(original), b = splitLines(revised);
  const pprAt = (idx) => (idx >= 0 && idx < origPprs.length ? origPprs[idx] : "");
  const out = [];
  for (const [tag, i1, i2, j1, j2] of new SeqMatcher(a, b).opcodes()) {
    if (tag === "equal") {
      a.slice(i1, i2).forEach((p, k) => out.push([[["plain", p]], null, pprAt(i1 + k)]));
      continue;
    }
    const old = a.slice(i1, i2), nw = b.slice(j1, j2);
    const n = Math.min(old.length, nw.length);
    for (let k = 0; k < n; k++) out.push([wordDiff(old[k], nw[k]), null, pprAt(i1 + k)]);
    old.slice(n).forEach((o, k) => out.push([o ? [["del", o]] : [], "del", pprAt(i1 + n + k)]));
    for (const x of nw.slice(n)) out.push([x ? [["ins", x]] : [], "ins", ""]);
  }
  return out;
}
function markupParas(text) {
  const segs = [];
  let pos = 0;
  MARK_RE.lastIndex = 0;
  let m;
  while ((m = MARK_RE.exec(text)) !== null) {
    segs.push(["plain", text.slice(pos, m.index)]);
    segs.push([m[1] === "DELETE" ? "del" : "ins", m[2]]);
    pos = m.index + m[0].length;
  }
  segs.push(["plain", text.slice(pos)]);
  const paras = [[]], marks = [];
  for (const [kind, s] of segs) {
    const lines = s.split("\n");
    lines.forEach((line, k) => {
      if (k) { marks.push(kind === "plain" ? null : kind); paras.push([]); }
      if (line) paras[paras.length - 1].push([kind, line]);
    });
  }
  while (marks.length < paras.length) marks.push(null);
  return paras.map((p, i) => [p, marks[i]]);
}
function writeRedline(paras, out, author, date) {
  const ctx = Ctx(author, date);
  const body = paras.map((it) => paraXml(it[0], it[1], ctx, it[2] || "")).join("");
  writeDocxFile(String(out), body, author, date);
  return {
    out: String(out),
    insertions: (body.match(/<w:ins\b/g) || []).length,
    deletions: (body.match(/<w:del\b/g) || []).length,
    paragraphs: paras.length,
  };
}
function accepted(markup) {
  MARK_RE.lastIndex = 0;
  return markup.replace(MARK_RE, (m, k, t) => (k === "ADD" ? t : ""));
}

function demo() {
  const assert = require("assert");
  const orig = "Článek 1\nKupující zaplatí 100 Kč do 30 dnů.\nTento odstavec zmizí.\n\tKonec & <tag>.";
  const rev = "Článek 1\nKupující zaplatí 120 Kč do 14 dnů.\n\tKonec & <tag>.\nNový „odstavec“ navíc.";
  const date = "2026-10-10T00:00:00Z";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "redline-"));
  try {
    const out = path.join(tmp, "cmp.docx");
    const s = writeRedline(compareParas(orig, rev), out, "Jan <Novák>", date);
    assert.deepStrictEqual(s, { out, insertions: 4, deletions: 4, paragraphs: 5 });
    const doc = readZip(fs.readFileSync(out)).get("word/document.xml").toString("utf-8");
    assert.strictEqual((doc.match(/<w:ins /g) || []).length, 4);
    assert.strictEqual((doc.match(/<w:del /g) || []).length, 4);
    const ids = [...doc.matchAll(/w:id="(\d+)"/g)].map((x) => x[1]);
    assert.strictEqual(ids.length, 8);
    assert.strictEqual(new Set(ids).size, 8);
    assert.ok(doc.includes('w:author="Jan &lt;Novák&gt;"'), doc);
    assert.ok(doc.includes('<w:delText xml:space="preserve">100</w:delText>'), doc);
    assert.strictEqual(readText(out), rev, JSON.stringify(readText(out)));

    const mk = "Nájemce [DELETE: nesmí][ADD: smí] dům\npodnajmout.[DELETE:  Bez\nvýjimky.]\nKonec[ADD: \nNová věta.]";
    const out2 = path.join(tmp, "mk.docx");
    const s2 = writeRedline(markupParas(mk), out2, "legalsuite", date);
    assert.deepStrictEqual([s2.insertions, s2.deletions, s2.paragraphs], [3, 4, 5]);
    assert.strictEqual(readText(out2), accepted(mk));
    assert.strictEqual(readText(out2), "Nájemce smí dům\npodnajmout.\nKonec\nNová věta.", JSON.stringify(readText(out2)));
    assert.ok(readZip(fs.readFileSync(out2)).get("docProps/core.xml").toString("utf-8").includes("legalsuite"));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log("demo ok");
  return 0;
}

function usage() {
  return "usage: redline.js ORIGINAL REVISED -o OUT.docx [--author NAME] [--date ISO8601] [--json]\n       redline.js --markup FILE -o OUT.docx [--author NAME] [--date ISO8601] [--json]\n       redline.js --demo";
}

function main(argv) {
  let original = null, revised = null, markup = null, out = null;
  let author = "legalsuite", date = null, json = false, isDemo = false;
  const err = (m) => { console.error(`redline.js: error: ${m}\n${usage()}`); process.exit(2); };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    const need = (k) => { if (++i >= argv.length) err(`${k} needs a value`); return argv[i]; };
    if (t === "--json") json = true;
    else if (t === "--demo") isDemo = true;
    else if (t === "--markup") markup = need("--markup");
    else if (t === "-o" || t === "--out") out = need(t);
    else if (t === "--author") author = need("--author");
    else if (t === "--date") date = need("--date");
    else if (t === "-h" || t === "--help") { console.log(usage()); return 0; }
    else if (t.startsWith("-")) err(`unknown option ${t}`);
    else if (original === null) original = t;
    else if (revised === null) revised = t;
    else err(`unexpected argument ${t}`);
  }
  if (isDemo) return demo();
  if (!out || !(markup || (original && revised)))
    err("need ORIGINAL REVISED -o OUT.docx, or --markup FILE -o OUT.docx (or --demo)");
  date = date || new Date().toISOString().replace(/\.\d+Z$/, "Z");
  let paras;
  try {
    paras = markup ? markupParas(readText(markup)) : compareParas(readText(original), readText(revised), docxPprs(original));
  } catch (e) { console.error(`error: ${e.message}`); return 1; }
  const s = writeRedline(paras, out, author, date);
  console.log(json ? JSON.stringify(s, null, 2)
    : `redline: wrote ${s.out} (${s.insertions} insertions, ${s.deletions} deletions, ${s.paragraphs} paragraphs)`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { compareParas, markupParas, writeRedline, accepted, wordDiff, SeqMatcher };
