# verify — capability

**Contract.** A read-only mechanical battery: run every applicable check, report
a pass/fail table, and **never mark a check `pass` that was not run**. `fail`
blocks release until fixed or explicitly `accepted` (the acceptance quoted, and
logged in `decisions.md`).

Any mode calls it; it is always-on before anything leaves the firm.

## The checks

Scripts live in `../scripts/` of the engine; mode skills call them as
`../legal/scripts/<name>.py`. All take `.txt`, `.md` or `.docx`, and support
`--json`, `--strict` and `--demo`.

| Check | Default | Mechanism |
|---|---|---|
| substance-preservation | on for every revision | `substance.py ORIGINAL REVISED`: amounts, dates, durations, refs and quotes dropped or added, and semantic flips (shall→may, and→or, party swaps, reasonable→sole discretion) |
| structure | on for every draft and revision | `structure.py DOC`: numbering, cross-references, defined terms (undefined, scope leak, overlap), blanks |
| house style | on for every draft and revision | `style.py DOC`: thematic breaks, `&`, banned words, bullet before `(a)`/`(i)` (`style.md`) |
| inbound scan | on for every document received from outside | `scan.py inbound FILE`: hidden text, embedded instructions, unaccepted tracked changes, macros |
| release safety | on before anything leaves the firm | `scan.py outbound FILE`: drafting notes, tags, trace refs, comments, metadata, privilege labels |
| trace | on for submissions, reports and memos | `trace.py ARTIFACT --facts facts.md --authorities authorities.md` |
| screen lint | before any markdown is shown in the TUI | `display.py FILE`: non-ASCII tree glyphs, >4-col tables, fenced lines over 76 |
| grounding | on for **every** deliverable that states or implies the law | every law proposition carries a ledger row that is `verified`, or is flagged `[verify]` with the unverified banner (`ground.md`) |
| link grounding | on when the document incorporates anything by URL | `links.py DOC`: extract URLs, check each live; a dead link fails (`ground.md`) |
| coverage, consistency, tag integrity | opt-in; always before release | map vs document; across documents; every claim tagged |

Run the check, quote its result, and never mark one `pass` that you didn't run.
Before anything leaves the firm the whole battery runs, regardless of opt-in.

**A zero-authority deliverable fails grounding.** "No authority was needed"
is an assertion like any other: name the propositions that would have needed
law and why they don't, or run the ledger. An empty ledger is `unknown`, not
clean.

**A negative finding carries its search.** "No deadline applies", "no conflict",
"no responsive document", "this regime does not apply", "contested: no" — each
states the scope searched (sources, terms, period, date). Without that record
the result is `unknown`, and `unknown` blocks release like a `fail`.

## Coverage / Read discipline

Always state what was read (`pages 1–50 of 200`); prioritise by section type; fan
out or batch large inputs (`orchestrate.md`); and say when the work should be a
team. A coverage check compares the map/grid against the corpus and reports the
gap.

## Verdict

Results are written as a pass/fail table into `verification-<artifact>.md`.
`fail` blocks release until fixed or explicitly `accepted`, and every acceptance
is quoted and logged in `decisions.md`.

## Checks

- Every applicable check in the battery ran; each result is quoted.
- No `pass` appears for a check that was not run.
- Every `fail` is fixed or explicitly accepted (quoted + logged).
- The Read/coverage line states what was read and what was not.
