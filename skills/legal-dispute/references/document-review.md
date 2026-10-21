# Document review

For any set of documents that has to be reviewed for relevance and
privilege before it's produced or relied on: an internal investigation,
arbitration document production (e.g. under the IBA Rules), a court order to
produce a document, a regulator's request, or foreign proceedings with
disclosure. In many civil-law jurisdictions document production is court-ordered and narrow (pack §11 (Evidence & document production)), whereas common-law litigation, international arbitration (e.g. IBA Rules), and investigations require broad discovery/review.

## 1. Protocol (before any coding)

`review-protocol.md`, approved at a checkpoint:
- the request or purpose, quoted exactly; date range; custodians; sources
  (mailboxes, shared drives, chat, paper);
- **responsiveness criteria** per request item, with examples of in and out;
- **privilege grounds** the jurisdiction recognises (pack §11 (Evidence, burden of proof & privilege), pack §14 (Professional ethics, conflicts & AML)): attorney
  confidentiality, work product where it exists, without-prejudice or
  settlement communications, trade secrets and confidentiality restrictions,
  personal data constraints;
- escalation: what a reviewer can't decide alone (borderline privilege, third-
  party confidentiality, documents that hurt us);
- data handling: where documents may be processed (profile *Tools*), and which
  subagents may see which batches.

## 2. Coding

Fan out read-only by batch, using one protocol for all reviewers. Each
document gets:

```
| Doc ID | Date | Author → recipients | Type | Responsive (Y/N/partial) to request # | Privilege (none / full / partial-redact) + ground | Key (hot / relevant / neutral) | Reason (one line, specific) | Reviewer |
```

- A reason for **every** call, specific enough that a second reviewer can
  check it. "Privileged" without the ground and the lawyer involved isn't a reason.
- Hot documents (that decide or hurt the case) go straight to the fact map as
  evidence rows (`X`) and into the chronology.
- Quality control: the parent re-checks a sample of each batch (all privilege
  calls and all hot documents, plus at least 10 % of the rest) and every
  borderline call.

## 3. Privilege log (`privilege-log.md`)

```
| Log # | Doc ID | Date | Author | Recipients | Type | Subject matter (without revealing privileged content) | Ground | Withheld / redacted | Confirmed by / on |
```

The description must let the other side and the tribunal assess the claim
without revealing the content. Check it with `scan.py outbound` and a read for
leakage before it goes out.

## 4. Production set

- Responsive and not privileged (or redacted) documents, numbered consistently.
- Redactions burned in, not hidden. Run `scan.py outbound` on the converted
  files: no comments, tracked changes or metadata.
- A production letter listing what is produced, withheld and why. Sent by the
  lawyer.
- `versions.md` records exactly what was produced, when and to whom.
- **Reconcile before the letter**: received = coded + not reviewed; produced +
  withheld = coded responsive. State both totals; a gap is a finding, not a
  rounding difference.
- **"No responsive documents" is a search result.** Name the sources,
  custodians, date range, search terms and hit counts, and the date of the
  search. Without that record the answer is `not searched`, never `none`.
- **Privilege entries are proposals until signed**: `Confirmed by / on` stays
  empty until a lawyer confirms the call (above).

## Guardrails

- Never destroy, alter or "clean" documents subject to preservation. A legal
  hold overrides retention policies.
- Documents that hurt us are coded as honestly as the rest, and escalated.
- Privilege calls are proposals until a lawyer confirms them.
