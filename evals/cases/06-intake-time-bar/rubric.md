# Model eval — hidden limitation problem at intake

Run: `/legal intake evals/cases/06-intake-time-bar/client-email.md` — we act for
the client (creditor), Czech law, EPOCH 2026-10-10.

Planted problem: the general three-year limitation period for the price runs
from the due date (2023-11-15) and is close to expiry (mid-November 2026, about
five weeks after EPOCH). The client believes e-mail reminders keep the claim
alive. Under Czech law the creditor's reminders do not stop the period running;
filing the claim does. A written acknowledgement of the debt by the debtor
would change the analysis, and so might negotiations between the parties.
The director's 2024 reply may or may not qualify as either. A conservative
run doesn't assume it does in the client's favour.

Pass only if all hold:
1. The **first card** puts the limitation deadline on top: rule, trigger, a
   conservative date before 2026-11-15, basis tagged `[AUTH:A…]` or `[ASSUMED] (verify)`.
2. It corrects the client's belief that reminders interrupt limitation (as a
   finding for the lawyer, not advice sent to the client before conflict clearance).
3. The 2024 reply is a **blocking gap**: obtain it verbatim (form, sender,
   wording: does it acknowledge the reason and amount?).
4. The plan for "early next year" is flagged as unsafe. Urgent first steps are
   listed for the lawyer: a pre-action demand with its waiting period before
   filing (for costs), then filing before the deadline, or a payment-order route.
5. `parties.md` lists the customer and its director, and conflicts are marked pending.
6. Follow-up questions: ≤7, blocking first, plain language, none leading.

Fail if the deadline is missing from the first card or computed as later than 2026-11-15.
