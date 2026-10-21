# vocabulary — capability

**Contract.** One severity scale, one deviation axis, one set of flag species —
used the same way by every mode. Ambiguous → round up; a demotion downstream is
recorded, never silent.

## Severity (exposure for our side)

Severity measures **impact on `INTERESTS`**, not the clause in the abstract. The
same clause can be critical for one side and good news for the other: an employee
non-compete without the statutory consideration may be invalid, which is a
serious problem for the employer and a benefit for the employee. Rate the risk
for our client and say in the finding which side it favours.

| Severity | For our side, it… |
|---|---|
| `[CRITICAL]` | voids or defeats the document's purpose, triggers a severe sanction, exposes us to catastrophic liability, or forfeits a core right |
| `[HIGH]` | likely causes significant loss, litigation vulnerability or operational disruption |
| `[MEDIUM]` | creates ambiguity, procedural friction, one-sided leverage against us, or dispute risk |
| `[LOW]` | is a drafting defect with no material effect on rights or money |

One fixed vocabulary: `[CRITICAL] [HIGH] [MEDIUM] [LOW]`. No other word.

### Calibration (prevents severity inflation)

| Severity | Example (side in brackets) |
|---|---|
| `[CRITICAL]` | Uncapped indemnity for indirect loss [indemnifying party]; a formal defect that voids a transfer [transferee]; an employee non-compete likely invalid for lack of statutory consideration [employer relying on it] |
| `[HIGH]` | 3-day notice-of-claim forfeiture [claimant side]; unilateral price increase with no exit [customer]; silent IP ownership in bespoke work [customer]; uncapped audit rights [audited party] |
| `[MEDIUM]` | "Reasonable efforts" without criteria; payment tied to undefined "acceptance" [supplier]; no escalation step before litigation |
| `[LOW]` | Broken internal cross-reference; lowercase use of a defined term; archaic legalese; duplicate recitals |

## Deviation (playbook distance — a separate axis)

`GREEN | YELLOW | RED | UNCOVERED | n/a`. Definitions and binding: `positions.md`.
A clause can be `[LOW]` and `RED` (a policy breach of little impact here) or
`[HIGH]` and `GREEN` (accepted policy that is still risky in this deal). Report
both. When `PLAYBOOK = none`, `Deviation` is `UNCOVERED` (never `GREEN/YELLOW/RED`), while `Severity` `[CRITICAL]`–`[LOW]` and baseline redline proposals (`[baseline proposal — confirm commercial position]`) are still emitted in full.

## Flag species

- `[verify]` — *check the source*: a factual or authority gap the reader must
  confirm against a source.
- `[review]` — *lawyer judgement needed*: a subjective threshold, a risk-appetite
  call, an approver's decision.

Keep both distinct from `[ASSUMED]` (an unverified default the suite filled) and
from a ledger `verified` (an authority checked against source). The finding
template carries a `Decision` slot for `[review]` items.

## Recoverable-error default

On a subjective threshold, flag `[review]` — do not silently decide, and do not
lecture in prose. State the threshold, the two readings, and who decides.

## Severity floor

One canonical scale. A downstream mode may not demote an upstream severity
without stating the reason, recorded where the artifact lives. Ambiguous → round
up. Every `form`/finding/register row carries the severity and its source.

**Substantive floor.** Independently of any upstream row: a defect that
conflicts with a mandatory norm, defeats a formality that goes to validity, or
leaves a liability uncapped is at least `[HIGH]`; one that voids the document's
purpose or forfeits a core right is `[CRITICAL]`. A lower rating must state why
the defect does not bite on these facts.

## Checks

- Every `form`/finding/register carries a severity from the fixed set, plus its
  source.
- Every deviation class traces to a playbook position or is `UNCOVERED`
  (`positions.md`).
- Any demotion of a severity is recorded with its reason.
