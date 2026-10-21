# Expected-clause baselines (clause families)

The generic floor: what a competent reviewer expects to find, expressed as
**clause families**, not document types. A document type is a combination of
these families; the jurisdiction pack and a bound playbook supply the
type-specific and market-specific list. Use this file after the playbook's
`must`/`should` rows and the pack's expected-clause section.

A missing family is not automatically a defect: the law may supply a default,
or the arrangement may not need it. Say which applies, and cite the rule.

## Every document

Identity and authority of each party (name, seat, registration number,
representative, evidence of authority) · subject matter and purpose · price or
consideration and payment mechanics · term, termination and its consequences ·
liability and its limits · governing law · forum (courts or arbitration) ·
notices (addresses, e-mail, service address) · assignment and change of
control · confidentiality (if needed) · entire agreement and amendment form ·
severability · language and prevailing version · signatures, date, place ·
schedules referenced and attached.

## Clause families

| Family | What must be present and checkable |
|---|---|
| **Obligation** | the act required, by whom, when, to what standard; the consequence of failure |
| **Condition** | the trigger, who decides it, what evidence satisfies it, and what happens if it fails |
| **Risk allocation** | what is excluded, capped, indemnified, insured, secured or escrowed — and what is not |
| **Money** | amount, currency, calculation, indexation, invoice, payment period, interest, set-off |
| **Term and exit** | duration, renewal or opt-out window, termination grounds, notice, post-termination survival |
| **Confidentiality** | definition, exceptions, purpose limitation, recipients, compelled disclosure, term, return or destruction |
| **Data and security** | roles, instructions, security baseline, incident notice, sub-processing, transfer, deletion |
| **Intellectual property** | what is licensed or assigned, scope and territory, background and results, warranties of title |
| **Control and transfer** | assignment, change of control, pre-emption, lock-up, tag or drag, deadlock, exit |
| **Public law overlay** | the regimes that touch the dealing, each with the test that decides whether it applies |
| **Dispute** | escalation before proceedings, forum, language, interim relief, costs, applicable law |
| **Formalities** | writing, signature, notarisation, registration, filing, powers of attorney, translation |
| **Compliance and sanctions** | representations, screening, export control, reporting duties, termination triggers |
| **Boilerplate** | entire agreement, amendment, waiver, severability, counterparts, notices, order of precedence |

## Banded use

Each family carries a band — a must/should/optional requirement with a
preferred / fallback / walk-away shape — that a **bound playbook** fills with
real positions. With no playbook bound (`PLAYBOOK = none`), `GREEN`/`YELLOW`/
`RED` policy deviation ratings are never emitted (`Deviation: UNCOVERED` per
`../../capabilities/positions.md`, "no positions, no ratings"), while
`Severity: [CRITICAL|HIGH|MEDIUM|LOW]` (exposure for our side, calibrated to
value, term, strategic criticality and `POSTURE`) and actionable
`[baseline proposal]` redline fixes are still provided.

Market values, named instruments and jurisdictional specifics belong in a
playbook or a pack — never in this file.
