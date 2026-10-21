# register — capability

**Contract.** The matter folder is the API between skills. Open it before work,
keep the registers current, store each object's classification **and its basis**,
and never let one matter leak into another.

Layout, file list and register formats: `references/matter-folder.md`.
Machine state schema: `references/state-schema.json`.

## The run record (every architect run)

The architect path keeps a run record in the matter folder; the fast-track path
keeps none. Establish the folder before any work and keep it current to the end
of the run.

- **Where.** Ask the user where the matter folder should live the first time, and
  remember it in `matter.md`. Default: `.legal/<matter-slug>/` in the project
  **document root** — the folder that holds the case documents — or the location
  the project instructions name. The user may point it elsewhere.
- **Scaffold on the first run, refresh on every run.** Create `plan.md` (the
  approved Gate Plan, incl. a 5–12 line inline eval contract: outcome, shared
  surfaces, required checks, blocking conditions, handoff evidence),
  `orchestration.md` (the run's structure), `state.json` (machine state),
  `integration.md` (accepted/rejected/conflicts per wave) and the status board
  in `matter.md`; append the run to `runs.md`; close with `final-report.md`
  (outcome, verification, skipped checks, residual risk). A resumed run reads
  them first and updates them, never recreates them.
- **Plan** — `plan.md`: the approved Gate Plan, with any `G0-revised` versions.
- **Structure** — `orchestration.md`: the critical path, the checkpoint→phase
  clustering, the packets and their owners, the wait points, the verification
  order. The execution contract, not a transcript. Full protocol:
  `capabilities/orchestrate.md`.
- **Progress** — the status board in `matter.md`, `state.json` (`gate_plan`,
  incl. `goals`/`success_criteria` with statuses, `active_items`, `packets`,
  `checks_run`, `runs`) and the per-run rows in
  `runs.md`. The Execution Protocol restates it each turn (`gate.md`).

This is the ultracode spine (plan / structure / state) applied to legal work:
heavier than a single clause needs, so it is architect-only, and the user's
choice of location is what keeps client material where they want it.

## Rules

- **One writer per document; the parent owns every register write.**
- **Store the basis, not just the conclusion.** Every register row carries the
  source or tag it rests on (`provenance.md`); a conclusion with no basis is not
  yet a row.
- **Do not auto-derive.** A register records; conclusions are drawn in
  conversation, never by a cross-product of columns (*Per-object register
  pattern* below).

## Per-object register pattern

Generalise the "inventory" pattern: a register stores, per object, its
classification **and its basis** (tagged `[verify]` where unconfirmed) — a fact,
a clause, an obligation, a claim element. It applies to the diligence grid, the
comply obligation register, the dispute claims matrix, and any future register.

- **Do not auto-derive.** The register never concludes from a cross-product of
  its columns ("every contract with a change-of-control clause needs consent" is
  drawn in conversation, from the rows, not written by the register).
- **A missing cell is content.** `not found` / `unknown` is a row, not a blank.

## Isolation and lifecycle

- **Cross-matter isolation is off by default.** One matter folder per matter; the
  suite never reads one matter's registers while working another.
- **Archive, never delete.** A closed matter moves to an archive location with
  its registers intact.
- **Slugs stay neutral** (`2026-document-review`, not `acme-v-novak`), so a folder
  seen outside the team leaks nothing (`references/matter-folder.md`).
- **The skill never runs the conflicts check** and never decides cross-matter
  appropriateness — a human does, and the result is recorded.

## Checks

- Every architect run has `plan.md`, `orchestration.md`, `state.json` and a
  `runs.md` row; a resumed run did not recreate them.
- Every register row that states a conclusion carries its basis.
- `state.json` validates against `references/state-schema.json`; its modes match
  the engine stance header.
