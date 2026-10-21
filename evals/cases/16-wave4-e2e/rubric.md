# Model eval — Wave-4 end-to-end on the corpus

> **Grade a *fresh* run, not the stale corpus.** The corpus memos predate the
> reviewer note (D1), the decision-tree close (D3) and the `[verify]`/`[review]`
> flags (C1s). A 2026-10-12 sweep graded the corpus and scored it **2/5** for
> that reason alone. Run a matter now — or regenerate the corpus — before grading.

Run a real matter (the corpus matters in `../legalczech/.legal/`, or a fresh one)
through the current suite and grade the run. Each criterion is binary.

- [ ] **Reviewer note.** Every architect deliverable opens with the reviewer note
  (`present.md`), collapsing to one line when there is nothing to flag.
- [ ] **Decision-tree close.** Substantive outputs end on options and, only when
  there is one, "One question I'd ask that isn't in my checklist".
- [ ] **Flags.** `[verify]` (check the source) and `[review]` (judgment) are used
  as distinct species; no `[ASSUMED]` is presented as verified.
- [ ] **Containment.** No client document text or matter state reaches the remote
  `legalsuite` server — local tools only (`guard.md`, §1A).
- [ ] **Neutralization.** No jurisdiction-specific law appears in a capability or
  the engine; it is reached through the pack/playbook layer (§6).

Pass = all five. A failing item becomes a row in the matter's `issue-log.md`.
