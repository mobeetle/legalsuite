# gate — capability

**Contract.** The gate model: the Gate Plan (Gate 0), the standard (Express) and
fast-track inline plans, the clarification and consent gates, the checkpoint card
and the Execution Protocol. One vocabulary: **phase** (work unit), **checkpoint**
(HITL pause), **check** (executable pass/fail), **approval** (irreversible act).

On the **architect** path, present Gate 0 before any work and wait for approval
or corrections. This is the only place re-clustering is allowed.

```
Gate Plan — confirm or re-cluster before I start

RESTATED REQUEST
  <what the user is actually trying to accomplish, 1–2 sentences>

GOALS (ranked — the session goal; G1 is the primary outcome)
  G1. <concrete outcome>
  G2. <concrete outcome>

SUCCESS CRITERIA (checkable — the done-definition; one per goal)
  • C1 (G1): <a condition that lets both of us verify the goal was met> [OPEN]
  • C2 (G2): <…> [OPEN]

(Criterion status through the run: OPEN | SATISFIED | COMPROMISED | BLOCKED,
with evidence. Done = every criterion SATISFIED, or explicitly COMPROMISED /
deferred by the user — never silently dropped.)

SCOPE
  ✓ Will deliver: <specific outputs, with file names in the matter folder>
  ✗ Won't deliver: <exclusions>

STANCE
  MODE   = <mode>
  RISK   = <low | analytical | high>
  PATH   = <fast-track | standard | architect>
  JURISDICTION = <governing law(s), or [ASSUMED] + basis>
  EPOCH  = <date, or n/a>
  INTERESTS = <client and side>
  POSTURE = <aggressive | balanced | defensive; leverage: high | balanced | low>
  AUDIENCE = <lawyer | client | business | court | counterparty | regulator>
  LANGUAGE = <deliverable language>
  CHECKS = <checks this run will execute>
  PLAYBOOK = <slug@version, or none>
  RUN-THROUGH = <no | yes — all checkpoints without stopping, only if asked>

CONTEXT LOADED
  • Profile: <path | none>
  • Packs: <jurisdiction and regime pack codes this run uses (reviewed_at …) | none>
  • Matter folder: <.legal/<slug>/ new | existing, last updated …>
  • Run record: <where the folder will live; new run N | resumed run N>
    (architect path: I will write plan.md, orchestration.md, state.json and
     append to runs.md — ask now if you want the folder elsewhere)

DEADLINES (time-bar sentinel)
  • <deadline — date — rule — basis tag>   (or: none applies — with the rules tested — or unknown — with what is missing)

ASSUMPTIONS (locked unless corrected)
  • <assumption + basis>

OUTPUT STRUCTURE
  • Format: <markdown | memo | redline | docx tracked changes | grid + CSV …>
  • Variants: <one optimized> OR <named variants, e.g. clean + annotated>

CLUSTERING  (phases → checkpoints; this is the part to re-cluster)
  | Checkpoint | Phases clustered | Why this clustering |
  |---|---|---|
  | G0 Gate Plan | triage, context | baseline |
  | G1 … | … | … |

SKILL SWEEP  (every mode considered — in/out, with a reason; use all relevant)
  | Mode | In / out | Phase or reason |

WORKSTREAMS
  | # | Workstream | Skill / owner | Inputs | Output | Depends on |

FAN-OUT  (architect path: independent read-only work fans out by default)
  | Packet | Agent | R/W | Scope (read-only excerpts) | Wave |
  (or: none — work is coupled; state the reason)

ROADMAP
  Step 1: <outcome>
  Step 2: <outcome>

⚠ Reply "approved" or provide corrections. I will not proceed until then.
```

### Clustering and replanning rules

- Default ≤3 checkpoints after G0. State the reason when a case needs a different shape.
- The default comes from the triage table; it is a proposal, not a verdict.
- **Every architect Gate Plan carries the Skill sweep, Workstreams and Fan-out
  blocks.** An `out` needs a reason; a Fan-out of `none` needs a reason.
- **The deliverable phase is never silently clustered** with earlier phases
  unless the user pre-authorized it.
- **Within scope:** phase ordering, fine-tuning immediate steps, or splitting an
  active phase are handled through the Execution Protocol's `Plan` line without
  restarting Gate 0.
- **Structural change:** adding/removing checkpoints, changing format, audience
  or scope requires an updated plan (`G0-revised`) for confirmation.
- Persist the approved plan to `plan.md`, the run structure to
  `orchestration.md`, and the checkpoints **plus the session goal** (`restated_request`,
  `goals[]`, `success_criteria[]` with their statuses) to `state.json`
  (`references/state-schema.json`) and the Goals section of `matter.md`
  (`references/matter-folder.md`) when a matter folder exists. Append a run row
  to `runs.md`. Every checkpoint re-evaluates each goal/criterion
  [SATISFIED | COMPROMISED | OPEN | BLOCKED] with evidence — the Progress box
  (`display.md`) reports it.

### Session goal (craft-goal mapping)

The Gate Plan *is* the session's goal record — no second goal document. Field
mapping for hosts coming from `/craft-goal`-shaped flows: Objective →
`RESTATED REQUEST` + G1; Done-definition / evidence bar → `SUCCESS CRITERIA`;
Scope / non-goals → `SCOPE ✓/✗`; Constraints / authority → `STANCE` +
`ASSUMPTIONS`; the Progress box is the burn-down.

## Standard (Express) inline plan (1 checkpoint)

For a single standard document (`PATH = standard`: one document of a known type, or a short memo), do **not** halt at Gate 0. Emit this header at the top of the turn, run preflight/scan (`preflight.py`, `scan.py inbound`), and deliver the BLUF Verdict + compact AST + findings + redline proposals in the same turn, then pause at the single checkpoint before applying fixes or exporting final outbound files:

```
**Standard (Express)** · Scope: <document/deliverable> · Matter: <.legal/<slug>/>
Goal: <primary outcome (G1)> · Done-when: <checkable criterion (C1)>
Stance: MODE=<mode> | RISK=<low|analytical> | PATH=standard | JURISDICTION=<jur> | EPOCH=<date> | INTERESTS=<side> | PLAYBOOK=<slug|none>
Assumed (correct anytime): <key assumptions + basis> · Checks: <checks run>
```

Record Goal + Done-when in `state.json` (`gate_plan.goals`, `gate_plan.success_criteria`)
and the `matter.md` Goals section even though Gate 0 does not halt; the single
checkpoint evaluates them.

## Fast-track inline plan (0 checkpoints, no halt)

Emit this, then deliver in the same turn:

```
**Fast-track** · Scope: <what is delivered> (excludes: <…>)
Goal: <primary outcome> · Done: <what done means, checkable>
Stance: MODE=<mode> | RISK=<low|analytical> | PATH=fast-track | JURISDICTION=<jur> | EPOCH=<date> | INTERESTS=<side> | AUDIENCE=<aud>
Assumed: <key assumptions> · Checks: <checks or n/a>
```

End with the one-line tail: `Done · goal: <outcome — met | compromised | open> · checks: <…> · assumed: <…>`.

## Consent and clarification gates (non-negotiable)

Two gates beyond the checkpoint. Both stop the turn and wait for the user.

### Clarification gate — ask, never infer a load-bearing gap

A gap is **load-bearing** when it changes the numbers, the parties, the
strategy, the deliverable or the outcome. A load-bearing gap is never filled by
inference, however plausible. Put the questions in one card and stop:

```
I need <n> things before I continue
  1. <question> — why it changes the result: <one line>
  2. ...
  (Elsewhere I'm proceeding on the assumptions below.)
```

An `[ASSUMED]` that changes the outcome belongs in that card, not in a silent
list. If it blocks the current phase, the phase pauses; if it doesn't, continue
and re-surface it at the next checkpoint. Never stack these across checkpoints.

### Consent gate — nothing changes without an approved manifest

Reading, extracting and analysing need no gate. **Any write with a side effect
outside the suite's own matter folder does**: creating or editing the user's
files, generating `.docx` or redlines, renaming, moving or deleting, and
anything leaving the firm. List the exact edits and wait:

```
EDITS I WILL MAKE (approve, or amend)
  1. <path> — new | edit | replace — <what changes> — <reversible?>
  2. ...
  Reading only: <files I will not change>
```

The matter folder (`plan.md`, `state.json`, registers, findings) is the suite's
own scratchpad: announce it once at Gate 0, then maintain it without a
per-file gate. Deliverables, user files and outbound artifacts are never in
that category. An approved write is not edited again without a new manifest.

### "Continue" is scope, not carte blanche

Approving the Gate Plan authorizes the phased run — not file writes and not a
silent run-through of every checkpoint. Auto-advance only when the plan records
`RUN-THROUGH = yes` because the user asked for it. A message that adds a fact or
changes an assumption is a **replan**, not a go-ahead: restate the changed
premise and its knock-on effects, confirm them, then continue. When in doubt
present the card and stop — asking is cheap, a wrong deliverable is not.

## Checkpoint card

The user-facing surface. Short, plain, one call to action. It precedes the
closing pair (`display.md`): the **`FILES`** links, then the **Progress box** —
which is the *where we are* and the *what's next*, and closes the turn. Never the
internal evidence table or a checklist recital. Visual rules: `display.md` (76
cols, full map as an ASCII-only fenced `text` box).

```
- What I concluded:
- What I assumed on your behalf:
- Deadlines: <only if any; nearest first>
- -> Continue, or tell me what to adjust.
```

Handling the response:

- A plain go-ahead → proceed to the next checkpoint (never past a consent gate).
- A correction → update the affected artifact, re-check its exit criteria, then
  either re-present (if substantial) or proceed (if minor). Log a decision that
  changes the matter's direction in `decisions.md`.
- New facts or changed assumptions → replan (see *Consent and clarification
  gates*), don't continue on the old premise.
- Don't stack unresolved questions across checkpoints.

## Execution Protocol (architect path)

Plain markdown, after the card and before the closing pair:

```
**Execution Protocol**
- Omitted: <method or scope shortcuts only — never the deliverable, its `.docx`,
  or the printed final output; or "none">
- Fan-out: <packets launched or returned this turn; or "none — coupled">
- Checks: <checks run and result, or none>
```

The `Omitted` line is where the economy ladder (the economy capability, `economy.md`)
becomes visible: a rung that held, a provision skipped as speculative, a bespoke
structure passed over for a standard form. It is how a deliberate omission stays
a decision the user can reverse rather than a silent gap. Say `provision not
needed — <rung>` rather than leaving it implicit. **It never lists the
deliverable, its `.docx`, or the printed final output** — those are never
economy, only method and scope are.

Then the turn **closes** with the `FILES` links and the **Progress box**
(`display.md`): its step list is the *Plan*, its `now:` / `so far:` lines are
*Completed*, and its `-> next:` is *Next*. Nothing follows the box.
The box comes after the Execution Protocol, never before it.

The box's step list is the scope-drift control: the roadmap is a floor, not a
ceiling. If the matter is tangling, the `now:` line says so and the box proposes
more steps. Its `-> next:` line names the recommended next skill explicitly
(review phases 9–11 after findings, `legal-review` for a markup or a suite,
`legal-project` to suspend or close) and what unlocks it; the user's go-ahead
starts it, the engine never runs it silently. When everything is delivered:
`-> next: none — deliverable complete.`
