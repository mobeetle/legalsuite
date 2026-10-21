---
name: IT statement of work — customer side (Czech)
format: legalsuite-playbook/2
scope: custom software development and agile statements of work where we commission the work; Czech law
jurisdiction: CZ
role: customer (objednatel) commissioning custom IT development
version: 0.9
status: draft
owner: legalsuite seed (pending approver)
approved_by:
approved_at:
updated: 2026-10-14
review_by: 2027-04-10
---

# IT statement of work — customer side (Czech)

Draft seed playbook shipped with legalsuite. It is not approved policy and not
legal advice. Positions need human sign-off before use on a real matter.

## Scope
Statements of work and contracts for work (*smlouva o dílo*) under which we
commission custom software: fixed-price, milestone-based or agile. Applies to
the customer side only, from a single statement of work up to a framework
agreement with several statements of work. Does not cover off-the-shelf licence
purchases, pure SaaS subscriptions without custom development, hardware supply,
or staff-augmentation arrangements (use a different playbook for those).

## Positions

| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Acceptance criteria (*kritéria akceptace*) | must | Objective, testable criteria fixed in a signed acceptance protocol before each milestone opens; acceptance runs against those criteria alone | Criteria in the statement of work; the supplier proposes the tests and we approve them before the milestone starts | No written criteria, or the supplier alone decides whether a deliverable passes | senior associate | Without testable criteria the supplier sets its own bar for delivery |
| P2 | Deemed acceptance | must | Acceptance only after we fail to raise written defects within a fixed review window that starts on delivery of a complete, testable increment; silence alone never accepts | Deemed acceptance after a review window, with an express carve-out for latent defects and a right to reopen | Acceptance by silence on delivery, with no latent-defect carve-out | senior associate | Deemed acceptance without a carve-out turns unfinished work into accepted work |
| P3 | Fixed milestones and payment | must | Fixed milestones each closing on signed acceptance; payment only after acceptance, with retention held until final acceptance | Time-and-materials with a not-to-exceed cap per milestone and payment against accepted output | Advance payments with no milestone or acceptance gate | partner | Payment must follow accepted work, not elapsed time |
| P4 | Intellectual property | must | All IP in the deliverables, including source code, vests in us on payment; a present assignment (*převod*) of future works; no licence to the supplier over our data | Broad, irrevocable, worldwide, royalty-free, sub-licensable licence to use, modify and further develop, with the source code on request | Supplier retains ownership and grants only a narrow licence to the delivered binary | partner | We paid for the work; ownership or a wide licence is the only protection against lock-in |
| P5 | Source code escrow | should | Full source, build scripts and environment placed in escrow (*zdrojový kód*) with release on insolvency, cessation of support or breach | Escrow of the source with the main release triggers only | No source access under any trigger | senior associate | Escrow is the last resort when the supplier fails |
| P6 | Warranty and remedy period | must | Twelve months from final acceptance; defects fixed within a fixed remedy period at no cost, with a right to fix ourselves and recover the cost if the supplier fails | Six months from final acceptance, remedy within a reasonable period | No warranty, or a token warranty period with no remedy obligation | partner | Defect risk sits with the supplier that built the software |
| P7 | Change-request governance | must | Written change request, impact assessment on price, schedule and acceptance criteria, signed before work starts; no verbal changes | Changes run through the supplier's process with our written approval for anything affecting scope or price | Supplier may change scope or price unilaterally | senior associate | Uncontrolled change is how fixed-price projects drift |
| P8 | Key personnel and substitution | should | Named key personnel (*klíčoví pracovníci*), changes need our prior written consent, replacements equally qualified; no subcontracting without consent | Supplier keeps us informed, substitutes with equivalent staff, and notifies us of subcontractors | Free substitution and subcontracting with no key-person commitment | legal counsel | The team that bid is the team we priced |
| P9 | Security and data protection by design | must | Security requirements and data-protection-by-design in an annex; processing agreement (*zpracovatelská smlouva*) per Regulation (EU) 2016/679; no personal data outside the EEA without our approval | Security annex and processing agreement in place; data location agreed per project | No security requirements, no processing agreement, data placed offshore | legal counsel | Security and privacy must be designed in, not patched on |
| P10 | Liability cap and carve-outs | must | Cap at a multiple of the fees, with uncapped liability for breach of confidentiality, IP infringement, security and data-protection breaches, and wilful or grossly negligent damage (*§ 2898*) | Cap at the fees paid under the statement of work, with the same carve-outs | Cap below the fees, carve-outs removed, or any attempt to exclude wilful or grossly negligent damage | partner | A cap below the fees prices our risk too cheaply; § 2898 bars excluding wilful or grossly negligent damage |
| P11 | Termination for convenience and wind-down | should | We may terminate for convenience (*výpověď*) on notice, paying only for accepted work, with a wind-down and transition-assistance obligation | Termination for convenience with a notice period and a defined wind-down | No termination for convenience, or termination only on payment of the full remaining contract value | partner | We must be able to stop a failing project without buying out the rest |
| P12 | No lock-in, exit and portability | should | On exit the supplier delivers source, data, configuration and documentation in open formats, deletes our data and certifies deletion | Deliverables and data returned on exit, deletion on request | No exit obligation, or the supplier keeps our data | senior associate | Exit terms decide how cheaply we can change supplier |

## Clause library

### P1 — Acceptance criteria
Preferred wording:
> Each milestone closes only on acceptance. Acceptance is carried out solely
> against the acceptance criteria set out in the applicable statement of work.
> The supplier delivers the milestone with the test evidence and the customer
> runs the acceptance tests. A milestone is accepted only when every acceptance
> criterion is met and the customer has signed the acceptance protocol
> (*akceptační protokol*).

Fallback wording:
> The supplier proposes the acceptance tests and the customer approves them in
> writing before the milestone starts. Acceptance follows the agreed criteria and
> is recorded in the acceptance protocol.

### P4 — Intellectual property
Preferred wording:
> All intellectual property rights in the deliverables, including the source
> code, documentation and data, vest in the customer on payment of the price
> attributable to them. The supplier assigns to the customer all future works
> created under this agreement by way of a present assignment (*převod*) and
> undertakes to do everything needed to perfect the customer's title.

Fallback wording:
> The supplier grants the customer an irrevocable, worldwide, royalty-free,
> non-exclusive licence, with the right to sublicense, to use, reproduce, modify,
> maintain and further develop the deliverables, including the source code, for
> any purpose. Ownership of the supplier's pre-existing components remains with
> the supplier.

### P6 — Warranty and remedy period
Preferred wording:
> The supplier warrants that the deliverables conform to the acceptance criteria
> and are free from defects for twelve months after final acceptance. The
> supplier shall remedy any defect within [● days] of written notice at its own
> cost. If the supplier fails to do so, the customer may remedy the defect itself
> or through a third party and recover the reasonable cost from the supplier.

Fallback wording:
> The supplier warrants the deliverables for six months after final acceptance
> and shall remedy defects within a reasonable period of written notice at its
> own cost.

### P10 — Liability cap and carve-outs
Preferred wording:
> The supplier's aggregate liability under this agreement is capped at
> [● multiple] of the fees paid under the applicable statement of work. The cap
> does not apply to liability for breach of confidentiality, infringement of
> intellectual property rights, breach of the security or data-protection
> obligations, or damage caused wilfully or by gross negligence (*§ 2898*).
> Nothing in this agreement excludes liability that cannot be excluded by law.

Fallback wording:
> The supplier's aggregate liability is capped at the fees paid under the
> applicable statement of work, except for the carved-out heads of liability
> listed in the preferred wording, which remain uncapped.

## Standard definitions
- "Acceptance criteria": the testable criteria fixed per P1.
- "Acceptance protocol" (*akceptační protokol*): the signed record of acceptance
  per P1.
- "Deliverable": each item the supplier must hand over under a statement of
  work, including source code, documentation and data.
- "Defect" (*vada*): any failure of a deliverable to meet the acceptance
  criteria or the agreed specification.
- "Change request": a written request per P7.
- "Key personnel" (*klíčoví pracovníci*): the named individuals per P8.
- "Customer data": all data we provide or that is generated for us under the
  statement of work.

## Red flags
- Acceptance by silence with no latent-defect carve-out.
- Supplier retains IP and grants only a licence to use the delivered binary.
- No source code and no escrow.
- Payment before acceptance, or large advance payments.
- Warranty cut below what a work contract normally carries.
- Unilateral change control over scope or price.
- No processing agreement where personal data is processed.
- Cap below the fees with the security and IP carve-outs removed.
- No termination for convenience and no exit assistance.
- Broad subcontracting and free substitution of key personnel.

## Negotiation sequence
1. Hold P1, P2 (acceptance and no bare deemed acceptance), P4 (ownership or the
   broad licence) and the P10 carve-outs. These are not traded.
2. Trade P6 (warranty length) against P5 (escrow release triggers), and P3
   (retention) against P7 (change-request turnround).
3. Concede P8 substitution wording and P11 notice period last.

## Jurisdiction notes
- CZ: contracts for work (*smlouva o dílo*) under Act No. 89/2012 Sb. (the Civil
  Code) carry a duty to deliver a defect-free work and a defect regime; § 2898
  bars excluding liability for wilful or grossly negligent damage; the
  contractual penalty is subject to judicial moderation. Copyright and the
  assignment of future works sit in Act No. 121/2000 Sb. (the Copyright Act) —
  ⚠ verify the commissioned-work and assignment rules before relying on vested
  title. Resolve each in the citation ledger (see the CZ jurisdiction pack).
- EU: Regulation (EU) 2016/679 (GDPR) governs any processing of personal data in
  the development and handover.

## Provenance
Seed positions shipped with legalsuite, 2026-10. No
signed agreements or client matters back these positions; they are reasoned
defaults for the customer side of custom IT development. Owner: legalsuite seed.
Approver: pending. Treat as draft until a human signs it off.
