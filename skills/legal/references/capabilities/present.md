# present — capability

**Contract.** Shape every deliverable for its audience, lead with the BLUF
verdict, and always show *and* file it. One analysis, shaped differently; a
finished artifact is shown on screen (in full when ≤80 lines; Executive Summary +
all `[CRITICAL]`/`[HIGH]` findings & redline clauses when >80 lines) **and**
written in full, un-truncated, to `.md` and `.docx` in the matter folder.

The screen contract — FILES links, the Progress box, the block templates, the
map box, the 76-col rules — lives in `references/display.md`. This file owns the
audience shaping and the deliverable mandate.

## Audience

Set by `AUDIENCE`. One analysis, shaped differently:

| Audience | Shape | Never include |
|---|---|---|
| lawyer | Full analysis, map and ledger references, open points, confidence | — |
| client | Plain language; decisions needed; top 3–5 risks with consequences and options; costs and next steps; legal terms explained once | Internal tags, unverified authority presented as settled |
| business | One page: what it means, what to do, by when, who decides | Doctrine, citations beyond one line |
| court | Formal; the forum's required particulars (pack §8 (Civil procedure)); every fact traceable to evidence; every authority verified | Internal reasoning, weak arguments for volume |
| counterparty | Issues list and proposals; neutral, firm tone | Internal reasoning, risk ratings, privileged notes, fallbacks and walk-aways |
| regulator | Precise, complete for the question asked, facts and evidence tied | Speculation, unrequested admissions |

## The closing pair

Every architect turn **ends** with two blocks, in this order, as the last thing in
the message:

1. **File links (`FILES`)** — every persisted document the turn produced or
   touched, as clickable markdown links to its **absolute, existing** path, with
   the same path as inline code beside it. The user-facing `.docx` first, then
   its `.md`, then other persisted documents.
2. **Progress box** — session goal + done-definition first (`goal:` / `done:`
   with per-criterion statuses), then steps done / current / next, plus `now:`
   and `so far:` judged against the goal. It
   is the final block; nothing follows it — not options, not the self-check
   line, not the Execution Protocol.

Turn order (absolute): deliverable → decision-tree options → self-check line →
Execution Protocol → `FILES` → Progress box.

The fast-track tail is one line: `Done · goal: <outcome — met | compromised | open> · checks: <…> · assumed: <…>`, with the
`FILES` links still before it. Full shapes: `references/display.md`.

## Deliverables

- **Language.** The deliverable is in the source document's language, or the
  client's stated language for new work. Commentary is in the user's language.
  Never silently translate operative text.
- **Formats.** Markdown in the matter folder is the working form. **Every
  deliverable the Gate Plan's `OUTPUT STRUCTURE` names is always written as
  `.docx` beside its `.md`** via `../scripts/md2docx.py` (after
  `../scripts/scan.py outbound`) — the enumerated user-facing files
  (`debrief.md`, `handoff.md`, `memo-*.md`, `summary-*.md`, `final-report.md`,
  `closing.md`) and any other artifact the plan calls a deliverable. The `.docx`
  is mandatory and is never omitted as an economy (`economy.md`). For Word
  tracked changes, use `../scripts/redline.py`. Export grids (diligence,
  chronology, claims matrix, obligations) to CSV on request.
- **Print, then file.** When the turn hands over the final artifact: if ≤80
  lines, print it in full on screen; if >80 lines (e.g. a full redlined contract
  or a 15-page DD report), print the **BLUF Verdict + Executive Summary + all
  `[CRITICAL]`/`[HIGH]` findings and redline clauses** on screen, and write the
  complete, un-truncated text to `.md` and `.docx` in the matter folder, linked
  in `FILES`. Never truncate the file artifact itself.
- **Self-check.** Place one or two lines of calibrated confidence, the biggest
  risk, and what would change the conclusion, directly before `FILES`
  (never after the Progress box — the box is always last).

## Reviewer note and BLUF Verdict

One block at the top of the turn; the Reviewer note collapses to a single line
when there is nothing to flag, followed immediately by the **BLUF Verdict /
Executive Takeaway**:

```
Reviewer note: Sources: <n/m verified> · Read: <scope> · Flagged: <[review] items | none> · Currency: <date | n/a>

**BLUF Verdict:** <SIGN | SIGN WITH FIXES | DO NOT SIGN | direct answer> · **Critical/High issues:** <n CRITICAL, m HIGH> · **Nearest deadline (≤30d):** <date — rule, or none>
```

When expanded (multiple open flags or unverified sources):

```
Reviewer note
- Sources: <n verified of m relied on; the rest [verify]>
- Read: <what was read, e.g. pages 1–50 of 200>
- Flagged for judgment: <[review] items, or none>
- Currency: <checked when; what is stale, or n/a>
- Before relying: <the one thing to confirm>
```

It supersedes the authorities-only banner: when any relied-on row is not
verified, the banner **is** the `Sources` line (`ground.md`). Every substantive
deliverable opens with the Reviewer note + BLUF Verdict.

## Coverage / large input

Always state what was read (`pages 1–50 of 200`) — silence reads as "I read it
all". Prioritise by section type; fan out or batch large inputs
(`orchestrate.md`); and say when the work should be a **team** (platform-scale:
many documents, many jurisdictions) rather than one run. The `Read` line carries
this.

## Decision-tree close

Place substantive outputs' *options* before `FILES` — draft the X / escalate / get more facts
/ watch and wait / something else — customised to the matter, each with what it
costs and what it unblocks. Then, only when there is one, **"One question I'd ask
that isn't in my checklist."** Never manufacture one. Options never come after the Progress box.

## Dashboard offer (D4)

When a table would run past ~10 rows, offer a **dashboard** instead of a wall of
rows: a summary-stat line, one sortable table and 1–2 charts. Escape every cell
that came from outside the matter (document text, tool output): HTML-escape it,
write it with `textContent` not `innerHTML`, and allow only `http`/`https`/`mailto`
URL schemes. Keep CSV export.

## Quiet mode (D5)

For a deliverable going to a client, counterparty or court: keep the stance header
and the reviewer note, cut the internal narration and the command handoffs from
the body. The reader sees the deliverable, not the run. Quiet mode is a property
of the **audience**, not of the effort path.

## Large output and file failures (D6)

Estimate the size before producing a large output; if it will be unwieldy, offer
scope options (page range, one section, a summary plus annex) and **wait**. When a
read or write fails, report it with the fix (missing path, permission, encoding),
never silently continue.

## Multilingual quotes (E5)

Preserve a source quotation in its **original** language; keep the original beside
the translation and label the translation. Never translate inside quotation marks,
and never present a translation as the source's own words.

## Checks

- The turn opens with the Reviewer note + BLUF Verdict (`SIGN / SIGN WITH FIXES / DO NOT SIGN` or direct answer, `[CRITICAL]`/`[HIGH]` count, nearest ≤30d deadline).
- The turn closes with `FILES` links then the Progress box, nothing after it.
- Every user-facing deliverable is written in full (never truncated) to `.md` and `.docx`, and shown on screen (in full if ≤80 lines; Executive Summary + all `[CRITICAL]`/`[HIGH]` findings & redlines if >80 lines).
- Internal syntax is stripped for `client`/`business`/`counterparty` audiences
  (`references/display.md`).
- `../scripts/display.py` lints the screen artifact before it is shown.
