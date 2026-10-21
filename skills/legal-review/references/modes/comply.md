---
name: comply
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, challenge, verify, context
  delta: comply
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# comply (legal-review · mode)

**Object of work.** A regulatory gap analysis: which regimes apply and what is missing.
> **Imports.** Obey the capability files named in the front-matter `imports:`; do not restate them. This file carries only the mode's delta.


The Compliance hat. The object of work is **an organisation measured against a
regime**: which rules apply, what they require, what the organisation does
today, and the gap between the two. The regime packs (`../legal/regimes/`)
supply the seed obligations. This skill applies them to one organisation's
facts, and resolves each obligation it relies on to the current text.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded.

## AST obligation — non-negotiable

Build the AST from the regime test: `Norm` = each obligation the regime imposes,
`Trace` = our non-compliance (a gap), `ESTABLISHES_BOUNDARY` = what compliance
requires. Print the **full** tree every turn in one fenced `text` box; every gap
row cites its node. Read the org's policies, contracts and practice as one
logical unit before asserting any gap.

Grammar and structure: `../legal/references/ir-and-provenance.md`.

**Urgency.** Name the regime even where no pack exists. Every gap carries a
severity, an owner and a deadline. Never assert compliance from a policy that
is not in force. Reporting clocks are computed, never guessed.

**Consent.** Ask, never infer a load-bearing gap; a write outside the matter folder needs an approved manifest (`gate.md`).

## Freshness gate

Regulatory content ages fast. Before using a regime pack, compare today with
its `review_by`. If the pack is stale, the deliverable opens with a staleness
line, every obligation from that pack is checked against the current text
before use, and the user is told once. Items marked ⚠ in a pack are resolved in
the citation ledger, or reported as unverified.

## Phases

1. **Organisation profile** (`comply-profile.md`, a fact map in the engine's
   format where facts are disputed): sector and activities, size (headcount,
   turnover, balance sheet, consolidated with group where the regime requires),
   locations and markets, customers (consumers? public sector?), data and
   systems, ICT providers, AI systems used or offered, regulated status
   (licences, supervision), group structure. Each fact tagged and sourced. Gaps
   become questions (the intake mode's style: ≤7 per round, blocking first).
2. **Applicability.** For each candidate regime (jurisdiction pack §13 (Regulatory overlays), and
   any the user names), run the regime pack's §2 *Scope tests* in order. Record
   each answer with its basis, then the **role** (§3) that decides the
   obligations (controller/processor; essential/important entity or
   higher/lower obligations; AI provider/deployer; obliged person). A regime
   that doesn't apply gets one line saying why. That conclusion is a
   deliverable too.
3. **Obligation register** (`obligations-register.md`): from the pack's §4, the
   rows that apply to this role, refined to the organisation:

   ```
   | ID | Regime | Article | Obligation (for this organisation) | Applies because | Evidence of compliance expected | Ledger |
   ```

   Resolve each relied-on article in the citation ledger (version in force at
   `EPOCH`). Add obligations the pack doesn't list when the current text
   requires them.
4. **Current state.** For each obligation, what exists: policies, records,
   contracts (`legal-review` for contract touchpoints, regime pack §7 (Contract touchpoints)),
   technical and organisational measures, training, governance. Tag each
   `[DOC]` with its anchor or `[USER]`. Missing evidence counts as not
   compliant until shown otherwise.
5. **Gap register** (`gaps-register.md`):

   ```
   | GAP# | Obligation ID | Gap (what is missing or deficient) | Severity | Exposure (sanction, liability, contractual) | Remediation | Owner | Deadline | Evidence when closed | Status |
   ```

   Severity measures exposure for this organisation: likelihood of enforcement
   or harm × consequence (fine maxima and management liability from the pack's
   §6, contractual exposure, operational impact). A missed statutory deadline
   (registration, notification) is at least `[HIGH]`.
6. **Clocks and deadlines.** Registration deadlines, notification clocks
   (breach, incident, suspicious transaction), periodic duties (reports,
   reviews, training, audits) from the pack's §5 go to `deadlines.md` with their
   rules. Incident clocks also go into a one-page **response card** that the
   organisation can use on the day.
7. **Remediation roadmap.** Gaps grouped into workstreams, ordered by severity
   and dependency, with owners and dates. Policy and contract changes are
   drafted by the draft mode (`references/modes/draft.md`) as **proposals** for
   the organisation's approval. Contract repapering (DPAs, ICT contract clauses,
   supply-chain security clauses) is run as a `legal-project` workstream.

## Outputs

- **Applicability memo** (which regimes, which role, why; short for
  `AUDIENCE = business`).
- `obligations-register.md`, `gaps-register.md` (CSV on request), the remediation
  roadmap, the response card(s), `deadlines.md` entries.
- **Executive summary** for management: top gaps, exposure, what management
  must decide or approve. Several regimes make management personally
  responsible, and the pack's §6 says which.

## Rules

- **Applicability is a conclusion with a basis**, never assumed from the
  sector name. Borderline scope (size thresholds, group consolidation, "main
  establishment", entity qualifications) is surfaced to the lawyer with both
  readings.
- **Adopted vs proposed.** Only adopted law creates obligations today. Pending
  amendments (from the pack's §1) are listed separately as readiness items,
  with their status and expected dates.
- **Overlaps** (regime pack §8 (Overlaps)): apply lex specialis, and don't duplicate
  remediation across regimes (e.g. one incident-response process serving
  several reporting duties, each with its own clock).
- **Authority is national too.** Directives apply through the national act;
  regulations are direct but have national add-ons (authorities, sanctions,
  options). Load the jurisdiction pack and use the national pack where one
  exists (the pack code names it).

## Checks

- **grounding** on every obligation relied on (ledger rows `verified`).
- **coverage**: every applicable regime pack §4 (Obligations) row is in the register, or excluded
  with a reason.
- **trace** on the memo and the executive summary.
- For `RISK = high` (regulated entity, live incident, inspection announced),
   the challenge capability (`../legal/references/capabilities/challenge.md`) with the *regulator* lens on the applicability memo and the
  gap ratings.

## Fan-out

One read-only packet per candidate regime (scope tests, current-state evidence) and per policy or contract to check. The parent owns the applicability memo and the two registers. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Decide applicability for a regulator: it assesses and states the basis; the determination is the lawyer's.
- Invent an obligation: every row resolves to the regime's text in force at the epoch.
- Leave a gap without an owner and a date.

## Counter-example (illustration)

*Illustration, not law.* The client asks if a regime applies, and the memo answers "no". **Mistake to catch:** applicability was asserted with no basis and no unresolved branches. Correct: state the applicability test, the facts it turns on, and mark uncertain branches `[review]`.
