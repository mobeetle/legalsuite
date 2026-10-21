---
code: nis2-cz
name: NIS2 — Czech Cybersecurity Act (zákon o kybernetické bezpečnosti)
instruments: Directive (EU) 2022/2555 (NIS2); CZ: zákon č. 264/2025 Sb., o kybernetické bezpečnosti; vyhlášky č. 334/2025, 408/2025, 409/2025, 410/2025, 411/2025, 412/2025 Sb.
regulator: Národní úřad pro kybernetickou a informační bezpečnost (NÚKIB); Národní CERT (lower regime incidents)
reviewed_at: 2026-10-10
review_by: 2027-01-10
status: partially verified
---
# NIS2 (CZ) — regime pack

How to use: this pack is a seed obligation register, not the law itself. Use §2
to decide applicability and §3 to fix the client's role, then build the
obligation register from §4. Every obligation used in a deliverable is resolved
to the current text (version in force on the EPOCH date) in the citation
ledger; never cite this pack as authority. ⚠ marks items not verified against an
official source at `reviewed_at`. If today is past `review_by`, warn the user
that the pack may be stale before relying on it.

## 1. Instruments and status

ADOPTED and applicable:
- **Directive (EU) 2022/2555 (NIS2)** — transposition deadline 17 October 2024.
- **Zákon č. 264/2025 Sb., o kybernetické bezpečnosti** (*ZKB*) — dated 11 June
  2025, promulgated 4 August 2025, **effective 1 November 2025** (§ 73).
  Repeals zákon č. 181/2014 Sb. and its decrees (82/2018, 317/2014, 437/2017,
  190/2023 Sb.) (§ 72). Transitional rules § 71: entities regulated under the old
  act keep at least their previous obligations until the new deadlines run;
  public-law contracts under the old act lapse **1 November 2026**.
- **Implementing decrees (NÚKIB), all effective 1 November 2025:**
  - **408/2025 Sb.** o regulovaných službách — sectors/services (annex) and the
    split into higher/lower regime;
  - **409/2025 Sb.** security measures — **vyšší povinnosti**;
  - **410/2025 Sb.** security measures — **nižší povinnosti** (§ 14: significant
    impact criteria);
  - **334/2025 Sb.** Portál NÚKIB and filing requirements;
  - **411/2025 Sb.** security levels of public-administration IS;
  - **412/2025 Sb.** cloud computing by public bodies.
- **Government decrees** on strategically important services and on
  indispensable functions (*nepominutelné funkce*) — circulated May 2025; **not
  found published** at reviewed_at ⚠ verify; supplier-screening mechanism depends
  on them.

PROPOSED only (EU level; no effect until adopted and transposed):
- **Digital Omnibus** COM(2025) 837, 2025/0360(COD) — EU single entry point for
  incident reports (new NIS2 art. 23a). Awaiting EP committee decision.
- **Targeted NIS2 amendments** COM(2026) 13, 2026/0012(COD) (20 January 2026) —
  "small mid-cap" category (< 750 staff, ≤ EUR 150 m turnover / ≤ EUR 129 m
  balance sheet) moved to important-entity tier, sector narrowing, ransomware
  reporting; plus revised Cybersecurity Act (CSA2) with ICT supply-chain
  high-risk supplier framework. EP committee stage; 1-year transposition after
  adoption.

## 2. Scope tests

1. **Established in CZ?** (§ 1) — ZKB applies to entities established in CZ;
   electronic-communications providers operating in CZ regardless of seat.
   Classified information systems excluded (§ 1(4)). NIS2 jurisdiction rules for
   DNS/cloud/data-centre/CDN/MSP/MSSP/online platforms: main establishment
   (NIS2 art. 26).
2. **Service type listed in the annex to vyhláška 408/2025 Sb.**, in one of the
   15 sectors of § 4(1)(a) ZKB: public administration, energy, manufacturing,
   food, chemicals, water, waste, transport, digital infrastructure and
   services, financial market, health, science/research/education, postal and
   courier, defence industry, space? → no → out.
3. **Size** (§ 4(1)(b), § 7): **medium or large enterprise** per Recommendation
   2003/361/EC (≥ 50 staff, or annual turnover **and** balance sheet both > EUR
   10 m; linked/partner enterprises aggregated; EUR at ČNB rate, § 2(2)). State
   bodies, regions, municipalities and ČNB are not "enterprises" (§ 7) — public
   bodies are captured by the public-administration annex. Small/micro → test 4.
4. **Regardless of size** (§ 5): (a) sole CZ provider of an essential service,
   impact on security/public order/life and health, significant systemic
   (cross-border) risk, or regional/national importance for the sector; (b)
   disruption could seriously affect > **125,000** persons; (c) could seriously
   impair a higher-regime provider's service; (d) critical-infrastructure entity.
   Services registered under § 5 → higher regime (§ 8(3)). Some service types
   (e.g. trust services, TLD/DNS, public e-communications) are in scope
   regardless of size via the 408 annex ⚠ verify per service.
5. **Which regime?** (§ 8; vyhláška 408): general rule large enterprise →
   **vyšší povinnosti**, medium → **nižší povinnosti**, with sector-specific
   deviations (e.g. e-communications ≥ 350,000 SIM → higher; energy capacity
   thresholds; lower-only sectors; listed public bodies).
6. **Lex specialis?** (§ 70 ZKB; DORA art. 1(2); NIS2 art. 4) — security
   measures, incident reporting and their supervision are disapplied where an EU
   or sectoral act has at least comparable effect (DORA financial entities) —
   registration and some duties remain (ČNB–NÚKIB statement 24 June 2026).
7. **Strategically important service?** (§ 25) — extra duties (§§ 26, 33) once
   designated by government decree ⚠ verify publication.

## 3. Roles

- **Poskytovatel regulované služby** — provider of a regulated service meeting
  §§ 4–5; registered by NÚKIB decision (§ 6). Two tiers:
  - **režim vyšších povinností** (≈ NIS2 *essential entity*, art. 3(1)) — full
    measure set § 14(1) + vyhl. 409; reports all in-scope incidents to NÚKIB;
  - **režim nižších povinností** (≈ *important entity*, art. 3(2)) — 13 measures
    § 14(2) + vyhl. 410; reports only significant-impact incidents to Národní
    CERT. Mapping to essential/important is not 1:1.
- **Poskytovatel strategicky významné služby** (§ 25) — additional obligations,
  incl. operation from CZ territory (§ 33).
- **Vrcholné vedení** (top management / statutory body) — accountable for
  measures (§ 14(1)(a)(2), § 14(2)(b)); personal ban possible (§ 58).
- **Významný dodavatel** (significant supplier, vyhl. 409 § 2(h)) — supplier whose
  failure affects the regulated service; contract requirements apply.
- **Dodavatel** under screening (§§ 27–32) — supplier subject to NÚKIB measure
  (*opatření obecné povahy*) after government resolution.
- **NÚKIB** (regulator; operates vládní CERT) and **Národní CERT** (operator under
  public-law contract, § 43, § 53; named on NÚKIB website).

## 4. Obligation register (seed)

| ID | Article | Obligation | Applies to (role/condition) | Evidence of compliance | Typical gap |
|---|---|---|---|---|---|
| NIS2-CZ-01 | § 4–5, § 6(1) ZKB; NIS2 art. 3(3)–(4), 27 | Self-assess and notify (*ohlásit*) regulated service to NÚKIB within 60 days of meeting conditions | Any entity meeting §§ 4–5 | Scoping memo (sector/size/linked enterprises), Portál NÚKIB filing, registration decision | Group linkage ignored in size test; late or no notification |
| NIS2-CZ-02 | § 11, § 9 ZKB | Supplement contact data within 30 days of decision; report changes within 14 days; regime change within 60 days | Registered provider | Portál records, change log | Contacts outdated; acquisitions not reported |
| NIS2-CZ-03 | § 13(1)–(4) ZKB | Implement security measures within **1 year of delivery of registration decision** | Registered provider | Implementation plan with decision date, gap closure evidence | Deadline computed from 1.11.2025 instead of decision date (or vice versa) |
| NIS2-CZ-04 | § 14(1)(a)(1) ZKB; vyhl. 409 | Information security management system (*ISMS*) with defined scope | Higher regime | ISMS scope, policy set, management review | ISO 27001 scope narrower than the regulated service |
| NIS2-CZ-05 | § 14(2)(a) ZKB; vyhl. 410 | System for ensuring minimum cybersecurity | Lower regime | Documented minimum-security system | Not formalised |
| NIS2-CZ-06 | § 14(1)(a)(2), § 14(2)(b) ZKB; vyhl. 409 § 4; NIS2 art. 20 | Top management: approve and oversee measures, set security policy; higher regime: steering committee (*výbor pro řízení kybernetické bezpečnosti*) | Statutory body | Board resolutions, committee charter and minutes | Delegated entirely to IT; no board approval |
| NIS2-CZ-07 | vyhl. 409 § 10(3)(a); NIS2 art. 20(2) | Initial and regular cybersecurity training for top management | Higher regime (lower: per vyhl. 410 ⚠ verify) | Training records for each board member | Board never trained |
| NIS2-CZ-08 | § 14(1)(a)(3)–(4) ZKB | Security roles (incl. manager/architect/auditor roles) and security documentation | Higher regime | Role appointments, document register | Roles combined in conflicting ways (auditor = manager) |
| NIS2-CZ-09 | § 14(1)(a)(5)–(6), § 14(2)(c)–(d) ZKB | Asset management and risk management (risk assessment, treatment plan) | Both regimes | Asset register, risk assessment, risk treatment plan, statement of applicability | Asset register lacks dependencies on suppliers |
| NIS2-CZ-10 | § 13(5) ZKB; vyhl. 409 § 9, příl. 4–5 | Supplier management: identify *významní dodavatelé*, risk-assess before contracting, notify them in writing, include required contract terms | Higher regime (lower: § 13(5) generally) | Supplier register, pre-contract risk assessments, notices, contract clauses | Legacy contracts not amended; cloud/MSP not flagged as significant |
| NIS2-CZ-11 | § 31 ZKB | Identify and report suppliers as required for supplier screening | Providers as specified | Supplier list filed | Unaware of duty |
| NIS2-CZ-12 | § 29, § 32 ZKB | Comply with NÚKIB measure restricting/banning a supplier; contractual exit | Providers using affected supplier | Measure monitoring, exit plan | No termination right → rely on § 32 statutory right |
| NIS2-CZ-13 | § 14(1)(a)(8), § 14(2)(e) ZKB | Human-resources security (screening, awareness, offboarding) | Both | Awareness programme, joiner/leaver records | No awareness for contractors |
| NIS2-CZ-14 | § 14(1)(a)(9)–(10) ZKB | Change management; acquisition, development and maintenance | Higher regime | Change records, secure development policy | Emergency changes undocumented |
| NIS2-CZ-15 | § 14(1)(a)(11), (b)(3)–(4); § 14(2)(g)–(h) ZKB | Access control, identity management (MFA), privileged access | Both | IAM policy, MFA coverage report, access reviews | No MFA for remote/admin access |
| NIS2-CZ-16 | § 14(1)(b)(5)–(7); § 14(2)(i) ZKB | Detection, logging and evaluation of security events | Both | SIEM/log policy, retention, alert handling | Logs not retained or reviewed |
| NIS2-CZ-17 | § 14(1)(a)(12); § 14(2)(j); §§ 15–16 ZKB | Incident handling process incl. reporting chain | Both | Incident procedure, contact list, Portál access, exercises | Nobody can file on Portál at night/weekend |
| NIS2-CZ-18 | § 14(1)(a)(13); § 14(2)(f) ZKB | Business continuity (BIA, BCP/DRP, backups, testing) | Both | BIA, BCP, restore-test records | Backups never restored in test |
| NIS2-CZ-19 | § 14(1)(a)(14) ZKB | Cybersecurity audit | Higher regime | Audit plan and reports, auditor independence | Audit by the ISMS owner |
| NIS2-CZ-20 | § 14(1)(b)(1)–(2); § 14(2)(k) ZKB | Physical security; network security (segmentation) | Higher (physical); both (network) | Network diagrams, segmentation rules | Flat OT/IT network |
| NIS2-CZ-21 | § 14(1)(b)(8)–(9); § 14(2)(l)–(m) ZKB | Application security and cryptography | Both | Vulnerability/patch management, crypto policy | Unsupported software in production |
| NIS2-CZ-22 | § 14(1)(b)(10)–(11) ZKB | Availability of the regulated service; security of industrial/control assets (OT) | Higher regime | Availability design, OT security plan | OT excluded from scope |
| NIS2-CZ-23 | § 19 ZKB | Inform service recipients of significant cyber threats (mandatory) and incidents (if ordered) | Registered provider | Customer-communication template | No process |
| NIS2-CZ-24 | §§ 25–26, 33 ZKB | Strategically important service: notify changes, ensure operation from CZ, 2-year review | Designated providers | Location/operations evidence | Designation status unknown ⚠ verify decree |

## 5. Deadlines and notifications

| Trigger | Deadline | To | Basis |
|---|---|---|---|
| Conditions of §§ 4–5 met (incl. 1 Nov 2025 for existing entities → 31 Dec 2025) | ≤ 60 days | NÚKIB via Portál | § 6(1) |
| Registration decision delivered | supplementary/contact data ≤ 30 days | NÚKIB | § 11 |
| Change of registered data | ≤ 14 days | NÚKIB | § 11 |
| Change affecting regime | ≤ 60 days | NÚKIB | § 9 |
| Security measures | ≤ 1 year from delivery of registration decision | — | § 13(4) |
| Incident reporting duty starts | ≤ 1 year from registration (pre-regulated entities: from delivery of decision, § 71(1)) | — | § 15(4) |
| Incident detected (higher regime: in-scope incidents where intent cannot be excluded; lower: significant impact) | **prvotní hlášení ≤ 24 h** from detection | NÚKIB (higher) / Národní CERT (lower) | §§ 15(1)–(2), 16(1) |
| NÚKIB feedback on significance (higher) | ≤ 24 h | Provider | § 16(2) |
| Significant incident | **oznámení ≤ 72 h** (trust services: 24 h) with initial assessment | same | § 16(3)(a) |
| On request | interim report | same | § 16(3)(b) |
| Final report | **≤ 30 days** after notification (ongoing incident: 30 days after resolution) | same | § 16(3)(c) |
| Significant cyber threat | without undue delay | Service recipients | § 19(2) |
| Channel | Portál NÚKIB; fallback e-mail / datová schránka | — | § 16(4) |

NIS2 comparison: art. 23(4) — 24 h early warning, 72 h notification, final
report ≤ 1 month. CZ uses 30 days.

## 6. Enforcement and sanctions

- **NÚKIB**: registration decisions, inspections, warnings, remedial measures
  (*opatření k nápravě*, § 56), reactive measures, supplier-screening measures.
- **Fines (§ 59(4))**: higher regime up to **CZK 250 m or 2 %** of worldwide
  annual turnover, whichever higher; lower regime up to **CZK 175 m or 1.4 %**;
  lower tiers CZK 100 m / 50 m / 35 m (§ 59(4)(c)–(e)). Other persons up to CZK
  250 m / 2 % (§ 60(7)). (NIS2 art. 34(4)–(5) minima: EUR 10 m / 2 %, EUR 7 m /
  1.4 %.) Special cap for public bodies **not found** ⚠ verify.
- **Management liability**: temporary ban on a statutory-body member of a
  higher-regime provider (≥ 6 months, entered in commercial register) where a
  § 56 remedial order is frustrated (§ 58). Civil duty-of-care exposure (§ 159 OZ,
  § 51 ZOK); NIS2 art. 20(1) liability of management bodies.
- **Practice**: 2026 is the first registration/implementation year; NÚKIB has
  prioritised registration completeness and guidance (*metodiky* on nukib.gov.cz);
  expect inspections from 2027 when 1-year implementation periods expire.

## 7. Contract touchpoints

- **Significant-supplier contracts** (vyhl. 409 § 9, příloha č. 5): security
  requirements; flow-down to subcontractors; incident notification to customer;
  SLA; audit/inspection; data location and return; change-of-control
  termination; contractual sanctions; right to terminate for breach of security
  requirements ⚠ verify full list in příloha 5 and vyhl. 410 equivalent.
- **Supplier screening**: statutory right to terminate where performance would
  breach a NÚKIB measure (§ 32) — add express termination/transition clause.
- **Pre-contract risk assessment** (vyhl. 409 § 9(2), příloha 4) — document it
  before signing; written notice to supplier of its significant status (§ 9(3)).
- **Cloud/MSP/MSSP**: incident cooperation within § 16 clocks (supplier must
  notify in hours, not days), logs access, BCP participation, exit assistance.
- **Customer-side**: § 19 duty to inform recipients — avoid contractual
  confidentiality that blocks it.

## 8. Interaction with other regimes

- **DORA (`dora`)** — lex specialis for financial entities (DORA art. 1(2); NIS2
  art. 4; § 70 ZKB). Per ČNB–NÚKIB statement (24 June 2026): not a blanket
  exclusion — NÚKIB registration and non-equivalent activities remain; ČNB is
  primary supervisor for DORA-equivalent measures.
- **GDPR (`gdpr`)** — incident with personal data: separate 72 h art. 33 notice to
  ÚOOÚ; NIS2 art. 35 cooperation with DPAs.
- **AI Act (`ai-act`)** — AI in critical infrastructure is Annex III pt 2
  high-risk; art. 15 cybersecurity requirements; serious-incident reporting
  (AI Act art. 73) runs in parallel.
- **CER / critical infrastructure** — critical-infrastructure entities are in
  scope regardless of size (§ 5); CER Directive (EU) 2022/2557 transposition ⚠
  verify Czech act.
- **eIDAS / trust services** — 24 h notification for trust-service providers
  (§ 16(3)(a)).
- **Whistleblowing (`whistleblowing-cz`)** — network-security breaches are a
  reportable area (§ 2(1)(d) ZOO).
