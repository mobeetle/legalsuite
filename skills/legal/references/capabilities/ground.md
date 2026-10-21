# ground — capability

**Contract.** Given a proposition a deliverable relies on: build a source plan
down the hierarchy, retrieve and read the source, pin the version in force at
`EPOCH`, match the quote, and record a citation-ledger row. Currency is required
wherever the law can move between retrieval and reliance.

The row format and the full procedure live in `references/citation-ledger.md`;
this file is the reusable method. `legal-research` is the mode that runs it
standalone.

## Method

1. **Source plan.** Per proposition, work down the hierarchy (jurisdiction pack
   §1 (Sources and hierarchy)): constitutional and EU law → statute in the version in force at `EPOCH` →
   binding or unifying case law → CJEU/ECtHR → lower courts → commentary. Stop
   at the highest level that settles the point. Name the portals and the
   (anonymised) search terms.
2. **Retrieve and read.** Open the provision or decision itself, not a summary;
   read the surrounding provisions (definitions, exceptions, transitional rules)
   and the reasoning. Search results and other tools' output are leads.
3. **Pin the version.** The wording in force at `EPOCH`, checked against
   transitional provisions; for a decision, whether later decisions or
   amendments have overtaken it.
4. **Match the quote.** Every quotation compared word for word; unmatched text
   is paraphrased without quotation marks, or dropped. **Quote-to-proposition:**
   the quote must carry the *holding* the deliverable uses it for — a dictum, a
   dissent, or an argument the court rejected is not support. Where support is
   retrieved but the link to the proposition is not established, tag it
   `[retrieved but verify support]` rather than citing it. A paraphrase is
   checkable only with the operative words in the ledger's Source excerpt
   column (`references/citation-ledger.md`); without it the row is `partial`.
5. **Record.** One ledger row per authority per proposition, in
   `authorities.md` (`references/citation-ledger.md`). A row is `verified` only
   when every column supports it. Contrary authority gets its own row.

## No pack for the jurisdiction — build the source list from official sources

When no `jurisdictions/<code>.md` pack exists for `JURISDICTION` (no grounding
plugin for that jurisdiction), do not skip grounding: build an ad-hoc §1 source
list with the search tool, then run this same method against it.
1. Search for the official gazette / collection of laws, the official
   court-decisions database, and the competent regulator(s) for this
   jurisdiction and matter; prefer official gazette, court and regulator
   domains over commentary.
2. Name the 2–5 official portals found as the ad-hoc hierarchy (statute in
   force at `EPOCH` → binding case law → regulator guidance); everything else
   is a lead until its row is `verified`.
3. Retrieve, pin the version, match the quote, and record ledger rows as usual;
   a rule from the ad-hoc list stays `[ASSUMED]` until its row is `verified`.

Company sources (bound playbook, profile, matter `decisions.md`) ground by trace
to the stated position (`positions.md`), not by ledger row; every proposition
about what the law *is* still needs a ledger row.

## Currency

Where the answer depends on the current state of the law, a retrieval is
**required**, not optional; where it is absent, the reviewer note says so
(`present.md`). A pack rule is `[ASSUMED]` until it has a verified ledger row.

**The recent-developments test.** Ask: has this rule moved — or is it scheduled
to move — between the source's date and `EPOCH`? If the answer could be yes, a
current retrieval is mandatory and its absence is stated. Standing staleness
checks and verify-at sources: `currency-watch.md`. Which *regimes* move is
content, not method — it lives in the packs.

## Links incorporated by reference

A URL a document incorporates by reference — product terms, a policy, a
register, a portal — is an authority in substance and is grounded the same way:
retrieve the page, confirm it says what the document claims, and give it a
ledger row (source, status, retrieved date). Never ship a URL from memory or
from a prior draft unchecked. Verify the address with `links.py DOC` (a dead or
redirecting link is a finding) and then read the page: `links.py` proves the
address resolves, the read proves the page matches. A live URL is not a correct
one.

## No silent supplement

When a source is missing or a lookup fails, there are three responses, never a
fourth (invent):

- **supplement with a flag** — fill from the nearest defensible source and tag
  the substitution in the deliverable;
- **stop** — the gap is load-bearing (`frame.md`); ask and wait;
- **flag but don't use** — record the source as unavailable and leave the point
  open, so the reader sees the hole.

Never quietly paper over the gap with hedged language.

## The banner

If no retrieval tool is connected, or any relied-on row is not `verified`, the
deliverable opens with:

> ⚠ Authorities not verified against source: <n of m>. Check each before relying on or filing this.

The banner is removed only by verifying the rows, never by deleting it.

## Checks

- Every relied-on authority has a ledger row with all columns filled.
- No memory citation is quoted or called `verified`.
- The banner is present (and current) whenever it applies; absent only when it
  does not.
