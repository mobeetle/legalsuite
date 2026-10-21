---
name: legal-project
description: "Project door for a legal matter for any legal system: open or resume the matter folder, decompose into work items, run the status board, keep the registers (deadlines, decisions, history, versions, issues), run a closing checklist with conditions precedent and critical path, track post-signing obligations and renewals, integrate deliverables, hand a live matter over to a colleague (handoff.md) and record a closed one (debrief.md). Use when work spans several documents, steps or skills, or the user says matter, project, checklist, status, what's next, closing, CP list, hand off, handover, debrief, close the file, lessons learned (CS: spis, věc, stav věci, co dál, checklist, closing, odkládací podmínky, předání věci, převzetí spisu, shrnutí spisu, uzavření věci, zhodnocení, poučení, retrospektiva, uzavřít spis). Holds project (this file), handoff and debrief as references/modes/*.md. Load alongside the legal engine."
license: Apache-2.0
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, challenge, verify, context
  delta: project
  version: 1.0
  last_validated: 2026-10-16
  category: door
---

# legal-project (project · handoff · debrief)

**Object of work.** Running, handing over or closing a matter.
> **Imports.** Obey the capability files named in the front-matter `metadata.imports`; do not restate them. This file carries only the mode's delta.

The PM door. The object of work is a **process**: deliverables across documents,
stages and skills. Decompose by **work item**, keep the registers, integrate.
This is where delegation is genuinely safe, because items are usually
independent.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. The folder
layout and register formats are in `../legal/references/matter-folder.md`.

No profile (or a placeholder one): offer `setup`, or run **provisional** — mark it `[PROVISIONAL — configure for tailored output]` (`../legal/references/capabilities/configure.md`).

## Modes in this door

Project (this file) is the default. Read the mode's file before doing its work:

| Mode | File | Object of work |
|---|---|---|
| project | this file | run a multi-deliverable matter: board, registers, closing, obligations |
| handoff | `references/modes/handoff.md` | brief a colleague taking over a live matter |
| debrief | `references/modes/debrief.md` | the retrospective record of a closed matter |

## AST obligation — non-negotiable

When the matter turns on documents or decisions, destructure them: build and
print the AST (grammar: `../legal/references/ir-and-provenance.md`) in one fenced `text` box, or state in the
first line why not. Read the matter's documents both individually and as one
logical unit; a document you didn't consider is a defect.

## Object of work

- **Unit of decomposition:** a work item (one document, one issue, one step),
  each owned by one skill.
- **Parallelism:** real. Fan out read-only per item. Write fan-out only where
  items are disjoint documents. Never two writers on one document.
- **Failure modes:** a missed item, a missed date, scope drift, inconsistent
  positions across documents, a decision nobody recorded. The registers exist
  to catch these.

## Operations

### open / resume (default)
1. **Open:** create `.legal/<slug>/` with `matter.md` and `state.json`. If
   the engine's intake already opened it, read `parties.md`, `facts.md`,
   `deadlines.md` and the gap table. **Resume:** read `matter.md`, `state.json`,
   `deadlines.md`, the last 20 lines of `history.md` and `decisions.md`, then
   give the status card (what's due, what's blocked) and close the turn with the
   closing pair (`../legal/references/display.md`): `FILES` links, then the
   **Progress box** (steps done / current / next).
2. **Triage + Gate Plan** (engine). Clustering here is by work item.
3. **Status board** in `matter.md`: one row per item, giving skill, owner
   (parent / sidecar / human), status, blocking?, file. Mirror it in
   `state.json.active_items`.

### run
1. **Execute packets.** Keep the critical path in the parent. Delegate bounded
   read-only items with a packet (`packets/<item>.md`: task, inputs, stance,
   expected output, exit criteria); returns go to `results/<item>.md`.
2. **Integrate.** Deduplicate findings into `issue-log.md`. Check consistency
   **across** documents (the failure mode unique to this hat): same term, same
   definition; same issue, same position; same party, same identifiers; same
   date, same value.
3. **Keep the registers current** after every work item: `deadlines.md`,
   `decisions.md` (human decisions only), `history.md` (append-only),
   `versions.md` (what went to whom).

### closing (transactions)
`closing.md`: the conditions precedent and completion deliverables:

```
| # | Item | Type (CP / deliverable / filing / consent / payment) | Responsible party | Depends on | Due | Status | Evidence of satisfaction |
```

Mark the **critical path**: the chain of dependent items that sets the earliest
completion date. Put regulatory clearances (merger control, FDI screening),
third-party consents, corporate approvals and registrations on it first.
Nothing is `done` without its evidence (a signed document, a register extract,
a clearance decision).

### obligations (post-signing)
`obligations.md`: what the signed documents oblige each side to do from now on:

```
| # | Obligation | Party | Source (doc §) | Trigger / frequency | Next due | Notice / renewal window | Consequence of breach | Owner |
```

Every dated item (renewal, opt-out window, reporting, price review, warranty
expiry, claim deadline under the limitation clause) also goes to `deadlines.md`.
Renewal and termination windows are calculated back from the expiry date using
the contract's notice rule.

### close
1. Confirm that every deliverable is `done` or explicitly `deferred`, and every
   deadline is `met`, `n/a`, or handed over.
2. Hand the matter over with the handoff mode (`references/modes/handoff.md`,
   `handoff.md`) when a successor will take it on, and record the closed matter
   with the debrief mode (`references/modes/debrief.md`, `debrief.md`).
   Both are views of this folder: outcome, final versions (from `versions.md`),
   open obligations and deadlines with owners, decisions taken, residual risks,
   and where everything is.
3. Confirm that `deviations.md` is complete for every playbook-bound document.
4. Set `matter.md` status to `closed`, and append to `history.md`.

## Checks

- **Coverage:** every deliverable on the board is addressed or explicitly deferred.
- **Cross-document consistency** (above), run by the verify capability (`../legal/references/capabilities/verify.md`) at the
  deliverable checkpoint for multi-document suites.
- **Deadlines:** none `open` without an owner; nothing due within 30 days off
  the first card.
- the challenge capability (`../legal/references/capabilities/challenge.md`) is proposed at the deliverable checkpoint for `RISK = high` matters.

## Fan-out

One read-only packet per independent work item; one write-capable subagent per **disjoint document**. Decisions, the board and integration stay in the parent. Protocol: `../legal/references/capabilities/orchestrate.md`.

## Output

Status card + board + assembled deliverables + `final-report.md` (outcome,
files, open items, residual risk) plus `final-report.docx` beside it
(`../legal/scripts/md2docx.py`, after `scan.py outbound`), all linked in the
closing `FILES` block. A live handover is the handoff mode
(`references/modes/handoff.md`, `handoff.md`); a closed matter is the debrief
mode (`references/modes/debrief.md`, `debrief.md`). Keep the final answer shorter
than the report. Screen follows `../legal/references/display.md`.

## What this mode does not do

- Run another mode's work inline: it names the hand-over and waits for the gate.
- Advance past an unapproved gate, or read one "continue" as authorization for the whole roadmap.
- Close a matter with open obligations, or without recording the decisions and the debrief.

## Counter-example (illustration)

*Illustration, not law.* Four deliverables are tracked on the board; one is quietly written during the status update. **Mistake to catch:** the project door did the review itself instead of handing over. Correct: name the next mode, keep the board current, wait for the user.
