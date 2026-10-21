# configure — capability

**Contract.** Build and update the practice profile, run provisionally when there
is none, pause and resume a setup without re-asking, and change one section at a
time. The profile is what turns generic output into the firm's output.

Template and setup interview: `references/profile.md`.

## Context layers (read before the Gate Plan)

Read what exists. Missing layers are not errors; they become `[ASSUMED]`.

| Layer | Where | Gives |
|---|---|---|
| Practice profile | `.legal/profile.md`, else `~/.legal/profile.md` | Default side, posture, audience, language, house style, approvers, precedents, approved tools |
| Jurisdiction pack | `jurisdictions/<code>.md` in the engine (one per jurisdiction; format in `_template.md`) | Sources, citation format, formalities, time bars, procedure, overlay regimes, terminology |
| Regime pack | `regimes/<code>.md` in the engine, one per regime the practice uses | Scope tests, obligations, deadlines, contract touchpoints |
| Playbook | `positions.md` | The client's or firm's positions |
| Matter folder | `.legal/<matter-slug>/` (layout: `references/matter-folder.md`) | Everything done so far: read `matter.md`, `state.json`, `deadlines.md` first |

- Load one jurisdiction pack per jurisdiction in play, plus `eu` for any EU
  member state, if the packs exist. With no pack for a jurisdiction, say so once,
  work from the primary sources directly per `ground.md` (§ No pack for the
  jurisdiction), and tag its rules `[ASSUMED]` until
  each one is retrieved. "Pack §n" references in the mode skills then mean that
  topic in the primary sources (e.g. pack §1 (Sources and hierarchy), pack §4 (Mandatory vs default norms), pack §5 (Formalities), pack §7 (Computing time), pack §8 (Civil procedure), pack §12 (Registers)).
- **Freshness.** If today is past a pack's `review_by`, put one line at the top
  of the deliverable: the pack is stale and each rule taken from it was checked
  against the source (or wasn't).
- Packs are checklists that point to the law. They aren't the law itself. A rule
  taken from a pack is `[ASSUMED]` until it has a verified row in the citation
  ledger (`ground.md`).
- No profile and an architect-path matter: offer the 2-minute `setup` once, then
  continue without it. Never block on it.
- **Precedence:** mandatory law envelopes everything → the user's instruction in
  this matter → matter decisions (`decisions.md`) → playbook → profile → pack
  defaults. The more specific source wins. Surface conflicts; never resolve one
  silently.

## setup (the operation)

Build or update `.legal/profile.md` by short interview: quick (2 minutes, 6
questions) or full. Show the draft profile before writing it, and never write
client secrets into it. Ask in the user's language, one block at a time; accept
"skip"; offer to read seed documents and extract only the general practice.

## Provisional mode (no profile)

If the profile is missing, or a section is still `[PLACEHOLDER]`, stop once and
offer: **(a)** run `setup`, or **(b)** **provisional** — run now on generic
defaults. A provisional run tags the deliverable
`[PROVISIONAL — configure for tailored output]` and says, in one line, what
changes after setup (default side, posture, audience, house style, approvers).
Never block on the profile, and never drop the tag by silence.

## Pause / resume and provenance

- An interrupted setup leaves `<!-- SETUP PAUSED AT: <section> -->` in the file;
  resuming continues there without re-asking answered questions.
- `[PENDING]` = asked, not yet answered. `[PLACEHOLDER]` = not yet asked. Never
  write a profile with a silent gap; an unanswered section is one or the other.
- Mark how each section was built: *from reviewed documents* (a seed template, a
  house-style guide) vs *stated preference*. Verify a user-stated rule or
  citation before writing it; anything unverified is written as stated, with
  that caveat.

## Targeted customize

A `customize` operation changes **one** profile section without re-running setup:
state what will change, change only it, confirm. Never delete a section to "clean
up" — set `[Not configured]` and say what that degrades downstream. When a change
weakens a guardrail (removes an approver, drops a confidentiality rule), say so
explicitly. One change at a time.

## Authoring firm policy (playbooks, intake matrix)

Draft a playbook (`playbooks/_template.md`) or an intake matrix
(`playbooks/_template-intake-matrix.md`) by interview: one section at a time,
short rounds, accept "skip", mine the firm's signed agreements and the matters'
`deviations.md` for evidence. Every position or cell traces to a stated source
or is marked `[ASSUMED]` for the approver.

- Output is always `status: draft` with empty `approved_by` / `approved_at`, a
  named owner and a `review_by` date, plus one line stating it is not policy
  until the approver signs. Approval happens outside the skill: a human fills
  the signature fields. The skill prepares; it never approves.
- `load_playbook.py --check` (playbooks) passes before the draft is presented;
  no client facts leak into firm policy.
- A draft still binds downstream, but only as proposals needing sign-off
  (`positions.md`); the intake qualify gate treats a draft matrix as
  provisional (`legal-intake`).

## Shared context layer (A4)

One level above the profile, a shared **practice/company context** file
(`.legal/context.md`, or the practice root when there is one) holds what every
matter and every door would otherwise re-ask: who we are, house style, standard
approvers, confidentiality defaults, billing conventions. Read it before the
profile and reuse it across doors.

Keep **jurisdiction and position content out of it**: statutory content belongs to
`jurisdictions/`/`regimes/`, negotiating positions to playbooks. The shared layer
is facts about *us* — who we are and how we work, not what the law says or which
clause we prefer.

## Checks

- A missing profile produces a visible offer, never a block.
- A stale pack produces the staleness line.
- Precedence conflicts are surfaced, not resolved silently.
