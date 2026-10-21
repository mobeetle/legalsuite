# legalsuite

A composable **skill suite** for general legal work. It is not legal advice and
it is not a runtime: it is a set of Markdown skills plus thin command wrappers
that share one engine, one intermediate representation, one matter folder, and
one playbook layer.

The suite is **domain-agnostic**. Specialization comes only from **playbooks**
(reusable positions: preferred / fallback / walk-away), never from the skills.

## What it is

| Layer | Holds | Domain-specific? |
|---|---|---|
| Skills | Process — how legal work is decomposed, delegated, grounded, verified | No |
| Capabilities | The reusable method the engine owns **once** and every mode imports (`skills/legal/references/capabilities/`) | No |
| Playbooks | Substance — positions, standard terms, red flags, negotiation order | Yes |

### Effort paths (`fast-track`, `standard`, `architect`)

| Path | When | How it runs |
|---|---|---|
| `fast-track` | Single question, single clause check, low stakes | Inline answer with one-line stance header and provenance tail; no matter folder |
| `standard` | Routine single-document review, draft, markup turn, or research memo | Compact 3-line Gate 0 (or single-turn execution when requested), BLUF executive summary on screen, full `.md` + `.docx` written to disk |
| `architect` | Multi-document, high-risk, contentious, due diligence, or multi-step matter | Full Gate Plan at Gate 0, matter folder registers, subagent fan-out harness (`plan.md`, `orchestration.md`), challenge (`challenge.md`, alias `oponentura.md`) + mechanical verification battery |

Every architect run builds a **task harness**: it sweeps every mode (using all the
relevant skills, not just one), decomposes the work into bounded workstreams, and
**fans independent read-only work out to subagents in parallel**, with the parent
keeping the critical path, every write and the integration. The harness lives in
the matter folder (`plan.md`, `orchestration.md`) and is restated each turn.

Every architect turn **closes** with a `FILES` block — clickable links, by
absolute persisted path, to every document the turn produced (the `.docx` first)
— then a **Progress box**: steps done / current / next, and what this step and the
run have achieved. Every finished deliverable is also **printed on screen in
full**. The `.docx` is mandatory, never omitted as an economy: a lawyer cannot
work from a `.md` or a path.

## The doors

Six visible skills. Each holds its other modes as reference files read on
demand (`skills/<door>/references/modes/<mode>.md`); the door's `SKILL.md`
routes to them.

**Skill metadata.** Each door/mode file carries `version`, `last_validated` and
`category`. **`last_validated` is the date a human last read that file through**;
the `2026-10-12` values are the *baseline* stamped when the metadata was
introduced, not a fresh review. Bump it when you actually re-read the file.

| Door | Question it asks | Holds (modes) |
|---|---|---|
| `legal` | The engine: classify, plan a task harness, fan out to subagents, gate, verify | engine |
| `legal-intake` | Is this our matter — and what happened? Qualify, engage, capture, open | **intake** (qualify gate: intake matrix) |
| `legal-research` | What does the law say, with authority that survives checking? | **ground** (alias: legal-ground) |
| `legal-review` | What is wrong with a document — or how is it written, negotiated, diligenced, explained, or measured against a regime? | **review**, **draft**, **negotiate**, **diligence**, **comply**, **explain** |
| `legal-dispute` | What is the claim, the proof and the procedure? | **dispute** (incl. investigations) |
| `legal-project` | How is this matter run, handed over and closed? | **project** (matter), **handoff**, **debrief** |

Confrontational review (oponentura) and mechanical verification are the
`challenge` and `verify` **capabilities** — invoked by any mode and run by default
in `legal-review`. Playbook *consumption* stays in the engine; playbook and
matrix *authoring* is assisted in-skill (`configure.md`) as draft-only —
approval stays human. The suite ships free under Apache-2.0; the paid side
is the work behind it — authoring depth, integration, data preparation and
certifying a firm's AI legal tooling (see `legalskills.cz`).


## Quality

The suite ships its own checks. They are not decoration: a broken tree fails
the build, and the archive is written only after they pass.

```sh
python3 scripts/verify_suite.py     # 6 skills, 17 capabilities, neutralization,
                                    # schema, data packs, 16+16 script demos,
                                    # 7 playbooks, then the evals below
python3 evals/run.py --mechanical   # 27 mechanical cases
python3 evals/parity_js.py          # every mechanical case, Python vs Node
python3 evals/corpus.py             # the matter folders in the legalczech corpus
```

`evals/manifest.json` lists every case: **27 mechanical** (run by the gate) and
**7 model** cases (rubric-graded, run by an agent — `evals/cases/*/rubric.md`).
The mechanical set covers silent counterparty changes, instructions planted in an
inbound document, a fabricated authority, `shall`→`may` flips, negation flips,
party swaps, release safety, an unrun check recorded as `pass`, and the
negative cases where a clean document has to stay clean.

The skills also validate against the Agent Skills spec — `agentskills validate
skills/*` (reference library: `pip install skills-ref`).


## Bundle shape

```
legalsuite/
  README.md            # this file
  DESIGN.md            # decisions ledger + architecture
  install.sh           # stage skills/ + commands/, ask for a prefix, install
  skills/
    legal/             # engine (SKILL.md + references/ + regimes/ + scripts/)
      SKILL.md         # spine + dispatch; imports the capabilities
      references/
        capabilities/  # the reusable method, one file per feature
          frame.md orchestrate.md gate.md ground.md provenance.md
          register.md challenge.md verify.md present.md guard.md
          economy.md positions.md configure.md vocabulary.md
          currency-watch.md context.md
        ir-and-provenance.md   # canonical AST + structural mandate
        fact-map.md citation-ledger.md matter-folder.md display.md
        profile.md state-schema.json
      regimes/ jurisdictions/
      scripts/         # stdlib checks (substance.py, scan.py, redline.py, …)
    legal-intake/      # front door: qualify (intake matrix), engage, capture, open
      SKILL.md
    legal-research/    # grounding (ground); no folded modes
      SKILL.md
    legal-review/      # documents + assessments
      SKILL.md         # review is the default mode
      references/
        clause-baselines.md
        modes/
          draft.md negotiate.md diligence.md comply.md explain.md
          diligence/   # buy-side.md, sell-side.md
    legal-dispute/     # contentious
      SKILL.md
      references/      # document-review.md, hearing-prep.md, investigations.md
    legal-project/     # run / hand over / close a matter
      SKILL.md         # project (matter) is the default mode
      references/modes/
        handoff.md debrief.md
  commands/            # one canonical router (legal.md) + six door aliases
    legal.md             # /legal — the single surfaced command: classifies and
                         #   co-loads legal-intake | legal-research | legal-review
                         #   | legal-dispute | legal-project (+ legal-drafting
                         #   entry to the review door; engine-internal question,
                         #   brainstorm, setup need no second door)
    legal-intake.md legal-research.md legal-review.md legal-drafting.md
      legal-dispute.md legal-project.md  # deprecated aliases; installed only
                                         # with ./install.sh --all-commands
  evals/               # manifest.json inventories every case; mechanical cases run,
                       # model cases list a rubric; corpus E2E + Python/Node parity gate
  playbooks/
    _template.md
    _template-intake-matrix.md
    README.md
```

`skills/*` maps to `<config>/skills/*`; `commands/*` maps to `<config>/commands/*`.
The skills and commands are the whole distribution. The installer asks for a
skill-name prefix (default `legal-`) and applies it on the fly; the source tree
keeps the canonical `legal-` names.

### One bundle

The tree is one source of truth. The single archive is built by
`scripts/build_dist.py`, which runs `verify_suite.py` first and writes one
bundle under `dist/`:

- `legalsuite.tar.gz` — the whole skill set: the 6 doors + engine
  (`references/`, `regimes/`, `jurisdictions/`, `scripts/`), `commands/`, the
  installers (`install.sh`, `install.ps1`), `LICENSE` + `NOTICE` and the
  playbooks (`README.md`, the two templates and the seven seed playbooks,
  all `status: draft`). Nothing is withheld: the seed playbooks are
  negotiating proposals, and the paid side is the work behind them —
  `playbooks/README.md` names the service.

```sh
python3 scripts/build_dist.py          # verify, then build dist/
python3 scripts/build_dist.py --no-verify
```


## Install (OpenCode)

```sh
./install.sh --dry-run           # see what would happen
./install.sh                     # auto runtime (python preferred, else node); one /legal command
./install.sh --all-commands      # also install the six door alias commands
./install.sh --runtime node      # force the JS flavor (*.js scripts)
./install.sh --runtime python --yes   # non-interactive, accept runtime installs
./install.sh /path/to/config     # explicit config root
```

Windows (PowerShell 5.1+):

```powershell
.\install.ps1 -DryRun
.\install.ps1 -Runtime node
```

The installer detects `python3 >= 3.10` and `node >= 20`. `auto` prefers Python
when both are present. When the chosen runtime is missing it offers the
OS-native install (`winget` / `brew` / `apt`·`dnf`·`apk`·`pacman`, else the
python.org / nodejs.org links); `--yes` accepts non-interactively,
`--no-runtime-install` turns the offer into an error. Both flavors ship on
disk; a node install rewrites staged `*.py` script references to `*.js`.

Native wrappers (all unsigned — no signing certificate yet, see
`installer/README.md`): `installer/nfpm.yaml` (.deb/.rpm via nFPM),
`installer/legalsuite.iss` (Windows .exe via Inno Setup 6),
`installer/macos/build-pkg.sh` (.pkg + .dmg), `installer/homebrew/legalsuite.rb`.

Default root is `${OPENCODE_CONFIG:-$HOME/.config/opencode}`. The script backs up
an existing skill/command of the same name before replacing it (important: it
does **not** silently clobber your current `legal-review` skill).

Manual equivalent:

```sh
cp -R skills/*   "$HOME/.config/opencode/skills/"
cp    commands/* "$HOME/.config/opencode/commands/"
```

### Other hosts

The skills are plain Markdown, so they port. Point the host's skill directory at
`skills/` (Claude Code: `~/.claude/skills/`; Codex: `~/.codex/skills/`;
Antigravity: `~/.gemini/antigravity/skills/`). The `commands/` wrappers are
OpenCode-shaped; on other hosts, invoke the skill by name instead.

## Quick start

```
One command, all doors — `/legal` classifies and co-loads the right door:

```
/legal NDA from a counterparty, Czech law, we are the disclosing party
/legal intake what happened is <client story>
/legal is this non-compete enforceable under Czech labour law?
/legal review <paste or path>
/legal draft <instructions or draft to revise>
/legal negotiate <their v3 and our last sent version>     # what did they change?
/legal diligence <data room or target>
/legal comply does NIS2 apply to us?
/legal dispute <the claim or demand received>
/legal project status of the matter
/legal project handoff summarize the file for the next lawyer
/legal project debrief close the file
/legal setup                                                # practice profile
```

The six door commands (`/legal-intake`, `/legal-research`, `/legal-review`,
`/legal-drafting`, `/legal-dispute`, `/legal-project`) remain in the source
tree as aliases, installed only with `./install.sh --all-commands`; the
default install retires previously installed copies (moved aside, never
deleted).

Every run starts with a **Gate Plan** (Gate 0) that you confirm or re-cluster.
No work executes before approval.

## Install check

The installer verifies what it wrote — every staged skill present with the same
file count, the router command, and the playbooks the skills read from
`<config>/playbooks` — and fails if any is missing. `--dry-run` makes no change,
including runtime installation.

## Runtime

The agent is the runtime. The suite ships one set of stdlib scripts in two
flavors — nothing heavier.

- **Scripts** (`skills/legal/scripts/`, stdlib only, dual runtime) — the
  deterministic checks and helpers (`substance.py`/`.js`, `scan.py`/`.js`,
  `matter.py`/`.js`, `preflight.py`/`.js`, `display.py`/`.js`, …). Each
  supports `--demo`; `evals/parity_js.py` proves both flavors agree, and both
  run inside `scripts/verify_suite.py` (a skip is reported, never counted).

```sh
python3 skills/legal/scripts/substance.py ORIGINAL REVISED [--json] [--strict]
node skills/legal/scripts/substance.js ORIGINAL REVISED --json
python3 skills/legal/scripts/substance.py --demo
```

`substance.py` reports dropped and added protected tokens; `--strict` exits 1
when anything was dropped, so it runs as a blocking check.

## Licence

Apache-2.0 (`LICENSE`). Use it, modify it, redistribute it — including
commercially — as long as you pass the licence on, mark changed files and keep
the `NOTICE` attributions. `NOTICE` also carries the statements that matter to
a user: the suite is not legal advice and not a legal service within Act
No. 85/1996 Coll. (zákon o advokacii), a qualified lawyer decides and stays
responsible, and your own matter files, profiles and playbooks remain yours.

See `DESIGN.md` for the full decisions ledger.
