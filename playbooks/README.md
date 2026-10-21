# Playbooks

A playbook is the firm's policy layer: approved positions per clause
(preferred / fallback / walk-away), who may approve a deviation, the verbatim
clause wording, red flags and the negotiation sequence. The skills never
hard-code a firm's positions. They read them from here.

## Format

`legalsuite-playbook/2`, documented in `_template.md` (which ships with the
suite alongside `_template-intake-matrix.md` for in-skill draft authoring via
`configure.md`). The example `example-nda-discloser-cz.md` shows a filled-in
playbook. It is illustrative, not approved policy. Every seed playbook ships
with the suite under Apache-2.0 as `status: draft` — a negotiating proposal,
not a position anyone may rely on until a lawyer signs it off.

The skills turn the three positions into deviation classes per clause:

| Class | Meaning | Who decides |
|---|---|---|
| GREEN | within the preferred position | — |
| YELLOW | within the fallback | the position's Approver |
| RED | beyond the walk-away | escalation per the practice profile |
| UNCOVERED | no position in the playbook | the playbook's owner |

## Where playbooks come from

This suite consumes and validates playbooks — and drafts them
(`configure.md`, authoring): interview, mined agreements and deviations,
`--check` before presenting, always `status: draft` until the owner approves.
The tool is free and complete. Depth is the paid part: partner interviews at
depth, agreement mining at scale and cross-matter deviation analysis are
legalskills.cz services (playbooks, workflows and skills creation; prices on
`legalskills.cz`). You can also author by hand from `_template.md` and
`_template-intake-matrix.md` (both ship with the suite so in-skill draft
authoring via `configure.md` works out of the box).

Every matter that applies a playbook records the accepted deviations in
`.legal/<matter>/deviations.md`. That record is the input for the playbook's
next version.

## Use one

Bind it in the Gate Plan (`PLAYBOOK = <slug>`). Any mode reads it.

```sh
python3 skills/legal/scripts/load_playbook.py --list
python3 skills/legal/scripts/load_playbook.py <slug>
python3 skills/legal/scripts/load_playbook.py --check <slug>   # format + leaked client facts
```

- **Precedence:** most specific wins (a client's playbook over the firm's
  base playbook for that contract type).
- **Conflicts:** a conflict between a playbook position and the document, or
  mandatory law, is surfaced, never silently resolved.
- **Status:** `draft` and stale (past `review_by`) playbooks still apply, but
  their positions are proposals that need a lawyer's sign-off.

## Storage

The loader searches, first hit wins: an explicit path, `$LEGALSUITE_PLAYBOOKS`,
`.legal/playbooks/` in the project, this folder, then `~/.legal/playbooks/`.
Never overwrite an approved playbook; publish a new version.
