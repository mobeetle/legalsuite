---
name: draft
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, challenge, verify, context
  delta: draft
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# draft (legal-review · mode)

**Object of work.** One document's text: new text or a revision, precedent first.
> **Imports.** Obey the capability files named in the front-matter `imports:`; do not restate them. This file carries only the mode's delta.


The Drafting hat: **DRAFTING** (new text) and **REVISION** (text changed from
instructions, comments or markups). Same universal AST, same phases 9–11
(challenge, verify, apply) as the review mode — the difference is only the
object: this mode writes, review judges. The parent is the single writer.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. This file
adds only what is draft-specific. Scripts: `../legal/scripts/`.

## 0. Precedent first

Practice drafts from precedent, not from a blank page. Before writing, ask for
or find a precedent, in this order: the client's template, the playbook's
clause library, the firm's precedents (profile *Precedents*), and the
counterparty's form (when tactically acceptable). Name the precedent used in
the cover note. With no precedent, draft from the map and the jurisdiction
pack, and say so. Then build the reuse vocabulary from the swept context and
draft to it (`../legal/references/capabilities/context.md`): same situation,
same wording — a deliberate departure names its reason.

Submissions to a court or arbitral tribunal: the procedure, facts and
arguments come from `legal-dispute`. This skill writes the text to that plan.

## AST obligation — non-negotiable

Build the AST (the **intended** structure) before you write a line, print the
**full** tree every turn in one fenced `text` box, and draft to it. A `Trace`
here is a discarded alternative — with its trade-off; `Edges` are the intended
cross-references. Across a document family (base + amendments) it is still one
tree. Every drafting choice of substance cites its node.

Grammar and structure: `../legal/references/ir-and-provenance.md`.

**Urgency.** Treat every clause as if it will be litigated. Never truncate, no
placeholders, no "[as before]". Never invent a fact — blank `[● label]`
instead. Never ship a clause without a node in the intended tree.

**Consent.** Ask, never infer a load-bearing gap; a write outside the matter folder needs an approved manifest (`gate.md`).

## DRAFTING

**Climb the economy ladder first** (`../legal/references/capabilities/economy.md`): if a rung
holds, the outline entry is one line naming the rung and what it relies on — an
existing defined term, a default rule, a standard form, or a cross-reference. Do
not manufacture clauses the matter doesn't need; the ladder is the deletion pass
*before* the draft, not after it.

1. **Intended structure first.** Build the document map (engine IR) as the
   *intended* design: parties, functions, control flow, edges. Draft to the map.
2. **Architecture** (below). Definitions, then operative clauses, then
   conditions and remedies, then boilerplate. Reuse standard provisions that fit
   the jurisdiction and the playbook.
3. **Enforceable covenants.** Actors, triggers and consequences unambiguous.
   One rule, one place.
4. **Every clause in full.** No truncation, no ellipsis, no "[as before]".
5. **Blanks, not inventions.** Every fact you don't have (names, identifiers,
   amounts, dates, addresses, account numbers) becomes `[● label]`, and every
   blank goes in the **Blanks schedule** at the end: blank · what's needed · who
   provides it. Never fill a blank with a plausible guess.
6. **Drafting notes** for open choices: `[Drafting note: option A … / option B
   …; we recommend A because …]`. They appear only in the annotated version.
7. **Formalities** (pack §5 (Formalities & execution)): written form, signatures and their verification,
   notarial deed, qualified electronic signature, registration or publication
   as a condition of effectiveness, consents (corporate, spousal, regulatory),
   language of record and a prevailing-language clause for bilingual text. List
   them in the cover note as execution steps.

## Artifact architectures

- **Transactional** (contracts, amendments, policies): Title and parties →
  Recitals → Definitions → Operative covenants → Representations, warranties,
  indemnities → Remedies and termination → General provisions → Signatures →
  Schedules.
- **Amendment**: Parties → Recitals (the agreement amended, by date and any
  previous amendments) → Amendments (each as "Clause X is replaced/deleted/
  inserted as follows", with full text) → Effectiveness → Everything else
  unchanged → Signatures. Check the amended agreement's own amendment
  formalities.
- **Advisory memo**: Question → Short answer → Facts relied on (`[USER]`/
  `[DOC]`/`[ASSUMED]`, fact ids) → Analysis per issue (rule `[AUTH:A…]`,
  application, contrary view, risk) → Recommendation and next steps → Authorities.
- **Letter** (client, counterparty, authority): Purpose in the first paragraph
  → Facts → Position or advice → What we ask, or what happens next, with a date
  → Formalities (delivery method, e.g. registered post, court portal, data box). Pre-action
  letters follow `legal-dispute`'s demand requirements.
- **Contentious / submission**: built to `legal-dispute`'s procedural map:
  court/tribunal and case number → parties and representation → what is sought
  → facts, each with its evidence designation (`[F…]`/`[X…]` in the annotated
  version) → legal grounds `[AUTH:A…]` → answer to the other side → the exact
  relief sought (exact prayer for relief / order sought, e.g. *petit*), drafted to be enforceable → evidence list →
  annexes. The pack §8 (Civil procedure & relief requirements) sets the required particulars.

## REVISION

1. **Root-cause each input.** For every markup or comment, diagnose the cause:
   drafting error, substantive problem, structural flaw or tone.
2. **Minimum intervention.** Touch only the deficient provisions. If a fix needs
   a broader change, say so before making it.
3. **Compromise redlines.** Where a change is contested, give the playbook
   fallback alongside the preferred wording.
4. **Reproduce the whole document,** revised and unchanged clauses alike, so the
   output is ready to execute.
5. **Version it.** Save the new version under `drafts/<doc>-v<n>` and add a row
   to `versions.md` when a matter folder exists.

## Drafting to the intent layer

Draft against the Gate Plan's goals and success criteria. Where a choice
involves a genuine trade-off (scope vs enforceability, specificity vs
flexibility, protection vs acceptability to the counterparty), name it in a
drafting note and present the options. Don't resolve it alone.

## Output

- **Clean version**: no drafting notes, no tags, no fact ids; blanks remain as
  `[● …]` with the schedule.
- **Annotated version** (internal): drafting notes, provenance on non-obvious
  choices, fact and authority ids in submissions.
- **Cover note** (≤1 page, shaped for `AUDIENCE`): precedent used, key choices
  and why, open points, blanks to fill, execution formalities and steps.
- **Word**: every user-facing draft and cover note is exported to `.docx` with
  `md2docx.py` (after `scan.py outbound`) — never omitted as an economy. For
  tracked changes against the previous version, `redline.py`.

## Checks

- **structure** on every draft: `structure.py <draft>`. Numbering,
  cross-references, definitions (undefined, scope leak, overlap), blanks
  schedule. Fix the fails before handing the draft over.
- **house style** on every draft: `style.py <draft>`. Thematic breaks, `&`,
  filler words, a bullet in front of an `(a)`/`(i)` item. Fix the fails; a
  banned word is the drafter's call.
- **link grounding** when the draft incorporates anything by URL: `links.py
  <draft>`. A dead link is a finding, not a detail; then read the page
  (`../legal/references/capabilities/ground.md`).
- **substance-preservation** on every revision: `substance.py ORIGINAL
  REVISED`. Every dropped token and every semantic flip is either an intended
  change named in the cover note or a defect.
- **trace** for memos and submissions: `trace.py <annotated> --facts facts.md
  --authorities authorities.md`.
- **release safety** on the clean version before it leaves the firm:
  `scan.py outbound <clean>`.
- For `RISK = high`, propose the challenge capability (`../legal/references/capabilities/challenge.md`) before final output.

## Fan-out

Drafting is single-writer: **one document, one writer, the parent.** Only read-only support fans out — precedent-finding, clause-library recall, research. A suite of disjoint documents may have one writer per document; the parent reconciles terminology and cross-references. Protocol: `../legal/references/capabilities/orchestrate.md`.

## Guardrails

Minimum intervention, blanks not inventions, single responsibility, structural
consistency and the quality attributes apply (`../legal/references/capabilities/guard.md`).
The deliverable stays in the source document's language, or the client's stated
language for new drafting.

## What this mode does not do

- Draft from scratch before checking precedent and the deal suite (economy: reuse over create).
- Vary mandatory law or a formal requirement to fit a template.
- Ship text without substance-preservation and, where a playbook is bound, its positions.

## Counter-example (illustration)

*Illustration, not law.* A new clause is drafted where the framework agreement already covers it. **Mistake to catch:** a fresh standalone provision conflicted with an existing defined term. Correct: cross-reference the existing clause (economy rung 2).
