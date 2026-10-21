# legalsuite — design

The decisions ledger and architecture behind the suite. Read this before
changing a skill; it is the source of truth for intent.

## Thesis

Three source prompts (a strict *Dynamic Architect* protocol, a *Legal Document
Drafting & Review* framework, and a *Research Agent* gated pipeline), plus
`ultracode`, are the same protocol seen from different angles:

> classify → plan and get approval → execute in gated passes → self-verify
> adversarially → report calibrated → never advance silently.

The suite = **ultracode's file/state/delegation spine** + **these prompts'
conversational gate discipline** + **legal guardrails** + **playbooks as the
data layer**.

## Locked decisions

| Area | Decision |
|---|---|
| Architecture | Skill suite, not monolith: thin modes over one `legal` engine. Compose via shared IR + matter folder + co-loading commands |
| Layers | Skills = process (domain-agnostic); **playbooks = the only specialized layer** (create + consume) |
| Capabilities | The engine owns a **capability layer**: one file per reusable feature (`skills/legal/references/capabilities/*.md`). Doors and modes *import* a capability and carry only their task delta; no capability's text is copied into a mode |
| Doors | Six visible skills — `legal` (engine), `legal-intake` (qualify, engage, capture, open), `legal-research` (ground), `legal-review` (review, draft, negotiate, diligence, comply), `legal-dispute` (dispute), `legal-project` (project/matter, handoff, debrief). Each door holds its other modes as `references/modes/<mode>.md` |
| Composition under the door | The former per-mode skills are now modes (reference files) inside a door; the door's description aggregates their triggers and its body routes to them. Nothing is dropped, only relocated |
| Executor | Fix application is `legal-review` phase 11 — the link between *recommend* and *do* |
| Handover | The `legal-project` door holds project (matter), handoff (mid-matter) and debrief (closed matter) sharing one structure: state, intention, what was done, decisions, strategy grounded in the facts, deadlines, documents, risks |
| Playbook | Consumption stays in the engine (GREEN/YELLOW/RED binding); authoring assisted in-skill (draft only, a human approves), the paid service competes on depth |
| Run record | Every architect run scaffolds `plan.md` (plan), `orchestration.md` (structure) and `state.json`/`runs.md` (progress) in the matter folder — the ultracode spine, legal-shaped. The folder's location is the user's choice, asked once, defaulting to `.legal/` under the project document root |
| Task harness | Every architect run builds an explicit harness before working: a **skill sweep** (every mode in/out with a reason, using all relevant skills), workstreams, and a **parallelism plan** that fans independent read-only work out to subagents by default — writes only across disjoint documents; the parent integrates. Protocol: `references/capabilities/orchestrate.md` |
| v1 code | One stdlib script: substance-preservation check |
| Runtime | A **content backend** (remote MCP: served, enum/pattern-only; never receives a document, task text or matter state) plus a **local state server** (stdio, a thin adapter over the stdlib scripts). Direct-script invocation is the degraded mode. "Script > plugin" still holds **locally** |
| MCP split | Two servers, opposite rules (§1A): `legalsuite` (remote) serves the method + data layer, enums/patterns only; `legalsuite-local` (stdio) holds client state. **No state tool is ever registered on the remote** — enforced by the suite integrity check, not merely intended |
| Metadata | Every door/mode carries `version`, `last_validated`, `category` (M1). `last_validated` means the last **human read-through** of that file; the values shipped with M1 are the *migration baseline*, not a validation date — bump on a real review |
| Gates | Vocabulary: **phase** / **checkpoint** / **check** / **approval** |
| Gate Plan | Surfaced per case; architect path HITL-confirmed at Gate 0; fast-track delivers inline; default ≤3 checkpoints |
| Checks | Substance-preservation in v1, **default-on**; opt-in per matter; **always-on in `legal-review` phase 10** |
| Approvals | Irreversible acts (file/send/execute/sign/publish) always blocked; never opt-out |
| IR | Structural map: Symbols / Functions / Control Flow / Edges + optional Deontic depth. Text governs agreement, statute envelopes validity |
| Provenance | `[DOC]` `[AUTH]` `[INFER]` `[USER]` `[ASSUMED]`; the tags drive the checks |
| Verification | Red-team verdicts `confirmed/revised/rejected/contested`; replanning protocol; minimum sufficient inquiry; anti-patterns adopted. Challenge and verify are the `challenge`/`verify` capabilities, invoked by any mode |
| Ceremony | One engine tail (one line). The full adversarial pass is the `challenge` capability (oponentura), run by default in `legal-review` phase 9. Full header/footer on the architect path only |
| Research | `legal-research` is its own door (ground); its phases are also called inline from any door |
| "Thinker" | The Dynamic Architect protocol lives inside the engine, not as a separate skill |
| Oponentura | the `challenge` capability, run by default in `legal-review` phase 9; Czech alias `oponentura`; artifact `oponentura.md` |

## The four axes

1. **Hat** — intake · research · review · draft · negotiate · dispute ·
   diligence · comply · project · handoff · debrief ·
   question · brainstorm · setup
2. **Effort path** — fast-track ↔ architect, defaulted by the complexity table
3. **Gate plan** — how phases cluster into checkpoints, proposed per case and confirmed
4. **Checks** — opt-in per matter, always-on in `legal-review` phase 10
5. **Parallelism** — a task harness per architect run; independent work fans out
   to subagents, the parent integrates

Plus playbook binding (data, not a dial).

## Gate model

- **phase** — an atomic unit of work.
- **checkpoint** — a HITL pause where phases cluster.
- **check** — an executable pass/fail.
- **approval** — a block on an irreversible act.

The Gate Plan merges the Dynamic Architect "Working Annex", the Legal prompt's
"Phase 0 + Dynamic Gating", and the Research Agent's "Plan Checkpoint" into one
approval.

Turn-by-turn gating (never auto-advance) and cluster-and-run are **not two
policies**: they are two outputs of the same gate plan. A deep matter gets a
checkpoint per phase; a trivial matter pre-authorizes run-through.

## Two surfaces, one state

- **User surface** — the checkpoint card: short, plain, one call to action.
  Never the internal evidence table. Every architect turn closes with the
  **closing pair** (`display.md`): a `FILES` block of clickable absolute links to
  the persisted documents, then the **Progress box** (steps done / current / next,
  plus *now* and *so far*), so the user always sees where the run is and can open
  the files.
- **Machine surface** — the matter folder (files). Corrections at a checkpoint
  write back to state.
- **Deliverable surface** — a finished artifact is always shown *and* filed: full
  text printed on screen in the turn, `.docx` written beside the `.md`. Producing
  the deliverable, printing it and exporting the `.docx` are never an economy
  rung; a lawyer cannot read a path.

## Composition (skills cannot call each other)

1. Shared IR owned by `legal`.
2. Co-loading via commands (`/legal-review` loads `legal` + `legal-review`).
3. One matter folder as the handoff bus.
4. A shared engagement header (stance) every mode reads and writes.
5. Playbooks as the cross-cutting data layer.
6. The task harness fans independent work out to subagents (parallel); the parent
   integrates and verifies.

## Old → new coverage map

Traces the original monolithic `legal-review` (preserved at
`../standalone_legal_review/`) into the suite. Nothing from the old functionality
is dropped.

| Old | Now lives in | Status |
|---|---|---|
| Phase 0 intent: restated request, goals, success criteria | Gate Plan (`references/capabilities/gate.md`) | Restored |
| Context parameters: jurisdiction, epoch, client, posture | Engine stance header + Gate Plan | Restored |
| Tiers Small/Smart/Ultra | Effort path (fast-track/architect) + gate clustering | Superseded |
| Mode DRAFTING, REVISION | `legal-review` (draft mode) | Added |
| Modes QUESTION, BRAINSTORMING | Engine modes `question`, `brainstorm` | Added |
| Mode REVIEW | `legal-review` | Kept |
| Phase 2 deontic map (states, Hohfeld, survival, coupling) | `references/ir-and-provenance.md` deontic depth | Restored (optional) |
| Phase 3 dimensions + code smells | `legal-review` finding dimensions | Kept |
| Phase 4 severity | `legal-review` severity table (full wording) | Restored |
| Phase 4 playbook stance + fallback per finding | `legal-review` finding `Stance`/`Fallback` + playbooks | Restored |
| Phase 5 redline convention | `legal-review` (review + draft modes) | Kept |
| Phase 5 drafting / memo deliverables | `legal-review` (draft mode) / engine `question` mode | Restored |
| Phase 6 reconciliation, residual risk, negotiation roadmap | `legal-review` reconcile + oponentura + playbook | Restored |

## Open items

1. **Oponentura independence default** — **resolved**: the `challenge` capability
   (`references/capabilities/challenge.md`) scales independence by path (architect →
   fresh-context read-only subagent; fast-track → same-context pass with the
   degradation stated). The `oponentura` phase no longer owns the rule.
2. **`legal-review` name collision** — resolved: the suite's `legal-review`
   replaced the old skill, which is preserved verbatim at
   `../standalone_legal_review/`. `install.sh` backs up before overwriting.
3. **Playbook machine form** — the template is Markdown-only for now; a JSON
   mirror (for mechanical stance binding) is deferred **until a mode needs it**
   (trigger: `bind_playbook` or a mode must compare positions programmatically).

## Decisions 2026-10-13: MCP verdict, dual runtime, distribution

- **MCP verdict**: `skills/` + `playbooks/` + `commands/` are byte-identical
  between `legalsuite/` and `legalsuite-mcp/`; the divergence is the served
  model (`engine/` + Rust/`wasm` + `get_params` + versioned `server/content/`).
  Standalone plaintext is canonical. Backported from MCP: eval cases 18–28,
  `evals/run.py --engine`, `LEGALSUITE_ENGINE` override, `--serve` portability
  fixes (bare interpreter, env pass-through, Codex 0.130 keys). Dropped:
  `wasm`, served params, content bundles. (`stubs/.../display.py` `[SEV]`
  fixture was *not* backported — the source `display.py` emits `[HIGH]`.)
- **Dual runtime**: every `skills/legal/scripts/*.py` ships a `*.js` twin
  (Node 20+, no dependencies, same CLI/JSON/exit codes). `auto` prefers Python
  when present; `evals/parity_js.py` proves verdict agreement, not byte output.
- **Distribution**: `install.sh` + `install.ps1` are primary (runtime detect +
  offer `winget`/`brew`/`apt`·`dnf`·`apk`·`pacman` or python.org/nodejs.org
  links). Native wrappers (`installer/`: nFPM deb/rpm, Inno Setup 6 exe,
  macOS pkg/dmg, Homebrew formula) call the bootstraps. All unsigned — no
  signing certificate; SmartScreen/Gatekeeper warnings documented, signing
  steps deferred to `installer/README.md`.

## Decisions 2026-10-13 (pm): MCP removed

- Standalone-only confirmed: no MCP server is configured or used. Deleted
  `server/` (remote + local adapter, tests, venv), `stubs/` and
  `scripts/make_stubs.py`; stripped `--serve`/`--host`/`--url`/`--token` from
  both installers (plaintext install is the only mode).
- `verify_suite.py` drops the tool-registration, served-bundle and stub gates;
  `SCRIPT_RE`/skill checks accept `.js` twins. The capability→tool manifest in
  `skills/legal/SKILL.md` stays as vocabulary — helpers are invoked as scripts
  directly, nothing is registered anywhere.
- History (`review/`, `.workflow/`, eval rubric 17, prior DESIGN entries) left
  intact as run records.

## Decisions 2026-10-15: policy authoring in-skill (draft only)

- The skill may draft playbooks and intake matrices (interview + mined
  deviations/agreements, new `configure.md` section, new
  `playbooks/_template-intake-matrix.md`); approval stays human — output is
  always `status: draft` until the owner signs. Unlocks the old "authoring is a
  service, not a skill" lock; the service now competes on depth, not on the
  file-writing monopoly. Templates never ship (dist exclusions generalised to
  `_template*`).

## Decisions 2026-10-15: intake door + intake matrix

- **Sixth door: `legal-intake`.** The engine's intake mode relocated as the
  door's core, extended with the front-door delta: the **qualify gate** (firm
  **intake matrix**: rows = case types / segments, columns = scope fit,
  conflict risk, economics, capacity, urgency; cells = accept / conditions /
  decline reusing playbook stances), lead stages with first-response urgency,
  and conversion to an opened matter. The suite never auto-engages: accepting
  the client is a human approval; conflicts are human-cleared.
- **Matrix, not playbook.** The matrix uses playbook stance semantics but lives
  as firm-owned configuration beside the playbooks — it is acceptance policy,
  not a negotiating position. Per-case-type form generation deferred until a
  real case type needs it.

## Decisions 2026-10-15: drafting entry, house context + reuse vocabulary

- **One door, two commands.** `legal-review` stays the single substantive door
  (review, draft, negotiate, diligence, comply, explain); `/legal-drafting` is a
  second command — the drafting-first entry to the same door — not a second
  skill and not a rename. Two skills would duplicate the challenge/verify/apply
  spine and break the capability-defined-once rule; a rename would churn every
  engine reference, command and install. The door's description already
  aggregates both triggers.
- **`context` capability** (`skills/legal/references/capabilities/context.md`,
  imported by review + draft): sweep the host's tools/skills/connectors for
  house context (policies, tickets, chats, prior docs, playbooks, workflows)
  before the Gate Plan; build the matter reuse vocabulary (terms → phrases →
  sentences → clauses, `must`/`should`, beyond defined terms) into
  `reuse-vocabulary.md`; pick from it when drafting, reviewing or editing, and
  name any departure. Severity-scale `vocabulary.md` is untouched.

## Decisions 2026-10-21: free core (Apache-2.0) + services

Supersedes "Decisions 2026-10-14: commercial tiers, distribution split, CZ pack".
That block described a paid content subscription ("Standard Library", 19 900 Kč /
€800 per year) that was never built, and pointed at a `website/pricing.html` that
does not exist. The one-time "Playbook skill" offer and the "paid Standard
Library" are dropped.

- **Model**: the suite ships **free, forever, under Apache-2.0** — the whole
  thing, the seed playbooks included, as `status: draft`. The paid side is the
  work behind it, sold as services: authoring depth, workflow and skill
  creation, integration, data preparation for agent connections, and certifying
  a firm's own AI legal tooling. Scope and prices live on `legalskills.cz`
  (`/playbooks.html`, `/contact.html`).
- **Distribution**: one source tree, published as a public GitHub repository
  (`legalskills/legalsuite`) and as one bundle built by `scripts/build_dist.py`,
  which runs `verify_suite.py` first and writes `legalsuite.tar.gz` — the whole
  skill set plus `LICENSE`, `NOTICE` and the installers. Nothing is filtered
  out: a public Apache-2.0 repository that withheld files would be incoherent,
  and the seed playbooks are draft proposals, not sellable policy.
- **Licence**: Apache-2.0 for the whole Work. The site copy (`terms.html` §4,
  `docs.html`) was corrected from CC BY-ND 4.0 to match the bundle. The
  licensor identity that `LICENSE` carried as a `[● …]` placeholder is filled
  (Metropolitan advisory s.r.o., Kaprova 42/14, IČO 028 57 626), and the "not
  legal advice", "your content is yours", trademark and Czech-law statements
  moved into `NOTICE` (Apache-2.0 §4(d)).
- **Frontmatter**: the suite's own keys (`imports`, `delta`, `version`,
  `last_validated`, `category`) moved under `metadata:`, so every skill
  frontmatter carries only the Agent Skills spec's closed field set and parses
  as strict YAML — the reference validator rejected the old flow-sequence form.
  `scripts/verify_suite.py` now checks the spec itself: closed field set, a
  licence, no flow collections.
- **`cz` jurisdiction pack** (`skills/legal/jurisdictions/cz.md`) added — the
  pack `example-nda-discloser-cz.md` already referenced (§4, §15). Anchors not
  checked against an official source carry `⚠ verify`, per the template.
  Verification is a precondition for selling any CZ content.
- **Seed playbooks** added (`nda-recipient`, `nda-mutual`, `saas-customer`,
  `saas-provider`, `it-sow-customer`, `nis2-significant-supplier`), all
  `status: draft`, `owner: legalsuite seed (pending approver)`. They are
  negotiating *proposals*, not approved policy; a firm owner must sign off
  (`approved_by`/`approved_at`) before they are presented as approved.

## Decisions 2026-10-17: session goal (intake/planning phase)

- **Every session plans its goal first.** `frame` restatement now yields the
  session goal (primary outcome G1 + done-definition); the Gate Plan is the
  single goal record on all three paths — architect carries full
  `GOALS`/`SUCCESS CRITERIA` (IDs G1../C1→G1, statuses
  OPEN|SATISFIED|COMPROMISED|BLOCKED), standard/fast-track inline headers carry
  `Goal:`/`Done-when:` (`gate.md`, `legal/SKILL.md`). No second goal document;
  mapping for `/craft-goal`-shaped flows is noted in `gate.md`.
- **Persisted machine-readable.** `state.json` `gate_plan` gains optional
  `restated_request`, `goals[]`, `success_criteria[]` (`state-schema.json`);
  validator ignores absent keys so legacy states stay valid; `matter.md` gains a
  Goals/Done-when section (`matter-folder.md`, `register.md`); intake objectives
  feed the next door's GOALS (`legal-intake` phase 9).
- **Progress judged against the goal.** The WHERE WE ARE box gains `goal:`/`done:`
  lines and `now:`/`so far:` read as movement toward `done:` (`display.md`,
  `present.md`); fast-track tail carries the goal verdict; `display.py/js`
  `emit_progress` takes optional `goal`/`done` (old calls byte-identical);
  eval `10-progress-box` gains criterion 7.

## Decisions 2026-10-16: holistic review — 3-tier effort, BLUF UX, baseline redlines, multilingual scripts, real docx tables

- **3-tier effort paths (`fast-track`, `standard`, `architect`)**: adds a middle
  `standard` path between inline `fast-track` and full-harness `architect` so
  routine single-document reviews, drafts, and memos execute with a compact
  3-line Gate 0 and deliver a BLUF executive summary on screen while writing the
  full report, AST, and `.docx` to disk.
- **BLUF UX and scoped AST**: screen output leads with the bottom-line answer
  and top risks rather than walls of intermediate state; `handoff.md` and
  `debrief.md` synthesize existing registers without re-printing an AST box,
  `legal-intake` scopes AST generation to pivotal contracts/decisions only, and
  `legal-dispute` orders Deadlines & Intake (Phase 1) and Chronology (Phase 2)
  before the Claims Matrix & Dispute AST (Phase 3), plus a structured Quantum,
  Interest & Costs Exposure schedule in Phase 5.
- **Baseline redlines without a bound playbook (`PLAYBOOK = none`)**: maintains
  strict `no positions, no ratings` integrity (`Deviation: UNCOVERED`, never
  `GREEN`/`YELLOW`/`RED`) while still emitting `Severity: [CRITICAL|HIGH|MEDIUM|LOW]`
  (calibrated to commercial proportionality and `POSTURE`) and actionable
  `[baseline proposal]` redline language.
- **Universal jurisdiction neutrality & named pack sections**: all door and mode
  descriptions are universally applicable across civil-law, common-law, EU, and
  international practice with Czech trigger aliases (`CS: ...`); bare `pack §N`
  references now carry self-explanatory titles (e.g. `pack §4 (Mandatory vs default norms)`),
  and templates (`_template.md`, `_template-intake-matrix.md`, pack templates)
  ship in the free distribution so in-skill authoring (`configure.md`) works out
  of the box.
- **Multilingual scripts & real `.docx` tables**: deterministic scripts support
  multilingual legal tokens and semantic flips (EN, CS, DE, FR, ES/PL) and
  `md2docx.py`/`md2docx.js` emit native Word `<w:tbl>` tables with borders and
  header shading.

## Decisions 2026-10-18: single surfaced command (dev-team parity)

- **One command surfaced, six skills kept.** Default install exposes only
  `/legal` (the router: classify → effort path → Gate Plan → co-load the
  matching door). All 6 skills stay — auto-trigger relies on their
  `description` fields (jurisdiction + CS aliases); only command surface
  shrinks. This is the `dev-team` principle (one thin skill router + one thin
  command, heavy reference alongside) applied to the suite.
- **Aliases, not deletions.** The six door commands remain in `commands/` as
  deprecated aliases, installed only with `./install.sh --all-commands`
  (`.\install.ps1 -AllCommands`); a default install retires previously
  installed copies (moved aside under `.legalsuite-backups/`, never deleted).
  `verify_suite.py` locks the invariant: the router must name every door.
- **Folded entries preserved as router keywords.** `/legal-drafting` survives
  as `legal draft ...`; its trigger words (draft, precedent, reuse vocabulary)
  live in the router description + body, so no discovery is lost.
