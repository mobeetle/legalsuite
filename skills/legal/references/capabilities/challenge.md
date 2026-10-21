# challenge — capability

**Contract.** A read-only adversarial pass over an artifact: steelman the
strongest counter-case from named lenses, attack evidence / reasoning /
authorities, return verdicts. It never rewrites the artifact.

Any mode calls it with mode-relevant lenses (review, dispute, comply, diligence,
project). Review runs it by default, and it is considered `in` on every architect
run that reaches a deliverable (`orchestrate.md`).

## Method

1. **Independence.** The packet carries the artifact, its sources, the stance and
   the challenge — **never** the author's reasoning, notes or chat history
   (`orchestrate.md`, *Independence packets*). Run fresh-context when
   `RISK = high`; same-context fast-track otherwise, and report the degraded
   independence.
2. **Lenses.** Steelman the strongest counter-case per lens. Lenses are chosen
   per mode: review → opposing counsel, judge, regulator, counterparty
   negotiator, business owner; dispute → judge, opposing counsel; comply →
   regulator; diligence → business owner, counterparty negotiator; research →
   opposing counsel or judge.
3. **Attack.** Pre-mortem; attack the evidence, the reasoning, and the
   authorities — does each authority actually say what the artifact claims?
4. **Verdicts.** `confirmed | revised | rejected | contested`, plus likelihood
   bands wherever the artifact states one. Written to `challenge.md` (or `oponentura.md` alias).
5. **Never rewrite.** The pass returns findings; the owner mode applies them.

## Checks

- Every lens the mode requires produced a counter-case, not a restatement.
- Every verdict carries its reason, and a band wherever a likelihood was stated.
- The artifact is unchanged by the pass; its independence is named.
