---
name: SaaS / cloud services — provider side (seed)
format: legalsuite-playbook/2
scope: B2B SaaS and hosted cloud service agreements where we are the Provider (poskytovatel); Czech law
jurisdiction: CZ
role: provider (poskytovatel)
version: 0.9
status: draft
owner: legalsuite seed (pending approver)
approved_by:
approved_at:
updated: 2026-10-14
review_by: 2027-04-10
---

# SaaS / cloud services — provider side (seed)

Seed playbook shipped with legalsuite. It is not approved policy
and not legal advice. Positions need a lawyer's sign-off before use.

## Scope
Subscriptions for B2B SaaS and hosted cloud services where we are the Provider
(poskytovatel) hosting the service and processing the customer's (objednatel)
data. Covers the order, the service level schedule, the data processing
agreement and the security schedule read together.

Not for: consumer contracts — the consumer-protection rules (zákon č. 634/1992
Sb.) do not apply to these B2B matters and are out of scope; on-premise software
licences, custom development or systems integration; reseller and distributor
arrangements; public-sector procurement (Registr smluv rules apply there); and
one-off professional services with no ongoing hosted component.

## Positions

| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Service availability (SLA) | should | A stated monthly uptime target with service credits as the sole and exclusive remedy for missed availability | A target from the applicable service tier with the same credit remedy | An uptime commitment with damages in addition to credits and no cap | senior associate | An SLA with credits as the sole remedy bounds availability risk |
| P2 | Service credits as sole remedy | should | Service credits are the customer's sole and exclusive remedy for any failure to meet the availability target | Credits plus a termination right after a longer, repeated failure | Damages for downtime in addition to credits, without a cap | senior associate | A predictable, bounded remedy keeps the exposure financeable |
| P3 | Right to update the service | must | The right to modify, update and replace features of the service, provided the core functionality is not materially reduced | Updates that may reduce functionality with notice and a termination right if the customer objects | A commitment that the service will not change during the term | senior associate | A hosted service must be able to evolve |
| P4 | Sub-processors | must | General authorisation of sub-processors, with a current list, notice of new sub-processors, and a right for the customer to object (with termination of the affected service if we cannot accommodate) | General authorisation with notice, and a right to object only on reasonable data-protection grounds | Prior written consent for every sub-processor | senior associate | Consent per sub-processor does not scale |
| P5 | Audit | should | Reliance on our independent audit report or certification, plus an audit on reasonable notice, no more than once a year, at the customer's cost and under confidentiality | A questionnaire-based review plus the audit report | Unrestricted on-site audit on demand | senior associate | We must control cost and disruption while giving assurance |
| P6 | Data protection (processor) | must | The Provider acts as processor under a data processing agreement meeting Article 28 of Regulation (EU) 2016/679, processing only on the customer's documented instructions | Our standard data processing agreement, with limited negotiated changes | Unlimited controller obligations, or liability for the customer's own unlawful instructions | partner | Our processor role and exposure must be defined |
| P7 | Customer data licence | must | A limited licence to host, copy, transmit, display and process customer data to provide and support the service, and to create aggregated or anonymised data | A licence limited to providing the service, with no aggregated-data right | A broad licence allowing use of customer data for our own commercial purposes | partner | The licence must match what the service needs |
| P8 | Limitation of liability (cap) | must | Each party's aggregate liability capped at the fees paid or payable in the twelve months before the claim, with carve-outs for breach of confidentiality, data-protection breach, the IP indemnity and wilful misconduct | Cap at twelve months' fees, with a higher super-cap for data-protection and IP claims | Uncapped liability, or a cap below three months' fees | partner | A defined cap is insurable and financeable |
| P9 | No indirect or consequential loss | must | Neither party is liable for indirect, consequential, special or punitive damages, or for lost profits, revenue, data or goodwill, whether or not foreseeable | The same exclusion, with loss of data carved back for breach of the data processing agreement | Liability for all losses, however remote | partner | We cannot underwrite the customer's downstream losses |
| P10 | Suspension for non-payment | must | The right to suspend the service on written notice if undisputed invoices are unpaid after a stated cure period | Suspension after a shorter notice period for repeated non-payment | No right to suspend | senior associate | Suspension is our main lever for unpaid fees |
| P11 | Term, renewal and termination | should | Auto-renewal unless either party gives notice in a stated window; termination for material breach after a cure period | Annual renewal with a longer notice window | A perpetual term with no termination for breach | senior associate | Renewal terms determine the revenue schedule |
| P12 | Price changes | must | The right to increase fees on renewal with prior notice; increases during the term only where the order says so | Renewal increases capped at an index, with notice | Fees fixed for the life of the relationship | senior associate | Cost input changes must be passable |

## Clause library

### P1 — Service availability (SLA)
Preferred wording:
> The Provider shall use reasonable efforts to make the Service available with a Monthly Uptime Percentage of at least 99.9%, measured over each calendar month. The service credits are the Customer's sole and exclusive remedy for any failure to meet that target.

Fallback wording:
> The Provider shall make the Service available with a Monthly Uptime Percentage of at least 99.5%. The service credits are the Customer's sole and exclusive remedy, except that the Customer may terminate the affected Service after six consecutive months of failure.

### P6 — Data protection (processor)
Preferred wording:
> The Provider processes personal data only as a processor on the Customer's documented instructions, in accordance with a data processing agreement that meets Article 28 of Regulation (EU) 2016/679. The Provider is not the controller of that data.

Fallback wording:
> The parties enter into the Provider's standard data processing agreement, which meets Article 28 of Regulation (EU) 2016/679, and the Provider processes personal data only on the Customer's documented instructions.

### P7 — Customer data licence
Preferred wording:
> The Customer grants the Provider a non-exclusive, worldwide, royalty-free licence to host, copy, transmit, display and process Customer data to provide and support the Service, and to create aggregated or anonymised data that does not identify the Customer or any individual. The licence lasts for the term and for the period needed to delete the data.

Fallback wording:
> The Customer grants the Provider a licence to process Customer data only to provide and support the Service during the term; the Provider may not use the data for its own purposes.

### P8 — Limitation of liability (cap)
Preferred wording:
> Except for breach of confidentiality, breach of data-protection obligations, the IP infringement indemnity and wilful misconduct, each party's aggregate liability under this Agreement is capped at the fees paid or payable in the twelve months before the claim. Neither party is liable for indirect or consequential loss, including lost profits, revenue or goodwill.

Fallback wording:
> Except for breach of confidentiality, breach of data-protection obligations and the IP infringement indemnity, each party's aggregate liability is capped at the fees paid in the twelve months before the claim, and liability for those carved-out claims is capped at twice that amount.

## Standard definitions
- "Service": the hosted service provided under the order.
- "Sole and exclusive remedy": the service credits are the only financial
  remedy for an availability failure.
- "Customer Data": data submitted to the Service by or for the customer.
- "Personal Data", "Processing" and "Processor": per Regulation (EU) 2016/679.
- "Fees": amounts payable under the order.

## Red flags
- A demand for uncapped liability, or a cap below three months' fees.
- Downtime damages in addition to service credits.
- Audit rights on demand, without notice or scope limits.
- Prior written consent for every sub-processor.
- A data processing agreement that makes us a controller or exceeds the
  Article 28 content.
- A promise that the service will not change during the term.
- Termination for convenience during the initial term with no early-termination
  fee.
- A demand for a perpetual, broad licence over customer data.

## Negotiation sequence
1. Hold P8 (cap) and P9 (no consequential loss). These are not traded.
2. Trade P1 target (99.9 → 99.5) against P2 (credits stay the sole remedy).
3. Concede P3 update rights and P11 notice periods last.

## Jurisdiction notes
- CZ: limitation and exclusion of liability, and the limits a party cannot
  contract out of, come from the Civil Code (zákon č. 89/2012 Sb.), in
  particular § 2898; the contractual penalty (*smluvní pokuta*) and its judicial
  moderation are in §§ 2048–2051; default interest and the consequences of
  delay also follow the Civil Code. Resolve each in the citation ledger before
  relying on it (see the `cz` jurisdiction pack §4 and §15).
- CZ/EU: processing of personal data is governed by Regulation (EU) 2016/679;
  the mandatory content of a processor agreement is in Article 28.
- CZ: these are B2B contracts, not consumer contracts, so the
  consumer-protection rules (zákon č. 634/1992 Sb.) do not apply.
- ⚠ verify: whether § 89(3) of zákon č. 127/2005 Sb. bears on any specific
  service in a matter; not assumed here.

## Provenance
Seed positions written for the legalsuite distribution, 2026-10. Not derived
from client matters. The positions reflect common B2B SaaS provider-side market
practice and are pending review and approval by the firm's playbook owner.
