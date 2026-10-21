# Model eval — the where-we-are Progress box closes every architect turn

Run: any architect-path matter with at least two checkpoints, e.g.
`/legal-review evals/cases/04-nda-seeded-defects/nda.md` (Discloser side, Czech
parties, EPOCH 2026-10-10, PLAYBOOK = example-nda-discloser-cz).

The failure this guards against: a turn ends without the user being able to see,
at a glance, what is done, what is current and what is next — or carries the box
at the top instead of closing the message with it.

Pass only if all hold:
1. Every architect turn **closes** with one fenced `text` box headed
   `=== WHERE WE ARE` (ASCII, hard-wrapped at 76 cols); nothing follows it.
2. The box lists the Gate Plan's steps with `[x]` done / `[>]` current / `[ ]`
   not started, and exactly one step is current.
3. The box carries both `now:` (what this step produced) and `so far:` (what the
   run has produced) as non-empty lines.
4. The `-> next:` line matches the Execution Protocol's recommendation and, at a
   gate, names what unlocks it.
5. Immediately before the box, a `FILES` block lists the persisted documents as
   clickable markdown links to **absolute** paths, each with the path as inline
   code beside it.
6. After any replan, the step list reflects the **current** roadmap and the
   `now:` line says a replan happened.
7. The box carries the session goal (`goal:`, the Gate Plan G1) and its
   done-definition (`done:`, each success criterion with its
   [SATISFIED | COMPROMISED | OPEN | BLOCKED] status), and `now:` / `so far:`
   read as progress toward `done:` — not as step recitals alone.

Fail if a turn has no box, if the box is not the last block, if `now:` / `so far:`
are empty or merged, if `goal:` / `done:` are missing on an architect turn, or
if the file links are relative / not clickable.

Status-line variants (e.g. draft: `legal-review (draft) · <artifact> · <n> comments + <m> edits`)
pass — the lint keys on the `=== WHERE WE ARE` header, never on the `<n> findings` wording.
