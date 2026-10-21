# Fact map

The fact layer of the shared IR: **what happened, who says so, what proves it,
and who has to prove it.** The document map (`ir-and-provenance.md`) models a
text; this layer models a case. Intake seeds it, dispute and investigations
build it out, diligence uses it for findings that rest on facts outside the
documents, and the verify capability (`capabilities/verify.md`) traces deliverables back to it.

One file per matter: `.legal/<matter>/facts.md`. It is the single source.
Chronologies, claims matrices and witness outlines are **views** generated from
it. A view starts with `Generated from facts.md on <date>. Edit facts.md, then
regenerate.` and is never edited by hand.

## Format

Four Markdown tables, in this order, under these headings. `trace.py` parses
them by header name, so keep the columns and their names.

```
# Fact map — <matter>

## Facts
| ID | Proposition | Source anchor | Tag | Asserted by | Contested | Evidence |
|---|---|---|---|---|---|---|
| F1 | Buyer paid the first instalment of [amount] on 2025-03-14 | bank statement p. 2 | [DOC] | client | N | X3 |
| F2 | Seller was told of the defect by phone in April 2025 | client call 2026-09-30 | [USER] | client | Y | — |

## Events
| ID | Date | Precision | Actor | Act | Facts | Source |
|---|---|---|---|---|---|---|
| E1 | 2025-03-14 | exact | Buyer | pays 1st instalment | F1 | X3 |
| E2 | 2025-04 | month | Buyer | reports defect by phone | F2 | — |

## Evidence
| ID | Item | Type | Supports | Weakens | Authenticity | Held by | Status |
|---|---|---|---|---|---|---|---|
| X3 | Bank statement 03/2025 | document | F1 | | ok | client | in file |
| X4 | Phone log April 2025 | record | F2 | | unknown | operator | to obtain |

## Issues
| ID | Issue | Element | Burden | Standard | Facts | Evidence | Status |
|---|---|---|---|---|---|---|---|
| I1 | Claim for price reduction | — | — | — | — | — | open |
| I1.a | | defect existed at handover | claimant | [ASSUMED] full proof | F4 | X5 | disputed |
| I1.b | | timely notice of defect | claimant | [ASSUMED] full proof | F2 | — | missing |
```

### Column rules

- **ID**: `F`, `E`, `X`, `I` + number; elements `I1.a`. Never renumber. A
  withdrawn row stays, with `withdrawn` in its last column.
- **Proposition**: one checkable fact per row, in neutral words. No
  characterisation ("unlawfully terminated" is an issue, not a fact).
- **Source anchor**: where the fact comes from, exactly enough to find it again
  (document + page/§, call date, e-mail date + sender).
- **Tag**: the provenance tag. Inference is allowed (`[INFER]` naming the
  premise facts), but it is never upgraded to `[DOC]`.
- **Asserted by**: client, counterparty, witness <name>, document, us. Facts
  only the other side asserts are still recorded.
- **Contested**: `Y` if anyone disputes it or we expect them to. `?` if unknown.
- **Date / Precision**: ISO dates; precision is `exact | day | month | year |
  range | approx`. A range is written `2025-04-01..2025-04-30`. Never sharpen a
  date beyond its source.
- **Evidence Type**: document, record, witness, expert, physical, electronic,
  party testimony. **Authenticity**: `ok | disputed | unknown | at risk`
  (deepfake, altered metadata, unsigned copy). **Status**: `in file | to obtain |
  requested | at risk | unavailable`.
- **Issues**: one header row per claim, defence or question, then one row per
  element. **Burden**: the party who has to prove the element (burden of
  assertion and burden of proof, per the jurisdiction pack §11 (Burden and standard of proof)).
  **Standard**: the standard of proof, tagged. **Status**: `proven | disputed |
  missing | open | conceded`.

## Rules

- **Surface, don't decide.** Whether evidence meets the standard of proof is a
  judgment for the lawyer. Models judge this poorly. Mark the element `disputed`
  or `missing` and say what the gap is; never mark it `proven` on thin evidence.
- **Allegation vs proof.** Every Issue element links the facts that satisfy it
  *and* the evidence for those facts. A fact with no evidence is a gap, even if
  the client is sure.
- **Both sides.** Record facts the other side asserts and evidence that weakens
  ours (`Weakens`). A one-sided fact map is the commonest strategic blind spot.
- **Inconsistencies are findings.** Two sources that disagree (dates, amounts,
  who said what) get two rows, both `Contested = Y`, plus a line in the matter's
  `issue-log.md`.
- **Preservation.** Evidence with status `at risk` triggers a preservation
  action (a legal hold, a request, a notarial record of a web page), listed in
  `deadlines.md`.
- **Privacy.** Use roles or initials for private individuals unless the name is
  needed. The fact map is client-confidential and never leaves the firm as it is.

## Views

| View | Built from | Owner skill |
|---|---|---|
| Chronology (`chronology.md`) | Events sorted by date, with Facts and Source; gaps and inconsistencies listed after the table | `legal-dispute`, `legal-intake` |
| Claims and defences matrix (`claims-matrix.md`) | Issues with their elements, burden, facts, evidence, status | `legal-dispute` |
| Gap table (`gaps.md`) | Issue elements and facts with `missing` / `to obtain` | `legal-intake` |
| Witness outline | Facts asserted by or known to one witness, plus the exhibits to put to them | `legal-dispute` |

In a deliverable (submission, memo, report), factual statements carry their
fact ids in the **annotated** version (`[F3]`). `trace.py` checks they resolve
and have evidence. The **clean** version drops the ids, and `scan.py outbound`
confirms none are left.
