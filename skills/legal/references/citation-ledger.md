# Citation ledger

Courts found AI-fabricated authority in more than 2 000 decisions by 2026,
including constitutional complaints, and in cases where legal-specific tools
were used. Many of these were **invented quotes inside real decisions**.
"The case exists" is not verification. This file defines what verified
means.

## The ledger

One per matter: `.legal/<matter>/authorities.md`. Without a matter folder, put
the ledger at the end of the deliverable under `## Authorities`.

```
# Authorities — <matter>
| ID | Citation | Proposition | Source | Retrieved | In force at EPOCH | Quote | Weight | Status | Result |
|---|---|---|---|---|---|---|---|---|---|
| A1 | § 629 odst. 1 z. č. 89/2012 Sb. | general limitation period is 3 years | e-Sbírka <URL> | 2026-10-10 | yes — version in force on 2025-03-14 | match | binding | in force | verified |
| A2 | NS 23 Cdo 1234/2020 | … | — | — | — | — | — | — | unverified |
```

| Column | Content |
|---|---|
| Citation | The citation in the jurisdiction's format (pack §2 (Citation format)) |
| Proposition | The exact point the deliverable uses it for: one proposition per row |
| Source | URL or database ID of the text actually read. "Model knowledge" is not a source |
| Retrieved | Date retrieved |
| In force at EPOCH | `yes` / `no` / `partly`, with the version or date range (pack §3 (Temporal validity)). For case law: the date of decision and whether the law it applied has changed since |
| Quote | `match`: the quoted words appear verbatim **and are the passage that states this row's Proposition**. `paraphrase`: no quote in the deliverable; the row then carries the operative words in Source excerpt. `mismatch`: a quote doesn't match, or matches but does not state the Proposition. `—`: not checked |
| Source excerpt | The operative words relied on, quoted from the source. Required when Quote is `paraphrase`; this is what makes a paraphrase checkable |
| Weight | `binding` · `persuasive` · `commentary` · `lead` (a pointer only, not citable). Pack §1 (Sources and hierarchy) gives the hierarchy |
| Status | `in force` · `amended` · `repealed` · `good law` · `overruled` · `doubted` · `unknown` |
| Result | `verified`: retrieved, in force at EPOCH, and the quoted passage (or the Source excerpt) states this Proposition. `partial`: retrieved but one element is open, which you name. `unverified`: not retrieved. `failed`: retrieved and it doesn't say this, doesn't exist, or wasn't in force |

**Tier mapping.** Each `Result` maps to a provenance tier (`provenance.md`):
`verified → [settled]`, `partial → [verify-pinpoint]`, `unverified → [verify]`,
`failed → [verify]` (and the row is not cited).

## Procedure

1. **Source plan first.** Work down the hierarchy in jurisdiction pack §1 (Sources and hierarchy):
   constitution and EU law, then statute in the version in force at `EPOCH`,
   then binding or unifying case law, then supranational courts, lower courts,
   and commentary. Stop when the proposition is settled at the highest level
   available.
2. **Retrieve and read.** Open the provision or decision itself, from an
   official or reputable source (pack §1 (Sources and hierarchy) lists the portals). Search results,
   summaries and other tools' outputs are leads.
3. **Pin the version.** Statutes: the wording in force at `EPOCH`, checked
   against transitional provisions. Decisions: whether later decisions or
   amendments have overtaken them.
4. **Match the quote to the proposition.** Every quotation is compared word for
   word with the source, and the passage must carry the point the row asserts:
   a real quotation attached to a different holding is `mismatch`, not `match`.
   If it can't be matched, paraphrase it, record the operative words as Source
   excerpt, and remove the quotation marks — or drop it.
5. **Weigh it.** Binding or persuasive, and why. Note contrary authority in its
   own row, with the proposition it undercuts.
6. **Record the row.** A row is `verified` only when every column supports it.

## Rules

- A negative authority search is a result only with its record: the sources
  and terms searched, the date, and the outcome (`none found` / `not searched`).
  "No contrary authority" without that record is `unknown`, never a finding.
- Memory-only authority is a lead: `[ASSUMED] (verify)`, `Result =
  unverified`. Never quote it.
- **Paywalled sources** (Beck-online, ASPI, Codexis, Westlaw): use them when the
  user has access, and cite the official text where one exists. A commentary
  passage that can't be opened is cited as a lead, not as verified.
- **Opponent's authorities** go through the same ledger, with the Proposition
  starting `(opponent)`. A misquoted or overruled authority on their side is a
  finding for us.
- **Multi-jurisdiction:** one ledger section per jurisdiction. Never let a
  rule from one jurisdiction stand in for another.
- **Anonymise queries.** Search for the legal point, never the client's facts.
- **No retrieval tool connected:** every row stays `unverified`, and the
  deliverable carries the banner below. Say this once, at the start; don't
  pretend to look things up.

## Banner

When any relied-on row isn't `verified`, the deliverable opens with:

> ⚠ Authorities not verified against source: <n of m>. Check each before relying on or filing this.

The banner can only be removed by verifying the rows, never by deleting it.
