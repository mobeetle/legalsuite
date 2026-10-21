#!/usr/bin/env node
"use strict";
/* Plain-text extraction for the legal suite scripts (stdlib only).
 *
 * read_text(path) returns the text of a .txt/.md/.docx file. For .docx it is
 * the accepted view: inserted tracked text kept, deleted tracked text
 * (w:delText) dropped, a deleted paragraph mark merges into the next
 * paragraph, one line per paragraph (table cells included, in body order).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const zlib = require("zlib");

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosNow() {
  const d = new Date();
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((Math.floor(d.getSeconds() / 2)) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
}

// Minimal zip reader via the central directory (local headers locate the data).
function unzip(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535 - 1); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not a zip file");
  const count = b.readUInt16LE(eocd + 10);
  const cdOff = b.readUInt32LE(eocd + 16);
  const entries = [];
  let p = cdOff;
  for (let i = 0; i < count; i++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory");
    const method = b.readUInt16LE(p + 10);
    const csize = b.readUInt32LE(p + 20);
    const usize = b.readUInt32LE(p + 24);
    const fnLen = b.readUInt16LE(p + 28);
    const exLen = b.readUInt16LE(p + 30);
    const coLen = b.readUInt16LE(p + 32);
    const localOff = b.readUInt32LE(p + 42);
    const name = b.toString("utf8", p + 46, p + 46 + fnLen);
    entries.push({ method, csize, usize, localOff, name });
    p += 46 + fnLen + exLen + coLen;
  }
  const out = {};
  for (const e of entries) {
    if (b.readUInt32LE(e.localOff) !== 0x04034b50) throw new Error("bad local header");
    const fnLen = b.readUInt16LE(e.localOff + 26);
    const exLen = b.readUInt16LE(e.localOff + 28);
    const start = e.localOff + 30 + fnLen + exLen;
    const raw = b.subarray(start, start + e.csize);
    let data;
    if (e.method === 0) data = Buffer.from(raw);
    else if (e.method === 8) data = e.csize === 0 && e.usize !== 0
      ? (() => { throw new Error("data descriptor not supported"); })()
      : zlib.inflateRawSync(raw);
    else throw new Error("unsupported compression method " + e.method);
    out[e.name] = data;
  }
  return out;
}

function zipFiles(files) {
  // files: [[name, Buffer]] in order; deflated like Python ZIP_DEFLATED.
  const { time, date } = dosNow();
  const chunks = [];
  const central = [];
  let off = 0;
  for (const [name, data] of files) {
    const fname = Buffer.from(name, "utf8");
    const comp = zlib.deflateRawSync(data);
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(time, 10);
    lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(fname.length, 26);
    lh.writeUInt16LE(0, 28);
    chunks.push(lh, fname, comp);
    central.push({ fname, crc, csize: comp.length, usize: data.length, off });
    off += lh.length + fname.length + comp.length;
  }
  const cdStart = off;
  const cdChunks = [];
  for (const c of central) {
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(time, 12);
    ch.writeUInt16LE(date, 14);
    ch.writeUInt32LE(c.crc, 16);
    ch.writeUInt32LE(c.csize, 20);
    ch.writeUInt32LE(c.usize, 24);
    ch.writeUInt16LE(c.fname.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(c.off, 42);
    cdChunks.push(ch, c.fname);
    off += ch.length + c.fname.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(central.length, 8);
  end.writeUInt16LE(central.length, 10);
  end.writeUInt32LE(off - cdStart, 12);
  end.writeUInt32LE(cdStart, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...chunks, ...cdChunks, end]);
}

function docx_parts(p) {
  return unzip(fs.readFileSync(p));
}

function xmlUnescape(s) {
  return s.replace(/&(lt|gt|amp|quot|apos|#\d+|#[xX][0-9a-fA-F]+);/g, (m, e) => {
    if (e === "lt") return "<";
    if (e === "gt") return ">";
    if (e === "amp") return "&";
    if (e === "quot") return '"';
    if (e === "apos") return "'";
    if (e[0] === "#") {
      const cp = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      if (!Number.isNaN(cp)) { try { return String.fromCodePoint(cp); } catch { return m; } }
    }
    return m;
  });
}

function paraText(pInner) {
  const re = /<w:delText(?:\s[^>]*)?>[\s\S]*?<\/w:delText\s*>|<w:delText(?:\s[^>]*)?\/>|<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t\s*>|<w:tab(?:\s[^>]*)?\/?>|<w:br(?:\s[^>]*)?\/?>|<w:cr(?:\s[^>]*)?\/?>/g;
  let out = "";
  let m;
  while ((m = re.exec(pInner)) !== null) {
    const tok = m[0];
    if (tok.startsWith("<w:delText")) continue;
    else if (tok === "<w:t" || tok.startsWith("<w:t ") || tok.startsWith("<w:t>")) out += xmlUnescape(m[1] || "");
    else if (tok.startsWith("<w:tab")) out += "\t";
    else out += "\n";
  }
  return out;
}

function docx_text(data) {
  const xml = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);
  const bodyM = xml.match(/<w:body(?:\s[^>]*)?>([\s\S]*?)<\/w:body\s*>/);
  if (!bodyM) return "";
  const body = bodyM[1];
  const out = [];
  let carry = "";
  const re = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p\s*>|<w:p(?:\s[^>]*)?\/>/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const inner = m[1] !== undefined ? m[1] : "";
    const ppr = inner.match(/<w:pPr(?:\s[^>]*)?>([\s\S]*?)<\/w:pPr\s*>|<w:pPr(?:\s[^>]*)?\/>/);
    const deletedMark = ppr && ppr[1] !== undefined && /<w:del(?:\s|\/|>)/.test(ppr[1]);
    const text = carry + paraText(inner);
    if (deletedMark) { carry = text; continue; }
    out.push(text);
    carry = "";
  }
  if (carry) out.push(carry);
  return out.join("\n");
}

function read_text(p) {
  if (String(p).toLowerCase().endsWith(".docx")) {
    const parts = unzip(fs.readFileSync(p));
    const doc = parts["word/document.xml"];
    if (doc === undefined) throw new Error("There is no item named 'word/document.xml' in the archive");
    return docx_text(doc);
  }
  let s = fs.readFileSync(p, "utf8");
  if (s.startsWith("﻿")) s = s.slice(1);
  return s;
}

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
  "</Types>";
const ROOT_RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
  "</Relationships>";

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function core_xml(creator, date) {
  if (creator === undefined) creator = "legalsuite";
  if (date === undefined) date = "";
  const d = date ? `<dcterms:created xsi:type="dcterms:W3CDTF">${xmlEscape(date)}</dcterms:created>` : "";
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:creator>${xmlEscape(creator)}</dc:creator>` +
    `<cp:lastModifiedBy>${xmlEscape(creator)}</cp:lastModifiedBy>${d}` +
    "</cp:coreProperties>";
}

function write_docx(docPath, bodyXml, extra, creator, date) {
  if (creator === undefined) creator = "legalsuite";
  if (date === undefined) date = "";
  const doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    `<w:document xmlns:w="${W_NS}"><w:body>${bodyXml}</w:body></w:document>`;
  const files = [
    ["[Content_Types].xml", Buffer.from(CONTENT_TYPES, "utf8")],
    ["_rels/.rels", Buffer.from(ROOT_RELS, "utf8")],
    ["word/document.xml", Buffer.from(doc, "utf8")],
    ["docProps/core.xml", Buffer.from(core_xml(creator, date), "utf8")],
  ];
  if (extra) for (const k of Object.keys(extra)) {
    const v = extra[k];
    files.push([k, Buffer.isBuffer(v) ? v : Buffer.from(String(v), "utf8")]);
  }
  fs.writeFileSync(docPath, zipFiles(files));
}

function assertOk(cond, msg) {
  if (!cond) throw new Error("assert failed: " + (msg || ""));
}

function demo() {
  const body =
    '<w:p><w:r><w:t xml:space="preserve">Kupující zaplatí </w:t></w:r>' +
    '<w:del w:id="1" w:author="x" w:date="2026-01-01T00:00:00Z"><w:r>' +
    "<w:delText>100 Kč</w:delText></w:r></w:del>" +
    '<w:ins w:id="2" w:author="x" w:date="2026-01-01T00:00:00Z"><w:r>' +
    "<w:t>120 Kč</w:t></w:r></w:ins><w:r><w:tab/><w:t>„ok“</w:t></w:r></w:p>" +
    "<w:tbl><w:tr><w:tc><w:p><w:r><w:t>cell</w:t><w:br/><w:t>2</w:t></w:r></w:p>" +
    '</w:tc></w:tr></w:tbl><w:p><w:pPr><w:rPr><w:del w:id="3" w:author="x" ' +
    'w:date="2026-01-01T00:00:00Z"/></w:rPr></w:pPr><w:r><w:t>e</w:t></w:r></w:p>' +
    "<w:p><w:r><w:t>nd</w:t></w:r></w:p>";
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "doctext-"));
  try {
    const f = path.join(tmp, "t.docx");
    write_docx(f, body);
    const txt = read_text(f);
    assertOk(txt === "Kupující zaplatí 120 Kč\t„ok“\ncell\n2\nend", JSON.stringify(txt));
    assertOk(!txt.includes("100"), "deleted text leaked");
    assertOk(Object.prototype.hasOwnProperty.call(docx_parts(f), "word/document.xml"), "missing part");
    const m = path.join(tmp, "t.md");
    fs.writeFileSync(m, Buffer.from("﻿Čl. 1 text", "utf8"));
    assertOk(read_text(m) === "Čl. 1 text", JSON.stringify(read_text(m)));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log("demo ok");
  return 0;
}

function main(argv) {
  const args = (argv || process.argv.slice(2));
  let file = null;
  let json = false;
  let isDemo = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") json = true;
    else if (a === "--demo") isDemo = true;
    else if (a.startsWith("-")) {
      process.stderr.write(`doctext.js: error: unknown option ${a}\n`);
      return 2;
    } else if (file === null) file = a;
    else {
      process.stderr.write(`doctext.js: error: unexpected argument ${a}\n`);
      return 2;
    }
  }
  if (isDemo) return demo();
  if (!file) {
    process.stderr.write("usage: doctext.js FILE [--json]\n");
    process.stderr.write("doctext.js: error: need FILE (or --demo)\n");
    return 2;
  }
  let text;
  try {
    text = read_text(file);
  } catch (e) {
    process.stderr.write(`error: ${(e && e.message) || e}\n`);
    return 1;
  }
  if (json) console.log(JSON.stringify({ path: file, text }, null, 2));
  else process.stdout.write(text + "\n");
  return 0;
}

module.exports = { docx_parts, docx_text, read_text, write_docx, core_xml, CONTENT_TYPES, ROOT_RELS };

if (require.main === module) process.exitCode = main();
