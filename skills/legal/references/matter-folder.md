# Matter folder

The handoff bus between skills. Skills can't call each other; they read and
write the same files. Create the folder on the first architect-path run of a
matter, or when the user asks. Fast-track work needs no folder.

Root: ask the user where the matter folder should live the first time a matter
opens, and remember it in `matter.md`. Default `.legal/<matter-slug>/` under the
**project document root** (the folder holding the case documents), unless the
project instructions name another location. Slug: short, neutral, no client name
if the folder could be seen outside the team (`2026-document-review`, not
`acme-v-novak`).

## Layout

```
.legal/
  profile.md                 practice profile (firm-wide; references/profile.md)
  playbooks/                 the firm's playbooks
  <matter-slug>/
    matter.md                scope, client, side, deliverables, status board
    plan.md                  approved Gate Plan (and G0-revised versions)
    orchestration.md         run structure: critical path, packets, owners, verify order
    integration.md           per-wave accepted/rejected/conflicts (ultracode spine)
    final-report.md          outcome, verification, skipped checks, residual risk
    runs.md                  append-only run record (one row per architect run)
    state.json               machine state (references/state-schema.json)
    parties.md               parties and conflicts list
    facts.md                 fact map (references/fact-map.md)
    deadlines.md             critical-dates register
    decisions.md             decision log
    history.md               append-only log: events, communications, tool exposure
    versions.md              document version register
    authorities.md           citation ledger (references/citation-ledger.md)
    issue-log.md             consolidated findings across documents
    deviations.md            playbook deviation record
    sources/                 documents as received (never edited)
    drafts/                  our documents, one file per version: <doc>-v<n>.md / .docx
    packets/ results/        delegation packets and their returns
    <skill artifacts>        see below
```

Skill artifacts, at the matter root:

| Door (mode) | Files |
|---|---|
| `legal-intake` (intake) | `intake.md`, `gaps.md` |
| `legal-research` (ground) | `memo-<topic>.md` |
| `legal-review` (review) | `review-<doc>.md`, `summary-<doc>.md`, `issues-<doc>.md`, `reuse-vocabulary.md`, `challenge.md` (or `oponentura.md` alias), `verification-<artifact>.md`, `fix-log.md` |
| `legal-review` (draft) | `drafts/<doc>-v<n>`, `reuse-vocabulary.md` |
| `legal-review` (negotiate) | `round-<n>.md`, `negotiation-log.md` |
| `legal-dispute` | `chronology.md`, `claims-matrix.md`, `procedural-map.md`, `case-assessment.md`, `strategy.md`, `exhibits.md`, `hearing-plan.md`, `privilege-log.md`, `investigation.md` |
| `legal-review` (diligence) | `dd-grid.md`, `dd-findings.md`, `dd-report.md`, `protections.md`, `qa-log.md`, `vdd-report.md`, `remediation.md`, `dataroom-index.md`, `disclosure-letter.md` |
| `legal-review` (comply) | `comply-profile.md`, `obligations-register.md`, `gaps-register.md` |
| `legal-project` (project) | `closing.md`, `obligations.md`, `final-report.md` |
| `legal-project` (handoff) | `handoff.md` |
| `legal-project` (debrief) | `debrief.md` |

Create a register when it first has content, not before. Every skill reads
`matter.md`, `state.json` and `deadlines.md` before its Gate Plan.
**Every user-facing artifact gets a `.docx` beside it** via `scripts/md2docx.py`
— each deliverable the Gate Plan's `OUTPUT STRUCTURE` names, including
`debrief.md`, `handoff.md`, `memo-*.md`, `summary-*.md`, `final-report.md` and
`closing.md`. The `.docx` is mandatory; it is never omitted as an economy (see
`capabilities/economy.md`). In the turn, every persisted document is
offered as a clickable link to its **absolute** path, with the path as inline
code beside it (`display.md`); never a bare relative path.

## Registers

### matter.md

```
# <Matter title>
Client: <name> · Side: <role> · Responsible lawyer: <name/role>
Opened: <date> · Status: open | on hold | closed
Scope: <engagement scope in 2–3 lines; exclusions>
Goals: <G1 primary outcome; further ranked goals>
Done-when: <C1 (G1): checkable criterion [status]; …>
Jurisdiction: <…> · Language: <…>

## Deliverables / status board
| # | Item | Skill | Owner | Status | Blocking | File |
|---|---|---|---|---|---|---|
```

Status values: `todo | in progress | review | done | deferred | blocked`.

### parties.md

```
| Name | Role | Relation to client | Identifiers (reg. no., tax ID, LEI) | Representatives / counsel | Source |
|---|---|---|---|---|---|
```

Roles: client, adverse, co-party, related entity (parent, subsidiary, owner,
officer), witness, prior counsel, other. This list is what the conflict check
consumes. The suite prepares it, and a human runs the check and clears it. Any
new adverse party added later triggers a new check; log it in `history.md`.

A clearance is a **negative result with evidence**: date, the human checker,
every register and name searched (parties, related entities, officers, prior
counsel, the firm's own matters) and the outcome. Until that record exists the
matter reads `conflicts: pending` — "no conflicts" alone is not a clearance.

### deadlines.md

```
| ID | Deadline | Date (latest safe) | Rule / computation | Basis | Trigger | Consequence if missed | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| T1 | Limitation — price claim | 2028-03-14 | 3 y subjective period from the due date; end-of-period rule per pack §7 (Computing time); target filing a month earlier | [AUTH:A1] | invoice due 2025-03-14 [F3] | time-barred if the debtor objects | <lawyer> | open |
```

- Always show the rule, never only the date. A date with an unknown trigger is
  written as a rule (`3 y from discovery — discovery date unknown [F?]`) and
  goes to the gap table.
- Compute conservatively: the earliest defensible date, with weekend/holiday
  rules from pack §7 (Computing time). When in doubt, use the earlier date and say so.
- Status: `open | met | missed | n/a | superseded | unknown`. Mirror each row in
  `state.json.deadlines` (trigger and basis included: a mirrored date without its
  trigger cannot be recomputed).
- `Verified by / on` is mandatory. A deadline is `verified` only when its rule
  resolves to a ledger authority and its trigger resolves to a fact or a document.
  Recompute it at every run and before any filing; a computed date nobody
  re-derived is a memory, not a deadline.
- `n/a` means "checked and does not apply", never "not checked". Record the
  time-bar search beside it: rules tested, their source, and the result
  (`applies` / `does not apply` / `unknown`). `unknown` is a gap.

### decisions.md

```
| ID | Date | Decision | Decided by | On what advice / options considered | Ref |
|---|---|---|---|---|---|
```

A decision is any choice that changes the matter's direction: scope, strategy,
accepting a risk, accepting a fallback, settling, filing. Only humans decide.
The suite records the decision; it doesn't make it.

### history.md (append-only)

```
- 2026-10-10 · intake · client call summary received [USER]; parties.md created
- 2026-10-11 · tools · web search (anonymised: limitation of warranty claims, CZ) · no client data sent
- 2026-10-12 · sent · issues list v1 to counterparty counsel (by the lawyer)
```

Never edit or delete lines; correct with a new line. Record external tool
exposure here (which tool, what category of data).

### versions.md

```
| Doc | Version | File | Date | Author | Sent to | Based on | Note |
|---|---|---|---|---|---|---|---|
| Agreement | v3 | drafts/agreement-v3.docx | 2026-10-14 | counterparty | — | v2 (ours) | their markup |
```

The basis for every markup turn: `legal-review` (negotiate mode) always diffs
against **our last sent version**, which comes from this register.

### issue-log.md

```
| ID | Doc / area | Issue | Severity | Deviation | Owner | Status | Source finding |
|---|---|---|---|---|---|---|---|
```

Deduplicated across documents and skills. Status: `open | proposed | applied |
agreed | accepted risk | closed`. `proposed` means a fix or redline is offered;
`applied` means review phase 11 wrote it into the document (see `fix-log.md`).

### deviations.md (playbook deviation record)

```
| # | Playbook | Position | Clause / issue | Class | Their text / ask | Outcome | Approved by | Rationale | Stage | Date |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | agreement@1.2 | P4 | Term of confidentiality | YELLOW | 2 years | accepted | <approver> | low-sensitivity info | signed | 2026-10-20 |
```

One row per accepted `YELLOW`, `RED` or `UNCOVERED` outcome, and per rejected
counterparty ask that the playbook didn't cover. Stage: `review | round <n> |
signed`. This record is what lets a playbook learn from practice. Keep it
factual, and record client-confidential details only where they explain the
outcome.

### runs.md (append-only)

```
| Run | Date | Skill(s) | Gate reached | Outcome | Checks |
|---|---|---|---|---|---|
| 1 | 2026-10-10 | legal-review | G2 | findings + redline written | substance pass |
```

One row per architect run: what it did and where it stopped. Mirror each row in
`state.json.runs`. Never edit or delete a row; correct with a new one.

### orchestration.md

The run's **task harness**, not a transcript: the skill sweep, the workstreams
and their owners, the critical path, the packets and their waves, the wait
points, and the verification order. Rewritten each run to match `plan.md`. Full
protocol: `references/capabilities/orchestrate.md`.

### packets/ and results/ (delegation)

One file per delegated packet — `packets/<id>.md` (objective, skill, R/W, inputs,
stance, output, exit criteria) — and its return, `results/<id>.md`. Mirror each in
`state.json.packets` with status `queued | running | returned | integrated |
rejected`. The parent marks `integrated` only after reconciling the return; a
packet is not done until then.

## Rules

- `sources/` is read-only. Received documents are never edited; scan them on
  arrival (`scan.py inbound`).
- **Cross-matter isolation.** One folder per matter; a closed matter is archived,
  never deleted. The suite never runs the conflicts check — a human clears it and
  the result is recorded (`parties.md`).
- **Schema drift.** A `state.json` that predates the current schema is *legacy*,
  not corrupt: `matter.py state` says so, writes refuse, and `migrate_state.py`
  converts it (backing up the original). An unrecognised state is an error.
- One writer per document. Delegated subagents write only to `results/`.
- **Fan out by default.** Independent read-only work runs as subagent packets;
  writes fan out only across disjoint documents. The parent owns integration and
  every register write.
- **Every architect run** builds a task harness (skill sweep, workstreams,
  fan-out) into `plan.md`/`orchestration.md`, scaffolds or refreshes `plan.md`,
  `orchestration.md`, `state.json` and the status board, and appends to `runs.md`.
  A resumed run reads them first; it never recreates them.
- Closing a live matter: hand over and record it inside `legal-project` — its
  handoff mode writes `handoff.md`, its debrief mode writes `debrief.md`.
