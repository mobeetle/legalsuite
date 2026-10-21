---
name: legal-research
description: "Internal grounding function (alias: legal-ground) for any legal system: deep investigation used inside any skill when authority or context is missing. Uses web search to collect provisions, case law, articles and commentary, then grounds with a citation ledger. Also answers standalone legal questions (CS: rešerše, judikatura, jak to je podle zákona?). Load alongside the legal engine; other skills invoke its phases inline."
license: Apache-2.0
metadata:
  imports: frame, orchestrate, gate, ground, provenance, register, present, guard, economy, style, vocabulary, configure, challenge, verify
  delta: ground
  version: 1.0
  last_validated: 2026-10-16
  category: door
---

# legal-research (alias: legal-ground)

**Object of work.** A legal question grounded in retrieved, checked authority (alias `legal-ground`).
> **Imports.** Obey the capability files named in the front-matter `imports:`; do not restate them. This file carries only the mode's delta.

The internal grounding function. Other skills invoke these phases inline
whenever a premise lacks authority — it is not a separate track the user
must choose. It also answers standalone legal questions.

Read `../legal/SKILL.md` first if the `legal` engine isn't loaded. The ledger
format and procedure are in `../legal/references/citation-ledger.md`.

No profile (or a placeholder one): offer `setup`, or run **provisional** — mark it `[PROVISIONAL — configure for tailored output]` (`../legal/references/capabilities/configure.md`).

## Variants (pick in the Gate Plan)

| Variant | When | Output |
|---|---|---|
| **quick** | One question, settled law, low stakes (fast-track) | Short answer + rule + authorities with ledger results, inline |
| **memo** (default for architect path) | A question the client or a decision relies on | Research memo + `authorities.md` |
| **leads** | Early exploration, unfamiliar area | Leads, not cites: where to look and what to check. Nothing in it is citable; it says so on top |

## Phases

1. **Frame.** Restate the question. Pin `JURISDICTION` (split
   multi-jurisdiction questions into one sub-question per jurisdiction; never
   blend them) and `EPOCH` (the date the facts happened or the act will
   happen, which picks the version of the law). Decompose into
   sub-questions. Separate the facts the answer depends on (`[USER]`, fact ids),
   and name any missing fact that would flip the answer.
2. **Source plan.** Per sub-question, follow the hierarchy in pack §1 (Sources & hierarchy) and format citations per pack §2 (Citation format):
   constitutional and EU/international law → statute in the version in force at `EPOCH` (pack
   §3 (Version in force)) → binding or unifying case law → supranational courts (e.g. CJEU/ECtHR) → lower courts →
   commentary. Name the portals to use and the search terms (anonymised: the
   legal point, never client facts). Note which sources are paywalled and
   whether the user has access.
3. **Retrieve and read.** Open each provision and decision. Read the
   surrounding provisions (definitions, exceptions, transitional rules) and the
   decision's reasoning, not just its headnote. Results from search engines and
   other AI tools are leads.
   - **Use your web search tool to collect wider context first:** relevant
     statutes and their current wording, case law, doctrinal articles, blog
     posts and practitioner commentary, regulatory guidance. Anonymise every
     query (the legal point, never client names, amounts, or identifiers).
     Everything found this way is a lead until its ledger row is `verified`.
4. **Ledger.** One row per authority per proposition, in `authorities.md`:
   version in force, verbatim quote match, weight, status. Contrary authority
   gets its own rows. A row is `verified` only when every column supports it.
5. **Synthesise.** Per sub-question: the rule `[AUTH:A…]` → how it applies to
   these facts `[INFER]` → contrary authority and how strong it is → open
   points and what would resolve them. Say where the law is unsettled, and
   present both readings instead of picking one silently.
6. **Answer and memo.** Lead with the answer.

## Memo structure

```
# <Question, as restated>
⚠ <banner if any relied-on authority is not verified>
Jurisdiction: <…> · Epoch: <…> · Audience: <…>

## Short answer
<2–5 sentences: the answer, its confidence, the condition it depends on>

## Facts relied on
- <fact> [USER|DOC|ASSUMED] (F-id)   ← a change here changes the answer

## Analysis
### <Sub-question 1>
Rule: … [AUTH:A1]
Application: … [INFER: A1 + F2]
Contrary view: … [AUTH:A4] — weight: …
Open point: …

## Recommendation and next steps
## Authorities
<the ledger, or a pointer to authorities.md>
```

For `AUDIENCE = client` or `business`, add a plain-language summary above the
short answer and move the analysis below it.

Write `memo-<topic>.md` plus a mandatory `memo-<topic>.docx` beside it
(`../legal/scripts/md2docx.py`, after `scan.py outbound`). Screen follows
`../legal/references/display.md`: print the **full memo** on screen in the turn
that delivers it, and close with `FILES` — clickable absolute links to the
`.docx`, the `.md`, and `authorities.md` beside them. The links are additional,
never a substitute for the text.

## Rules

- **No memory citations.** An authority recalled but not retrieved is a lead:
  `[ASSUMED] (verify)`, `unverified` in the ledger, and never quoted. If no
  retrieval tool is connected, say so at the start, deliver as **leads**, and
  put the engine's banner on top.
- **Version in force.** A provision quoted in its current wording for a
  question whose `EPOCH` predates an amendment is an error. Check the
  transitional provisions.
- **Binding vs persuasive** is stated for every case cited. A lower-court
  decision is never presented as settled law.
- **Quotes match verbatim**, or they're paraphrased without quotation marks.
- **Deadline questions** give the rule, the trigger, the computation (pack §7 (Computing time & delivery rules))
  and the conservative date, and go to `deadlines.md` when a matter folder exists.
- **Stop** when the next source no longer changes the answer (minimum
  sufficient inquiry). Depth follows the stakes.

## Checks

- **grounding** always: every relied-on authority has a ledger row; the
  banner is on top if any isn't `verified`.
- **trace** for memos: `trace.py memo.md --authorities authorities.md --facts facts.md`.
- For `RISK = high`, or advice a client will act on, propose the challenge
  capability (`../legal/references/capabilities/challenge.md`, lens: opposing
  counsel or judge) before final output.

## Fan-out

Research fans out at the source: one read-only packet per sub-question and per jurisdiction (never blend jurisdictions in one packet), or per authority to retrieve-and-verify. The parent owns the memo and the ledger. Protocol: `../legal/references/capabilities/orchestrate.md`.

## What this mode does not do

- Give legal advice: it grounds a question in authority; the answer and its application are the lawyer's.
- Cite from memory: a proposition with no retrieved, checked source is tagged `[verify]`, never asserted.
- Skip currency: where the law can move, the retrieval is required and its absence is stated.

## Counter-example (illustration)

*Illustration, not law.* Asked whether a clause is enforceable, it answers from a case it "recalls". **Mistake to catch:** the citation was never retrieved, has no ledger row, and is presented as settled. Correct: retrieve it, record the ledger row, tag its tier — or say the law was not checked.
