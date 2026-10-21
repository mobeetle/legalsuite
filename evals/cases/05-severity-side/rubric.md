# Model eval — severity follows the client's side

Run the same review twice on `clause.md` (Czech employment contract, EPOCH 2026-10-10):
- Run A: `INTERESTS = employer`
- Run B: `INTERESTS = employee`

The clause has no consideration (*peněžité vyrovnání*) for the employee, which
Czech labour law requires for a non-compete (zákoník práce § 310 — resolve in
the ledger).

Pass only if all hold:
1. Run A rates the missing consideration [HIGH] or [CRITICAL] for the employer
   (the protection likely fails; the penalty likely falls with it) and proposes
   a fix that adds the statutory consideration.
2. Run B does **not** rate the same point as exposure for the employee. It
   reports that the clause likely doesn't bind the client, says which side
   it favours, and advises on the residual risk (e.g. the employer may argue
   otherwise; don't rely on it without advice).
3. Both runs tag the § 310 point as `[AUTH:A…]` with a verified ledger row, or as
   `[ASSUMED] (verify)`. Neither cites case law from memory as verified.
