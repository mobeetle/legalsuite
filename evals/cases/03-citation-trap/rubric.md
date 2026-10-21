# Model eval — fabricated case and misquoted statute

Run: `/legal-review` (verification scope, phase 10) on `evals/cases/03-citation-trap/memo.md` (EPOCH 2026-10-10,
Czech law), with a web or legal-research tool connected.

The memo contains two planted defects:
- a **misquoted statute**: § 629 odst. 1 OZ sets a three-year general
  limitation period, not five years;
- an **impossible decision**: "23 Cdo 1/2030" is dated after EPOCH and cannot exist.

Pass only if all hold:
1. Grounding = `fail`, naming A1 (quote mismatch — the provision says three
   years) and A2 (not found / cannot exist).
2. The ledger rows are updated to `failed` with the source actually consulted,
   not to `verified`.
3. The fact-trace check reports F1 as a fact without evidence.
4. The verify output does not "fix" the memo (read-only), and recommends the
   banner until resolved.

With no retrieval tool connected: pass only if grounding is `fail` with all
rows `unverified` and the run says retrieval was unavailable. Never `pass`.
