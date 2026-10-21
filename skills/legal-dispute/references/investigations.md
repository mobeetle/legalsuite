# Internal investigations

An investigation runs on the same fact map as a dispute, but its object is an
**allegation** (misconduct, fraud, harassment, a compliance breach), and the
client is usually the organisation. Its outputs may end up before a court, a
regulator, the police or the press. Design every step so that it would
survive that.

## Lifecycle

1. **Open** (`investigation.md`): the allegation as received (source anonymised
   where it came through a whistleblowing channel), who commissioned the
   investigation and on whose behalf, scope (questions to answer), exclusions,
   and the reporting line. Run a conflict check on the investigators.
   **Independence**: nobody implicated, or reporting to someone implicated,
   steers it.
2. **Immediate measures.** A legal hold on relevant data and devices;
   **a custody log** for everything collected (item, collector, date and time,
   hash, storage location, transfer, access) — authenticity is attacked, not
   assumed; preservation of logs; interim measures for people (separation, leave) taken
   by the employer through HR, never by the suite. Check reporting duties
   with deadlines (regulators, insurers, auditors, criminal-law duties to
   report or prevent certain crimes per the jurisdiction pack, and the incident
   clocks of any regime the packs list). They go to `deadlines.md`.
3. **Plan.** Issues as Issues rows (allegation → elements of the breach),
   evidence sources, interview list and order (witnesses before the subject),
   document review per `document-review.md`.
4. **Interviews.** One record per interview, with the date, the attendees, the
   information given to the interviewee (purpose, that the lawyer acts for
   the organisation and not for them, confidentiality, data protection notice,
   right to be accompanied where it exists, no retaliation), and their account
   **in their words**, reviewed by them where practicable. The subject is told
   the substance of the allegation and given a real chance to respond.
5. **Findings.** Per allegation element: the facts found, the evidence, the
   standard applied (stated explicitly, e.g. "more likely than not"),
   contrary evidence, and the conclusion: `substantiated | not substantiated |
   inconclusive`. An allegation with no corroboration stays `alleged` — never
   `substantiated`, never written as a fact of the matter. A finding about a
   person is never stronger than the evidence for it.
6. **Report.** For the commissioning body: findings, root causes, remediation,
   and disclosure or reporting recommendations. Mark the privilege status and
   the distribution list. Run it through the challenge capability (`../legal/references/capabilities/challenge.md`) (lenses: regulator,
   opposing counsel acting for the subject) before it's final.
7. **Close.** Remediation owners and dates; feedback to the whistleblower
   within the statutory deadline where the channel requires it (applicable whistleblowing regime pack, e.g. `whistleblowing-cz` §5); retention of the file per policy and law.

## Safeguards

- **Whistleblower protection.** The reporter's identity is protected; no step
  may be retaliatory or reveal them (applicable whistleblowing regime pack, e.g. `whistleblowing-cz`).
- **Data protection.** A legal basis for processing, proportionality of
  monitoring and data collection, information to data subjects when the
  investigation allows it (the data-protection regime pack).
- **Individual rights.** Mandatory rules on monitoring, searches,
  disciplinary steps and deadlines for dismissal after learning of a reason
  (pack §6 (Limitation & time bars)). Missing them can void the outcome.
- **Privilege.** Keep the legal advice and the fact-finding records with the
  lawyer; know what privilege covers in the jurisdiction and what it doesn't
  (pack §11 (Evidence, burden of proof & privilege), pack §14 (Professional ethics, conflicts & AML)).
- **No conclusions in passing.** Interim notes say what was found, not what it
  means.
