---
name: <intake matrix name>
format: legalsuite-intake-matrix/1
scope: <firm + matter types this matrix governs, e.g. "firm-wide — all new inquiries">
version: 0.1
status: draft            # draft | approved | retired
owner: <role or person responsible for this matrix>
approved_by:             # required when status is approved
approved_at:             # YYYY-MM-DD, required when status is approved
updated: YYYY-MM-DD
review_by: YYYY-MM-DD    # after this date the matrix is treated as stale
---

# <Intake matrix name>

Rows are case types / client segments. Columns are the acceptance criteria.
Each cell: `accept` (take), `conditions:<what>` (take only with the named
approver's sign-off), or `decline` / `refer-out` (walk away, advice-free).
A row with any decline cell is declined. Conditions cells become the
engagement options of the scope proposal.

| Row (case type / segment) | Scope fit | Conflict risk | Economics | Capacity | Urgency |
|---|---|---|---|---|---|
| <e.g. employment — employee side> | accept | check-first | conditions: deposit | accept | standard |
| | | | | | |

Column notes (fill per firm: fee floors, excluded matter types, conflict
categories that always decline, capacity limits, expedite triggers):

- Scope fit:
- Conflict risk:
- Economics:
- Capacity:
- Urgency:

## Engagement discipline

- First-response clock: <e.g. same business day; expedite rows within 2 hours>
- Lead stages: `new → contacted → qualified → consulted → engaged / declined`
- Decline path: advice-free close in the client's language, logged with the
  deciding cells.

## Status rule

`draft` and stale matrices still qualify, but their outcome is provisional and
needs the owner's sign-off before engagement. Never present a draft matrix as
approved policy. Never overwrite an approved matrix; publish a new version.
