---
name: handoff
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, configure, context
  delta: handoff
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# handoff (legal-project · mode)

**Object of work.** A live matter handed to the colleague taking it over.
> **Imports.** Obey the capability files named in the front-matter `imports:`; do not restate them. This file carries only the mode's delta.


The Handover hat. The object of work is **the matter as it stands now**, written
so that a lawyer who has never seen it can take over and continue. It creates no
new legal analysis; it synthesises what the matter folder holds and states what
is missing.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. Registers:
`../legal/references/matter-folder.md`.

## Document & register synthesis

Synthesize the existing matter registers and documents as one logical unit. No
new AST box is needed unless a newly received decision or contract must be
mapped at handover; reference existing maps and register rows directly.

## Before writing

Read the whole folder, current state first: `matter.md`, `state.json`,
`plan.md`, `orchestration.md`, `decisions.md`, `deadlines.md`, `history.md`,
`versions.md`, `issue-log.md`, `deviations.md`, `parties.md`, `facts.md`,
`authorities.md`, and the skill artifacts. A handoff is a view of all of them.
Then check: every item below is either filled from the folder or written as a
gap. Do not paper over a missing register with plausible prose.

## Contents of `handoff.md`

1. **Matter snapshot.** Title, client, side, responsible lawyer, status, scope,
   jurisdiction, language, key dates — one paragraph a reader can stop at.
2. **Background and initial state.** How the matter arose; the facts as known,
   each with its source tag; what was at stake at the start.
3. **Intention and objectives.** The client's stated and inferred objectives,
   the success criteria from the Gate Plan, and the side we act for.
4. **What has been done.** Each deliverable and analysis produced, with its file
   path and current status; what was sent, filed or agreed.
5. **Decisions taken.** From `decisions.md`: the decision, who decided, on what
   advice, and the alternatives considered and rejected. Note the open decisions.
6. **Legal strategy and base qualification.** The theory of the matter in one
   page: the legal basis and how it applies to the facts, each authority via its
   ledger row `[AUTH:A…]`, the facts it rests on `[F…]`, the contrary positions
   and the open legal points. Grounded in the facts, not asserted.
7. **Current position.** Where the matter stands; what has been conceded or
   agreed; what the other side has done.
8. **Immediate risks and actions.** What must be decided or done now, and why;
   anything with a deadline inside 30 days goes to the top.
9. **Deadlines.** From `deadlines.md`: each with its rule, trigger, basis, owner
   and status; the nearest first.
10. **Challenges and blockers.** What blocks progress — a missing document, an
    unresolved conflict, a pending approval, a counterparty, a court — and who
    owns each.
11. **Case directory and documents.** The folder structure; documents available
    (received, read-only); documents created; **documents missing** (the gaps and
    the document requests). A reader should be able to find everything.
12. **Recommendations and next steps.** What a successor should do first,
    ranked, each with a reason and any dependency, naming the skill that runs it.
13. **Residual risks.** Open exposures, unverified authority, accepted risks,
    and the confidence in the assessment.

## Rules

- **Facts, not impressions.** Every statement is tagged (`[DOC] [AUTH] [USER]
  [INFER] [ASSUMED]`); an `[AUTH]` names its ledger row.
- **No new analysis.** If a step is missing, name it as a next step; don't do it.
- **Gaps are content.** A missing register, an unknown deadline trigger, an
  unfilled blank — each is stated as an open item, not smoothed over.
- **Mid-term.** This is for a live matter. A closed matter is the debrief mode
  (`references/modes/debrief.md`).
- **Verified or flagged, never established.** Run the `verify` battery before
  writing. An `[ASSUMED]` or `[verify]` item is handed over as open with its
  flag intact; nothing unverified is written as a finding of the matter.
- **Negative knowledge is a section, not a footnote.** Record what the
  successor must not retry: rejected routes and why, closed issues, settled
  points, and any clause that is deliberately asymmetric — do not "fix" it.

## Output

`handoff.md` in the matter folder plus `handoff.docx` beside it
(`../legal/scripts/md2docx.py`, after `scan.py outbound`), plus a short
card: the three things the successor must do first, the nearest deadline,
and the biggest open risk. Close with the `FILES` links (clickable, absolute,
persisted) and the Progress box. Screen follows
`../legal/references/display.md`.

## Checks

- **coverage**: every register and skill artifact in the folder is represented in
  the handoff or listed as missing.
- **deadline integrity**: every deadline has a rule, a trigger and a basis;
  nothing due within 30 days is off the card.
- **verification**: the `verify` battery ran and its table is quoted; every
  `[ASSUMED]` / `[verify]` item is listed as open.
- **release safety** (`scan.py outbound`) if the handoff goes to anyone else — it
  holds privileged material, so it leaves the firm only as the lawyer decides.

## Fan-out

Read-only synthesis: a read-only packet per register or section group. `handoff.md` has **one writer** — the parent. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Summarise without provenance: state, intention, what was done, decisions, strategy, deadlines, documents, risks — each from the file.
- Resolve open items to make the file look tidy: open findings stay open, with their status.
- Replace the recipient's own check: it hands over, it does not certify.

## Counter-example (illustration)

*Illustration, not law.* The hand-over says "review complete". **Mistake to catch:** open `[HIGH]` findings were smoothed into "complete". Correct: carry the finding statuses verbatim and name what is still open.
