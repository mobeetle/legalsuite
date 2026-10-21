---
name: SaaS / cloud services — customer side (seed)
format: legalsuite-playbook/2
scope: B2B SaaS and hosted cloud service agreements where we are the Customer (objednatel); Czech law
jurisdiction: CZ
role: customer (objednatel)
version: 0.9
status: draft
owner: legalsuite seed (pending approver)
approved_by:
approved_at:
updated: 2026-10-14
review_by: 2027-04-10
---

# SaaS / cloud services — customer side (seed)

Seed playbook shipped with legalsuite. It is not approved policy
and not legal advice. Positions need a lawyer's sign-off before use.

## Scope
Subscriptions for B2B SaaS and hosted cloud services where we are the Customer
(objednatel) buying from a provider (poskytovatel) that hosts the service and
processes our data. Covers the order, the service level schedule, the data
processing agreement and the security schedule read together.

Not for: consumer contracts — the consumer-protection rules (zákon č. 634/1992
Sb.) do not apply to these B2B matters and are out of scope; on-premise software
licences, software development or systems integration; reseller and distributor
arrangements; public-sector procurement (Registr smluv rules apply there); and
one-off professional services with no ongoing hosted component.

## Positions

| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Service availability (SLA) | must | Monthly uptime target of 99.9% measured over the calendar month, with service credits and a termination right after repeated failure | 99.5% uptime with service credits, termination right only after a longer failure period | No SLA, or a target below 99% with no credits | senior associate | Availability is the core of what we buy; with no measured target and credits the service level is unenforceable |
| P2 | Service credits | should | Tiered credits on the monthly fee, claimable on request, payable in addition to and not instead of other remedies | Credits as a discount on the next invoice | Credits as the sole and exclusive remedy with no termination right | senior associate | Credits compensate the failure; tying them to an exclusive remedy prices the outage for us |
| P3 | Security commitments | must | Named technical and organisational measures (encryption in transit and at rest, access control, logging, tested backups), a current independent certification on request, and prompt breach notification | A documented security schedule and breach notification, without a certification | No security commitment beyond reasonable efforts | partner | Security is a condition of putting our data into the service |
| P4 | Data protection and DPA | must | Data processing agreement meeting Article 28 of Regulation (EU) 2016/679, processing only on our documented instructions, assistance with data-subject rights and breach notification, deletion at the end; we are the controller | The provider's standard data processing agreement, provided it covers the Article 28 content and our instructions | No data processing agreement, or processing for the provider's own purposes | partner | Processing personal data without a compliant processor agreement is unlawful |
| P5 | Data location and sub-processors | must | Data stored and processed in the EU/EEA; a current sub-processor list, prior notice of changes, and a right to object and terminate the affected services | Sub-processors generally authorised with notice and a right to object on reasonable grounds | Transfers outside the EEA without a Chapter V transfer mechanism, or no objection right | partner | Location and control of sub-processors drive our own data-protection exposure |
| P6 | Audit and information rights | should | Audit of the provider's controls at our cost, on reasonable notice, no more than once a year, plus security reports and certification evidence | Reliance on the provider's independent audit report rather than an on-site audit | No audit right and no report | senior associate | We must be able to verify the commitments we rely on |
| P7 | Exit, data export and deletion | must | Export of our data in a structured, commonly used, machine-readable format at any time and during a transition period after termination, then deletion with written certification | Export on request within a stated period; deletion on request | No export, or deletion only at extra cost | partner | Vendor lock-in and residual copies are the exit risk |
| P8 | IP ownership and licence | must | Our data and our outputs remain ours; the provider gets only a limited licence to process them to deliver the service, and no rights in our data, outputs or feedback pass to it | Our data and outputs remain ours; the provider's licence is limited and ends on termination | The provider claims rights in our data, outputs or feedback | partner | We must not fund a grant of rights in our own data |
| P9 | Price changes | must | Fees fixed for the initial term; renewal increases capped at the change in the official inflation index and never applied before renewal; no unilateral increase during the term | Increases capped and notified in advance, with a right to terminate if we object | Unilateral price change at any time on short notice | senior associate | Unlimited price change empties the term of content |
| P10 | Limitation of liability | must | Cap not below the fees payable over the prior twelve months, with no cap (or a higher cap) for breach of confidentiality, data-protection breach, the IP indemnity and wilful misconduct | Cap at twelve months' fees with those carve-outs, and a super-cap for data-protection and IP claims | Cap below six months' fees, or one cap that also covers data-protection and IP claims | partner | A cap below the annual fee makes the provider underwrite nothing |
| P11 | Term, renewal and termination | must | Fixed initial term; termination for convenience at renewal on reasonable notice; termination for material breach unremedied after a cure period; no automatic renewal trap | Auto-renewal with a clear opt-out window, and termination for material breach | Long auto-renewal with no effective opt-out, or no termination for material breach | senior associate | Auto-renewal with no exit hands the schedule to the provider |
| P12 | Suspension of the service | should | Suspension only for material breach or non-payment after written notice and a cure period, and never in a way that prevents export of our data | Suspension on notice for non-payment, with the data still accessible | Suspension immediately and at the provider's discretion | senior associate | Suspension is a de facto termination if it locks our data |
| P13 | IP infringement indemnity | should | The provider indemnifies us against third-party claims that the service infringes IP, with defence and payment of damages and costs | Indemnity capped and conditioned on prompt notice and the provider's control of the defence | No indemnity, or an indemnity that excludes our use as instructed | partner | Third-party IP claims are the classic service loss we should not carry |

## Clause library

### P1 — Service availability (SLA)
Preferred wording:
> The Provider shall make the Service available with a Monthly Uptime Percentage of at least 99.9%, measured over each calendar month. If the Provider fails to meet that target, the Customer is entitled to the service credits in the Service Level Schedule, and after [●] consecutive months of failure the Customer may terminate the affected Service for material breach without a cure period.

Fallback wording:
> The Provider shall use reasonable efforts to make the Service available with a Monthly Uptime Percentage of at least 99.5%, measured over each calendar month. If the Provider fails to meet that target, the Customer is entitled to the service credits in the Service Level Schedule.

### P4 — Data protection and DPA
Preferred wording:
> The parties shall enter into a data processing agreement that meets the requirements of Article 28 of Regulation (EU) 2016/679. The Provider shall process personal data only on the Customer's documented instructions, shall not use it for its own purposes, shall assist the Customer with data-subject requests and personal-data-breach notification, and shall delete or return the data on termination.

Fallback wording:
> The Provider's standard data processing agreement applies, provided that it satisfies Article 28 of Regulation (EU) 2016/679 and limits processing to the Customer's documented instructions.

### P7 — Exit, data export and deletion
Preferred wording:
> On request at any time during the term, and during a transition period of [●] days after termination, the Provider shall export all Customer data in a structured, commonly used and machine-readable format. After the transition period the Provider shall delete the Customer data, including in backups, and certify the deletion in writing.

Fallback wording:
> On request, the Provider shall export the Customer data in a machine-readable format and delete it, including copies in its systems, within a reasonable period.

### P8 — IP ownership and licence
Preferred wording:
> All rights in the Customer's data and in the outputs generated for the Customer remain with the Customer. The Provider receives only a limited, revocable licence to process that data to provide and support the Service. No rights in the Customer's data, outputs or feedback pass to the Provider.

Fallback wording:
> The Customer's data and outputs remain the Customer's. The Provider's licence to process them is limited to providing the Service and ends on termination.

### P10 — Limitation of liability
Preferred wording:
> Neither party's aggregate liability is capped for breach of confidentiality, breach of data-protection obligations, the IP infringement indemnity or wilful misconduct. For all other claims, each party's aggregate liability is capped at an amount not less than the fees payable in the twelve months before the claim.

Fallback wording:
> Each party's aggregate liability is capped at the fees payable in the twelve months before the claim, except that liability for breach of confidentiality, breach of data-protection obligations, the IP infringement indemnity and wilful misconduct is capped at [●], a multiple of that amount.

## Standard definitions
- "Service": the provider's hosted software service as described in the order.
- "Monthly Uptime Percentage": per P1, measured over each calendar month.
- "Customer Data": data submitted to the Service by or for the Customer, and
  the outputs generated for the Customer.
- "Personal Data", "Processing" and "Controller": per Regulation (EU) 2016/679.
- "Service Credits": per P2, calculated on the monthly fee.

## Red flags
- No SLA, or an SLA without service credits.
- Service credits as the sole and exclusive remedy with no termination right.
- No Article 28 data processing agreement, or a provider that uses our data
  for its own purposes.
- Data stored or processed outside the EEA without a transfer mechanism.
- Unlimited unilateral price increases, or auto-renewal with a narrow opt-out.
- A liability cap below the annual fee, or one cap that also covers
  data-protection and IP indemnity claims.
- A right to suspend the service that blocks export of our data.
- A licence or ownership claim over our data, outputs or feedback.

## Negotiation sequence
1. Hold P4 (data processing agreement), P7 (exit and deletion) and P10 (no low
   cap). These are not traded.
2. Trade P1 uptime (99.9 → 99.5) against P2 (credits must not be the exclusive
   remedy).
3. Concede P6 audit (on-site → vendor report) and P9 notice periods last.

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
from client matters. The positions reflect common B2B SaaS customer-side market
practice and are pending review and approval by the firm's playbook owner.
