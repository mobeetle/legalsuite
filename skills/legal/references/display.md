# Display (screen contract)

Screen is narrow, files are complete. The chat shows the card, the matter
folder holds the record, `.docx` is what leaves the firm. Prose rules alone get
ignored, so `scripts/display.py` lints a screen artifact before it is pasted.

## How the turn closes: file links, then the Progress box

Every architect turn **ends** with two blocks, in this order, as the last thing
in the message:

1. **File links** (`FILES`) — every persisted document the turn produced or
   touched, as clickable links.
2. **Progress box** — where we are: steps done / current / next, and what this
   step and the run have achieved. It is the **final** block; nothing follows it.

A lawyer reads the answer, then the footer says where the run stands and lets
them open the files. (The old `-> full:` single-path tail is retired.)

### File links (FILES) — clickable, absolute, persisted

Plain markdown, **never inside a code fence** — a fenced link is not clickable:

```markdown
FILES
- [memo-matter.docx](/abs/…/.legal/matter/memo-….docx)
  `/abs/…/.legal/matter/memo-….docx`
- [authorities.md](/abs/…/.legal/matter/authorities.md)
  `/abs/…/.legal/matter/authorities.md`
```

- **Absolute, existing, persisted** path, resolved from the matter-folder root.
  Never `~`, never workspace-relative, never a temp path — those are not
  clickable and they break the next session.
- One line per file: a markdown link to the path, then the same path as inline
  code for copy/paste. **Both forms, always.**
- Link a file **only after it is written this run**. A planned or not-yet-created
  file is never linked; the write script's success is the evidence it exists.
- Order: the user-facing `.docx` first, then its `.md`, then any other persisted
  document the turn mentions (ledger, plan, report, integration…).
- Wrap the path in `<…>` when it contains a space:
  `[plan](</abs/My Dir/plan.md>)`.

### Progress box — the last block

One fenced `text` box. ASCII only, hard-wrapped at 76.

```text
=== WHERE WE ARE ==========================
<door> · <artifact> · <n> findings
goal:     <primary session goal (G1)>
done:     <C1 text [status]; C2 … — n/m satisfied>
[x] 1. <step>          done
[x] 2. <step>          done
[>] 3. <step>          <- now
[ ] 4. <step>          next
-------------------------------------------
now:      <what this step produced>
so far:   <what the run has produced>
-> next:  <step> — say "go" or adjust
```

- Step markers: `[x]` done, `[>]` current (exactly one), `[ ]` not started. One
  line per step, in Gate Plan order. The box shows the **current** roadmap: after
  a replan the steps change, and the `now:` line says so.
- The header line is the status line folded in — `door · artifact · findings`.
- `goal:` is the session goal (Gate Plan G1); `done:` is the done-definition —
  each success criterion with its [SATISFIED | COMPROMISED | OPEN | BLOCKED]
  status and the satisfied count. Both lines are always present on architect
  turns, one line each.
- `now:` and `so far:` are both always present, one line each, even when short —
  and both are judged **against the goal**: `now:` says what this step moved
  toward `done:`, `so far:` says how much of `done:` the run has closed.
- `-> next:` names the next step and, at a gate, what unlocks it.
- Nothing comes after the box; it closes the message.
- Fast-track (one turn, no steps to track): the box is skipped; the one-line tail
  `Done · goal: <outcome — met | compromised | open> · checks: <…> · assumed: <…>`
  carries the goal verdict instead, and the `FILES` links still come
  before it.
- `scripts/display.py` warns when a turn carries no `=== WHERE WE ARE` header,
  and when any content follows the box.

## Final output: printed, then filed

When the turn delivers a user-facing artifact, it does **two** things — both,
always, never one instead of the other:

1. **Print on screen (scaled to TUI budget).**
   - If the deliverable is **≤80 lines** (short memo, letter, executive summary, clause redline): print the artifact's full text on screen in its own fenced block.
   - If the deliverable is **>80 lines** (e.g. a full redlined contract, a 15-page DD report, or a multi-regime compliance register): print the **BLUF Verdict + Executive Summary + all `[CRITICAL]`/`[HIGH]` findings and redline clauses** on screen, and write the complete, un-truncated text to `.md` and `.docx` in the matter folder. Never truncate the file artifact itself.
2. **File it.** Write the complete `.docx` beside the complete `.md` (`scripts/md2docx.py`, after
   `scripts/scan.py outbound`) in the matter folder, then link both in `FILES`.

A path alone is not a deliverable. The `FILES` link supplements the on-screen
summary or full print; it never replaces the on-screen substance. Producing the
complete deliverable and exporting its `.docx` are never a YAGNI rung — a
lawyer cannot work from a `.md` or a bare path.

## Screen budget (TUI / CLI, 76 cols)

- **Cap the turn**: ~40–60 lines of prose outside the map box and deliverable block. Longer → write
  the file, show the top (`[CRITICAL]`/`[HIGH]`), and link it in `FILES`.
- The checkpoint card from `capabilities/gate.md` precedes the closing pair. Never the
  evidence table, never the full plan template.
- One idea per line. No markdown table over 4 columns on screen — use a vertical
  list (`Clause: … / Issue: … / Fix: …`) instead.
- One severity vocabulary, fixed: `[CRITICAL] [HIGH] [MEDIUM] [LOW]`.
- Strip internal syntax for `AUDIENCE = client|business|counterparty`: no
  `[DOC] [AUTH:A1] [F3]`, no trace refs, no `YELLOW/RED` internals.
- One fenced block per turn max for prose analysis; the map box and the Progress
  box are exempt.

## Turn skeleton (same shape every turn)

1. The **reviewer note** (`present.md`) — one block at the top,
   collapsing to a single line when there is nothing to flag.
2. **BLUF Verdict / Executive Takeaway** — right under the reviewer note:
   `Verdict: <SIGN | SIGN WITH FIXES | DO NOT SIGN | direct answer> · Issues: <n CRITICAL, m HIGH> · Nearest deadline: <date/rule within 30d, or none>`.
3. The **compact Map / AST box** (≤25 lines on screen; full AST persisted in `review-<doc>.md` or `map.md`; skipped for `handoff`, `debrief`, `explain`, and non-document `intake`).
4. Findings in the unified template (`[SEVERITY] | <Deviation> | §ref — <Title> [tag]`), or
   the deliverable (full text if ≤80 lines; Executive Summary + all `[CRITICAL]`/`[HIGH]` items if >80 lines, with full text in `.md` + `.docx`).
5. The next gate: the checkpoint card, or the questions I need answered.
6. The Execution Protocol (`capabilities/gate.md`): Omitted / Fan-out / Checks.
7. **File links** (`FILES`), then the **Progress box** — the closing pair.

Anything the card cannot hold goes to the file, not the chat.

## Gate Plan: card on screen, tables in `plan.md`

Gate 0 shows the **decisions**, not the whole template: restated request,
`MODE / RISK / PATH`, one line of clustering, the top assumptions, the nearest
deadline, `RUN-THROUGH`, and the questions I need answered. The Skill sweep,
Workstreams and Fan-out tables belong in `plan.md`; on screen they collapse to a
line each, or drop. Never dump the template into the chat. `plan.md` is linked in
`FILES`, not as an inline path.

## Map / AST box (full AST in file, compact ≤25-line box on screen)

- Build the **full AST** (`Symbols / Functions / Control Flow / Rejection Traces / Edges`) in the working file (`review-<doc>.md` or `map.md`). On screen in the TUI, print a **compact ASCII Map / Trace & Coupling box** (≤25 lines): key parties/obligations, active `Trace[Tn]` collisions, and `§X <-> §Y` couplings (collapse standard clauses per LOD 2).
- Modes that do not analyze clause or claim coupling (`handoff`, `debrief`, `explain`, and non-document `intake`) skip the on-screen AST box.
- **ASCII-only**, hard wrap at 76. Tree glyphs `|--`, `+--`, `|`; relations
  `->`, `<->`. No `├─ └─ │ ► → ⇄` (breaks in TUI fonts).
- Long labels wrap with 4-space continuation, never cut:
  ```
  ```text
  [Matter]
  |-- Symbols
  |   +-- Party: Discloser — discloses CI (§1) [DOC]
  |-- Trace[T1]: Counterparty.proposes(2y cap)
  |       COLLIDES_WITH: Norm "unlimited wilful-misconduct liability"
  |       REFUTED_BY: mandatory law overrides the cap
  |       ESTABLISHES_BOUNDARY: NOT(capped wilful misconduct)
  +-- Edges: §5.1 <-> §2.1 (cap scope tied to CI definition) [DOC]
  ```
- Directly under the tree, 3–5 lines: top risks / pros / cons derived from the
  traces and edges (`Trace[T1] -> [HIGH] risk: …`), each with its severity.
  Full node-by-node detail lives in the working file; the screen carries the decisive shape.

## The instructional grammar is not the screen glyphs

The canonical grammar (`ir-and-provenance.md`, *Notation*) uses Unicode
box-drawing: that is the notation to reason in. What is **printed** on screen
follows this file — ASCII, 76 cols. Two different jobs; never paste the Unicode
grammar as the on-screen map.

## Block templates (copy these shapes exactly)

The screen uses only these blocks. Copy the structure, fill the slots, invent
no new layout, and never merge two blocks onto one line. Blank line between
blocks, never two. These are the contract the model follows turn after turn.

### 1. Closing pair — the last two blocks of a turn

**File links** — plain markdown, clickable, absolute persisted paths:
```markdown
FILES
- [NDA_v3-review.docx](/abs/…/.legal/<slug>/NDA_v3-review.docx)
  `/abs/…/.legal/<slug>/NDA_v3-review.docx`
- [issue-log.md](/abs/…/.legal/<slug>/issue-log.md)
  `/abs/…/.legal/<slug>/issue-log.md`
```

**Progress box** — fenced, the final block, nothing after it:
```text
=== WHERE WE ARE ==========================
legal-review · NDA_v3.docx · 3 findings
goal:     decide whether the agreement is signable for our side
done:     signability verdict + redline [OPEN]; caps checked [SATISFIED] — 1/2
[x] 1. Plan            done
[x] 2. Map & evidence  done
[>] 3. Findings        <- now
[ ] 4. Redline         next
-------------------------------------------
now:      what this step produced
so far:   what the run has produced
-> next:  <step> — say "go" or adjust
```

### 2. Finding — unified block per issue, three indented lines, nothing else
```
[HIGH] | RED (P4) | §5.1 — Liability cap missing [DOC]
     doc: "liable for any and all damages"
     why: uncapped exposure for Discloser; market/playbook cap is 100% of fees
     fix: cap at 100% of 12m fees; Fallback: 200% of fees (Approver: GC)
```
- Header format: `[SEVERITY] | <Deviation (Position)> | <§ref> — <Title> [tag]`.
- Severity is one of `[CRITICAL] [HIGH] [MEDIUM] [LOW]` — no other word.
- When no playbook is bound (`PLAYBOOK = none`), `Deviation` is `UNCOVERED (baseline)` and `fix:` gives the baseline proposal (`[baseline proposal — confirm commercial position]`).
- Exactly `doc` / `why` / `fix`. No paragraph prose inside a finding. Detail
  that does not fit goes to the file, not the screen.

### 3. Map / AST box — one compact fenced `text` block (≤25 lines), ASCII only
```text
[Matter]
|-- Symbols
|   +-- Party: Discloser — discloses CI (§1)  [DOC]
+-- Trace[T1]: counterparty.proposes(2y cap)
        COLLIDES_WITH: "unlimited wilful-misconduct liability"
```
- Tree glyphs `|--` `+--` `|`; relations `->` `<->`. Never `├─ └─ │ → ⇄`.
- Hard wrap at 76 cols; continuation lines indent 4 spaces, never cut.
- Compact on screen (≤25 lines: key parties/obligations, active `Trace[Tn]` collisions, and `§X <-> §Y` couplings; collapse boilerplate); write the complete AST to the working file (`review-<doc>.md` or `map.md`).

### 4. Checklist — flat, `[x]` / `[ ]`, one per line
```
[x] reviewed clauses 1-8
[ ] verify the cap wording with the client
[ ] re-run substance check
```

### 5. Plan — the step list lives in the Progress box (§1)
The Progress box is the only plan on screen. Never show a second `PLAN v1/v2`
list beside it: the box's `[x] / [>] / [ ]` steps *are* the plan, and a replan is
recorded on its `now:` line (and in `plan.md`).

### 6. Screen table — 4 columns maximum
```
| Issue | Severity | Fix                  |
|-------|----------|----------------------|
| Cap   | [HIGH]   | cap at 100% of fees  |
```
- More than 4 columns → a vertical list (`Clause: … / Issue: … / Fix: …`).

## Enforcement

`display.py FILE` fails on non-ASCII tree glyphs and on tables over 4 columns,
and warns on fenced lines over 76 cols, on a turn that carries no
`=== WHERE WE ARE` Progress box, and on any content after the box. Run it on the
markdown before it goes to chat (and with `--strict` in a scripted surface). It
checks the artifact, not the terminal.
