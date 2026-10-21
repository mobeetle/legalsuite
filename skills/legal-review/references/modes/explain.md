---
name: explain
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, positions, configure, challenge, verify, context
  delta: explain
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# explain — client explanation (E4)

> **Imports.** Obey the capability files named in the front-matter `metadata.imports`; do not restate them. This file carries only the mode's delta.

**Object of work.** Turn an **approved** memo or advice into plain language for a
named recipient. The source is the approved text, never your own analysis: this
mode **explains**, it does not advise.

## Phases

1. **Frame the recipient.** Who reads this, and what may they be told
   (`guard.md`)? Confirm the recipient and the permitted disclosure *before*
   writing; an explanation to a third party needs explicit clearance.
2. **Transform, statement by statement.** For each substantive statement in the
   memo, write a plain-language sentence **and** a link-table row pointing at the
   memo section or quote it came from.
3. **Add nothing.** No advice, no promise, no deadline, no number that is not in
   the memo. Where the memo is silent, say "the memo does not say" rather than
   filling the gap.
4. **Shape it.** Quiet mode (`present.md`): recipient-facing, no internal
   narration or command handoffs.

## Artifact

`explanation-<memo>.md` holding:

- the plain-language body;
- a **link table** `| Plain statement | Memo source |`, one row per substantive
  statement; and
- a closing compliance statement: *every statement above traces to the memo it
  explains; nothing was added.*

## Exit criteria

- Every substantive statement has a link-table row; no row points outside the memo.
- No statement was added that is not in the memo.
- Recipient and permitted disclosure were confirmed.

## Checks

- Every statement resolves through the link table (no unlinked statement).
- `../legal/scripts/scan.py outbound` passes before it is sent (`guard.md`).

## Fan-out

One read-only packet per memo section for large memos; the **link table and the
compliance statement** are written by the parent. Protocol:
`../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Give new advice, or answer a question the memo did not.
- Translate a disclaimer or caveat out of the memo, or soften it.
- Go to a third party without confirmed disclosure clearance.

## Counter-example (illustration)

*Illustration, not law.* A memo says the non-compete is "likely unenforceable as
drafted (the 12-month term exceeds the statutory cap)". **Mistake to catch:** the
explanation writes "you are free to work for a competitor" — dropping *as drafted*
and turning a conditional into a promise. The correct explanation keeps the
condition and links it: "the clause as written probably would not hold (memo §3)".
