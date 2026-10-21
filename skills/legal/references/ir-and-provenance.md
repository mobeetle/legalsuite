# Document map and provenance

The document layer of the shared intermediate representation: what a text says.
What *happened* (facts, events, evidence, burden) lives in the fact map:
`fact-map.md`. Both are comprehension aids, not restatements.

**This file is the single canonical definition of the AST** — the grammar and the
structural mandate below. The engine and every mode point here; nothing copies
the grammar. The Unicode notation is for reasoning; what is printed on screen is
ASCII (`display.md`).

## Notation (universal AST — every mode builds one)

Every substantive run destructures the problem into this tree **before**
findings, risks, or prose. The full tree is persisted in the working file
(`review-<doc>.md` or `map.md`) and a compact ASCII box (≤25 lines) is printed on
screen (see `display.md`), with every Phase 3/4 item citing the node or edge it
came from.

```
[Matter: <slug>]
├─ Symbols                     — the nouns, grounded (§ref or source)
│   ├─ Party: <alias> — <role> (§ref) [tag]
│   ├─ Object: "<term/asset>" := <meaning> (§ref) [tag]
│   ├─ Event: <act or event> — <date/period, amount, place> [tag]
│   └─ Norm: "<anchor>" — <statute/contract/pack §> [tag]
├─ Functions                   — the verbs: obligations, rights, powers
│   └─ <Actor>.<verb>(<object>) [condition] → <effect> (§ref) [tag]
├─ Control Flow                — affirmative causal chains
│   └─ IF <predicate> [AND <fact>] [UNLESS <exception>]
│        → <consequence(actor, action)> (§ref) [tag]
├─ Rejection Traces            — negative boundaries: failed defenses,
│   │  rejected readings, discarded alternatives, counterparty asks.
│   │  Every contested matter has ≥1 Trace; a tree with none on a
│   │  contested matter is incomplete — say so.
│   └─ Trace[<ID>]: <Actor>.<asserts|proposes>(<claim>)
│        ├── COLLIDES_WITH: <Norm / fact predicate>
│        ├── REFUTED_BY: <ground: text, authority, risk>
│        └── ESTABLISHES_BOUNDARY: NOT(<asserted rule/exemption>)
└─ Edges                       — coupling, conflicts, resolution
    ├─ <Symbol_A> ⇄ <Symbol_B> — <dependency/duplication> [tag]
    ├─ Trace[<ID>] ──(inhibits/demarcates)──> <Control_Flow/Function>
    └─ <Norm_A> ──(displaces/interprets/limits)──> <Norm_B>
```

## Structural mandate (non-negotiable)

1. **Build it** before analysis — it is how the analysis is done, not decoration. Write the full AST to the working file (`review-<doc>.md` or `map.md`).
2. **Print it** every substantive turn that analyzes clause or claim coupling: a **compact ASCII Map / Trace & Coupling box** (≤25 lines: key parties/obligations, active `Trace[Tn]` collisions, and `§X <-> §Y` couplings; collapse standard clauses per LOD 2) in one fenced `text` box. Modes that do not analyze clause/claim coupling (`handoff`, `debrief`, `explain`, and non-document `intake`) skip the on-screen box.
3. **Ground it**: no finding, risk, pro or con without a node/edge reference
   (`Trace[T2]`, `§X ⇄ §Y`).
4. **Gate it**: a contested matter with zero `Trace`, or a finding citing no
   node, **fails** — the turn does not close until it is fixed.

The consent and clarification gates that apply here are in
`capabilities/gate.md`.

## Multiple documents are ONE logical unit

Base agreement, every amendment, annex, schedule, side letter and
incorporation-by-reference form **one operative text**. Read them **both ways** —
individually and together. Never comment on the assembled document as if a
document you were handed did not exist.

- **Assemble first.** Build the **consolidated current text**: start from the
  base, apply each amendment in its effectiveness order, fold in schedules and
  annexes. State it in one line: `<base> + <A1> (<date>) + <A2> (<date>) → v<n>`.
- **The assembled text governs.** A provision is "missing" only if absent from
  the **consolidated** text — not from the single file in front of you. A base
  clause no amendment touches **still stands**. (A VAT clause in the base
  agreement is in force until an amendment removes it; never call it missing.)
- **Map the chain as edges**: `A1 ──(amends)──> §X`, `A2 ──(repeals)──> §Y`,
  `⇄` where an amendment contradicts the base or an earlier amendment. An
  unresolved conflict between amendments is itself a finding.
- **Prove absence before any "gap" finding.** Search the whole assembled
  corpus, say where you looked, or do not assert it.
- **Then read each document individually** too: its own definitions,
  formalities, notices, effective date.
- A document you were given but did **not** consider is a defect no less severe
  than an invented fact.

Text governs the parties' terms; statute sets their validity limits. Where map
and text disagree, the text wins, and the disagreement is itself a finding.
Never add a node the document, the facts or the law don't support.

## Graph construction invariants

1. FULL COVERAGE: every decisive fact → an `Event`/`Object` node with its
   identifiers inline; every sub-rule → a `Function`/`Control Flow` node;
   every rejected or discarded position → a `Trace[ID]` with a unique ID.
2. BOUNDARY COUPLING: every `Trace[ID]` connects to the `Function`/`Control
   Flow` node it bounds via an `inhibits`/`demarcates` edge.
3. RIGID GROUNDING: never invent a symbol, defense, rationale, or boundary
   not in the document, stated facts, or applicable law.
4. SINGLE RESPONSIBILITY: one Trace per distinct contention; one Function
   per obligation/right/power.
5. NO NARRATION IN DOCTRINE NODES: `Symbols`/`Functions`/`Control Flow`
   name actors, objects, norms, rules — never a court instance or a
   procedural anecdote. Instances appear only inside a Trace's `REFUTED_BY`.

## From tree to risks, pros, cons

The tree is the findings engine, not decoration:

- Each `Trace[ID]` becomes ≥1 risk or con (what fails, what it costs, its
  likelihood driver). Each surviving `Control Flow` chain becomes the
  recommendation or pro it supports.
- REVIEW/DRAFT deltas: `Trace` = rejected reading or counterparty ask;
  `ESTABLISHES_BOUNDARY` = the redline rationale.
- BRAINSTORMING/NEGOTIATE: `Trace` = discarded alternative or their demand;
  `REFUTED_BY` carries the trade-off (cost, time, enforceability).
- Every finding cites its node/edge (`see §X ⇄ §Y`, `Trace[T2]`).

A deontic typing layer is available as **optional depth** (below). Engage it only
when a matter needs deontic precision.

## Deontic depth (optional)

Not required for a plain clause review. Add it when the matter turns on
lifecycle, conditional powers, options, or survival:

```
├─ States & Transitions        — contract lifecycle automata
│   └─ [Formation] ──(trigger)──► [Active] ──(breach/cure)──► [Terminated]
├─ Deontic Relations           — Hohfeldian normative positions (§ref)
│   ├─ Duty(actor, target, action)     — strict obligation (shall / must)
│   ├─ Claim(holder, obligor, action)  — correlative right to performance
│   ├─ Power(actor, target, shift)     — discretion to alter relations (option, termination)
│   └─ Immunity(target, actor, shift)  — protection from alteration (caps, non-waivable rights)
├─ Control Flow standards      — the standard attached to a trigger
│   └─ if <event> [standard: sole discretion | reasonable | objective] → <consequence>
├─ Definitions                 — usage tracking
│   └─ "<Term>" := <meaning> (§ref) [Used in: §A, §B | Orphaned: Y/N]
├─ Cross-refs                  — coupling typing
│   └─ §X ⇄ §Y — [coupling: substantive | procedural | conflict]
└─ Post-Termination Survival   — clauses surviving lifecycle end
    └─ §Survival ──enforces──► Duty: Confidentiality (§X), Power: Dispute Resolution (§Z)
```

## Scale it by mode

- **review / negotiate** — extracted from the **consolidated** document set; feeds findings and the change set.
- **draft** — the intended structure, produced before the outline.
- **diligence** — one light map per material contract; the grid columns are its questions; the amendment chain is the `Edges`.
- **dispute** — the contract or decision in issue, mapped deeply where the claims rest on it.
- **matter / brainstorm** — parties, interests, constraints as decision nodes.
- **comply** — `Norm` = regime obligation, `Trace` = non-compliance gap.
- **redteam / verify** — the subgraph the position rests on (now phases of `legal-review`).
- **Intake / handoff / debrief** — build it when the object is a document or a decision; otherwise state why not.

## Level of Detail (LOD) — Token defense

Never construct symbolic trees for a document indiscriminately. Scale granularity
by substantive exposure:

- **LOD 1 (Deep mapping):** Operative covenants, indemnities, liability caps,
  IP grants/assignments, restrictive covenants, termination triggers, and
  contested clauses. Extract full Symbols, Functions, Control Flow, and Edges.
- **LOD 2 (Summary node):** Standard administrative boilerplate (notices,
  counterparts, severability, entire agreement). Collapse into a single summary node:
  `§14–18 — Standard boilerplate; no anomalous liabilities or governing law conflicts [DOC]`
- **Rule:** Do not expand boilerplate into symbolic notation unless an explicit
  defect, one-sided deviation, or statutory conflict is detected.

## Fidelity rules

- **Text governs party terms; statute envelopes legality and omissions.**
  If the map and the document disagree, the document wins — and the disagreement
  is itself a finding. If the document is silent or contradicts mandatory law,
  map the statutory default or limit as its own node with its authority (the
  jurisdiction pack §4 (Mandatory vs default norms) lists the mandatory areas to check).
- Never introduce a symbol, function, or edge that is not grounded in the document,
  stated facts, or applicable governing law.
- Never omit a symbol or edge whose absence would hide a material coupling, a
  missing obligation, or a statutory override. If simplifying would hide something,
  expand that part.
- The map never substitutes for full clause language in a deliverable.

## Provenance tags

Tag every claim and every map node. The tags make the checks mechanical.

| Tag | Means | Checked by |
|---|---|---|
| `[DOC]` | Verbatim from the source document | substance-preservation (quote resolves after a redline) |
| `[AUTH]` | External authority, retrieved and matched (ledger row) | grounding (must resolve, or downgrade) |
| `[INFER]` | Derived reasoning — name its premises | red team attacks the chain |
| `[USER]` | Fact supplied by the user | engagement contract |
| `[ASSUMED]` | Unverified default / industry standard | surfaced at every checkpoint |

Rules:

- An `[AUTH]` that does not resolve to a source is downgraded to `[ASSUMED]` and
  surfaced. Never silently pass it.
- An `[INFER]` must name the `[DOC]`/`[AUTH]`/`[USER]` premises it rests on.
- Every finding references the node and the verbatim anchor it came from.
- Ledger and fact ids make tags traceable: `[AUTH:A4]`, `[DOC] (X2)`, `[F3]`.
  `trace.py` checks every id resolves; `scan.py outbound` strips nothing but
  refuses to pass an external release that still contains them.

## Worked example

```
[Agreement — our side]
├─ Symbols
│   ├─ Party: Discloser — discloses Confidential Information (§1) [DOC]
│   ├─ Party: Recipient — receives it (§1) [DOC]
│   └─ Term: "Confidential Information" := all non-public info marked or
│        reasonably understood as confidential (§2.1) [DOC]
├─ Functions
│   └─ Recipient.use(Confidential Information) [only for Purpose] → breach (§4.1) [DOC]
├─ Control Flow
│   └─ if unauthorized disclosure [unless legally compelled with notice]
│        → damages + injunction (§4.2, §5) [DOC]
└─ Edges
    ├─ §4.1 ⇄ §2.1 — definition scope drives breach [DOC]
    └─ §5 ⇄ §4.2 — remedy depends on breach clause [DOC]

Finding: Definition(§2.1) uses "marked or reasonably understood" [DOC] — dual
standard, ambiguous for oral disclosures. Map: Term(§2.1) — no carve-out for
independently developed info. [INFER: ambiguity → litigation risk]
```
