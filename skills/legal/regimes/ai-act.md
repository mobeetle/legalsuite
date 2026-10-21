---
code: ai-act
name: Artificial Intelligence Act
instruments: Regulation (EU) 2024/1689, as amended by Regulation (EU) 2026/1744 (Digital Omnibus on AI); CZ: zákon o umělé inteligenci — draft only (ODok 503/26)
regulator: EU AI Office (GPAI; AI on GPAI models of same provider; VLOPs/VLOSEs); CZ market surveillance not yet designated by law (proposed ČTÚ, ČNB, ÚOOÚ)
reviewed_at: 2026-10-10
review_by: 2027-01-10
status: partially verified
---
# AI Act — regime pack

How to use: this pack is a seed obligation register, not the law itself. Use §2
to decide applicability and §3 to fix the client's role, then build the
obligation register from §4. Every obligation used in a deliverable is resolved
to the current text (version in force on the EPOCH date) in the citation
ledger; never cite this pack as authority. ⚠ marks items not verified against an
official source at `reviewed_at`. If today is past `review_by`, warn the user
that the pack may be stale before relying on it.

## 1. Instruments and status

ADOPTED:
- **Regulation (EU) 2024/1689 (AI Act)** — in force 1 August 2024.
- **Regulation (EU) 2026/1744 (Digital Omnibus on AI)** of 8 July 2026, OJ L
  24 July 2026, **in force 27 July 2026** (proposal COM(2025) 836,
  2025/0359(COD); provisional agreement May 2026). Use the consolidated text
  CELEX 02024R1689-20260727.

Application timeline (art. 113 as amended):

| Date | What applies |
|---|---|
| 2 Feb 2025 | Ch. I–II: definitions, **AI literacy (art. 4)**, **prohibitions (art. 5)** |
| 2 Aug 2025 | Notified bodies (Ch. III s. 4), **GPAI (Ch. V)**, governance (Ch. VII), penalties (Ch. XII, except art. 101), art. 78 |
| 27 Jul 2026 | Arts. 102–110 (amendments to sectoral acts) (new art. 113(d)) |
| **2 Aug 2026** | General application: **transparency (art. 50)**, art. 101 GPAI fines, Commission GPAI enforcement powers; remaining provisions not deferred |
| 2 Dec 2026 | New prohibitions art. 5(1)(ba), (bb), 5(1a)–(1b) (non-consensual intimate imagery / CSAM generation); art. 50(2) marking for generative systems placed on the market before 2 Aug 2026 (art. 111(4)) |
| 2 Aug 2027 | National AI regulatory sandboxes operational (art. 57(1)); GPAI models placed before 2 Aug 2025 must comply (art. 111(3)) |
| **2 Dec 2027** | **High-risk, Annex III** (art. 6(2)) — Ch. III ss. 1–3 (was 2 Aug 2026) |
| **2 Aug 2028** | **High-risk, Annex I** product safety components (art. 6(1)) (was 2 Aug 2027); machinery moved to Reg. 2023/1230 by delegated acts |
| 2 Aug 2030 | High-risk systems used by public authorities placed before the cut-off (art. 111(2)) |

The omnibus fixed dates instead of the proposed link to standards availability.
Other adopted changes: art. 4 softened ("take measures to support" AI
literacy; no guaranteed level; Commission/Member States support); new art. 4a
(special-category data for bias detection only where strictly necessary); SMC
definition (art. 3(14a)–(14b)) and SMC lower-of fine cap (art. 99(6a), paras 4–5
only); simplified technical documentation for SMEs/SMCs (art. 11); art. 6(3)
systems still registered but with lighter Annex VIII content (rec. 22) ⚠ verify
operative art. 49 wording; AI Office exclusive competence (art. 75); FRIA may
cross-refer to DPIA, AI Office questionnaire template (art. 27(4)–(5)).

Czech implementation — PROPOSED only:
- **Návrh zákona o umělé inteligenci** (MPO; ODok 503/26) — final documents filed
  26 June 2026; **not approved by government, no sněmovní tisk** at reviewed_at.
  Proposed: **ČTÚ** general market-surveillance authority and single point of
  contact (art. 70(2)); **ČNB** (financial sector); **ÚOOÚ** (biometrics,
  law-enforcement-related uses ⚠ verify allocation); **ÚNMZ** notifying
  authority; **ČAS** sandbox; SME lower-of caps; remedy-before-sanction step.
  ČTÚ already presents itself as art. 50 supervisor (press release 31 Jul 2026).

Guidance: prohibited-practices guidelines (4 Feb 2025); AI-system definition
guidelines (6 Feb 2025); GPAI guidelines (18 Jul 2025); GPAI Code of Practice
(assessed adequate 1 Aug 2025); high-risk classification guidelines (art. 6(5))
**draft only** (19 May 2026), deadline missed.

## 2. Scope tests

1. **AI system?** (art. 3(1); Commission definition guidelines) — machine-based,
   varying autonomy, may adapt, **infers** from input how to generate outputs
   (predictions, content, recommendations, decisions). Plain rule-based software
   → out. GPAI model? (art. 3(63)) → Ch. V route.
2. **Territorial** (art. 2(1)): provider placing on EU market/putting into service
   (any seat); deployer established/located in EU; third-country provider or
   deployer whose **output is used in the EU**; importers, distributors,
   product manufacturers, authorised representatives, affected persons in EU.
3. **Exclusions** (art. 2): military/defence/national security (2(3)); scientific
   R&D only (2(6)); research and testing before market placement, except
   real-world testing (2(8)); purely personal non-professional use (2(10));
   free and open-source unless high-risk, art. 5 or art. 50 (2(12)).
4. **Prohibited practice?** (art. 5) — manipulation/exploitation of vulnerabilities,
   social scoring, individual crime-risk prediction based solely on profiling,
   untargeted facial scraping, emotion recognition at work/education, biometric
   categorisation of sensitive traits, real-time remote biometric ID in public
   for law enforcement (narrow exceptions); from 2 Dec 2026 also art. 5(1)(ba)–(bb).
5. **High-risk?** (art. 6): (a) safety component of / product under Annex I
   legislation requiring third-party conformity assessment (6(1)); or (b)
   **Annex III** use case (biometrics, critical infrastructure, education,
   **employment/HR**, essential services incl. **creditworthiness** and
   **life/health insurance pricing**, law enforcement, migration, justice and
   elections) (6(2)) — unless art. 6(3) derogation applies (narrow procedural
   task, improving prior human activity, detecting patterns without replacing
   human assessment, preparatory task) and **no profiling** of natural persons;
   derogation must be documented before placing on market (6(4)) and registered.
6. **Transparency trigger?** (art. 50) — interacts with persons, generates
   synthetic content, emotion recognition/biometric categorisation, deepfakes,
   AI-generated public-interest text.
7. **SME/SMC?** (art. 3(14a)–(14b)) — fine caps lower-of; simplified documentation.

## 3. Roles

- **Provider** (art. 3(3)) — develops or has developed an AI system/GPAI model
  and places it on the market / puts into service under own name or trademark.
- **Deployer** (art. 3(4)) — uses an AI system under its authority (not personal
  non-professional use). Most Czech clients are deployers.
- **Authorised representative** (art. 3(5), arts. 22, 54) — EU mandate for
  non-EU providers of high-risk systems / GPAI models.
- **Importer** (art. 3(6), art. 23) — EU entity placing a non-EU provider's
  system on the market.
- **Distributor** (art. 3(7), art. 24) — other supply-chain actor making a system
  available.
- **Product manufacturer** (art. 25(3)) — provider for Annex I safety components.
- **Role switch to provider** (art. 25(1)): own name/trademark on a high-risk
  system; substantial modification; changing intended purpose so a system
  becomes high-risk. Original provider must cooperate (25(2)).
- **GPAI model provider** (arts. 53–55); **with systemic risk** (art. 51: ≥ 10^25
  FLOP presumption or Commission designation). Downstream modifier becomes
  provider above ~one-third of original training compute (GPAI guidelines).
- **Operator** (art. 3(8)) — umbrella term for all the above.

## 4. Obligation register (seed)

| ID | Article | Obligation | Applies to (role/condition) | Evidence of compliance | Typical gap |
|---|---|---|---|---|---|
| AI-ACT-01 | 3(1), 6, 5 | AI inventory and classification (AI system? prohibited? high-risk? art. 50? GPAI?) | All operators | AI register with classification rationale per system | No inventory; shadow AI (staff using public chatbots) |
| AI-ACT-02 | 4 (as amended) | Measures to support AI literacy of staff and persons operating AI on its behalf | Providers, deployers | Literacy programme, role-based training, attendance | Generic e-learning; no record |
| AI-ACT-03 | 5 | No prohibited practices; screen use cases (esp. emotion recognition at work) | All | Prohibited-practice screening in procurement | Emotion/sentiment analytics in call centres or HR |
| AI-ACT-04 | 6(3)–(4), 49(2) | Document non-high-risk assessment before placing; register | Providers relying on 6(3) | Written assessment; EU database entry | Derogation assumed, not documented; profiling overlooked |
| AI-ACT-05 | 9 | Risk management system across lifecycle | High-risk providers | Risk management file | ⟂ |
| AI-ACT-06 | 10; 4a | Data governance; bias examination; special-category data only if strictly necessary | High-risk providers (4a: providers/deployers) | Data sheets, bias test reports | No bias testing on Czech-language/local data |
| AI-ACT-07 | 11, 18, Annex IV | Technical documentation (simplified form for SME/SMC); keep 10 years | High-risk providers | Annex IV file | Incomplete for third-party components |
| AI-ACT-08 | 12, 19 | Automatic logging; provider keeps logs ≥ 6 months | High-risk providers | Logging spec, retention | ⟂ |
| AI-ACT-09 | 13 | Instructions for use enabling deployers to comply | High-risk providers | Instructions for use | Marketing sheet instead of instructions |
| AI-ACT-10 | 14 | Human-oversight design | High-risk providers | Oversight measures in design and instructions | ⟂ |
| AI-ACT-11 | 15 | Accuracy, robustness, cybersecurity | High-risk providers | Test reports, metrics declared | ⟂ |
| AI-ACT-12 | 16, 17 | Provider obligations incl. quality management system | High-risk providers | QMS documentation | QMS not extended to AI |
| AI-ACT-13 | 43, 47, 48, 49 | Conformity assessment, EU declaration of conformity, CE marking, registration | High-risk providers | CA report, DoC, database ID | ⟂ |
| AI-ACT-14 | 72, 73 | Post-market monitoring; serious-incident reporting | High-risk providers | PMM plan, incident procedure | No route for deployer feedback |
| AI-ACT-15 | 22, 23, 24 | Authorised representative mandate; importer/distributor verification (CE, DoC, docs, registration) | Non-EU providers; importers; distributors | Mandate; verification checklist | Resellers do no verification |
| AI-ACT-16 | 25 | Role-switch analysis on rebranding, substantial modification, repurposing | Deployers, distributors, integrators | Role memo per system | White-labelled HR/credit tools → unknowingly provider |
| AI-ACT-17 | 26(1)–(2) | Use per instructions; assign human oversight to competent, trained, authorised persons | High-risk deployers | Oversight assignment, training | Oversight nominal |
| AI-ACT-18 | 26(4)–(5) | Input data relevant/representative (where controlled); monitor operation; inform provider/authority; suspend on risk | High-risk deployers | Monitoring log, escalation procedure | No monitoring after go-live |
| AI-ACT-19 | 26(6) | Keep automatically generated logs ≥ 6 months (unless other law) | High-risk deployers | Log retention config | Logs held by vendor only, no access right |
| AI-ACT-20 | 26(7) | Inform workers' representatives and affected workers before workplace use | Employer-deployers | Information records (*odborová organizace* / employees) | Not done; overlaps § 279 zákoník práce ⚠ verify |
| AI-ACT-21 | 26(9); GDPR 35 | Use provider information for DPIA | High-risk deployers processing personal data | DPIA referencing art. 13 info | DPIA omits AI logic |
| AI-ACT-22 | 26(11), 86 | Inform persons subject to Annex III decisions; right to explanation | High-risk deployers | Notices; explanation procedure | No explanation process for rejected applicants |
| AI-ACT-23 | 27 | Fundamental rights impact assessment before first use; notify authority | Public bodies; private entities providing public services; deployers for credit scoring (Annex III 5(b)) and life/health insurance pricing (5(c)) | FRIA (may cross-refer to DPIA, 27(4)); notification | Banks/insurers unaware of FRIA |
| AI-ACT-24 | 26(8), 49(3) | Register use in EU database | Public-authority deployers of high-risk | Database entry | ⟂ |
| AI-ACT-25 | 50(1), (2) | Disclose AI interaction; machine-readable marking of synthetic content | Providers | UX disclosure; watermark/metadata spec | Chatbots without disclosure; no marking |
| AI-ACT-26 | 50(3), (4) | Inform persons exposed to emotion recognition/biometric categorisation; disclose deepfakes and AI-generated public-interest text | Deployers | Labelling policy; editorial review record | Marketing deepfakes unlabelled |
| AI-ACT-27 | 53(1)(a)–(d) | GPAI: technical documentation, downstream information, copyright policy (incl. TDM opt-out), public training-content summary (Commission template) | GPAI providers | Model documentation, policy, published summary | Fine-tuners unsure if provider |
| AI-ACT-28 | 55 | Systemic-risk GPAI: evaluations, adversarial testing, serious incidents, cybersecurity | GPAI with systemic risk | Safety & security framework (Code of Practice) | ⟂ |
| AI-ACT-29 | 25(4) | Written agreement with suppliers of AI components/tools to high-risk providers | High-risk providers and their suppliers | Supply agreement (Commission model terms) | No contractual info/assistance duty |

(⟂ = provider-side; for a deployer client mark n/a.)

## 5. Deadlines and notifications

| Trigger | Deadline | To | Basis |
|---|---|---|---|
| Serious incident (high-risk) | immediately after causal link established, ≤ **15 days** of awareness | Market surveillance authority of the MS where it occurred | art. 73(2) |
| Widespread infringement / critical-infrastructure incident (art. 3(49)(b)) | ≤ **2 days** | same | art. 73(3) |
| Death of a person | ≤ **10 days** | same | art. 73(4) |
| Deployer identifies risk/serious incident | immediately | Provider, then importer/distributor and authority | art. 26(5) |
| FRIA completed | before first use; notify results (template) | Market surveillance authority | art. 27(1), (3) |
| Workplace deployment | before putting into service | Workers' reps and workers | art. 26(7) |
| GPAI systemic-risk threshold met | without delay, ≤ 2 weeks | Commission | art. 52(1) |
| Serious incident (systemic GPAI) | without undue delay | AI Office (and national authorities) | art. 55(1)(c) |
| Provider log retention | ≥ 6 months | — | arts. 19, 26(6) |
| Documentation retention | 10 years after placing | — | art. 18 |
| Pending dates | see §1 table (2 Dec 2026; 2 Dec 2027; 2 Aug 2028) | — | art. 113 |

## 6. Enforcement and sanctions

- **Fines (art. 99, higher of):** prohibited practices **EUR 35 m / 7 %**;
  operator obligations (arts. 16, 22–24, 26, 31, 33, 34, 50; plus 25(2), (4)
  added by omnibus) **EUR 15 m / 3 %**; incorrect/misleading information **EUR
  7.5 m / 1 %**. SMEs/start-ups: lower of (99(6)); SMCs: lower of for 99(4)–(5)
  (99(6a)). GPAI providers: Commission, **EUR 15 m / 3 %** (art. 101), from
  2 Aug 2026.
- **CZ enforcement gap:** penalty rules and authority designation require the
  national act, still draft. Until adopted, no Czech authority holds statutory
  power to fine for operator breaches ⚠ verify before advising on exposure;
  liability still arises via civil law, GDPR (ÚOOÚ), consumer law (ČOI) and
  sectoral supervisors (ČNB).
- **Rights of affected persons:** complaint to market surveillance authority
  (art. 85); right to explanation (art. 86); whistleblower protection (art. 87).
- **Management:** no personal AI Act sanction; board oversight of AI risk is a
  duty-of-care matter (§ 159 OZ).

## 7. Contract touchpoints

- **Procurement of AI (deployer side):** provider role and classification
  warranty; CE/DoC and registration for high-risk; instructions for use;
  log access ≥ 6 months (art. 26(6)); cooperation on incidents (art. 73) and
  FRIA/DPIA inputs; notice of substantial modifications; no use of client data
  for training without consent (GDPR/confidentiality); art. 50 marking support.
- **Value chain (art. 25(4))** — written agreement between high-risk provider
  and supplier of tools, services, components or processes: information,
  capabilities, technical access and assistance; Commission voluntary model
  terms ⚠ verify publication status.
- **White-label / reseller / OEM** — allocate art. 25(1) role-switch risk;
  indemnity for regulatory breaches; trademark use triggers provider status.
- **GPAI downstream** — art. 53(1)(b) information to downstream providers;
  copyright policy and training-data summary; acceptable-use and prohibited-use
  clauses aligned with art. 5.
- **Employment/HR tools** — art. 26(7) information; art. 86 explanation; human
  review of automated decisions (GDPR art. 22).

## 8. Interaction with other regimes

- **GDPR (`gdpr`)** — applies in full (art. 2(7)); DPIA + FRIA (art. 27(4) cross-
  reference); art. 4a vs GDPR art. 9; automated decisions GDPR art. 22 vs AI Act
  art. 86; ÚOOÚ proposed as AI authority for some areas.
- **DORA (`dora`)** — AI in ICT services for financial entities: DORA third-party
  contract rules (art. 30) apply to AI vendors; financial-institution
  obligations under arts. 17, 26 may be fulfilled within sectoral governance
  (art. 17(4), 26(5) ⚠ verify).
- **NIS2 (`nis2-cz`)** — AI in critical infrastructure (Annex III pt 2); art. 15
  cybersecurity; parallel incident reporting.
- **Product law** — Annex I legislation (machinery, medical devices, toys…);
  new Product Liability Directive (EU) 2024/2853 covers software/AI (transposition
  by 9 Dec 2026) ⚠ verify Czech transposition.
- **Copyright** — GPAI copyright policy; TDM exception (Directive 2019/790 art. 4;
  CZ autorský zákon § 39d ⚠ verify).
- **Employment law** — consultation/information duties (zákoník práce) alongside
  art. 26(7).
- **Whistleblowing (`whistleblowing-cz`)** — art. 87 applies Directive 2019/1937.
