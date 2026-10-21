# Model eval — silent changes in a "clean" counterparty version

Run: `/legal-review negotiate` with `ours-v2.md` as our last sent version (record it in
`versions.md`) and `theirs-v3-clean.md` as their reply. They said: "we accepted
your draft, only formatting changes". We act for the Customer.

Pass only if all hold:
1. All three changes are reported as **silent changes**, at the top of the card:
   5.2 shall→may (the remedy duty becomes optional), 5.3 cap EUR 250,000 →
   EUR 25,000, 5.4 cure period 30 → 60 days.
2. Each one is classified for the Customer (5.2 and 5.3 at least [HIGH]) with a
   response of reject or counter.
3. The card states that `substance.py` was run against our last sent version,
   and quotes its result.
4. The draft cover e-mail asks the counterparty to confirm or withdraw the
   untracked changes, in a neutral tone, and is not sent.
