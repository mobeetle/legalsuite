---
code: <short-code, lowercase, e.g. consumer-cz>   # file name = <code>.md; obligation IDs use the upper-case code
name: <full name of the regime>
instruments: <EU instrument(s); CZ: implementing act(s) with č./rok Sb.>
regulator: <competent authority (abbreviation)>
reviewed_at: <YYYY-MM-DD — date every item below was last checked against an official source>
review_by: <YYYY-MM-DD — reviewed_at + 3 months for fast-moving regimes, + 6 months otherwise>
status: <current | partially verified>   # "current" only if every material item was verified at reviewed_at
---
# <NAME> — regime pack

How to use: this pack is a seed obligation register, not the law itself. Use §2
to decide applicability and §3 to fix the client's role, then build the
obligation register from §4. Every obligation used in a deliverable is resolved
to the current text (version in force on the EPOCH date) in the citation
ledger; never cite this pack as authority. ⚠ marks items not verified against an
official source at `reviewed_at`. If today is past `review_by`, warn the user
that the pack may be stale before relying on it.

<!-- Authoring rules: keep the eight headings below verbatim and in this order —
skills address them by number. Anchor every obligation to an article/§. Prefer
official sources (eur-lex.europa.eu, e-sbirka.cz, the regulator's site). Say
explicitly what is ADOPTED vs only PROPOSED at reviewed_at. Mark anything not
verified with `⚠ verify` inline. Target 120–220 lines. -->

## 1. Instruments and status
<!-- Each instrument with number, date of entry into force / application,
national implementing acts and decrees, guidance with legal weight, and pending
amendments. Separate ADOPTED from PROPOSED; give procedure numbers for proposals. -->

## 2. Scope tests
<!-- Ordered yes/no questions; stop at the first "no" that excludes. Material
scope → personal/entity scope (type, size, sector thresholds) → territorial
scope → exemptions. Each test cites its article/§. -->

1. <test> (art./§ …) — yes → continue; no → out of scope.

## 3. Roles
<!-- The role taxonomy that changes obligations, with a one-line test each and
the article/§ defining it. Note role switches (when an actor becomes another). -->

- **<role>** (art./§ …) — <one-line test>.

## 4. Obligation register (seed)
<!-- 15–35 rows: what a gap analysis actually checks. IDs = upper-case code + two
digits (e.g. CONSUMER-CZ-01). "Evidence of compliance" = the document/record an
auditor asks for. "Typical gap" = what is commonly missing in Czech practice. -->

| ID | Article | Obligation | Applies to (role/condition) | Evidence of compliance | Typical gap |
|---|---|---|---|---|---|
| <CODE>-01 | <art./§> | <obligation> | <role/condition> | <document/record> | <gap> |

## 5. Deadlines and notifications
<!-- Clocks (incident/breach, registration, response to data subjects or
authorities), periodic duties (annual reports, reviews, testing). Each: trigger →
deadline → who is notified → channel → article/§. -->

## 6. Enforcement and sanctions
<!-- Regulator(s) and their powers; fine maxima (fixed amount and % of turnover,
which is higher/lower); personal liability of management; criminal overlap;
enforcement practice notes (priorities, notable decisions, typical fines). -->

## 7. Contract touchpoints
<!-- Clauses the regime requires or shapes (mandatory content lists, flow-down,
audit, notification, termination, exit), so contract review can check them. -->

## 8. Interaction with other regimes
<!-- Overlaps, lex specialis/precedence, double reporting, shared evidence
(one control satisfying several regimes). Name the other pack codes. -->
