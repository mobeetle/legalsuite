---
name: legal-dispute
description: "Disputes, litigation and arbitration for any legal system, claimant or defendant side: pre-action demands, claims received, court and arbitral proceedings, appeals, and internal investigations. Builds the sourced chronology and the claims-and-defences matrix (elements, burden, standard, facts, evidence, status), maps the procedure with every deadline and preclusion point, assesses merits, quantum and costs with likelihood bands, sets strategy (litigate, settle, ADR, wait), plans submissions, prepares hearings and witnesses, and runs document review with privilege logs. Use for a dispute, lawsuit, claim, defence, demand letter, payment order, appeal, arbitration, settlement, evidence, witness, hearing or investigation (CS: spor, žaloba, předžalobní výzva, vyjádření k žalobě, platební rozkaz, odpor, odvolání, dovolání, rozhodčí řízení, důkazy, svědek, jednání, smír, narovnání, interní šetření). Load alongside the legal engine."
license: Apache-2.0
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, positions, configure, challenge, verify, context
  delta: dispute
  version: 1.0
  last_validated: 2026-10-16
  category: door
---

# legal-dispute

**Object of work.** A claim, defence, pre-action demand, proceeding or internal investigation.
> **Imports.** Obey the capability files named in the front-matter `imports:`; do not restate them. This file carries only the mode's delta.

The Disputes hat. Litigation differs from transactional work in exactly the
ways a document map doesn't capture: an adversary acting in real time, hard
deadlines and preclusion, burden and standard of proof, evidence rules, costs
risk, and strategy that turns on facts more than on drafting. This skill runs
on the **fact map** (`../legal/references/fact-map.md`).

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. Procedure,
deadlines, costs and evidence rules come from the jurisdiction pack: pack §6 (Limitation & time bars), pack §7 (Computing time & delivery rules), pack §8 (Civil procedure & relief requirements), pack §9 (Costs & fees), and pack §11 (Evidence, burden of proof & privilege).

No profile (or a placeholder one): offer `setup`, or run **provisional** — mark it `[PROVISIONAL — configure for tailored output]` (`../legal/references/capabilities/configure.md`).

## Guardrails specific to disputes

- **Deadlines first, always.** Every procedural deadline is computed
  conservatively and shown with its rule, trigger and basis, never as a bare
  date. A received document starts a clock: find it before anything else.
- **Nothing is filed, sent or served** by the suite. Each one is an approval.
- **Burden and proof are surfaced, not decided.** Whether evidence meets the
  standard is the lawyer's judgment. Mark elements `disputed` or `missing`
  instead of `proven` on thin evidence.
- **Witness statements in the witness's own words.** Outlines and questions
  only. Never script testimony or "improve" a recollection.
- **Authenticity.** Flag evidence whose authenticity is open (unsigned copies,
  screenshots, audio/video that could be manipulated, altered metadata).
- **Settlement communications** follow the jurisdiction's rules (pack §8 (Civil procedure & relief requirements), pack §11 (Evidence, burden of proof & privilege)).
  Mark them, keep them out of submissions unless the rules allow, and don't
  assume foreign doctrines (e.g. US FRE 408) apply.

## AST obligation — non-negotiable

Deadlines & Case Intake (Phase 1) and Chronology (`chronology.md`, Phase 2)
feed the Claims & Defences Matrix (`claims-matrix.md`, Phase 3) and the
Dispute AST. Once the chronology and claims are framed, destructure the case
into the AST: `Party`/`Event`/`Object` are the facts, `Norm` the legal basis,
`Control Flow` the elements of each claim, and a `Trace` per defence or
counterclaim (theirs and ours). Print the **full** tree in one fenced `text`
box; every claim, defence and assessment cites its node. `Edges` carry the
evidence and burden links.

Grammar and structure: `../legal/references/ir-and-provenance.md`.

**Urgency.** Deadlines first, always — a missed preclusion is the whole case.
Every element shows its burden and its evidence; mark `disputed`/`missing`, not
`proven`, on thin proof. Never cite authority you did not retrieve.

**Consent.** Ask, never infer a load-bearing gap; a write outside the matter folder needs an approved manifest (`gate.md`).

## Phases (cluster via the Gate Plan; enter at any phase)

1. **Deadlines & case intake.** From `legal-intake`
   (qualify gate, then its capture, parties and
   urgency steps) or run now. Side (claimant / defendant / both). Forum options: court or
   arbitration (clause?), international jurisdiction and venue (pack §8 (Civil procedure & relief requirements); EU
   pack for cross-border), applicable law (the pack's private-international-law rules), and
   enforceability of a win where the assets are. **Time bars** (pack §6 (Limitation & time bars)) for every
   claim, our own and the other side's possible counterclaims.
2. **Chronology** (`chronology.md`, a view of `facts.md`). Events with date
   precision, source, who asserts them, contested or not. After the table:
   **inconsistencies** (sources that disagree), **gaps** (periods or events
   with no document), **missing documents**, and **critical documents** (the
   5–10 that decide the case).
3. **Claims and defences matrix & Dispute AST** (`claims-matrix.md`, a view of the Issues
   table). Fed by the Phase 1 intake and Phase 2 chronology: for each claim and
   each defence (ours and theirs), map the legal basis `[AUTH:A…]`, its elements,
   the burden for each element (who must assert and prove it, pack §11 (Evidence, burden of proof & privilege)), the standard,
   the facts per element, the evidence per fact, the status, and the Dispute AST.
   This is the core artifact. Every later phase reads it.
4. **Procedural map** (`procedural-map.md`). Forum and stage; every deadline,
   with its computation rule and basis (pack §7 (Computing time & delivery rules), to `deadlines.md`); preclusion points
   (the last moment to plead facts and offer evidence, limits on new facts in
   appeal, pack §8 (Civil procedure & relief requirements)); fees and costs regime (pack §9 (Costs & fees)); interim measures available and their
   conditions; the path to enforcement.
5. **Merits, quantum and risk** (`case-assessment.md`). Per claim: likelihood band and
   its drivers, amount range (best/likely/worst), costs exposure (own,
   adverse, court fees per pack §9 (Costs & fees)), duration, and enforceability. Include a
   structured **Quantum, Interest & Costs Exposure schedule**:

   ```
   | Head of claim | Principal | Interest / penalty rate & trigger | Accrued to date | Court / arbitral fees | Adverse costs exposure | Net expected value (likelihood × quantum − costs) |
   ```

   Then run the challenge capability (`../legal/references/capabilities/challenge.md`) with the *judge* and *opposing counsel* lenses. Its
   verdicts go into the assessment (`challenge.md`, alias `oponentura.md`), and are not summarised away.
6. **Strategy.** Options: litigate, settle, ADR (mediation, arbitration if
   available), do nothing or wait. For each: BATNA, costs, time, risk,
   reputational and relationship effects. Then a **decision tree** with the
   2–3 decisive uncertainties, and a **settlement range** (walk-away and target)
   for the lawyer to set. Then the **first moves**: e.g. a pre-action demand
   (pack §8 (Civil procedure & relief requirements): required content and waiting period for costs), preservation,
   interim relief, or a set-off declaration. Decisions go to `decisions.md`.
7. **Submissions.** Claim, defence, reply, appeal, extraordinary remedies,
   arbitration request, demand letter, settlement agreement: drafted by the
   draft mode (`../legal-review/references/modes/draft.md`, contentious
   architecture) against this door's plan:
   - the required particulars and the exact relief sought (exact prayer for relief / order sought, e.g. *petit*) per pack §8 (Civil procedure & relief requirements),
     worded so it's enforceable if granted;
   - every factual statement mapped to a fact row and its evidence designation;
   - every argument mapped to a matrix element;
   - the other side's arguments answered element by element.
   Then `trace.py` on the annotated version, the verify capability (`../legal/references/capabilities/verify.md`) before filing,
   and `scan.py outbound` on the clean version.
8. **Hearing and witnesses.** `references/hearing-prep.md`: hearing plan,
   witness outlines tied to the theory, exhibit list, anticipated objections,
   cross-examination points from the inconsistencies.
9. **Document review** (investigations, arbitration document production, a
   court order to produce, foreign proceedings): `references/document-review.md`
   covers responsiveness and privilege coding, the privilege log, and the
   production set.

## Received claim or demand (defence side)

Start here when something arrived: a demand letter, a claim, a payment order, an
arbitration request, a decision.
1. Identify the document, how and when it was delivered (statutory e-delivery / service fictions (e.g. registered post, court portal, data box), pack §7 (Computing time & delivery rules)), and **the deadline it triggers** with its rule. That
   becomes the first line of the first card.
2. What exactly is claimed, on what basis, with what evidence. Check it
   against the time bars (pack §6 (Limitation & time bars): is the claim already time-barred, and must that be
   raised as an objection?).
3. The immediate options and their deadlines: respond, contest (e.g.
   opposition to a payment order), pay or settle, counterclaim or set-off.
4. Then continue with phases 2–6.

## Internal investigations

Same fact map, a different object: allegations instead of claims. Lifecycle and
safeguards (scope, independence, interviews, employee rights, whistleblower
protection, data protection, privilege, reporting duties):
`references/investigations.md`.

## Outputs

`chronology.md` · `claims-matrix.md` · `procedural-map.md` ·
`case-assessment.md` (with `challenge.md`, alias `oponentura.md`) · `strategy.md` · submissions in
`drafts/` · `exhibits.md` · `privilege-log.md` (if document review) · and
`deadlines.md` and `decisions.md` kept current throughout.

## Checks

- **trace** on every submission, assessment and chronology: facts resolve and
  have evidence; contested facts are visible.
- **grounding** on every authority, ours and the other side's.
- Deadlines: each has a rule, a trigger, a basis and an owner.
- the verify capability (`../legal/references/capabilities/verify.md`) before anything is filed or sent; the challenge capability (`../legal/references/capabilities/challenge.md`) on every
  case assessment.

## Fan-out

Fan out the fact work: one read-only packet per claim or element, and per witness. Authority retrieval runs in its own wave. The parent owns the claims matrix, the strategy and every submission. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Predict the outcome as a certainty: it gives a likelihood band with its drivers, never a guarantee.
- File, send or decide to litigate or settle — those are the client's approvals.
- Build the case before the procedure: the procedural map and deadlines come first.

## Counter-example (illustration)

*Illustration, not law.* Told "we'll win", the memo adopts that framing. **Mistake to catch:** a confident verdict replaced the claims-and-defences matrix and the burden of proof. Correct: state the elements, who must prove each, the evidence, and a likelihood band — not an assurance.
