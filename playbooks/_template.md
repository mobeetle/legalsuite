---
name: <playbook name>
format: legalsuite-playbook/2
scope: <matter type + role, e.g. "commercial lease — tenant side">
jurisdiction: <CZ | EU | …>
role: <whose interests this protects>
version: 0.1
status: draft            # draft | approved | retired
owner: <role or person responsible for this playbook>
approved_by:             # required when status is approved
approved_at:             # YYYY-MM-DD, required when status is approved
updated: YYYY-MM-DD
review_by: YYYY-MM-DD    # after this date the playbook is treated as stale
---

# <Playbook name>

## Scope
Which matters this playbook governs and which it does not. Contract types,
side, deal size or risk band, jurisdictions.

## Positions
One row per clause or issue. `Req`: `must` (absence is a finding), `should`,
`optional`. The skills read the three positions as deviation classes:
within Preferred = GREEN, within Fallback = YELLOW (the Approver decides),
beyond Walk-away = RED. A clause with no row is UNCOVERED.

| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | | must | | | | | |

## Clause library
Verbatim wording per position ID, ready to paste into a draft or redline.

### P1 — <clause>
Preferred wording:
> …

Fallback wording:
> …

## Standard definitions
Terms this playbook fixes, with preferred wording.

## Red flags
Signals that escalate risk or trigger a walk-away, whatever the clause.

## Negotiation sequence
Order of concessions; what to trade against what; what never to trade.

## Jurisdiction notes
Where a position depends on the governing law (mandatory norms, formalities),
per jurisdiction.

## Provenance
What the positions rest on: number of matters or signed agreements, reviewers,
dates. **No client-identifying facts.**
