---
name: debrief
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, configure, context
  delta: debrief
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# debrief (legal-project · mode)

**Object of work.** The retrospective record of a closed matter.
> **Imports.** Obey the capability files named in the front-matter `metadata.imports`; do not restate them. This file carries only the mode's delta.


The Debrief hat. The object of work is **a matter that has ended**. It is the
closed-case sibling of the handoff mode: the same structure, read backwards, so
the firm keeps the record and learns from it. It performs no new legal work.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. Registers:
`../legal/references/matter-folder.md`.

## Document & register synthesis

Synthesize the existing matter registers and documents as one logical unit. No
new AST box is needed unless a newly received final decision or settlement must
be mapped at closure; reference existing maps and register rows directly.

## The handoff structure, for a closed matter

Use the sections of the handoff mode (`references/modes/handoff.md`,
`handoff.md`) as the skeleton — background,
intention, what was done, decisions, legal strategy and base qualification,
documents — with these differences for a closed matter:

1. **Outcome.** What was actually achieved against each objective and success
   criterion: `met | partly met | not met`, and why. A verdict on the result, not
   a summary of activity.
2. **What changed and why.** The end state versus the initial state: the final
   documents, the agreed position, the settlement or judgment, the concessions.
3. **Decisions taken.** The full `decisions.md`, each with its reasoning and the
   rejected alternatives.
4. **Obligations surviving closure.** From `obligations.md`: what still binds the
   client after closing (renewals, notices, confidentiality, payment,
   warranties, reporting), each with its owner and next due.
5. **Realised and residual risks.** What materialised; what remains open;
   anything handed to the client or to another adviser.
6. **Lessons and playbook feedback.** Every `YELLOW`, `RED` or `UNCOVERED`
   outcome in `deviations.md`, and what it suggests for the next playbook version
   (a proposal, for the playbook's owner). Note what the firm would do
   differently.
7. **If the matter reopens.** What a successor would need — a pointer to
   `handoff.md` and the current `matter.md`.

## Rules

- **Honest outcome.** Report what happened, including losses and accepted risks;
  no flattery, no hindsight heroics.
- **No new analysis, no re-argument.** The debrief records; it does not reopen.
- **Grounded.** Facts, decisions and outcomes cite their register rows.
- **Closed matter.** For a live matter, use the handoff mode.

## Output

`debrief.md` in the matter folder plus `debrief.docx` beside it
(`../legal/scripts/md2docx.py`, after `scan.py outbound`), plus a short
card: the outcome, the biggest residual risk or surviving obligation, and
the playbook feedback proposed. Close with the `FILES` links (clickable,
absolute, persisted) and the Progress box. Screen follows
`../legal/references/display.md`.

## Checks

- **coverage**: every objective and success criterion has an outcome; every
  register is represented.
- **feedback loop**: `deviations.md` is complete; proposed playbook updates are
  listed, not applied here — playbook maintenance is the owner's call.
- **release safety** (`scan.py outbound`) if the debrief leaves the firm.

## Fan-out

Read-only synthesis: a read-only packet per register or outcome area; playbook feedback comes from `deviations.md`. `debrief.md` has **one writer**. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Reopen a closed matter or re-argue an outcome: it records what happened and what to reuse.
- Turn lessons into fresh advice for a new matter: lessons are recorded; the new matter gets its own analysis.
- Skip the negative knowledge: what *not* to do is as valuable as what worked.

## Counter-example (illustration)

*Illustration, not law.* The debrief lists only what went well. **Mistake to catch:** the failure modes and their fixes were dropped, so the next matter repeats them. Correct: record the misses and the corrections alongside the wins.
