---
name: NIS2 — significant supplier contract (Czech, customer side)
format: legalsuite-playbook/2
scope: ICT and other supplier contracts of a Czech NIS2 regulated entity with a significant supplier; Czech law
jurisdiction: CZ
role: regulated entity (provider of a regulated service) contracting with a significant supplier
version: 0.9
status: draft
owner: legalsuite seed (pending approver)
approved_by:
approved_at:
updated: 2026-10-14
review_by: 2027-04-10
---

# NIS2 — significant supplier contract (Czech, customer side)

Draft seed playbook shipped with legalsuite. It is not approved policy and not
legal advice. Positions need human sign-off before use on a real matter.

## Scope
Contracts under which we, as a provider of a regulated service under the Czech
Cybersecurity Act (*zákon o kybernetické bezpečnosti*), engage a significant
supplier (*významný dodavatel*) — an ICT vendor, cloud, MSP or MSSP whose failure
would affect our regulated service. Applies in both the higher and the lower
obligations regime; the decree that applies to us is stated per position. Does
not cover suppliers that are not significant, consumer contracts, or DORA
financial-entity supply contracts where a sectoral regime is the lex specialis.

## Positions

| ID | Clause / issue | Req | Preferred (GREEN) | Fallback (YELLOW) | Walk-away (RED) | Approver | Rationale |
|---|---|---|---|---|---|---|---|
| P1 | Mandatory security requirements | must | A contract annex lists the security measures required of us under § 14 of the Cybersecurity Act and the applicable NÚKIB decree (higher regime: vyhláška č. 409/2025 Sb.; lower regime: vyhláška č. 410/2025 Sb.), binding on the supplier, with a written compliance statement on signing and each anniversary | Security measures incorporated by reference to the applicable decree, with a compliance statement on request | No contractual security requirements | legal counsel | Decree 409 § 9 requires the security requirements to be in the contract, not in a policy the supplier can change |
| P2 | Incident notification to us | must | Notification of any security incident without undue delay and in any event within 24 hours of detection, with the information we need for our own reporting under §§ 15 and 16 of the Cybersecurity Act; further reports on request | Notification within 72 hours, escalated to 24 hours where the incident affects a service on which our regulated service depends | Notice "within a reasonable time" or only after the supplier's internal investigation closes | partner | Our own 24-hour early-report clock runs from detection, so the supplier's notice must fit inside it |
| P3 | Subcontractor control | must | No subcontracting without our prior written consent; the supplier flows the security, notification and audit duties down to every subcontractor and remains liable for them | Subcontractors from a pre-approved list, with flow-down of the security, notification and audit duties and notice of changes | Free subcontracting with no flow-down | legal counsel | Decree 409 § 9 requires flow-down; the risk follows the chain |
| P4 | Audit and assurance | must | We, or an auditor on our behalf, may audit the supplier's relevant controls on reasonable notice; the supplier provides current assurance reports and evidence of the required measures | An annual assurance report and documentation on request, audit only for cause | No audit or assurance right | partner | We cannot certify what we cannot see |
| P5 | Access, continuity and exit | must | Availability, support and continuity commitments tied to our regulated service, with tested backups and restore; on exit, full data return in open formats, certified deletion and transition assistance | A documented continuity plan and a defined exit and transition process | No continuity or exit obligation | legal counsel | The regulated service must survive the supplier relationship |
| P6 | Cooperation with NÚKIB supervision | must | The supplier cooperates with our NÚKIB supervision duties, responds to NÚKIB requests and any supplier-screening measure, and provides information within the deadlines we pass on | A general cooperation obligation and a named contact | No cooperation duty, or one left to the supplier's discretion | partner | We answer to the regulator for what the supplier does |
| P7 | Data location, return and deletion | should | Data located in the EEA unless we agree otherwise; on termination the supplier returns and deletes our data and certifies deletion within a fixed period | Data location stated and deletion on request | No data-location commitment and no deletion obligation | legal counsel | Where the data sits is part of our security profile |
| P8 | Change-of-control termination | should | We may terminate on a change of control of the supplier, or on a change to its ownership, location or supply chain that raises a security or NÚKIB-screening risk | Termination on change of control with a notice period | No termination on change of control | senior associate | A changed vendor is a different risk decision |
| P9 | Service levels and sanctions | should | Service levels with service credits or a contractual penalty (*smluvní pokuta*) for breach of the security and availability requirements, in addition to damages | Service levels with credits only | No service levels and no remedy | partner | A remedy is what makes the security requirements bite |
| P10 | Pre-contract risk assessment and notice | must | Before contracting we document the pre-contract risk assessment required by decree 409 § 9(2) and annex 4, and give the supplier written notice that it is a significant supplier under § 9(3) | Assessment documented and notice given, with the notice issued shortly after signing | No assessment and no notice | legal counsel | We must identify and notify a significant supplier before we rely on the contract |
| P11 | Statutory termination on a screening measure | must | We may terminate and transition without penalty if performance would breach a NÚKIB measure adopted under §§ 27–32 of the Cybersecurity Act, and the supplier supports the exit | A termination right with a short transition period | No contractual route, leaving only the statutory right under § 32 | partner | § 32 gives a statutory exit; the contract must not make it costly |

## Clause library

### P1 — Mandatory security requirements
Preferred wording:
> The supplier shall implement and maintain the security measures required of
> the customer as a provider of a regulated service under § 14 of Act No.
> 264/2025 Sb., on cybersecurity, and the applicable NÚKIB decree (higher
> obligations under vyhláška č. 409/2025 Sb., or lower obligations under vyhláška
> č. 410/2025 Sb.), in each case as set out in Annex [●]. The supplier shall
> confirm compliance in writing on signing and on each anniversary and shall
> notify the customer of any material change.

Fallback wording:
> The supplier shall comply with the security measures set out in Annex [●],
> which incorporate the applicable NÚKIB decree by reference, and shall provide a
> written statement of compliance on request.

### P2 — Incident notification to us
Preferred wording:
> The supplier shall notify the customer of any security incident affecting the
> supplier's services without undue delay and in any event within 24 hours of
> detection, with the information the customer needs for its own reporting under
> §§ 15 and 16 of Act No. 264/2025 Sb. The supplier shall provide further reports
> on request and shall not delay notice until its own investigation is complete.

Fallback wording:
> The supplier shall notify the customer of any security incident within 72
> hours of detection, and within 24 hours where the incident affects a service on
> which the customer's regulated service depends.

### P3 — Subcontractor control
Preferred wording:
> The supplier shall not engage a subcontractor without the customer's prior
> written consent. The supplier shall impose these security,
> incident-notification and audit obligations on every approved subcontractor and
> remains fully liable for their performance.

Fallback wording:
> The supplier may engage subcontractors from a list approved by the customer,
> shall flow down the security, incident-notification and audit obligations, and
> shall notify the customer before adding or replacing a subcontractor.

### P5 — Access, continuity and exit
Preferred wording:
> The supplier shall provide the availability, support and continuity
> commitments needed for the customer's regulated service, including tested
> backups and restore. On termination or expiry, the supplier shall return all
> customer data in an open format, delete it and certify deletion within
> [● days], and provide transition assistance for [●] at no additional charge.

Fallback wording:
> The supplier shall maintain a documented continuity plan and, on termination
> or expiry, shall return the customer data, delete it on request, and provide
> transition assistance on agreed terms.

## Standard definitions
- "Significant supplier" (*významný dodavatel*): a supplier whose failure affects
  our regulated service; definition in decree 409 § 2(h).
- "Regulated service": the service for which we are registered as a provider.
- "Security incident": any incident our own incident-handling process treats as
  reportable under §§ 15 and 16.
- "NÚKIB": Národní úřad pro kybernetickou a informační bezpečnost, the regulator.
- "Národní CERT": the national CERT that receives lower-regime incident reports.
- "Security requirements": the measures in the applicable NÚKIB decree and our
  contract annex, per P1.

## Red flags
- No contractual security requirements, or only a policy reference the supplier
  can change.
- Incident notice "as soon as practicable" or after internal investigation, which
  cannot fit our 24-hour early-report clock.
- Free subcontracting without flow-down.
- No audit or assurance right.
- No continuity, exit or deletion obligation.
- No route to terminate on a NÚKIB supplier-screening measure.
- Data location unstated, or offshore with no safeguards.
- Confidentiality that blocks our § 19 duty to inform service recipients.

## Negotiation sequence
1. Hold P1 (security requirements), P2 (fixed short notification window) and P6
   (cooperation with NÚKIB). These are the reason this playbook exists and are
   not traded.
2. Trade P4 (audit cadence and assurance format) against the scope of the P3
   subcontractor list.
3. Concede P7 data-location wording and P9 credit mechanics last.
4. Never accept anything that undercuts P2 timeliness or P9 sanctions.

## Jurisdiction notes
- CZ: Act No. 264/2025 Sb., on cybersecurity (*zákon o kybernetické
  bezpečnosti*), in force since its 2025 commencement, with vyhlášky č. 408–412/2025
  Sb., in particular vyhláška č. 409/2025 Sb. on significant-supplier
  contractual requirements. Because the supplier is contracted by a regulated
  entity, the contract must give us what we ourselves owe NÚKIB. The
  implementation and reporting clocks run from delivery of the registration
  decision (§ 13(4), § 15(4)); align the contract with the date that applies to
  us. ⚠ verify the full list in annex 5 to decree 409 and the decree 410
  equivalent, and the government decrees on strategically important services and
  indispensable functions, not found published at the pack's review date.
- EU: Directive (EU) 2022/2555 (NIS2) arts. 21 and 23 — 24-hour early warning and
  72-hour notification; the Czech act uses a 30-day final report. Proposed
  Digital Omnibus COM(2025) 837 and targeted amendments COM(2026) 13 are not yet
  in force; re-check before relying on them.

## Provenance
Seed positions shipped with legalsuite, 2026-10.
Grounded in the legalsuite NIS2 regime pack (status: partially verified, reviewed
at the pack's review date); reconstructed from the statutory and decree anchors it
cites, never from the pack as authority. No signed agreements or client matters
back these positions. Owner: legalsuite seed. Approver: pending. Every ⚠ item
must be verified against the official texts before use.
