#!/usr/bin/env node
'use strict';
/* Substance-preservation check for legal redlines (stdlib only).

Compares an ORIGINAL document against a REVISED/redlined one and reports
protected tokens -- money, percentages, dates, durations, statutory
references, quoted strings, and bare numbers -- that the revision dropped or
introduced. A semantic layer then aligns sentences and flags silent flips a
token count cannot see: modal (shall -> may), negation, connector
(and -> or), standard (reasonable -> sole discretion) and party swaps.

Dropped tokens and flips are the danger signal. Added tokens are reported
too, since drafting legitimately adds language. This tool reports; the
mode/agent adjudicates. Inputs: .txt, .md or .docx (accepted view).

    substance.js ORIGINAL REVISED [--json] [--strict] [--no-semantic] [--party NAME]...
    substance.js --text-orig TEXT --text-rev TEXT [--json]
    substance.js --demo            # runnable self-check

Exit 0 normally; --strict exits 1 when any protected token is dropped or a
semantic flip is found, so the script can run as a blocking check.

Ceiling: a curated regex set and lexicon, not a legal parser. It can miss
unlisted notation, cannot tell a legitimate deletion from a lost one, and
only sees flips inside sentences similar enough to align (ratio >= 0.6).
*/

const assert = require('assert');

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

const NUM = String.raw`\d{1,3}(?:[  .,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?`;
const EN_MONTHS = ('January|February|March|April|May|June|July|August|September|' +
  'October|November|December');
const CZ_MONTHS = ('ledna|února|března|dubna|května|června|července|srpna|září|' +
  'října|listopadu|prosince');
const INTL_MONTHS = ('Januar|Jänner|Februar|März|Mai|Juni|Juli|Oktober|Dezember|' +
  'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|' +
  'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|' +
  'stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia|' +
  'januára|februára|apríla|mája|júna|júla|augusta|septembra|októbra|novembra|decembra');
const CURRENCIES = String.raw`Kč|CZK|EUR|USD|GBP|CHF|PLN|SEK|NOK|DKK|CAD|AUD|JPY|HUF|RON|€|\$|£|zł|Fr\.`;
const PRE_CURRENCIES = String.raw`\b(?:EUR|CZK|USD|GBP|CHF|PLN|SEK|NOK|DKK|CAD|AUD|JPY|HUF|RON|Kč|zł|Fr\.)|€|\$|£`;
const UNITS = String.raw`(?:(?:calendar|business|working)\s+)?(?:days?|weeks?|months?|years?|hours?)` +
  String.raw`|(?:(?:pracovních|kalendářních)\s+)?(?:dnů|dní|dny|den|týdnů|týdny|týden|` +
  String.raw`měsíců|měsíce|měsíc|let|roků|roky|rok|hodin[ay]?)` +
  String.raw`|(?:Werk|Arbeits|Kalender)?(?:[Tt]ag(?:en|e)?|[Ww]ochen?|[Mm]onat(?:en|e)?|[Jj]ahr(?:en|e)?|[Ss]tunden?)` +
  String.raw`|jours?(?:\s+ouvrés|\s+ouvrables|\s+calendaires)?|semaines?|mois|ans?|années?|heures?` +
  String.raw`|días?(?:\s+hábiles|\s+naturales)?|semanas?|meses|años?|horas?` +
  String.raw`|(?:dni\s+roboczych|dni\s+kalendarzowych|dni|tygodni|miesięcy|lat|godzin)`;

// Leftmost alternative wins, so more specific categories precede `number`.
// NOTE: trailing \b after UNITS is spelled as a Unicode-aware lookahead:
// JS \b is ASCII-only and would miss boundaries after Czech diacritics
// (e.g. "30 dnů."). Python-equivalent semantics via \p{L}\p{N}_.
const W = String.raw`[\p{L}\p{N}_]`;
const TOKEN_RE = new RegExp(
  String.raw`(?<money>\d[\d  .,]*\s?(?:` + CURRENCIES + String.raw`)` +
    String.raw`|(?:` + PRE_CURRENCIES + String.raw`)\s?(?:` + NUM + String.raw`))` +
  String.raw`|(?<percent>\d[\d  .,]*\s?%)` +
  String.raw`|(?<date>\d{1,2}\.\s*\d{1,2}\.\s*\d{4}|\d{4}-\d{2}-\d{2}` +
    String.raw`|\d{1,2}(?:st|nd|rd|th)?\.?\s+(?:de\s+)?(?:` + EN_MONTHS + String.raw`|` + CZ_MONTHS +
    String.raw`|` + INTL_MONTHS + String.raw`)\s+(?:de\s+)?\d{4}` +
    String.raw`|(?:` + EN_MONTHS + String.raw`)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})` +
  String.raw`|(?<duration>(?:` + NUM + String.raw`)\s+(?:` + UNITS + String.raw`)(?!` + W + String.raw`))` +
  String.raw`|(?<ref>§\s*\d+[a-zA-Z]?|(?<!` + W + String.raw`)(?:čl|odst|písm|art|Art|Artikel|Abs|Absatz|Ziff|article|alinéa|artículo|apartado|ust|pkt)\.?\s*\d+|\bArticle\s+\d+)` +
  String.raw`|(?<quote>["„“][^"„“\n]{2,}["“”])` +
  String.raw`|(?<number>\b\d[\d  .,]*\b)`,
  'gu');

function tokens(text) {
  // Multiset of (category, normalised value) protected tokens.
  const out = new Map();
  for (const m of text.matchAll(TOKEN_RE)) {
    const g = m.groups;
    const cat = g.money !== undefined ? 'money'
      : g.percent !== undefined ? 'percent'
      : g.date !== undefined ? 'date'
      : g.duration !== undefined ? 'duration'
      : g.ref !== undefined ? 'ref'
      : g.quote !== undefined ? 'quote' : 'number';
    const val = m[0].replace(/\s+/gu, ' ').trim();
    const k = cat + '\0' + val;
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
}

function counterSub(a, b) {
  // Counter subtraction drops non-positive counts.
  const r = new Map();
  for (const [k, v] of a) {
    const d = v - (b.get(k) || 0);
    if (d > 0) r.set(k, d);
  }
  return r;
}

function compare(original, revised) {
  const a = tokens(original), b = tokens(revised);
  return [a, b, counterSub(a, b), counterSub(b, a)];
}

function fmt(counter) {
  return [...counter.entries()].map(([k, n]) => {
    const i = k.indexOf('\0');
    return { category: k.slice(0, i), value: k.slice(i + 1), count: n };
  }).sort((x, y) => x.category < y.category ? -1 : x.category > y.category ? 1
    : x.value < y.value ? -1 : x.value > y.value ? 1 : 0);
}

// --- semantic layer -------------------------------------------------------
// (category, lemma, regex). Order matters: longer phrases before their parts.
const _I = (s) => '(?i:' + s + ')';
const LEXICON = [
  ['modal', 'shall not', _I(String.raw`shall\s+not`)], ['modal', 'shall', _I('shall')],
  ['modal', 'must not', _I(String.raw`must\s+not`)], ['modal', 'must', _I('must')],
  ['modal', 'may not', _I(String.raw`may\s+not`)],
  ['modal', 'may', _I(String.raw`(?<!\d )may(?!\s+\d)`)],
  ['modal', 'will not', _I(String.raw`will\s+not|won't`)], ['modal', 'will', _I('will')],
  ['modal', 'is not entitled to', _I(String.raw`(?:is|are)\s+not\s+entitled\s+to`)],
  ['modal', 'is entitled to', _I(String.raw`(?:is|are)\s+entitled\s+to`)],
  ['modal', 'agrees to', _I(String.raw`agrees?\s+to`)],
  ['modal', 'undertakes to', _I(String.raw`undertakes?\s+to`)],
  ['modal', 'není povinen', _I(String.raw`(?:není|nejsou)\s+povin(?:en|na|no|ni|ny)`)],
  ['modal', 'je povinen', _I(String.raw`(?:je|jsou)\s+povin(?:en|na|no|ni|ny)`)],
  ['modal', 'není oprávněn', _I(String.raw`(?:není|nejsou)\s+oprávněn[aoiy]?`)],
  ['modal', 'je oprávněn', _I(String.raw`(?:je|jsou)\s+oprávněn[aoiy]?`)],
  ['modal', 'nemá právo', _I(String.raw`nem(?:á|ají)\s+právo`)],
  ['modal', 'má právo', _I(String.raw`m(?:á|ají)\s+právo`)],
  ['modal', 'nemusí', _I('nemus(?:í|ejí)')], ['modal', 'musí', _I('mus(?:í|ejí)')],
  ['modal', 'nesmí', _I('nesm(?:í|ějí)')], ['modal', 'smí', _I('sm(?:í|ějí)')],
  ['modal', 'nemůže', _I('nemůže|nemohou')], ['modal', 'může', _I('může|mohou')],
  ['modal', 'zavazuje se', _I(String.raw`zavazuj[eí]\s+se|se\s+zavazuj[eí]`)],
  ['modal', 'darf nicht', _I(String.raw`(?:darf|dürfen)\s+nicht`)],
  ['modal', 'muss nicht', _I(String.raw`(?:muss|müssen)\s+nicht`)],
  ['modal', 'ist nicht verpflichtet', _I(String.raw`(?:ist|sind)\s+nicht\s+verpflichtet`)],
  ['modal', 'verpflichtet sich', _I(String.raw`verpflichte[tn]\s+sich`)],
  ['modal', 'muss', _I(String.raw`muss|müssen`)],
  ['modal', 'hat zu', _I(String.raw`(?:hat|haben)\s+zu`)],
  ['modal', 'darf', _I(String.raw`darf|dürfen`)],
  ['modal', 'kann', _I(String.raw`kann|können`)],
  ['modal', 'ne doit pas', _I(String.raw`ne\s+(?:doit|doivent)\s+pas`)],
  ['modal', 'ne peut pas', _I(String.raw`ne\s+(?:peut|peuvent)\s+pas`)],
  ['modal', "n'est pas tenu", _I(String.raw`(?:n['’]est|ne\s+sont)\s+pas\s+tenu[es]?`)],
  ['modal', "s'engage à", _I(String.raw`s['’]engage(?:nt)?\s+à`)],
  ['modal', 'doit', _I(String.raw`doit|doivent`)],
  ['modal', 'est tenu', _I(String.raw`(?:est|sont)\s+tenu[es]?`)],
  ['modal', 'peut', _I(String.raw`peut|peuvent`)],
  ['modal', 'no deberá', _I(String.raw`no\s+deberán?`)],
  ['modal', 'no podrá', _I(String.raw`no\s+podrán?`)],
  ['modal', 'se obliga a', _I(String.raw`se\s+obliga(?:n)?\s+a`)],
  ['modal', 'deberá', _I(String.raw`deberán?`)],
  ['modal', 'debe', _I(String.raw`deben?`)],
  ['modal', 'podrá', _I(String.raw`podrán?`)],
  ['modal', 'puede', _I(String.raw`pueden?`)],
  ['modal', 'nie może', _I(String.raw`nie\s+(?:może|mogą)`)],
  ['modal', 'nie jest zobowiązany', _I(String.raw`nie\s+(?:jest|są)\s+zobowiązan[yiaeo]`)],
  ['modal', 'zobowiązuje się', _I(String.raw`zobowiązuj[eą]\s+się`)],
  ['modal', 'musi', _I(String.raw`musi|muszą`)],
  ['modal', 'jest zobowiązany', _I(String.raw`(?:jest|są)\s+zobowiązan[yiaeo]`)],
  ['modal', 'może', _I(String.raw`może|mogą`)],
  ['standard', 'commercially reasonable efforts',
    _I(String.raw`commercially\s+reasonable\s+efforts`)],
  ['standard', 'reasonable efforts', _I(String.raw`reasonable\s+efforts`)],
  ['standard', 'best efforts', _I(String.raw`best\s+efforts`)],
  ['standard', 'reasonably', _I('reasonably')],
  ['standard', 'reasonable', _I('reasonable')],
  ['standard', 'sole discretion', _I(String.raw`sole\s+discretion`)],
  ['standard', 'absolute discretion', _I(String.raw`absolute\s+discretion`)],
  ['standard', 'good faith', _I(String.raw`good\s+faith`)],
  ['standard', 'materially', _I('materially')], ['standard', 'material', _I('material')],
  ['standard', 'přiměřený', _I(String.raw`přiměřen\w*`)],
  ['standard', 'vlastní uvážení',
    _I(String.raw`(?:dle|podle)\s+(?:svého\s+)?vlastního\s+uvážení`)],
  ['standard', 'výlučné uvážení',
    _I(String.raw`(?:(?:dle|podle)\s+(?:svého\s+)?)?výlučného\s+uvážení`)],
  ['standard', 'veškeré úsilí', _I(String.raw`veškeré\s+úsilí`)],
  ['standard', 'nejlepší úsilí', _I(String.raw`nejlepší\s+úsilí`)],
  ['standard', 'v dobré víře', _I(String.raw`v\s+dobré\s+víře`)],
  ['standard', 'podstatný', _I(String.raw`podstatn\w*`)],
  ['standard', 'nach eigenem Ermessen', _I(String.raw`nach\s+eigenem\s+Ermessen`)],
  ['standard', 'nach billigem Ermessen', _I(String.raw`nach\s+billigem\s+Ermessen`)],
  ['standard', 'angemessen', _I(String.raw`angemessen\w*`)],
  ['standard', 'wesentlich', _I(String.raw`wesentlich\w*`)],
  ['standard', 'à sa seule discrétion', _I(String.raw`à\s+(?:sa|leur)\s+seule\s+discrétion`)],
  ['standard', 'raisonnablement', _I('raisonnablement')],
  ['standard', 'raisonnable', _I(String.raw`raisonnables?`)],
  ['standard', 'exclusiva discreción', _I(String.raw`exclusiva\s+discreción`)],
  ['standard', 'razonable', _I(String.raw`razonables?|razonablemente`)],
  ['standard', 'według własnego uznania', _I(String.raw`według\s+własnego\s+uznania`)],
  ['standard', 'uzasadniony', _I(String.raw`uzasadnion\w*`)],
  ['connector', 'and/or', _I('and/or')], ['connector', 'and', _I('and')],
  ['connector', 'or', _I('or')], ['connector', 'unless', _I('unless')],
  ['connector', 'except', _I('except')],
  ['connector', 'provided that', _I(String.raw`provided\s+that`)],
  ['connector', 'subject to', _I(String.raw`subject\s+to`)],
  ['connector', 'notwithstanding', _I('notwithstanding')],
  ['connector', 'bez ohledu na', _I(String.raw`bez\s+ohledu\s+na`)],
  ['connector', 'anebo', _I('anebo')], ['connector', 'nebo', _I('nebo')],
  ['connector', 'či', _I('či')], ['connector', 'ledaže', _I('ledaže')],
  ['connector', 's výjimkou', _I(String.raw`s\s+výjimkou`)],
  ['connector', 'kromě', _I('kromě')], ['connector', 'pokud', _I('pokud')],
  ['connector', 'za předpokladu', _I(String.raw`za\s+předpokladu`)],
  ['connector', 'und/oder', _I('und/oder')], ['connector', 'oder', _I('oder')],
  ['connector', 'sofern nicht', _I(String.raw`sofern\s+nicht`)],
  ['connector', 'es sei denn', _I(String.raw`es\s+sei\s+denn`)],
  ['connector', 'et/ou', _I('et/ou')], ['connector', 'sauf', _I('sauf')],
  ['connector', 'à moins que', _I(String.raw`à\s+moins\s+que`)],
  ['connector', 'y/o', _I('y/o')], ['connector', 'salvo', _I('salvo')],
  ['connector', 'a menos que', _I(String.raw`a\s+menos\s+que`)],
  ['connector', 'oraz', _I('oraz')], ['connector', 'lub', _I('lub')],
  ['connector', 'chyba że', _I(String.raw`chyba\s+że`)],
  ['connector', 'a', 'a'], ['connector', 'i', 'i'],   // Czech-only, see _CZ_ONLY
  ['negation', 'not', _I('not')], ['negation', 'no', _I(String.raw`no(?!\.\s*\d)`)],
  ['negation', 'never', _I('never')], ['negation', 'nor', _I('nor')],
  ['negation', 'neither', _I('neither')], ['negation', 'without', _I('without')],
  ['negation', 'nikoli', _I('nikoliv?')], ['negation', 'nikdy', _I('nikdy')],
  ['negation', 'žádný', _I(String.raw`žádn\w*`)], ['negation', 'ani', _I('ani')],
  ['negation', 'bez', _I('bez')],
  ['negation', 'nicht', _I('nicht')],
  ['negation', 'kein', _I(String.raw`kein(?:e[mnrs]?)?`)],
  ['negation', 'niemals', _I('niemals')],
  ['negation', 'ohne', _I('ohne')],
  ['negation', 'ne pas', _I(String.raw`ne\s+pas`)],
  ['negation', 'jamais', _I('jamais')],
  ['negation', 'sans', _I('sans')],
  ['negation', 'nunca', _I('nunca')],
  ['negation', 'sin', _I('sin')],
  ['negation', 'nie', _I('nie')],
  ['negation', 'nigdy', _I('nigdy')],
];
const EN_PARTIES = ('Disclosing Party|Receiving Party|Buyer|Seller|Purchaser|Vendor|Licensor|' +
  'Licensee|Provider|Customer|Client|Supplier|Contractor|Lessor|Lessee|' +
  'Landlord|Tenant|Employer|Employee|Discloser|Recipient|Lender|Borrower|' +
  'Guarantor|Verkäufer|Käufer|Auftraggeber|Auftragnehmer|Vermieter|Mieter|' +
  'Lizenzgeber|Lizenznehmer|Arbeitgeber|Arbeitnehmer|Darlehensgeber|Darlehensnehmer|' +
  'Vendeur|Acheteur|Prestataire|Bailleur|Preneur|Vendedor|Comprador|Arrendador|Arrendatario|' +
  'Sprzedający|Kupujący|Wykonawca|Zamawiający').split('|');
// Czech defined-party stems (case-sensitive, inflected forms by stem).
const CZ_PARTIES = [
  ['Zástavní věřitel', String.raw`Zástavní\w*\s+věřitel\w*`], ['Kupující', String.raw`Kupující\w*`],
  ['Prodávající', String.raw`Prodávající\w*`], ['Pronajímatel', String.raw`Pronajímatel\w*`],
  ['Nájemce', String.raw`Nájemc\w*`], ['Objednatel', String.raw`Objednatel\w*`],
  ['Zhotovitel', String.raw`Zhotovitel\w*`], ['Poskytovatel', String.raw`Poskytovatel\w*`],
  ['Uživatel', String.raw`Uživatel\w*`], ['Nabyvatel', String.raw`Nabyvatel\w*`],
  ['Zaměstnavatel', String.raw`Zaměstnavatel\w*`], ['Zaměstnanec', String.raw`Zaměstnan(?:ec|ce|ci|cem|cům|cích)`],
  ['Dodavatel', String.raw`Dodavatel\w*`], ['Odběratel', String.raw`Odběratel\w*`], ['Věřitel', String.raw`Věřitel\w*`],
  ['Dlužník', String.raw`Dlužník\w*`], ['Ručitel', String.raw`Ručitel\w*`], ['Příkazce', String.raw`Příkazc\w*`],
  ['Příkazník', String.raw`Příkazník\w*`], ['Zástavce', String.raw`Zástavc\w*`], ['Půjčitel', String.raw`Půjčitel\w*`],
  ['Vydlužitel', String.raw`Vydlužitel\w*`], ['Úvěrující', String.raw`Úvěrující\w*`],
  ['Úvěrovaný', String.raw`Úvěrovan\w*`],
];
const _CZ_ONLY = new Set(['connector\0a', 'connector\0i']);   // English "a" is an article
const _CZ_CHARS = new RegExp('[ěščřžůťďňĚŠČŘŽŮŤĎŇ]', 'u');

function escapeRegExp(s) {
  // NOTE: space is NOT escaped (unlike Python re.escape): `\ ` is a
  // SyntaxError in unicode mode, and a bare space matches a space.
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Faithful port of difflib.SequenceMatcher (isjunk=None, autojunk=False).
// Operates on code-point arrays so len()/indexing match Python str semantics.
function calcRatio(matches, length) {
  if (!length) return 1.0;
  return 2.0 * matches / length;
}

class SequenceMatcher {
  constructor(a, b) {
    this.a = Array.from(a);
    this.b = Array.from(b);
    this.b2j = new Map();
    for (let i = 0; i < this.b.length; i++) {
      const ch = this.b[i];
      if (!this.b2j.has(ch)) this.b2j.set(ch, []);
      this.b2j.get(ch).push(i);
    }
    this.matchingBlocks = null;
    this.fullbcount = null;
  }
  realQuickRatio() {
    const la = this.a.length, lb = this.b.length;
    return calcRatio(Math.min(la, lb), la + lb);
  }
  quickRatio() {
    if (this.fullbcount === null) {
      const full = new Map();
      for (const elt of this.b) full.set(elt, (full.get(elt) || 0) + 1);
      this.fullbcount = full;
    }
    const fullbcount = this.fullbcount;
    const avail = new Map();
    let matches = 0;
    for (const elt of this.a) {
      let numb;
      if (avail.has(elt)) numb = avail.get(elt);
      else numb = fullbcount.get(elt) || 0;
      avail.set(elt, numb - 1);
      if (numb > 0) matches++;
    }
    return calcRatio(matches, this.a.length + this.b.length);
  }
  findLongestMatch(alo, ahi, blo, bhi) {
    const a = this.a, b = this.b, b2j = this.b2j;
    if (ahi === undefined) ahi = a.length;
    if (bhi === undefined) bhi = b.length;
    let besti = alo, bestj = blo, bestsize = 0;
    let j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map();
      const js = b2j.get(a[i]);
      if (js) {
        for (const j of js) {
          if (j < blo) continue;
          if (j >= bhi) break;
          const k = newj2len.set(j, (j2len.get(j - 1) || 0) + 1).get(j);
          if (k > bestsize) { besti = i - k + 1; bestj = j - k + 1; bestsize = k; }
        }
      }
      j2len = newj2len;
    }
    // Junk-extension passes are no-ops here (bjunk is always empty:
    // isjunk=None), kept for structural parity with difflib.
    while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
      // (non-junk extension; bjunk empty so `not isbjunk` is always true)
      besti--; bestj--; bestsize++;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi &&
        a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize++;
    }
    return [besti, bestj, bestsize];
  }
  getMatchingBlocks() {
    if (this.matchingBlocks !== null) return this.matchingBlocks;
    const la = this.a.length, lb = this.b.length;
    const queue = [[0, la, 0, lb]];
    const matching = [];
    while (queue.length) {
      const [alo, ahi, blo, bhi] = queue.pop();
      const x = this.findLongestMatch(alo, ahi, blo, bhi);
      const [i, j, k] = x;
      if (k) {
        matching.push(x);
        if (alo < i && blo < j) queue.push([alo, i, blo, j]);
        if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
      }
    }
    matching.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
    let [i1, j1, k1] = [0, 0, 0];
    const nonAdjacent = [];
    for (const [i2, j2, k2] of matching) {
      if (i1 + k1 === i2 && j1 + k1 === j2) k1 += k2;
      else {
        if (k1) nonAdjacent.push([i1, j1, k1]);
        i1 = i2; j1 = j2; k1 = k2;
      }
    }
    if (k1) nonAdjacent.push([i1, j1, k1]);
    nonAdjacent.push([la, lb, 0]);
    this.matchingBlocks = nonAdjacent;
    return this.matchingBlocks;
  }
  ratio() {
    let matches = 0;
    for (const t of this.getMatchingBlocks()) matches += t[2];
    return calcRatio(matches, this.a.length + this.b.length);
  }
}

const _lexCache = new Map();
function lexicon(parties) {
  const key = parties.join('\0');
  const hit = _lexCache.get(key);
  if (hit) return hit;
  const entries = LEXICON.map(([c, l, p]) => ({ c, l, p }));
  const sorted = [...parties].sort((x, y) => y.length - x.length);
  for (const n of sorted) entries.push({ c: 'party', l: n, p: escapeRegExp(n) + String.raw`\w*` });
  for (const n of EN_PARTIES) entries.push({ c: 'party', l: n, p: escapeRegExp(n) + 's?' });
  for (const [l, p] of CZ_PARTIES) entries.push({ c: 'party', l, p });
  const compiled = entries.map((e) => {
    // (?i:...) wrapper (no inline flags in JS on Node 20) -> per-entry i flag.
    // \w -> Unicode word class: Python \w matches Czech letters, JS \w does not.
    let src = e.p, ci = false;
    if (src.startsWith('(?i:') && src.endsWith(')')) { src = src.slice(4, -1); ci = true; }
    src = src.replace(/\\w/g, '[\\p{L}\\p{N}_]');
    return { c: e.c, l: e.l, rx: new RegExp(`(?<!${W})(?:${src})(?!${W})`, 'y' + 'u' + (ci ? 'i' : '')) };
  });
  if (_lexCache.size >= 8) _lexCache.delete(_lexCache.keys().next().value);
  _lexCache.set(key, compiled);
  return compiled;
}

function signature(sentence, cz, parties) {
  const lex = lexicon(parties);
  const sig = [];
  // Mirror re.finditer alternation: at each position the first entry wins.
  let pos = 0;
  while (pos <= sentence.length) {
    let adv = null;
    for (const e of lex) {
      e.rx.lastIndex = pos;
      const m = e.rx.exec(sentence);
      if (m) { sig.push([e.c, e.l]); adv = m[0].length || 1; break; }
    }
    pos += adv === null ? 1 : adv;
    if (adv !== null && adv === 0) pos++;
  }
  if (cz) return sig;
  return sig.filter(([c, l]) => !_CZ_ONLY.has(c + '\0' + l));
}

const _SPLIT = new RegExp('(?<=[.;:])\\s+(?=[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ„"(])', 'u');
const _ABBR = new Set(['čl.', 'odst.', 'písm.', 'e.g.', 'i.e.', 'zák.', 'č.', 'tzv.', 'resp.', 'srov.',
  'no.', 'art.', 's.r.o.', 'a.s.', 'inc.', 'ltd.', 'mr.', 'ms.', 'dr.', 'cf.', 'vs.']);

function sentences(text) {
  // ponytail: regex splitter + abbreviation merge; a real segmenter if this misfires
  const out = [];
  for (const line of text.split('\n')) {
    let prevAbbr = false;
    for (let piece of line.trim().split(_SPLIT)) {
      piece = piece.trim();
      if (prevAbbr && out.length) out[out.length - 1] += ' ' + piece;
      else if (piece) out.push(piece);
      const words = piece ? piece.split(/\s+/) : [];
      const last = words.length ? words[words.length - 1].toLowerCase().replace(/^[(„"]+/, '') : '';
      prevAbbr = !!piece && _ABBR.has(last);
    }
  }
  return out;
}

function sigEq(a, b) {
  return a.length === b.length && a.every(([c, l], i) => b[i][0] === c && b[i][1] === l);
}

function flip(o, r, so, sr) {
  // Trim the common prefix/suffix; the first differing token names the category.
  let p = 0;
  while (p < Math.min(so.length, sr.length) && so[p][0] === sr[p][0] && so[p][1] === sr[p][1]) p++;
  let s = 0;
  while (s < Math.min(so.length, sr.length) - p &&
      so[so.length - 1 - s][0] === sr[sr.length - 1 - s][0] &&
      so[so.length - 1 - s][1] === sr[sr.length - 1 - s][1]) s++;
  const frm = so.slice(p, so.length - s), to = sr.slice(p, sr.length - s);
  return {
    category: (frm.length ? frm : to)[0][0],
    original: o.slice(0, 200),
    revised: r.slice(0, 200),
    from: frm.map(([, l]) => l),
    to: to.map(([, l]) => l),
  };
}

function flips(original, revised, parties) {
  parties = parties || [];
  const a = sentences(original), b = sentences(revised);
  const same = new Set(a.filter((s) => b.includes(s)));
  const cands = b.filter((s) => !same.has(s));
  const out = [];
  for (const o of a) {
    if (same.has(o)) continue;
    // ponytail: O(n*m) best-match scan, fine for contract-sized inputs
    let best = null, score = 0.0;
    for (const r of cands) {
      const sm = new SequenceMatcher(o, r);
      if (sm.realQuickRatio() >= 0.6 && sm.quickRatio() >= 0.6) {
        const ratio = sm.ratio();
        if (ratio > score) { best = r; score = ratio; }
      }
    }
    if (best !== null && score >= 0.6) {
      const cz = _CZ_CHARS.test(o + best);
      const so = signature(o, cz, parties), sr = signature(best, cz, parties);
      if (!sigEq(so, sr)) out.push(flip(o, best, so, sr));
      continue;
    }
    const so = signature(o, _CZ_CHARS.test(o), parties);
    const keep = so.filter(([c]) => c === 'modal' || c === 'party').map(([, l]) => l);
    if (keep.length) {
      out.push({ category: 'unmatched', original: o.slice(0, 200), revised: '', from: keep, to: [] });
    }
  }
  return out;
}

function report(original, revised, semantic, parties) {
  if (semantic === undefined) semantic = true;
  parties = parties || [];
  const [, , dropped, added] = compare(original, revised);
  const fl = semantic ? flips(original, revised, parties) : [];
  return { dropped: fmt(dropped), added: fmt(added), flips: fl, ok: dropped.size === 0 && fl.length === 0 };
}

function demo() {
  const orig = ('Nájem je 10 000 Kč měsíčně, splatný do 1. 5. 2024 podle § 5 ' +
    'odst. 2; strana uvedla „bez omezení“.');
  const rev = ('Nájem je 12 000 Kč měsíčně, splatný do 1. 5. 2024 podle § 5 ' +
    'odst. 2; strana uvedla „bez omezení“.');
  const [, , dropped, added] = compare(orig, rev);
  assert.deepStrictEqual([...dropped.entries()], [['money' + '\0' + '10 000 Kč', 1]]);
  assert.deepStrictEqual([...added.entries()], [['money' + '\0' + '12 000 Kč', 1]]);

  // refs/dates/quotes survive unchanged: nothing dropped here
  assert.strictEqual(report(orig, orig).ok, true);
  // losing the amount and the date are drops
  const lost = report(orig, 'bez čísel').dropped;
  const cats = new Set(lost.map((r) => r.category));
  assert.ok(cats.has('money') && cats.has('date'), JSON.stringify(lost));

  const drop = (o, r) => report(o, r).dropped.map((d) => [d.category, d.value]);
  assert.deepStrictEqual(drop('Price EUR 1,000.00.', 'Price EUR 1,500.00.'), [['money', 'EUR 1,000.00']]);
  assert.deepStrictEqual(drop('Lhůta do 1. ledna 2025.', 'Lhůta do 1. února 2025.'), [['date', '1. ledna 2025']]);
  assert.deepStrictEqual(drop('Splatnost 30 dnů.', 'Splatnost 14 dnů.'), [['duration', '30 dnů']]);
  for (const [s, cat] of [['€10', 'money'], ['$5', 'money'], ['USD 2 000', 'money'], ['Kč 100', 'money'],
      ['1 January 2025', 'date'], ['January 1, 2025', 'date'],
      ['1st January 2025', 'date'], ['15 business days', 'duration'],
      ['15 pracovních dnů', 'duration'], ['3 roky', 'duration'], ['48 hours', 'duration']]) {
    assert.deepStrictEqual([...tokens(s).entries()].map(([k]) => k.split('\0')), [[cat, s]], s);
  }

  const oneFlip = (o, r, kw) => {
    const fl = report(o, r, kw === undefined ? true : kw.semantic, (kw && kw.parties) || []).flips;
    assert.strictEqual(fl.length, 1, JSON.stringify([o, r, fl]));
    return [fl[0].category, fl[0].from, fl[0].to];
  };
  assert.deepStrictEqual(oneFlip('Seller shall deliver the goods.', 'Seller may deliver the goods.'),
    ['modal', ['shall'], ['may']]);
  assert.deepStrictEqual(
    oneFlip('Seller shall deliver the goods.', 'Seller shall not deliver the goods.').slice(1),
    [['shall'], ['shall not']]);
  assert.strictEqual(oneFlip('Buyer shall pay the price and the costs.',
    'Buyer shall pay the price or the costs.')[0], 'connector');
  {
    const [c, f, t] = oneFlip('Seller shall indemnify Buyer.', 'Buyer shall indemnify Seller.');
    assert.deepStrictEqual([c, f, t], ['party', ['Seller', 'shall', 'Buyer'], ['Buyer', 'shall', 'Seller']]);
  }
  assert.strictEqual(oneFlip('Buyer may terminate the agreement acting reasonably.',
    'Buyer may terminate the agreement in its sole discretion.')[0], 'standard');
  assert.deepStrictEqual(oneFlip('Prodávající je povinen dodat zboží do skladu.',
    'Prodávající může dodat zboží do skladu.'), ['modal', ['je povinen'], ['může']]);
  assert.deepStrictEqual(oneFlip('Verkäufer muss die Ware liefern.',
    'Verkäufer kann die Ware liefern.'), ['modal', ['muss'], ['kann']]);
  assert.deepStrictEqual(drop('Preis CHF 5,000 und £200.', 'Preis CHF 6,000 und GBP 300.'),
    [['money', 'CHF 5,000'], ['money', '£200']]);
  assert.strictEqual(oneFlip('Acme shall pay.', 'Beta shall pay.', { parties: ['Acme', 'Beta'] })[0], 'party');
  const two = 'The Seller shall deliver the goods. The Buyer shall pay the price.';
  assert.deepStrictEqual(report(two, two), { dropped: [], added: [], flips: [], ok: true });
  const swapped = 'The Buyer shall pay the price. The Seller shall deliver the goods.';
  assert.deepStrictEqual(report(two, swapped).flips, []);
  assert.strictEqual(oneFlip('Seller shall deliver.', 'Completely different text here.')[0], 'unmatched');
  assert.deepStrictEqual(sentences('Viz čl. V odst. 2. Další věta; Third: Fourth'),
    ['Viz čl. V odst. 2.', 'Další věta;', 'Third:', 'Fourth']);
  console.log('demo ok');
  return 0;
}

function pyRepr(s) {
  const esc = s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t').replace(/[\x00-\x1f\x7f]/g, (c) => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0'));
  if (!esc.includes("'")) return `'${esc}'`;
  if (!esc.includes('"')) return `"${esc}"`;
  return `'${esc.replace(/'/g, "\\'")}'`;
}

function main(argv) {
  const args = {
    original: null, revised: null, textOrig: null, textRev: null,
    json: false, strict: false, noSemantic: false, party: [], demo: false,
  };
  const pos = [];
  const fail = (msg) => {
    process.stderr.write(`substance.js: error: ${msg}\n`);
    process.exit(2);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = (name) => {
      if (a.includes('=', a.indexOf(name)) && a.startsWith(name + '=')) return a.slice(name.length + 1);
      if (i + 1 >= argv.length) fail(`argument ${name}: expected one argument`);
      return argv[++i];
    };
    if (a === '--text-orig' || a.startsWith('--text-orig=')) args.textOrig = val('--text-orig');
    else if (a === '--text-rev' || a.startsWith('--text-rev=')) args.textRev = val('--text-rev');
    else if (a === '--party' || a.startsWith('--party=')) args.party.push(val('--party'));
    else if (a === '--json') args.json = true;
    else if (a === '--strict') args.strict = true;
    else if (a === '--no-semantic') args.noSemantic = true;
    else if (a === '--demo') args.demo = true;
    else if (a === '--help' || a === '-h') {
      console.log('usage: substance.js ORIGINAL REVISED [--json] [--strict] [--no-semantic] [--party NAME]...');
      return 0;
    } else if (a.startsWith('-')) fail(`unrecognized arguments: ${a}`);
    else pos.push(a);
  }
  if (pos.length > 0) args.original = pos[0];
  if (pos.length > 1) args.revised = pos[1];
  if (pos.length > 2) fail(`unrecognized arguments: ${pos.slice(2).join(' ')}`);

  if (args.demo) return demo();

  let origText = args.textOrig !== null ? args.textOrig
    : (args.original ? read_text(args.original) : null);
  let revText = args.textRev !== null ? args.textRev
    : (args.revised ? read_text(args.revised) : null);

  if (origText === null || origText === undefined || revText === null || revText === undefined) {
    fail('need ORIGINAL and REVISED (as files or via --text-orig / --text-rev, or --demo)');
  }

  const res = report(origText, revText, !args.noSemantic, args.party);

  if (args.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    if (res.ok) console.log('substance-preservation: OK (no dropped protected tokens, no flips)');
    for (const r of res.dropped) console.log(`DROP  ${r.category.padEnd(8)} ${pyRepr(r.value)} x${r.count}`);
    for (const r of res.added) console.log(`ADD   ${r.category.padEnd(8)} ${pyRepr(r.value)} x${r.count}`);
    for (const f of res.flips) {
      const where = f.revised || f.original;
      console.log(`FLIP  ${f.category}  ${pyRepr(f.from.join(' '))} -> ` +
        `${pyRepr(f.to.join(' '))}  in: ${where.slice(0, 120)}`);
    }
  }

  if (args.strict && (res.dropped.length || res.flips.length)) return 1;
  return 0;
}

if (require.main === module) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`error: ${e.message}\n`);
    process.exit(1);
  }
}

module.exports = { tokens, compare, signature, sentences, flips, report, SequenceMatcher };
