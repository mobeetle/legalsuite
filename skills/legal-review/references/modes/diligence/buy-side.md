---
name: buy-side
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, challenge, verify, context
  delta: diligence-buy-side
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# Buy-side outputs

**Object of work.** The buy-side diligence outputs (red-flag report, protections map, Q&A).
> **Imports.** Obey the capability files named in the front-matter `metadata.imports`; do not restate them. This file carries only the mode's delta.


## Red-flag report (`dd-report.md`)

For the deal team. It reports issues, not a description of the target.

```
# Legal due diligence — red-flag report — <project code name>
⚠ <banner if any relied-on authority is unverified>
Scope: <documents reviewed (index ref), date of data room cut-off, register extracts dated …>
Thresholds: <…>   Limitations: <what was not available or not reviewed>

## Key findings (traffic light)
| # | Finding | Area | 🔴/🟠/🟢 | Deal impact | Recommended protection | Ref |
|---|---|---|---|---|---|---|

## Findings by area
### <Area>
DD<n> — <title>
- What we found: … (doc, §, "anchor")
- Why it matters for the buyer: …
- Confidence: high | medium | low (why)
- Recommendation: …

## Gaps and open requests
## Register checks (what each extract shows, dated)
```

Traffic light: 🔴 affects the decision to proceed, the price, or needs a
condition precedent; 🟠 needs a contractual protection or a post-closing
action; 🟢 noted, no action. A full report adds the area-by-area description,
but the findings come first.

## Protections map (`protections.md`)

The bridge from diligence to the the transaction agreement. One row per 🔴/🟠 finding:

```
| DD# | Risk | Quantifiable? | Protection | Drafting note for the transaction agreement | warranty insurance position | Owner |
```

Choose the protection by the nature of the risk:

| Risk | Typical protection |
|---|---|
| Known, quantifiable liability | price reduction, or specific indemnity with escrow or retention |
| Known, unquantifiable | specific indemnity (uncapped, or with a separate cap), or a CP to resolve before closing |
| Third-party consent or change-of-control trigger | CP (consent obtained) or a pre-closing covenant |
| Regulatory clearance (merger control, FDI, sector licences) | CP with a long-stop date, plus cooperation covenants |
| Defective title or corporate chain | CP to rectify; title warranty; walk-away if unfixable |
| Unknown / general risk | warranties with disclosure; warranty insurance |
| Known issue excluded by insurers | specific indemnity from the seller, since the insurer won't cover what the buyer already knows |
| Ongoing practice that must change | pre-closing covenant or post-closing undertaking |
| Deal-breaking | walk-away; or restructure (asset deal instead of share deal, hive-out) |

Every protection lands in the transaction agreement through the draft mode
(`references/modes/draft.md`); the negotiate mode
(`references/modes/negotiate.md`) tracks it in the rounds.

## Q&A to the seller (`qa-log.md`)

```
| Q# | Area | Question (one point, neutral) | Doc ref | Asked | Answer | Answer source | Follow-up | Status |
```

Questions are specific ("Has consent under §12.3 of the <customer> supply
agreement been requested?"), never fishing ("Please provide all information on
customers"). Answers are facts asserted by the seller (`[USER]` from the
seller's side), not verified until a document supports them.

## Checks

- **trace** on `dd-report.md` and `protections.md`: every finding and protection row resolves to a grid anchor (`dd-grid.md`).
- **release safety** (`scan.py outbound`) on `qa-log.md` before questions go to the seller.
- For high-risk findings, the challenge capability (`../legal/references/capabilities/challenge.md`, lenses: business owner and counterparty negotiator) on `protections.md`.

## Fan-out

One read-only packet per area to draft findings and Q&A rows from `dd-grid.md`. The parent owns `dd-report.md` and `protections.md`. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Give investment advice: a finding is a fact and its deal impact, not a recommendation to buy or a price.
- Conclude from the grid: it records; the protections map is drawn, not auto-generated.
- Treat the seller's answer as verified: an answer is `[USER]` from the seller's side until a document supports it.

## Counter-example (illustration)

*Illustration, not law.* The data room shows revenue overstated against the management accounts. **Mistake to catch:** the report concludes "the price should drop by X". Correct: the diligence states the facts, the deal impact, and a recommended protection (specific indemnity or price mechanism) — the pricing call is the deal team's, not the diligence's.
