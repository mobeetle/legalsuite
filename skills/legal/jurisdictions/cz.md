---
code: cz
name: Czech Republic
language: cs
reviewed_at: 2026-10-14
review_by: 2027-04-14
status: partially verified
---
# CZ — jurisdiction pack

How to use: this pack is the substantive-law data layer the skills read when
`JURISDICTION` is pinned to `cz`. It is a starting checklist, not a
substitute for the source: every anchor must still be resolved in the citation
ledger (statute text in the version in force at `EPOCH`, or the decision itself)
before it is relied on in a deliverable. Items marked ⚠ were not verified
against an official source at `reviewed_at`. The section headings are a fixed
contract with the skills: keep them verbatim and in this order; if a section
does not apply, keep the heading and write one line saying why.

<!-- Authoring rules: bullets and small tables, a statute anchor on every item,
no essays. Do not cite case law unless you checked the case number. Mark
anything not checked against an official source with ⚠ verify. -->

## 1. Sources and hierarchy

- **Constitutional:** ústavní zákon č. 1/1993 Sb., Ústava ČR; usnesení
  předsednictva ČNR č. 2/1993 Sb. (Listina základních práv a svobod).
- **EU law:** čl. 10 a 10a Ústavy — direct effect and primacy of EU law; the
  Czech act is disapplied where it conflicts (CJEU, *Simmenthal* line).
- **Domestic order:** ústavní zákony → zákony → nařízení vlády → vyhlášky
  ministerstev → obecně závazné vyhlášky obcí a krajů.
- **Case law weight:** ÚS nálezy bind the parties and carry strong precedent
  weight; NS and NSS decisions + *sjednocující stanoviska* guide but do not
  bind lower courts; commentary (*komentář*) is persuasive only.
- **Free official portals:** e-Sbírka (e-sbirka.cz, the official electronic
  Collection of Laws since 2024); zakonyprolidi.cz (readable, not official);
  justice.cz; nalus.usoud.cz.
- **Paywalled (leads only):** Beck-online, ASPI/Wolters Kluwer, CODEXIS — verify
  the lead against the official text before citing.

## 2. Citation format

- **Statute, long:** `§ 2048 zákona č. 89/2012 Sb., občanský zákoník, ve znění
  pozdějších předpisů`. **Short:** `§ 2048 OZ`.
- **Abbreviations:** OZ (89/2012), ZOK (90/2012), ZP (262/2006), OSŘ (99/1963),
  TŘ/tr. zákoník (40/2009), SŘ (500/2004), ZZVZ (134/2016), katastrální zákon
  (256/2013), zákon o obchodních korporacích viz ZOK.
- **Court decision:** `rozsudek Nejvyššího soudu ze dne <date>, sp. zn. 23 Cdo
  1234/2019`; ÚS `nález Ústavního soudu ze dne <date>, sp. zn. I. ÚS 1234/19`;
  NSS `rozsudek NSS ze dne <date>, čj. 2 As 123/2019-45`.
- **ECLI:** domestic `ECLI:CZ:NS:2019:23.CDO.1234.2019.1`; EU
  `ECLI:EU:C:2020:559`.
- **Point-in-time:** cite the e-Sbírka version in force at `EPOCH` (e-Sbírka
  version selector), not "as amended" alone, once a novela is in play.

## 3. Version in force

- Text in force at `EPOCH` from e-Sbírka (point-in-time); each act's
  **přechodná ustanovení** (final provisions) decide which rules apply to
  which facts.
- **Landmark cut-off 1 January 2014** (recodification): OZ (89/2012) and ZOK
  (90/2012) replaced občanský zákoník 40/1964 Sb. and obchodní zákoník 513/1991
  Sb. Contracts formed before it are governed by the old code.
- **Novely** are numbered in the Sbírka and dated; a č. XX/YYYY Sb. is the
  amendment, not the act.
- Gate Plan rule: pin `EPOCH`, then read every anchor on the list from the
  version in force at that date (§ `currency-watch`).

## 4. Mandatory vs default norms

- **General rule:** § 1(2) OZ — parties may derogate from the statute unless it
  is **kogentní** (mandatory); otherwise the statute is **dispozitivní**
  (default). Derogation is void where it conflicts with good morals
  (*dobré mravy*, § 588 OZ).
- **Frequently mandatory areas — the review checklist:**
  - **Consumer contracts** — §§ 1810–1867 OZ; a term departing from the act to
    the consumer's detriment is void (§ 1812(2) ⚠ verify numbering).
  - **Employment** — ZP is largely mandatory; derogation is allowed only where
    the act permits and never to the employee's detriment (§ 4a, § 4b ZP
    ⚠ verify split).
  - **Liability** — § 2898 OZ: an agreement waiving the right to damages in
    advance, or excluding liability, is void; liability for damage caused
    **intentionally or by gross negligence can never be excluded**.
  - **Contractual penalty** — § 2048–2051 OZ; a manifestly excessive penalty
    may be **reduced by the court** (§ 2051) — drafting cannot remove that.
  - **Late payment** — úrok z prodlení under § 1970 OZ and nařízení vlády
    č. 351/2013 Sb. (rates); the B2B statutory minimum cannot be contracted
    away (směrnice 2011/7/EU).
  - **Limitation agreements** — parties may agree a shorter or longer
    promlčecí lhůta within statutory bounds (§ 630 OZ ⚠ verify limits).
  - **Real estate transfers** — form and registration are controlled
    (see § 5); derogation impossible.
- **Drafting rule:** a cap, exclusion or penalty clause is checked against
  § 2898 and § 2051 first; a "market standard" never overrides them.

## 5. Formalities

- **Written form** where the act or the parties require it — § 559 OZ; a
  signature may be electronic (§ 561 OZ).
- **Electronic signatures:** nařízení (EU) č. 910/2014 (eIDAS); zákon
  č. 297/2016 Sb. A **qualified electronic signature** equals a handwritten
  signature (eIDAS art. 25(2)) — check which level a clause needs.
- **Notarial deed (*notářský zápis*):** required, e.g., for the founding legal
  act of an s.r.o. and for a transfer of a share (with notarial certification
  of signatures) under ZOK §§ 8, 209 ⚠ verify.
- **Real estate:** written contract + **vklad** (registration) into the
  katastr nemovitostí (zákon č. 256/2013 Sb.); ownership transfers on the
  vklad, not the signature.
- **Registr smluv:** zákon č. 340/2015 Sb. — obligated entities must publish
  contracts above the threshold; non-publication makes an *odporovatelná*
  contract ineffective against third parties until published (§§ 7–8
  ⚠ verify threshold and current §).
- **Official e-delivery:** zákon č. 300/2008 Sb. (datová schránka) — delivery
  fictions and 10-day rules ⚠ verify.
- **Cross-border:** translations and apostille (Haag Convention) or EU
  Regulation (EU) 2016/1191 for public documents.

## 6. Limitation and time bars

| Right | Period | Start | Effect | Anchor |
|---|---|---|---|---|
| Money claim / performance (general) | 3 years | when the right becomes due | promlčení: bars enforcement, right survives | § 629(1) OZ |
| Damage claim | 3 years; **longstop 10 years** from the harm (15 years if intentional) | awareness + longstop | promlčení | § 636 OZ ⚠ verify |
| Personal injury / death | 10 years from the harm (15 if intentional) | harm | promlčení | § 636 OZ ⚠ verify |
| Ownership (*vindikace*) | not subject to limitation | — | — | § 614 OZ ⚠ verify |
| Employment claims | statutory period from the act | when the right could first be exercised | promlčení | § 330 ZP ⚠ verify period |
| Contractual penalty | with the secured claim | — | promlčení | § 2048 OZ |
| Consumer warranty | 2 years from delivery (goods) | delivery | promlčení/statutory | § 2165, § 2113 OZ ⚠ verify |

- **Prekluze** (preclusion) is different: where an act sets a **propadná
  lhůta**, the right itself lapses and the court cannot revive it (§ 583 OZ).
- **Agreement on length:** § 630 OZ ⚠ verify when a shorter period may not go
  below one year.
- **Safe-date practice:** diarise at two thirds of the period; for damage
  claims, diarise the 10-year longstop separately from the 3-year period.

## 7. Computing time

- **Substantive:** §§ 605–608 OZ — a period set in days runs from the event;
  months and years are computed by calendar; if the last day falls on a
  *den pracovního klidu*, it moves to the next working day (§ 607 OZ).
- **Procedural:** § 57 OSŘ — periods run from **delivery**; a filing is timely
  if it reaches the court by the last day (or the next working day); filing by
  post/datová schránka follows § 57(2)–(3).
- **Holidays:** zákon č. 245/2000 Sb. (státní svátky a dny pracovního klidu).
- **Delivery fictions:** datová schránka — 10-day fiction and the "first
  login" rules (zákon č. 300/2008 Sb.) ⚠ verify current §.
- Never compute a procedural deadline without the delivery date from the file.

## 8. Civil procedure

- **Courts:** okresní soudy (general first instance); krajské soudy carry
  special competence (§ 9 OSŘ — commercial, insolvency, IP, some family);
  vrchní soudy (appeal); NS; NSS; ÚS.
- **Local jurisdiction:** general §§ 84–85 OSŘ; special §§ 87–89 OSŘ
  (employee, consumer, insurance may choose under § 87).
- **Claim:** § 79 OSŘ (essentials); precise relief wording matters (petit).
- **Interim measures:** § 74 OSŘ (preliminary injunction), § 102 OSŘ.
- **Payment order:** § 172 OSŘ (15-day *odpor*); electronic payment order
  route ⚠ verify availability/limits.
- **Default / acknowledgment judgments:** § 153a, § 153b OSŘ.
- **Appeal (*odvolání*):** §§ 201–212 OSŘ — **15 days** from delivery.
  **Dovolání:** §§ 236–243d OSŘ — **2 months**. **Obnova řízení** § 228 OSŘ;
  **žaloba pro zmatečnost** § 229 OSŘ.
- **Enforcement:** soudní výkon (OSŘ) or exekuce by an *exekutor* (zákon
  č. 120/2001 Sb.); choice-of-executor rules.
- **Cross-border:** nařízení (EU) 1215/2012 (Brussels Ibis); Lugano Convention.
- **No US-style discovery:** see § 11 — document production is court-ordered.

## 9. Costs and fees

- **Court fees:** zákon č. 549/1991 Sb. — a motion fee scaled to the claim
  value (percentage bands, minimum and cap), plus fees for appeal and other
  submissions ⚠ verify current rates and cap.
- **Cost shifting:** § 142 OSŘ — the losing party pays; the court is bound by
  the rate of success (§ 142(2)–(3)); full relief only if the success rate
  exceeds the statutory threshold. § 150 OSŘ allows moderation for special
  reasons.
- **Lawyer's tariff:** vyhláška č. 177/1996 Sb. (advokátní tarif) — time-based
  (*mimosmluvní odměna*) according to tariff value, plus a lump-sum expense
  (§ 13) and VAT.
- Costs are stated at the checkpoint; a court-cost exposure is a RED-flag item
  in dispute strategy.

## 10. Arbitration and ADR

- **Arbitration:** zákon č. 216/1994 Sb. — arbitration agreement in writing
  (or by reference); arbitrable: property disputes. Consumer disputes carry
  special limits (§ 2, § 31 ⚠ verify current text).
- **Setting aside:** § 31 z. 216/1994 Sb. — short time limit (3 months
  ⚠ verify) and enumerated grounds.
- **Main institution:** Rozhodčí soud při Hospodářské komoře ČR a Agrární
  komoře ČR (Prague). Ad hoc arbitration only where fully specified.
- **Mediation:** zákon č. 202/2012 Sb.; the resulting agreement can be
  approved as a settlement.
- **Consumer ADR:** zákon č. 634/1992 Sb. (as amended) — sector ADR bodies.

## 11. Evidence and document production

- **Free evaluation of evidence:** § 132 OSŘ.
- **Burden of proof:** § 120 OSŘ — the party asserting a fact must prove it;
  § 120(4) court may set time limits.
- **Duty to produce documents (*edice*):** § 129 OSŘ — the court may order a
  party or a third party to produce a document; refusal is sanctioned.
- **Means of evidence:** documents (§ 129), witness (§ 126), expert (§ 127),
  inspection (§ 125), party examination (§ 131).
- **Electronic evidence:** e-mail, logs and backups are ordinary documents;
  authenticity and chain of custody are attacked, not assumed.
- **Privilege:** advokátní mlčenlivost § 21 z. č. 85/1996 Sb. (attorney-client);
  obchodní tajemství § 504 OZ; medical secrecy. There is **no US-style
  pre-trial discovery** — production is court-ordered and bounded.

## 12. Registers

- **Obchodní rejstřík** — justice.cz — proves the entity, its statutory body
  and registered scope; does NOT prove authority to bind, solvency, or that a
  filed fact is true (material publicity, § 29 ZOK ⚠ verify).
- **ARES** — ares.gov.cz — aggregate economic and registry data; a lead, not
  proof.
- **Živnostenský rejstřík** — rzp.cz — trade licences.
- **Katastr nemovitostí** — nahlizenidokn.cuzk.cz — ownership, mortgages
  (*zástavní právo*), easements; does NOT prove building consent or fitness.
- **Insolvenční rejstřík** — isir.justice.cz — open insolvency; does NOT prove
  the absence of hidden liabilities.
- **Registr smluv** — smlouvy.gov.cz — published contracts of obligated
  entities (z. 340/2015 Sb.).
- **Evidence skutečných majitelů** — esm.justice.cz — beneficial owners
  (z. 37/2021 Sb.).

## 13. Regulatory overlay

| Regime | Trigger (one line) | Anchor | Suite pack |
|---|---|---|---|
| GDPR | processing personal data in/into the EU | Reg (EU) 2016/679; z. 110/2019 Sb. | `gdpr` |
| NIS2 (CZ) | a regulated service / entity in scope | z. 264/2025 Sb.; vyhl. 408–412/2025 Sb. | `nis2-cz` |
| AI Act | an AI system placed on the EU market / used | Reg (EU) 2024/1689 | `ai-act` |
| AML (CZ) | an obliged person in a business relationship | z. 253/2008 Sb. | `aml-cz` |
| Whistleblowing | employer ≥ 50 employees / public body | z. 171/2023 Sb. | `whistleblowing-cz` |
| Registers of contracts | obligated public entity over the threshold | z. 340/2015 Sb. | — ⚠ |
| Consumer protection | B2C dealing | z. 634/1992 Sb.; OZ §§ 1810–1867 | — ⚠ |
| Public procurement | a public contract above the threshold | z. 134/2016 Sb. | — ⚠ |

## 14. Profession

- **Advokát / ČAK:** zákon č. 85/1996 Sb.; ČAK stavovské předpisy and the
  etický kodex; the advocate is an independent controller for client-matter
  data (EDPB Guidelines 07/2020).
- **Confidentiality:** advokátní mlčenlivost § 21 z. 85/1996 Sb. — survives the
  engagement; disclosure needs the client's informed consent or a statutory
  duty; conflicts of interest are barred (§ 9 ⚠ verify §).
- **AML duties of an advocate:** z. 253/2008 Sb. — obliged person for listed
  acts; CDD and 10-year retention.
- **Mandatory representation:** dovolání § 241 OSŘ; ÚS § 30 z. 182/1993 Sb.;
  criminal defence.
- **AI:** the ČAK guidance on AI (2026) expects a lawyer to assess the tools
  used; EU AI Act art. 4 (AI literacy) applies to staff use. Record the tool
  and version in the matter file ⚠ verify wording of the ČAK opinion.

## 15. Terminology and false cognates

| Local term | Nearest English | Why they are not the same | Drafting note |
|---|---|---|---|
| smluvní pokuta | contractual penalty / liquidated damages | independent of proof of loss, and a court may reduce a manifestly excessive one (§§ 2048–2051 OZ) | do not equate with a common-law LD clause; state credit-against-damages |
| úrok z prodlení | default interest | separate from the penalty; the rate flows from nař. vl. 351/2013 Sb. | may run alongside smluvní pokuta; check the cap |
| promlčení | limitation | bars enforcement only; the right survives and must be raised as a defence (§§ 609, 629 OZ) | cannot be waived in advance beyond § 630 limits |
| prekluze | preclusion / forfeiture | the right itself lapses with the *propadná lhůta* (§ 583 OZ) | keep promlčení and prekluze apart in the memo |
| závazek | obligation | also the whole obligational relation; *dluh* = the duty, *pohledávka* = the receivable | translate by function, not word |
| náhrada újmy / škody | damages | *újma* = any harm incl. non-material; *škoda* = material loss (§ 2894 OZ) | the capsule clause must use the right noun |
| dobré mravy | good morals | voiding standard under §§ 1(2), 588 OZ | a "market standard" never cures a conflict |
| obchodní tajemství | trade secret | § 504 OZ definition; also criminal (z. 40/2009 Sb.) | align NDA definitions with § 504 |
| smlouva o dílo | contract for work | result-oriented, not a services contract (§ 2586 OZ) | fix the acceptance test, or it fails as a dílo |
| jednatel | managing director | statutory body of an s.r.o., not an employee | do not import employment-law assumptions |
| obchodní zástupce | commercial agent | specific rights/duties (zastoupení, § 2483 OZ ⚠ verify) | distinguish from a distributor |

## 16. Expected clauses by contract type

- **Koupě nemovitosti:** exact cadastral identification, vklad clause, taxes
  and fees, easements/mortgages disclosed, energy certificate; ownership
  passes on vklad (§ 5).
- **Nájem prostor sloužících podnikání:** term and notice, rent indexation,
  *smluvní pokuta*, hand-over condition ⚠ verify § 2302 ff. OZ.
- **Smlouva o dílo (IT):** dílo definition, price and milestones, acceptance
  test, defects and warranty, IP vesting, penalties (§§ 2586 ff. OZ).
- **Pracovní smlouva:** § 33 ZP (druh práce, místo, den nástupu); DPP/DPČ
  §§ 74–77 ZP; non-compete § 310 ZP.
- **Smlouva o výkonu funkce:** § 59 ZOK; remuneration and *příplatek*.
- **Smlouva o obchodním zastoupení:** § 2483 ff. OZ.
- **NDA / předsmluvní:** § 504 OZ (trade secret), § 1730 OZ (pre-contractual
  liability on failed negotiations).
- **Zpracovatelská smlouva (DPA):** GDPR art. 28(3) mandatory content; see
  the `gdpr` pack § 7.
- **Spotřebitelská smlouva:** §§ 1811 ff. OZ; mandatory-void rules (§ 4 above).
