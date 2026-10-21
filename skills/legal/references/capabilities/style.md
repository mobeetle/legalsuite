# style — capability

**Contract.** One house voice for the text a mode hands over: the mechanical
rules the house fixes by hand are checked, not re-told, and a matter's wording
choices persist. Fix the `fail`s before a draft goes anywhere; a `warn` is a
judgement the drafter owns.

Stylistic *wording* reuse (same situation, same word) is `context.md`; severity
vocabulary is `vocabulary.md`. This file owns the mechanical house style.

## The rules

`../scripts/style.py DOC` (twin `style.js`) is the single source:

| Rule | Level | It catches |
|---|---|---|
| thematic-break | `fail` | a `---` / `***` rule between paragraphs — the house never puts one in a document |
| list-punct | `fail` | a bullet glyph in front of a `(a)` / `(i)` enumerated item |
| ampersand | `warn` | `&` in running text — spell it out as `and` |
| banned-word | `warn` | a filler word the house avoids (`strictly` by default) |

- `&` inside a URL, an XML entity, or a closed compound (`R&D`, `AT&T`) is
  not flagged; the canonical legal collocations (`strictly necessary`,
  `strictly confidential`, `strictly prohibited`, `strictly limited`) are exempt.
  A legitimate `strictly` elsewhere is the drafter's call, not a defect.
- Fenced code blocks and YAML front-matter are skipped — the rules are about the
  document's prose, not its carriage.

## Where the house list lives

- **Firm-wide**: the profile's `House style` section (`configure.md`), or
  `.legal/context.md`. Extra words are passed with `--ban WORD` (repeatable).
- **Matter-wide**: the matter's reuse vocabulary (`context.md`,
  `reuse-vocabulary.md`) — a word the matter banned once stays banned for the
  run, and a wording choice feeds back there.
- The four mechanical rules are fixed; only the banned-word list is configurable.

## When it runs

- On **every draft and every revision** — a revision re-runs it, because a
  correction made last turn is reintroduced by the next redraft otherwise.
- Before release, with the rest of the battery (`verify.md`).
- On the `.md` source. The `.docx` export (`md2docx.py`) already drops thematic
  breaks, so the check is meaningful on the working form and on any `.docx`
  received back.

## Checks

- `style.py --strict` is clean on every draft handed over, or each `fail` is
  accepted and logged (`verify.md`).
- Every banned word in a deliverable traces to the fixed list or the house list.
- A `warn` left in place is a stated choice, not an oversight.
