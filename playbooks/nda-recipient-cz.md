---
name: NDA — recipient (one-way)
format: legalsuite-playbook/2
scope: one-way NDA where the counterparty discloses and we receive; Czech law
jurisdiction: CZ
role: recipient
version: 0.9
status: draft
owner: legalsuite seed (pending approver)
approved_by:
approved_at:
updated: 2026-10-14
review_by: 2027-04-10
---

# NDA — recipient (one-way)

Seed playbook shipped with legalsuite. It ships as draft
(not approved policy) and is not legal advice. The positions are a recipient-side
commercial stance; confirm them against your own approved playbook and the
current law before any use.

## Scope
One-way non-disclosure agreements before a commercial deal, diligence or
cooperation where the counterparty discloses and we receive. Not for mutual
NDAs (see the mutual playbook), employment confidentiality, M&A clean-team
arrangements or public-sector counterparties (Registr smluv rules apply there).

## Positions

| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Definition of Confidential Information | must | Only information marked "confidential" in writing, or, if disclosed orally or visually, identified as confidential at the time and confirmed in writing within 10 business days | Information a reasonable person would understand to be confidential; oral disclosures identified as confidential at the time | Broad "all information disclosed in any form" with no marking duty and no Purpose limitation | senior associate | Marking discipline is the Recipient's main risk control; an unmarked definition turns ordinary know-how into protected information |
| P2 | Exceptions and carve-outs | must | Four standard carve-outs (public without breach, lawfully known before, independently developed, received from a third party without restriction), available to the Recipient without a proof burden, and no residuals clause | Same four carve-outs, with the Recipient to prove them by written records | Any "residual knowledge" or "general skills and knowledge" exception reaching trade secrets, or carve-outs the Recipient cannot invoke in practice | partner | A residuals clause turns the NDA into a use licence; proof-on-Recipient clauses fail in practice |
| P3 | Term | must | Obligations last two (2) years from disclosure; trade secrets for as long as they remain trade secrets | Three (3) years; trade secrets carved out without a time limit | Over five (5) years for non-trade-secret information, or a perpetual term | senior associate | The Recipient's exposure should not outlast the commercial relationship |
| P4 | Purpose limitation and permitted use | must | Use limited exclusively to evaluating and pursuing the defined Purpose | Purpose described broadly but still exclusive and tied to the deal | No purpose limitation, or an express licence to use the information | senior associate | The purpose clause is the only line between an NDA and a use licence |
| P5 | Non-compete, non-solicit, exclusivity | must | No non-compete, non-solicit, exclusivity or standstill; the NDA governs confidentiality only | A mutual non-solicit of employees for a short period with a general-advertising carve-out | Any non-compete, exclusivity, customer non-solicit or standstill | partner | Commercial restraints belong in the main agreement, not smuggled into an NDA |
| P6 | IP, feedback and improvements | must | No licence, no assignment and no feedback or improvement grant; each party keeps its own IP | An express "no licence" statement only | Any licence, assignment or feedback/improvement grant to the Discloser | partner | Disclosure is not a grant; a feedback clause transfers value for free |
| P7 | Contractual penalty (*smluvní pokuta*) | should | No penalty; damages only, subject to the cap in P8 | A modest penalty per breach, credited against compensation for damage | A penalty payable in addition to full damages, or any uncapped exposure | partner | For the Recipient the penalty is pure downside; the Discloser already has damages and injunctive relief |
| P8 | Limitation of liability | must | Aggregate cap at a reasonable multiple of the contract value; indirect and consequential loss excluded; liability for intent and gross negligence not excluded | Cap at the amount of any contractual penalty plus a defined sum | Uncapped liability, or liability for indirect and consequential loss | partner | Damages from a leak resist valuation; the Recipient needs a defined ceiling |
| P9 | Return and destruction | should | On request within 10 business days, with written confirmation; backup copies remain confidential | On request, without a time limit | No return or destruction duty at all | senior associate | Ends the storage burden while keeping backups covered |
| P10 | Governing law and forum | must | Czech law; Czech courts at our seat | Arbitration (Arbitration Court attached to the Czech Chamber of Commerce and the Agricultural Chamber), seat in Prague | Foreign law and foreign courts with no recognition route in the CZ/EU | partner | Interim relief and enforcement should sit where we are |
| P11 | Compelled disclosure | must | Disclosure limited to what the law requires, prompt prior notice where lawful, and reasonable cooperation so the Discloser can seek protection | Notice where practicable, with harm minimisation | Automatic disclosure with no notice and no limitation | senior associate | The Recipient needs a route to object before it is forced to disclose |

## Clause library

### P2 — Exceptions and carve-outs
Preferred wording:
> Confidential Information does not include information that: (a) is or becomes public through no breach of this Agreement by the Recipient; (b) was lawfully in the Recipient's possession before disclosure by the Discloser; (c) is independently developed by the Recipient without use of the Confidential Information; or (d) is lawfully received from a third party without a duty of confidence. No "residual knowledge" or "general skills and knowledge" exception applies to information that is a trade secret.

Fallback wording:
> Confidential Information does not include information that: (a) is or becomes public through no breach of this Agreement by the Recipient; (b) was lawfully in the Recipient's possession before disclosure by the Discloser; (c) is independently developed by the Recipient without use of the Confidential Information; or (d) is lawfully received from a third party without a duty of confidence. The Recipient proves the application of an exception by written records.

### P3 — Term
Preferred wording:
> The obligations under this Agreement continue for two (2) years after this Agreement terminates. Obligations relating to information that constitutes a trade secret (*obchodní tajemství*) continue for as long as that information remains a trade secret.

Fallback wording:
> The obligations under this Agreement continue for three (3) years after this Agreement terminates. Obligations relating to information that constitutes a trade secret (*obchodní tajemství*) continue for as long as that information remains a trade secret.

### P7 — Contractual penalty
Preferred wording:
> This Agreement creates no contractual penalty (*smluvní pokuta*). The Discloser's remedies are compensation for damage and injunctive relief, in each case subject to the limitation of liability in this Agreement.

Fallback wording:
> For each breach of its obligations under this Agreement, the Recipient shall pay the Discloser a contractual penalty of [● amount]. The contractual penalty is credited against any compensation for damage arising from the same breach.

### P8 — Limitation of liability
Preferred wording:
> The Recipient's aggregate liability under this Agreement is limited to [● amount]. Neither party is liable for indirect or consequential loss, including lost profit or loss of opportunity. Nothing in this Agreement limits liability for damage caused intentionally or by gross negligence.

Fallback wording:
> The Recipient's aggregate liability under this Agreement is limited to the aggregate amount of any contractual penalty payable plus [● amount]. Nothing in this Agreement limits liability for damage caused intentionally or by gross negligence.

## Standard definitions
- "Confidential Information": per P1, preferred wording.
- "Purpose": evaluating and, if the parties so decide, pursuing the potential
  transaction or cooperation between the parties.
- "Recipient" and "Discloser": the counterparty as the disclosing party and our
  side as the receiving party.

## Red flags
- A residuals or "general skills and knowledge" clause that reaches trade
  secrets.
- A feedback, improvement or licence grant to the Discloser.
- A non-compete, non-solicit, exclusivity or standstill hidden in the NDA.
- A penalty payable in addition to uncapped damages.
- A perpetual term or an uncapped liability for information that is not a trade
  secret.
- An unmarked definition of Confidential Information covering everything
  disclosed in any form.
- Foreign law and foreign forum with no recognition route in the CZ/EU.

## Negotiation sequence
1. Hold P2 (carve-outs, no trade-secret residuals) and P8 (liability cap).
   These are not traded.
2. Trade P3 (two → three years) for P7 (drop the penalty or keep it credited
   against damages).
3. Concede P9 timing and P11 notice wording last.

## Jurisdiction notes
- CZ: the Civil Code (zákon č. 89/2012 Sb.) governs pre-contractual
  confidentiality, trade secret (*obchodní tajemství*), the contractual penalty
  (*smluvní pokuta*) under §§ 2048–2051 and its judicial moderation
  (§ 2051 ⚠ verify), and the limits on excluding or limiting liability
  (§ 2898). Resolve each in the citation ledger before relying on it (see the
  `cz` jurisdiction pack §4 and §15).
- CZ: an NDA needs no special form, but any penalty and any restraint must be
  certain and limited in time to be enforceable.

## Provenance
Seed positions written for legalsuite, 2026-10, by the
legalsuite seed author; not derived from client matters. Commercial
recipient-side stance, pending an approver. Not legal advice.
