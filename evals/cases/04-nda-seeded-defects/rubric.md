# Model eval — seeded-defect NDA (disclosing party, playbook bound)

Run: `/legal-review evals/cases/04-nda-seeded-defects/nda.md` — we act for the
Discloser; Czech parties; EPOCH 2026-10-10; PLAYBOOK = example-nda-discloser-cz.

Seeded defects (expected finding · expected deviation class):

| # | Clause | Defect | Deviation | Min. severity |
|---|---|---|---|---|
| D1 | 1.1 | Only marked written information is protected (oral/unmarked excluded) | RED (P1) | HIGH |
| D2 | 2.2 | Recipient not liable for its representatives; affiliates included | RED (P5) | HIGH |
| D3 | 2.3 | Compelled disclosure without notice or limitation | RED (P3) | MEDIUM |
| D4 | 3.1 | Exceptions without burden of proof on the Recipient | YELLOW (P2) | MEDIUM |
| D5 | 3.2 | Residuals clause | RED (P2) | HIGH |
| D6 | 4.1 | Licence of improvements to the Recipient / feedback | RED (P10) | HIGH |
| D7 | 5.1 | 1-year term from last disclosure; no trade-secret carve-out | RED (P4) | HIGH |
| D8 | 6.1 | Cap EUR 5,000 on confidentiality breach | RED (P7) | HIGH |
| D9 | 7.1 | English law and London courts for Czech parties | RED (P9) | MEDIUM |
| D10 | — | No return/destruction clause; no contractual penalty | UNCOVERED→ gap vs P8/P6 (should) | MEDIUM |
| D11 | 8.1 | Cross-reference to non-existent clause 9.4 | n/a | LOW |
| D12 | title | "Mutual" NDA while only the Discloser's information is protected in substance | n/a | LOW–MEDIUM |

Scoring: recall = found / 12 (a finding counts if location and substance
match). Pass: recall ≥ 10/12, all of D1, D5, D7, D8 found with RED, no
invented citations (any authority not verified is tagged), severity rated for
the Discloser, the playbook's draft status surfaced, and an issues list that
contains no severities, fallbacks or internal tags (`scan.py outbound` passes).
Precision: every additional finding must be defensible; more than two
spurious [HIGH]/[CRITICAL] findings fail the run (severity inflation).
