---
code: gdpr
name: General Data Protection Regulation
instruments: Regulation (EU) 2016/679; CZ: zákon č. 110/2019 Sb., o zpracování osobních údajů
regulator: Úřad pro ochranu osobních údajů (ÚOOÚ)
reviewed_at: 2026-10-10
review_by: 2027-01-10
status: partially verified
---
# GDPR — regime pack

How to use: this pack is a seed obligation register, not the law itself. Use §2
to decide applicability and §3 to fix the client's role, then build the
obligation register from §4. Every obligation used in a deliverable is resolved
to the current text (version in force on the EPOCH date) in the citation
ledger; never cite this pack as authority. ⚠ marks items not verified against an
official source at `reviewed_at`. If today is past `review_by`, warn the user
that the pack may be stale before relying on it.

## 1. Instruments and status

ADOPTED and applicable:
- **Regulation (EU) 2016/679 (GDPR)** — applies since 25 May 2018.
- **Zákon č. 110/2019 Sb., o zpracování osobních údajů** (*ZZOÚ*) — effective
  24 April 2019; consolidated version in force from 1 August 2025. Hlava II
  adapts GDPR (§§ 4–23); Hlava III transposes the Law Enforcement Directive
  (EU) 2016/680; §§ 50–60 ÚOOÚ; §§ 61–62 offences.
- **ePrivacy, Czech transposition (ÚOOÚ supervises):** zákon č. 127/2005 Sb.,
  o elektronických komunikacích, § 89(3) — cookies/terminal-equipment access
  on prior consent (opt-in since 1 January 2022); zákon č. 480/2004 Sb., o
  některých službách informační společnosti, § 7 — unsolicited commercial
  communications (*obchodní sdělení*).
- **Regulation (EU) 2025/2518** on additional procedural rules for GDPR
  enforcement (cross-border cases) — OJ 12 December 2025, in force 1 January
  2026, applies to complaints lodged / investigations opened after **2 April
  2027** (transitional rules art. 36). Procedural only; substantive duties and
  fine levels unchanged.
- **Transfers to the US:** adequacy decision (EU) 2023/1795 (EU–US Data Privacy
  Framework). General Court dismissed the challenge (T-553/23 *Latombe*, 3 Sept
  2025); appeal **C-703/25 P pending**. Keep SCC fallback in critical flows.

PROPOSED only (not law at reviewed_at):
- **Digital Omnibus** COM(2025) 837, procedure 2025/0360(COD) — would amend the
  personal-data definition (art. 4(1)), raise the art. 33 threshold to "high
  risk" and extend 72 h → 96 h via an EU single entry point, simplify records
  and cookies (move into GDPR). EP status "awaiting committee decision"; no
  Council general approach (Sept 2026). **Apply current art. 33 (72 h).**
  (The separate AI omnibus does not amend GDPR — see `ai-act`.)

## 2. Scope tests

1. Is there **processing** (art. 4(2)) of **personal data** (art. 4(1)) —
   identified or identifiable natural person, incl. pseudonymised data (rec. 26)?
   No → out (anonymous data; but test re-identification risk — cf. ÚOOÚ *Avast*).
2. Wholly/partly automated, or manual within a **filing system** (art. 2(1))?
   CZ extends the regime to some processing outside EU law (§ 4 ZZOÚ).
3. **Exclusions** (art. 2(2)): purely personal/household (c); criminal-law
   enforcement by competent authorities (d) → Hlava III ZZOÚ, not GDPR.
4. **Territorial** (art. 3): establishment in the EU (3(1)), regardless of where
   processing occurs; or non-EU entity offering goods/services to, or monitoring
   behaviour of, persons in the EU (3(2)) → art. 27 representative.
5. **Special categories / criminal data?** (arts. 9, 10) → condition under 9(2)
   needed; DPIA likely.
6. **Size-based relief:** records of processing exempt <250 employees only if
   processing is occasional, low-risk and excludes art. 9/10 data (art. 30(5)) —
   in practice almost never available (HR and payroll are not occasional).
7. **Czech derogations that may apply:** journalistic/academic/artistic purposes
   (§§ 17–23 ZZOÚ); research/statistics safeguards (§ 16); processing under
   legal obligation/public task (§ 5) with simplified info duty (§ 8) and no
   DPIA where a statute imposes the processing (§ 10).

## 3. Roles

- **Controller** (*správce*, art. 4(7)) — determines purposes and essential means.
- **Processor** (*zpracovatel*, art. 4(8)) — processes on documented instructions
  only; becomes controller if it determines purposes (art. 28(10)).
- **Joint controllers** (*společní správci*, art. 26) — jointly determine purposes
  and means (CJEU C-210/16 *Wirtschaftsakademie*, C-40/17 *Fashion ID*).
- **Sub-processor** (art. 28(2), (4)) — engaged by processor with controller's
  prior authorisation; same obligations flowed down.
- **Representative** (art. 27) — required for art. 3(2) non-EU controllers/processors.
- **DPO** (*pověřenec*, arts. 37–39) — mandatory for public authorities (CZ § 14
  extends to entities performing tasks in the public interest), core activities of
  large-scale regular/systematic monitoring or large-scale art. 9/10 data.
- **Advocates** — independent controllers for client-matter data, not
  processors of the client (EDPB Guidelines 07/2020 on controller/processor).

## 4. Obligation register (seed)

| ID | Article | Obligation | Applies to (role/condition) | Evidence of compliance | Typical gap |
|---|---|---|---|---|---|
| GDPR-01 | 5(2), 24 | Accountability: implement and be able to demonstrate compliance | Controller | Data-protection policy, governance owner, compliance file | Policy exists, no evidence trail or annual review |
| GDPR-02 | 30 | Records of processing activities (*záznamy o činnostech zpracování*) | Controller; processor (30(2)) | RoPA with purposes, categories, recipients, transfers, retention, TOMs | Outdated; processor RoPA missing; retention column blank |
| GDPR-03 | 6 | Legal basis per purpose | Controller | RoPA legal-basis column; LIA for 6(1)(f) | Consent used where 6(1)(b)/(c) applies; no LIA |
| GDPR-04 | 7, 8; § 7 ZZOÚ | Valid consent, provable, withdrawable; child consent for ISS at **15** | Controller relying on consent | Consent logs, wording, withdrawal mechanism | Bundled consent; no age gate for under-15 users |
| GDPR-05 | 9, 10 | Condition for special-category and criminal data | Controller | Art. 9(2) mapping; criminal-record checks justified by statute | Health data in HR files without 9(2)(b) basis; extract from *rejstřík trestů* without legal ground |
| GDPR-06 | 12–14; § 8 ZZOÚ | Transparent information at collection / within 1 month | Controller | Privacy notices (web, HR, CCTV, suppliers) | No employee or CCTV notice; recipients and retention vague |
| GDPR-07 | 12(3), 15–22 | Handle data-subject requests in 1 month (+2) | Controller; processor assists (28(3)(e)) | DSAR procedure, log, templates, ID verification | No log; access request answered without copy (art. 15(3)) |
| GDPR-08 | 21(2)–(3); § 7 z. 480/2004 Sb. | Right to object to direct marketing; e-mail marketing opt-in/soft opt-in | Controller doing marketing | Suppression list, unsubscribe in every message | Soft opt-in stretched to non-customers; no unsubscribe link |
| GDPR-09 | 22 | Automated decisions with legal/similar effect: basis + safeguards | Controller using profiling/scoring | Decision-logic description, human-review procedure | Scoring tools used without art. 22 analysis (CJEU C-634/21 *SCHUFA*) |
| GDPR-10 | 25 | Data protection by design and by default | Controller | Privacy-by-design checklist in change/procurement process | Default settings collect max data; no input to IT projects |
| GDPR-11 | 5(1)(e) | Storage limitation: retention schedule and deletion | Controller | Retention schedule (*skartační plán*), deletion logs | "Keep forever"; backups ignored; no deletion of rejected candidates |
| GDPR-12 | 5(1)(c), (d) | Minimisation and accuracy | Controller | Data inventory, form review | Copies of ID cards kept without legal ground |
| GDPR-13 | 26 | Joint-controller arrangement, essence available to data subjects | Joint controllers | Art. 26 arrangement; published summary | Group-wide HR/CRM without arrangement |
| GDPR-14 | 28(1), (3) | Processor due diligence and art. 28 DPA | Controller using processors | Vendor register, DPAs, due-diligence records | DPA missing for SaaS/IT support/payroll; no audit right |
| GDPR-15 | 28(2), (4) | Sub-processor authorisation and flow-down | Processor | Sub-processor list, notice mechanism, back-to-back terms | List not maintained; objection right absent |
| GDPR-16 | 29, 32(4) | Personnel act only on instructions; confidentiality | Controller, processor | Confidentiality undertakings, training records | No training records; contractors not bound |
| GDPR-17 | 32 | Security appropriate to risk (TOMs) | Controller, processor | Security policy, access-control, encryption, backup, test records | No periodic testing (32(1)(d)); shared accounts |
| GDPR-18 | 33(1), (5) | Breach notification to ÚOOÚ within 72 h; internal breach register | Controller | Breach procedure, breach log incl. non-notified breaches | Log only of notified breaches; 72 h clock not understood |
| GDPR-19 | 33(2) | Processor notifies controller without undue delay | Processor | DPA clause, incident runbook | Processor contract allows "reasonable time" |
| GDPR-20 | 34; § 12 ZZOÚ | Communicate high-risk breach to data subjects | Controller | Template notices, decision record | High-risk breaches not communicated |
| GDPR-21 | 35; ÚOOÚ list | DPIA for likely high-risk processing | Controller | DPIA reports; screening records | No DPIA for CCTV, employee monitoring, AI/large-scale profiling |
| GDPR-22 | 36 | Prior consultation where residual high risk | Controller | Consultation file | Never considered |
| GDPR-23 | 37–39; § 14 ZZOÚ | Designate DPO where required; publish contact, notify ÚOOÚ; independence | Public bodies; core large-scale monitoring / art. 9 data | Appointment, ÚOOÚ notification, conflict-of-interest analysis | DPO is IT head or GC (conflict); no reporting line to top management |
| GDPR-24 | 27 | EU representative | Art. 3(2) non-EU controllers/processors | Written mandate, notice | Missing for non-EU group entity targeting CZ |
| GDPR-25 | 44–46, 49 | Lawful third-country transfers (adequacy/DPF, SCCs 2021/914, BCRs) + TIA | Controller, processor exporting | Transfer register, SCCs, TIA, DPF certification check | US SaaS without DPF check or SCCs; no TIA |
| GDPR-26 | 6, 88; § 316 zák. práce | Employee monitoring proportionate and announced | Employer | Monitoring policy, DPIA, notice | Hidden CCTV/e-mail monitoring; GPS on private time |
| GDPR-27 | § 89(3) z. 127/2005 Sb.; 7 | Cookies: prior opt-in for non-essential cookies, equal "reject" | Website/app operator | CMP configuration, consent records, scan | Pre-ticked or no reject button; analytics before consent |
| GDPR-28 | 5(1)(f), 32; 24 | Staff awareness/training | Controller, processor | Training plan and attendance | One-off training, none for new staff |

## 5. Deadlines and notifications

| Trigger | Deadline | Notified | Basis |
|---|---|---|---|
| Personal-data breach (unless unlikely to result in risk) | without undue delay, ≤ **72 h** from awareness; reasons for delay; phased info allowed (33(4)) | ÚOOÚ (online form) | art. 33(1) |
| Breach at processor | without undue delay | Controller | art. 33(2) |
| High-risk breach | without undue delay | Data subjects | art. 34; § 12 ZZOÚ (restrictions) |
| Data-subject request | 1 month; +2 months if complex, informing within 1 month | Data subject | art. 12(3)–(4) |
| Info when data not from subject | ≤ 1 month; at first communication / disclosure | Data subject | art. 14(3) |
| Rectification/erasure/restriction | notify recipients unless impossible/disproportionate | Recipients | art. 19 |
| Prior consultation | ÚOOÚ advises within 8 weeks (+6) | ÚOOÚ | art. 36(2) |
| DPO designation | on appointment / change | ÚOOÚ; contact published | art. 37(7) |
| Restriction of rights under § 11 ZZOÚ | without undue delay | ÚOOÚ | § 11(2) ZZOÚ |
| Periodic | Review RoPA, DPIAs, TOMs, transfer assessments on change and at least annually (good practice) | — | arts. 24(1), 32(1)(d), 35(11) |

## 6. Enforcement and sanctions

- **ÚOOÚ** — supervisory authority (§§ 50–60 ZZOÚ); inspections under *kontrolní
  řád* (zákon č. 255/2012 Sb.); remedial measures (§ 60); access to all information
  incl. confidential (advocates' secrecy only with ČAK consent, § 58).
- **Fine maxima** (art. 83, higher of): **EUR 10 m / 2 %** worldwide annual turnover
  (arts. 8, 11, 25–39, 42–43 — 83(4)); **EUR 20 m / 4 %** (principles, legal
  basis, consent, art. 9, rights, transfers, orders — 83(5)–(6)). Undertaking =
  group (CJEU C-807/21 *Deutsche Wohnen*: fault of the entity required, no need to
  identify a natural person).
- **Public bodies are not fined:** § 62(5) ZZOÚ (*úřad upustí od uložení
  správního trestu*) for art. 83(7) controllers/processors; same in § 61(3).
- **National offence:** breach of a statutory publication ban — up to CZK 1 m,
  CZK 5 m via press/radio/TV/internet (§ 61 ZZOÚ).
- **Civil:** compensation art. 82 — no de minimis threshold for non-material damage
  (CJEU C-300/21 *Österreichische Post*), but damage must be proven; Czech courts
  award modest sums. **Criminal:** § 180 trestní zákoník (*neoprávněné nakládání
  s osobními údaji*).
- **Management:** no personal GDPR fine; exposure via duty of care (§ 159 OZ,
  § 51 ZOK) and recourse.
- **Practice:** ÚOOÚ record fine CZK 351 m (*Avast Software*, April 2024, data
  sold as "anonymous" were re-identifiable; one-stop-shop case). Otherwise typical
  fines are low (tens–hundreds of thousands CZK); frequent topics: CCTV,
  unsolicited commercial communications, cookies, health and employee data,
  breaches of security. Annual inspection plan published on uoou.gov.cz.

## 7. Contract touchpoints

- **Art. 28(3) DPA mandatory content** — subject-matter, duration, nature and
  purpose, data types, categories of data subjects, controller's obligations and
  rights; processor: (a) documented instructions incl. transfers; (b)
  confidentiality of personnel; (c) art. 32 security; (d) sub-processor conditions
  (prior specific/general written authorisation + objection, flow-down, processor
  liable); (e) assistance with data-subject rights; (f) assistance with arts. 32–36;
  (g) deletion or return at end; (h) information and audits/inspections, and
  notify if an instruction infringes law. Check also: breach-notice period
  (hours, not "reasonable"), sub-processor list, location of processing.
- **Art. 26 arrangement** — allocation of duties (information, rights, breach,
  contact point); essence made available to data subjects.
- **Transfers** — SCCs (Decision 2021/914) with correct module (C2C, C2P, P2P,
  P2C); docking clause; TIA annex; for US recipients check DPF certification and
  scope (HR data needs HR certification).
- **Liability** — caps cannot limit liability towards data subjects (art. 82(4));
  check internal recourse (82(5)) and indemnities for fines (enforceability of
  fine indemnities doubtful ⚠ verify per jurisdiction).
- **Clauses that leak GDPR risk:** vendor "uses data to improve services" (=
  own controller purpose → separate basis), analytics/AI training on client data,
  unilateral sub-processor changes, audit only by vendor report.

## 8. Interaction with other regimes

- **NIS2 / zákon o kybernetické bezpečnosti (`nis2-cz`)** — same incident may
  trigger NÚKIB report and art. 33 notice; separate clocks and recipients; NIS2
  art. 35 obliges NIS authorities to inform DPAs of likely personal-data breaches.
- **DORA (`dora`)** — major ICT incident reporting to ČNB does not replace art. 33.
- **AI Act (`ai-act`)** — GDPR applies in full to personal data in AI systems
  (AI Act art. 2(7)); art. 10(5) AI Act allows special-category data for bias
  detection under safeguards; FRIA (art. 27(4)) complements the DPIA; art. 22
  GDPR for automated decisions.
- **Whistleblowing (`whistleblowing-cz`)** — processing under art. 6(1)(c);
  identity confidentiality limits art. 15/14 rights of the person concerned;
  retention 5 years under § 21 z. 171/2023 Sb.
- **AML (`aml-cz`)** — CDD processing under art. 6(1)(c); 10-year retention
  under § 16 z. 253/2008 Sb.; tipping-off ban limits access rights.
- **Data Act** (Regulation (EU) 2023/2854, applies from 12 September 2025) —
  GDPR prevails for personal data (Data Act art. 1(5)).
- **Employment** — zákoník práce § 316 (monitoring of employees) and labour
  inspection (SÚIP) run in parallel with ÚOOÚ.
