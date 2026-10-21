---
name: legal-intake
description: "Front door of a legal matter for any legal system: qualify a lead or instruction against the intake matrix (scope, conflicts, economics, capacity, urgency), engage fast through lead stages, capture the story into facts, parties, gaps and deadlines, and open the matter for the next door. Use for a new inquiry, lead, prospective client, in-house instruction, triage, conflicts pre-screen or intake forms (CS: poptávka, nový klient, nová věc, příjem věci). Holds intake as its core. Load alongside the legal engine."
license: Apache-2.0
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, context, challenge, verify
  delta: intake
  version: 1.0
  last_validated: 2026-10-16
  category: door
---

# legal-intake (front door)

**Object of work.** A lead becoming a matter: qualified, engaged, captured, opened — and routed to the door that does the work.
> **Imports.** Obey the capability files named in the front-matter `metadata.imports`; do not restate them. This file carries only the mode's delta.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. Fact map
format: `../legal/references/fact-map.md`. Registers:
`../legal/references/matter-folder.md`. Scripts: `../legal/scripts/`.

No profile (or a placeholder one): offer `setup`, or run **provisional** — mark it `[PROVISIONAL — configure for tailored output]` (`../legal/references/capabilities/configure.md`).

## Modes in this door

Intake (this file) is the core and, in v1, the only mode. A per-case-type form
generator is deferred until a real case type needs it; until then the document
request list (phase 6) is the form.

| Mode | File | Object of work |
|---|---|---|
| intake | this file | qualify → engage → capture → open: from first contact to a matter with a next door |

## 0. Qualify gate (intake matrix)

Before anything is captured, the lead meets the firm's **intake matrix**: rows
are case types / client segments, columns are the acceptance criteria — scope
fit, conflict risk, economics, capacity, urgency. Each cell carries a playbook
stance (`../legal/references/capabilities/positions.md`): **accept**
(preferred), **conditions** (fallback: take only with the named approver's
sign-off, e.g. a deposit, a capped scope, a timeline), **decline / refer-out**
(walk-away). The matrix is firm-owned configuration (kept beside the
playbooks); with no matrix bound, qualify provisionally from the profile and say
so. No matrix at all? Offer to draft one from the interview
(`../legal/references/capabilities/configure.md`, authoring); it stays draft
until the owner approves.

- Any decline cell decides the row: the lead is declined or referred out —
  advice-free, in the client's language, passing `scan.py outbound`. No views on
  the merits, no fee promises, ever.
- Conditions cells become the engagement options of the scope proposal
  (phase 7): what is included, on what terms, decided by whom.
- The conflict-risk column never auto-clears: the suite prepares the
  parties/conflicts list (phase 2) and **a human runs the check**.
- The urgency column sets the clock: an `expedite` cell shortens first response
  and tops the first card.

**Lead stages.** Track `new → contacted → qualified → consulted →
engaged / declined` in the intake memo header until the matter opens; no lead
sits uncontacted. First response is same-turn fast; anything past the firm's
clock is stated on the card.

**In-house and existing-client instructions.** Where conflicts are pre-cleared
and no prospective-client lead-stage pipeline applies, the Qualify Gate
compresses to a 1-line scope, urgency and capacity check so capture starts
immediately.

**House context first** (`../legal/references/capabilities/context.md`): sweep
the host's tools and connectors for prior matters, policies and guidance on
this lead before qualifying; build the reuse vocabulary before writing anything
client-facing.

## Guardrails specific to intake

- **No advice and no implied engagement before conflict clearance.** Until a
  human clears conflicts, outputs addressed to the prospective client are
  limited to questions and document requests. No views on the merits, no
  outcome or fee promises.
- **The suite never engages a client by itself.** Accepting the engagement is a
  human approval; a declined lead gets a polite close, never silence.
- **Questions don't suggest answers.** "When did you first learn of the
  defect?", not "You learned of it only in May, right?"
- **Record what was said, as said.** The client's account is `[USER]`, the
  documents are `[DOC]`. Nothing becomes a fact by repetition.
- **Confidentiality from the first message.** No client facts in web searches;
  minimum packets to subagents.

## Scoped AST obligation

Intake focuses on rapid triage, the time-bar sentinel, conflict pre-screening,
and the Fact Map (`facts.md`). Build and print the AST (grammar:
`../legal/references/ir-and-provenance.md`) in one fenced `text` box **only**
when intake is handed a pivotal contract, contract family or decision that must
be destructured immediately to spot urgent deadlines or blocking gaps;
otherwise skip the AST at intake and leave structural mapping to the substantive
door (`legal-review` or `legal-dispute`).

## Phases

1. **Capture.** Read the narrative and every document (`scan.py inbound` on
   received files). Write each fact as a row in `facts.md`: one proposition,
   source anchor, tag, asserted by. Events go to the Events table with honest
   date precision ("a while ago" becomes a question, not a date). Write down
   the client's objectives: stated and inferred (`[INFER]`), and the two kept
   apart.
2. **Parties and conflicts list** (`parties.md`): client, adverse parties,
   related entities (parents, subsidiaries, owners, officers), other
   participants, prior or opposing counsel, with identifiers where known
   (pack §12 (Public registers)). The suite prepares the list. **A human runs the
   conflict check and clears it** (pack §14 (Professional ethics, conflicts & AML)). Mark the matter `conflicts:
   pending` until then.
3. **Urgency screen.** Before anything else is analysed:
   - time bars and procedural deadlines running or about to start (pack §6 (Limitation & time bars), pack §7 (Computing time & delivery rules), pack §8 (Civil procedure & relief requirements)),
     each computed conservatively from its trigger, with the trigger's own
     certainty stated;
   - contractual notice, cure and claim windows;
   - need for interim relief (asset flight, ongoing harm);
   - **evidence at risk**: e-mails on auto-delete, CCTV overwritten, web pages,
     witnesses leaving. Each one gets a preservation action (legal hold,
     notarial record, request).
   Record the time-bar search itself — rules tested, their source, and the result
(`applies` / `does not apply` / `unknown`) — so a clean answer is distinguishable
from an unchecked one. Everything dated goes to `deadlines.md`; anything within 30 days tops the
   first card.
4. **Issue spotting** across areas (contract, tort/damage, property,
   the area or areas of law the matter touches
   or its officers, tax), using pack §13 (Regulatory overlays) for regimes. Each issue becomes an
   Issues row in `facts.md` (status `open`) with the facts it depends on.
5. **Gap analysis** (`gaps.md`, a view of the fact map):

   ```
   | # | Issue | What we know (tag, F-ids) | What's missing | Why it matters (which outcome it changes) | Who likely has it | Blocking? |
   ```

   "Blocking" means the next step (advice, a demand letter, a filing, a
   preservation measure) can't be taken without it.
6. **Follow-up questions and document requests.** Blocking items first, ≤7
   questions per round, one fact per question, plain words in the client's
   language, no legal jargon, no leading. Then the **document request list**:
   named documents ("the signed contract with all amendments, the e-mail
   terminating it, invoices 2025"), never "all relevant documents".
7. **Scope proposal.** 1–3 engagement options (advice only / negotiation or
   demand / dispute or transaction), each with what is included, key
   assumptions, exclusions, the first steps and their urgency, and a fee-basis
   placeholder (`[● fee basis]`) for the lawyer. Options honour the matrix
   conditions cells from the qualify gate.
8. **Engagement checklist** (human actions, as a list in `matter.md`):
   conflict clearance; client identification and AML/KYC where the matter
   falls under the AML rules (pack §14 (Professional ethics, conflicts & AML)); engagement letter; power of attorney
   where needed; confidentiality and communication instructions (who may
   instruct, which channels); privilege handling.
9. **Open the matter.** Write `matter.md`, `parties.md`, `facts.md`, `gaps.md`,
   `deadlines.md` and `history.md`. The lead stage flips to `engaged`.
   Carry the client's objectives (phase 1, stated vs `[INFER]` kept apart) into
   the next door's Gate Plan as its `GOALS`/`SUCCESS CRITERIA` — intake captures
   the goal, the Gate Plan confirms it. Recommend the next door: `legal-research`
   (a question to answer), `legal-review` (a document, a markup, due diligence,
   compliance), `legal-dispute` (a claim or defence), or `legal-project`
   (several of these).

## Iterating

When answers or documents arrive: add the facts (with their source and date of
the answer), close or narrow gaps, recompute any deadline whose trigger has
become known, re-rank the remaining questions, and log the round in
`history.md`. **Stop** when no open gap would change the recommended next step.
That's the engine's minimum sufficient inquiry. Then hand over.

## Output

- **First card**: lead stage and response clock; urgent deadlines and
  preservation actions; conflict check status; the 3–5 issues spotted; the
  blocking gaps.
- **Client-facing message** (`AUDIENCE = client`): the questions and document
  requests, plus one line on what happens next. No advice before clearance.
  Passes `scan.py outbound`.
- **Internal intake memo** (`intake.md`): lead stage, matrix outcome (accept /
  conditions / decline with the deciding cells), summary of the story,
  objectives, parties, issues, gaps, deadlines, scope options, engagement
  checklist.

## Checks

- **trace** on `intake.md`: every fact statement resolves to `facts.md`.
- Every deadline has a rule, a trigger and a basis; unknown triggers are gaps.
- Every party named anywhere in the facts is in `parties.md`.
- The matrix outcome names its deciding cells, or states the provisional basis.

## Fan-out

One read-only packet per received document, and per issue area. The parent owns `facts.md`, `parties.md`, `gaps.md`, the deadlines and the memo. Minimum packet: excerpts, roles not names. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Analyse on intake: it captures the story, parties, urgency and gaps; analysis is the mode that follows.
- Fill a load-bearing gap by inference: it asks, or records a blank.
- Open the matter without the time-bar sentinel and the parties/conflicts list.
- Qualify without the matrix (or a stated provisional basis), engage a client without human approval, or clear conflicts itself.

## Counter-example (illustration)

*Illustration, not law.* The story is vague on a date, so intake writes a plausible one. **Mistake to catch:** an invented date entered the fact register unmarked. Correct: record it as unknown (precision `unknown`) and ask, or tag the inference.
