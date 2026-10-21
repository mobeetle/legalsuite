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

// --- minimal zip (CRC32 + deflate via zlib), mirrors Python zipfile output ---
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
// Accepted-view text of a word/document.xml payload (drops w:delText, merges deleted marks).
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

// --- markdown -> w:p / w:tbl list ---
const BAD_XML = /[\x00-\x08\x0b\x0c\x0e-\x1f]/g;
const LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g;
const MD_INLINE_RE = /(\*\*|__|\*|_|`|~~)/g;
const SPAN_RE = /\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|_([^_\n]+)_/g;

function clean(text) {
  text = text.replace(LINK_RE, (m, t, u) => t + (u ? ` (${u})` : ""));
  text = text.replace(MD_INLINE_RE, "").replace(BAD_XML, "");
  return escapeXml(text);
}
function runsXml(text, bold = false) {
  text = text.replace(LINK_RE, (m, t, u) => t + (u ? ` (${u})` : ""));
  SPAN_RE.lastIndex = 0;
  if (bold || !SPAN_RE.test(text)) {
    const t = clean(text) || " ";
    const rpr = bold ? "<w:rPr><w:b/></w:rPr>" : "";
    return `<w:r>${rpr}<w:t xml:space="preserve">${t}</w:t></w:r>`;
  }
  SPAN_RE.lastIndex = 0;
  const out = [];
  let pos = 0, m;
  while ((m = SPAN_RE.exec(text)) !== null) {
    if (m.index > pos) {
      const pre = clean(text.slice(pos, m.index));
      if (pre) out.push(`<w:r><w:t xml:space="preserve">${pre}</w:t></w:r>`);
    }
    const bTxt = m[1] || m[2];
    const iTxt = m[3] || m[4];
    const tag = bTxt !== undefined ? "<w:b/>" : "<w:i/>";
    const val = clean(bTxt !== undefined ? bTxt : iTxt);
    if (val) out.push(`<w:r><w:rPr>${tag}</w:rPr><w:t xml:space="preserve">${val}</w:t></w:r>`);
    pos = m.index + m[0].length;
  }
  if (pos < text.length) {
    const tail = clean(text.slice(pos));
    if (tail) out.push(`<w:r><w:t xml:space="preserve">${tail}</w:t></w:r>`);
  }
  return out.length ? out.join("") : '<w:r><w:t xml:space="preserve"> </w:t></w:r>';
}
function para(text, bold = false) {
  return `<w:p>${runsXml(text, bold)}</w:p>`;
}
function flush(table) {
  const rows = [];
  let idx = 0;
  for (const r of table) {
    const s = r.trim();
    if (!s || /^\|?[\s:|\-]+\|?$/.test(s)) continue;
    const cells = s.replace(/^\|+|\|+$/g, "").split("|").map((c) => c.trim()).join(" | ");
    const pXml = para(cells, idx === 0);
    rows.push(`<w:tr><w:tc>${pXml}</w:tc></w:tr>`);
    idx++;
  }
  return rows.length ? [`<w:tbl>${rows.join("")}</w:tbl>`] : [];
}
function mdParas(md) {
  const out = [];
  let fence = false, code = [], table = [];
  for (const raw of md.split(/\r\n|\r|\n/)) {
    const line = raw.replace(/\s+$/, "");
    if (line.trim().startsWith("```")) {
      if (fence) { for (const c of code) out.push(para(c ? "  " + c : " ")); code = []; }
      fence = !fence;
      continue;
    }
    if (fence) { code.push(line); continue; }
    const s = line.trim();
    if (!s) { if (table.length) { out.push(...flush(table)); table = []; } continue; }
    if (/^\|?[\s:|\-]+\|?$/.test(s) && table.length) continue;
    if (s.startsWith("|") && s.endsWith("|")) { table.push(s); continue; }
    if (table.length) { out.push(...flush(table)); table = []; }
    let m = s.match(/^(#{1,6})\s+(.*)/);
    if (m) { out.push(para(m[2].trim(), true)); continue; }
    if (/^>\s?/.test(s)) { out.push(para(s.replace(/^>\s?/, ""))); continue; }
    if (/^([-*+]\s+|\d+[.)]\s+)/.test(s)) { out.push(para(s)); continue; }
    if (/^([-*_]{3,})$/.test(s)) continue;
    out.push(para(s));
  }
  if (fence) for (const c of code) out.push(para(c ? "  " + c : " "));
  if (table.length) out.push(...flush(table));
  return out.length ? out : [para(" ")];
}

function convert(inp, out = null, creator = "legalsuite", date = "") {
  const src = String(inp);
  const dst = out ? String(out) : src.replace(/\.[^.]*$/, "") + ".docx";
  const body = mdParas(readText(src)).join("");
  writeDocxFile(dst, body, creator, date);
  return { in: src, out: dst, paragraphs: mdParas(readText(src)).length };
}

function demo() {
  const assert = require("assert");
  const md = "# Nadpis\n\nText s **bold** a [odkaz](https://x.cz).\n\n" +
    "- bod jedna\n- bod dva\n\n```text\n[Matter]\n|-- Duty\n```\n\n" +
    "| A | B |\n|---|---|\n| a1 | b1 |\n";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "md2docx-"));
  try {
    const src = path.join(tmp, "t.md");
    fs.writeFileSync(src, md, "utf-8");
    const s = convert(src);
    const parts = readZip(fs.readFileSync(s.out));
    const doc = parts.get("word/document.xml").toString("utf-8");
    assert.ok(doc.includes("<w:b/>") && doc.includes("Nadpis"), doc);
    assert.ok(doc.includes("bold") && !doc.includes("**"), doc);
    assert.ok(doc.includes("<w:tbl>") && doc.includes("<w:tr>") && doc.includes("<w:tc>"), doc);
    assert.ok(doc.includes("odkaz (https://x.cz)"), doc);
    assert.ok(doc.includes("a1 | b1") && doc.includes("A | B"), doc);
    assert.strictEqual(readText(s.out).split(/\r\n|\r|\n/)[0], "Nadpis", readText(s.out));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log("demo ok");
  return 0;
}

function usage() {
  return "usage: md2docx.js IN.md [-o OUT.docx] [--json]\n       md2docx.js --demo";
}

function main(argv) {
  let input = null, out = null, json = false, isDemo = false;
  const err = (m) => { console.error(`md2docx.js: error: ${m}\n${usage()}`); process.exit(2); };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--json") json = true;
    else if (t === "--demo") isDemo = true;
    else if (t === "-o" || t === "--out") { if (++i >= argv.length) err(`${t} needs a value`); out = argv[i]; }
    else if (t === "-h" || t === "--help") { console.log(usage()); return 0; }
    else if (t.startsWith("-")) err(`unknown option ${t}`);
    else if (input === null) input = t;
    else err(`unexpected argument ${t}`);
  }
  if (isDemo) return demo();
  if (!input) err("need IN.md (or --demo)");
  let s;
  try {
    const d = new Date();
    const stamp = d.toISOString().replace(/\.\d+Z$/, "Z");
    s = convert(input, out, "legalsuite", stamp);
  } catch (e) { console.error(`error: ${e.message}`); return 1; }
  console.log(json ? JSON.stringify(s, null, 2) : `md2docx: wrote ${s.out} (${s.paragraphs} paragraphs)`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));
module.exports = { mdParas, convert, readText };
