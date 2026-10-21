# positions — capability

**Contract.** Bind a playbook; apply its positions; classify every deviation;
and where no playbook is bound, never emit policy ratings (`GREEN/YELLOW/RED`) —
mark `Deviation: UNCOVERED` while still rating `Severity` and proposing concrete
baseline fixes.

A playbook is a Markdown file of approved positions (format:
`playbooks/_template.md` in the suite). Any mode applies one. In-skill playbook and intake-matrix authoring produces a `status: draft` file for human approval (`configure.md`).

## Binding

- Bind in the Gate Plan: `PLAYBOOK = <slug>` or `none`. Load and list with
  `../scripts/load_playbook.py <slug> | --list | --check <slug> | --bind <slug|none>`. The search
  order is: explicit path, `$LEGALSUITE_PLAYBOOKS`, `.legal/playbooks/`, the
  suite's `playbooks/`, `~/.legal/playbooks/`.
- Run `--check` once per matter. A `draft` or stale playbook still applies, but
  its positions are proposals, not policy, and the card says so.

## Deviation class (per clause, alongside severity)

- `GREEN`: within the preferred position.
- `YELLOW`: within the fallback; the playbook's `Approver` (or the profile's
  escalation matrix) decides.
- `RED`: beyond the walk-away.
- `UNCOVERED`: the playbook has no position; escalate to its owner.

Deviation is a separate axis from severity (`vocabulary.md`): a clause can be
`[LOW]` and `RED`, or `[HIGH]` and `GREEN`. Report both.

Every accepted `YELLOW`, `RED` or `UNCOVERED` outcome gets a row in the matter's
`deviations.md` (`references/matter-folder.md`). That row is how practice feeds
back into the playbook's next version.

## No positions, no policy ratings (`GREEN/YELLOW/RED`)

When `PLAYBOOK = none`, never emit `GREEN`, `YELLOW`, or `RED` (`load_playbook.py --bind` enforces this). Instead:
- Mark `Deviation: UNCOVERED` (or `n/a`).
- **Still assign `Severity: [CRITICAL|HIGH|MEDIUM|LOW]`** based on client exposure (`INTERESTS`) and `clause-baselines.md`.
- **Still provide concrete redline fixes** marked as baseline proposals (`[baseline proposal — confirm commercial position]`), never claiming an unapproved baseline is already firm policy.

## Checks

- `PLAYBOOK` is recorded in the stance and the Gate Plan (`none` allowed).
- Every deviation class cites a playbook position, or `UNCOVERED` with its owner.
- No playbook bound ⇒ no `GREEN/YELLOW/RED` policy ratings; `Deviation` is `UNCOVERED`, `Severity` is rated for `INTERESTS`, and baseline fixes carry `[baseline proposal — confirm commercial position]`.
- Every accepted deviation has a `deviations.md` row.
