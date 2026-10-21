# provenance — capability

**Contract.** One tag per claim and per map node; the tags make the checks
mechanical. Tags are the single vocabulary of "how do we know this", and the
registry the checks key off.

## Tags

| Tag | Means | Checked by |
|---|---|---|
| `[DOC]` | Verbatim from a source document | substance, trace |
| `[AUTH]` | External authority, retrieved and matched, with a ledger row | grounding |
| `[INFER]` | Reasoning; name its premises | red team |
| `[USER]` | Supplied by the user or client | engagement record |
| `[ASSUMED]` | Unverified default, memory, or industry practice | surfaced at every checkpoint |

`[AUTH]` is earned, not asserted. Authority recalled from memory, or not yet
retrieved, is `[ASSUMED]` with the note "verify". A failed lookup downgrades to
`[ASSUMED]` and is surfaced. In working files, trace refs make this mechanical:
`[F3]`, `[X2]`, `[A4]`, `[AUTH:A4]`.

Rules:

- An `[AUTH]` that does not resolve to a source is downgraded to `[ASSUMED]` and
  surfaced. Never silently pass it.
- An `[INFER]` must name the `[DOC]`/`[AUTH]`/`[USER]` premises it rests on.
- Every finding references the node and the verbatim anchor it came from.
- Ledger and fact ids make tags traceable: `[AUTH:A4]`, `[DOC] (X2)`, `[F3]`.
  `../scripts/trace.py` checks every id resolves; `../scripts/scan.py outbound`
  strips nothing but refuses to pass an external release that still contains
  them.

## Fabrication-risk tiers (orthogonal to the tags)

A tag says *where* a claim came from; a tier says *how safe it is to rely on
right now*. Tag citations with a tier as well:

| Tier | Means |
|---|---|
| `[settled]` | Authority in force, quoted, and the proposition is not moving |
| `[verify]` | Relied on, but the source or its current status is unchecked |
| `[verify-pinpoint]` | Retrieved, but the exact pinpoint (paragraph, sub-provision) is not confirmed |
| `[settled — last confirmed YYYY-MM-DD]` | Settled, with the date last confirmed; re-verify after the freshness window |

- The citation-ledger `Result` column maps to a tier (`verified → [settled]`,
  `partial → [verify-pinpoint]`, `unverified → [verify]`); the mapping is in
  `references/citation-ledger.md`.
- A deliverable tags each citation with its tier; the reviewer note
  (`present.md`) counts the `[verify]` items.

## Quote-to-proposition

A retrieved quote is not yet support. Check that it states the **holding** the
deliverable relies on: a dictum, a dissent, or an argument the court rejected
does not. Where the source is retrieved but the proposition is not established,
tag `[retrieved but verify support]` and do not cite it as settled.

## Tool vs model conflict

When a tool result and the model's own knowledge disagree, **surface both** and
say which the deliverable rests on. The conflict is the signal, not noise to
resolve silently.

## Verification log

One line per verified item, practice-level (not per matter), with the date and a
freshness window: what was verified, against which source, when, and when it goes
stale. The reviewer note cites an item's prior verification instead of
re-verifying it inside the window. (`ground.md` owns retrieval; this log owns the
record that a retrieval happened.)

## Checks

- Every claim and map node carries exactly one tag.
- `[AUTH]` rows resolve to a ledger row; otherwise the tag is `[ASSUMED]`.
- Every `[INFER]` names its premises.
- `trace.py` resolves every id in a memo, submission or report.
