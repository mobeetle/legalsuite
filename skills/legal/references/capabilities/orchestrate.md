# orchestrate — capability

**Contract.** Build the task harness for an architect run — the skill sweep, the
workstreams, the fan-out plan, the waves — then integrate the returns and log
progress. It carries the *what parallelises here* protocol; modes carry only
their own delta.

Every **architect-path run** builds a *task harness* before it works: the
explicit plan for **which skills do what, in which order, and what runs in
parallel**. It is not left to inference. The harness lives in the matter folder
as `plan.md` (the plan) and `orchestration.md` (the structure), is summarised in
the Gate Plan, and is restated in each Execution Protocol. Fast-track runs build
none.

The engine's *Task harness*, *Skill flow* and *Fan-out* sections are the short
form; this file is the detail.

## Step 1 — Skill sweep (consider all, use every relevant one)

Walk the mode list. For **each** mode, decide and record:

```
| Mode | In / out | Phase or reason |
```

- A matter is rarely one skill. Selecting only the obvious one is a defect.
- `in` means the mode has a phase in this run's roadmap. `out` carries a one-line
  reason ("no counterparty markup yet", "no authorities relied on yet",
  "single document", …).
- Challenge (`legal-review` phase 9) and verification (phase 10) are considered
  on **every** run: challenge for any `RISK = high` or contested position,
  verification before anything leaves the firm. They default `in` at the
  deliverable checkpoint unless a reason says otherwise.

## Step 2 — Workstreams

Decompose the run into bounded workstreams. One workstream = one owner skill +
one input set + one output, small enough to be a packet.

```
| # | Workstream | Skill / owner | Inputs | Output | Depends on |
```

- One owner per workstream. If two skills touch the same output, split them or
  order them (a producer, then a reviewer/verifier).
- Keep the parent's critical path local: the next blocking decision, the
  single-writer deliverable, integration.
- A workstream that can't be bounded is a discovery workstream first (find the
  shape), then plan the rest.

## Step 3 — Dependency and parallelism analysis

Classify every workstream and turn the independent ones into packets:

```
| Packet | Agent (subagent) | R/W | Scope (read-only excerpts) | Wave |
```

- **Independent + read-only → fan out now** (a wave of subagents).
- **Independent + write → fan out only where ownership is disjoint** (separate
  documents; never one document, never two writers).
- **Coupled / blocking the next decision → parent, serial.**

What parallelises, by mode:

| Mode skill | Fan out read-only | Never parallel (single owner) |
|---|---|---|
| intake | per received document; per issue area | the intake memo |
| research (ground) | per sub-question; per authority or source | the memo and the citation ledger |
| review (core, incl. challenge/verify/apply) | per clause batch; per lens; per check | the redline; one document one writer |
| draft | research/recall and precedent-finding packets | any write to one document |
| negotiate | per clause group: diff and classify | the counter-markup |
| dispute | per claim or element (facts and evidence); per witness | pleadings; the strategy memo |
| diligence | per document / batch — the canonical fan-out | the grid and the report |
| comply | per regime; per policy; per obligation area | the gap register |
| matter | per work item | the status board; integration |
| handoff / debrief | per register or section read | the single output file |
| playbook | per playbook file | the validation verdict |

## Step 4 — Author, then execute

Write `plan.md` (the Gate Plan) and `orchestration.md` (critical path, packets
with owners, waves, wait points, verification order), confirm at Gate 0, then
run. The Execution Protocol's `Fan-out:` line reports each turn's packets.

## Packets

A packet is a self-contained brief. Write `packets/<id>.md`; the return goes to
`results/<id>.md`.

```
Packet <id> — <objective, one line>
Skill / mode: <which mode's work this is>
R/W: read-only | write (<the one document owned>)
Inputs: <paths, with the excerpts the packet needs — minimum, anonymised>
Stance: <jurisdiction, epoch, language, whose side>
Constraints: <what not to do; provenance tags required; no client identifiers out>
Output: <the exact artifact/rows expected, with its tag/format>
Exit criteria: <what makes the return acceptable>
```

Bad packets: "review the contract", "figure out the risks", "do the diligence".
Good packets: "extract every change-of-control and assignment clause from
`sources/document.pdf` into `results/p2.md` as `[DOC]` rows with verbatim anchors".

## Agent prompts

Give the host's native subagent primitive (a `subagent` / `task` / agent tool)
the packet, not the chat. Two shapes.

Read-only (the default for legal fan-out):

```
You are one of several read-only analysts on the same matter folder.
Task: <the packet objective>
Do: work only from the inputs listed; tag every statement [DOC]/[AUTH]/[INFER]/[USER]/[ASSUMED];
    cite anchors (document, §, verbatim quote); return the artifact, not prose about it.
Do not: edit any file except your result file; contact anyone; invent facts or citations.
Output: <exact format> plus open points and confidence.
```

Write-capable (only disjoint documents, one document per writer):

```
You own exactly one document: <path>. No other writer touches it.
Task: <the change>
Do: apply only the named findings; minimum intervention; keep blanks as blanks.
Do not: touch any other document or the matter registers — the parent integrates those.
Output: the revised document plus a change list (finding id → verbatim delta).
```

## Waves and caps

- One discovery wave, one analysis wave, one verification wave. More only with
  the user's approval.
- Default 2–4 sidecars, **≤5 total** per run unless the user approves more.
  Diligence over a data room, and large document suites, may justify more — ask
  first and say why.
- Wait only when a return blocks the parent's next step.

## Independence packets (challenge, verify)

For challenge and verification (`challenge.md`, `verify.md`), the packet contains
the artifact, its sources, the stance and the challenge — **never** the author's
reasoning, notes, drafts or chat history. Run them fresh-context; the report names its
independence.

## Integration (the parent owns it)

After each wave: read every result; check claimed edits; reconcile against the
maps and registers (deduplicate, cross-document consistency — same term, same
definition; same issue, same position; same fact, same value); reject outputs
without evidence; update `issue-log.md` and `deviations.md`; mark packets
`integrated` (or `rejected`); update `state.json`. Raw agent output is never the
deliverable.

## Verification order

Checks run after integration, in order: substance → structure → trace →
grounding → release safety, then the full review-phase-10 battery. No delegated
write goes out before the parent has integrated and verified it.

## Fallback (no delegation)

If the host exposes no subagent primitive, or the user restricts delegation, run
the packets sequentially in the parent session, keep the same packet files and
results, and record the reason in `orchestration.md` and the Execution Protocol.
Say it once, then degrade openly.

## Confidentiality

Every subagent gets the **minimum** packet: excerpts, not the data room; roles,
not names, where the analysis doesn't need them; anonymised. Don't delegate
privileged material unless the user permits it for this matter. Record the
exposure category (tool and data category) in `history.md`.

## Progress logging

Four levels, all in the matter folder (register formats in `matter-folder.md`):

- **Turn:** closes with the `FILES` links + the Progress box (`display.md`); the
  Execution Protocol — `Omitted / Fan-out / Checks` — sits just before them.
- **Run:** a `runs.md` row, mirrored in `state.json.runs`.
- **Workstream:** the status board in `matter.md`, mirrored in
  `state.json.active_items`.
- **Packet:** `packets/<id>.md` → `results/<id>.md`, mirrored in
  `state.json.packets`, status `queued | running | returned | integrated |
  rejected`. The parent flips `returned → integrated` only after reconciling.

## Worked example

A three-document suite review, `RISK = high`.

**Skill sweep:** review `in` (per document); fix `in`; verify `in`; challenge (`challenge.md`, alias `oponentura.md`) `in`;
negotiate `out` (no markup yet); dispute, diligence, comply `out` (not this
matter); matter `in` (suite); research `out` (no open question).

**Workstreams:** W1 findings for doc A · W2 doc B · W3 doc C · W4 cross-document
consistency · W5 challenge · W6 verify.

**Fan-out:** wave 1 — three read-only review packets (one per document); wave 2 —
one read-only challenge packet (independence packet). The parent integrates into
`issue-log.md`, then runs the verify battery. `fix` runs after the user picks the
findings; its write fan-out is one writer per document.
