---
name: sell-side
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, challenge, verify, context
  delta: diligence-sell-side
  version: 1.0
  last_validated: 2026-10-16
  category: mode
---

# Sell-side outputs

**Object of work.** The sell-side readiness outputs (VDD, remediation, data room, disclosure, Q&A).
> **Imports.** Obey the capability files named in the front-matter `metadata.imports`; do not restate them. This file carries only the mode's delta.


The seller's advantage is time: run the buyer's review on yourself first, and
fix things on your own schedule instead of under price pressure.

## Vendor DD / readiness report (`vdd-report.md`)

Run the shared core with the buyer's eyes: the same grid columns, the same
thresholds a buyer would apply. The output has two parts:
- **Readiness findings**: what a buyer will find, rated by its likely deal
  impact (price chip, CP, specific indemnity, walk-away).
- **For a published VDD report** (one buyers may rely on): factual and neutral,
  with the reliance and scope terms set by the lawyer. Internal assessments
  and remediation discussions stay out of it, and it passes `scan.py outbound`.

## Remediation plan (`remediation.md`)

```
| # | Finding | Fix | Owner | Deadline | Before signing? | Evidence when done | Status |
```

Typical fixes: missing corporate approvals ratified, register entries
corrected, change-of-control consents obtained in advance, IP assignments
signed, processor terms concluded, expired permits renewed, litigation
provisioned or settled. Anything that can't be fixed goes to the disclosure
letter.

## Data-room build and index (`dataroom-index.md`)

```
| Index # | Folder | Document | Date | Parties | Version (signed / draft) | Complete? | Sensitive (clean team) | Redacted | Uploaded |
```

- Signed, complete versions only, with all amendments and schedules. Mark
  missing items instead of hiding them.
- Clean-team-only documents (competitively sensitive) flagged and separated.
- Personal data minimised or redacted (the data-protection regime pack).
- Each upload passes `scan.py outbound`: no comments, tracked changes, internal
  metadata or privileged notes.

## Disclosure letter (`disclosure-letter.md`)

Against the warranties of the current transaction-agreement draft.

```
| Warranty (agreement §) | Disclosure | Specific / general | Data-room ref (index #) | Fairly disclosed? |
```

- **Specific disclosures** name the warranty, the facts and the document. They
  must be "fair": enough for the buyer to understand the nature and scope of
  the matter.
- **General disclosures** (the data room, public registers) depend on what the
  agreement accepts. Check its disclosure standard and limit general
  disclosures to it.
- Check that every remediation item that wasn't completed and every finding
  in the readiness report is either disclosed or deliberately not disclosed,
  with that decision recorded in `decisions.md`.

## Q&A response log (`qa-log.md`)

```
| Q# | Buyer's question | Draft answer | Source (index # / person) | Approved by | Sent | Consistent with room? |
```

- Every answer is drafted from a document or a named person at the seller, and
  approved before it's sent.
- **Consistency check** before each batch: an answer that contradicts the data
  room, an earlier answer or the disclosure letter is a finding. It creates
  warranty and misrepresentation risk.
- Answers are disclosed information. Mirror them in the disclosure letter if the
  agreement requires it.

## Checks

- **coverage and consistency**: every readiness finding is remediated, disclosed in `disclosure-letter.md`, or recorded in `decisions.md`; Q&A answers match the data room.
- **release safety** (`scan.py outbound`) on every uploaded file, published VDD report, disclosure letter, and Q&A batch.

## Fan-out

One read-only packet per folder or warranty group to verify disclosures and Q&A consistency against the room. The parent owns `vdd-report.md`, `remediation.md`, and `disclosure-letter.md`. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Hide or soften a disclosed risk to keep the deal moving: a readiness finding is disclosed or deliberately not, with that decision recorded.
- Run the buyer's review or answer for the buyer: it prepares the seller's side.
- Publish internal assessment or remediation in a report buyers may rely on: a published VDD report is factual and neutral.

## Counter-example (illustration)

*Illustration, not law.* The readiness report finds a missing change-of-control consent. **Mistake to catch:** it is dropped from the disclosure letter to avoid a price chip. Correct: it is either remediated (consent obtained) or specifically disclosed — and the decision is recorded in `decisions.md`.
