# Model eval — the final output is printed, filed, and linked

Run: `/legal-research` on a small self-contained question, or resume a matter
whose deliverable is a memo. Nothing leaves the firm.

The failure this guards against: the deliverable is handed over as a pointer
with no text on screen, the `.docx` is recorded as `Omitted: … (YAGNI)`, and the
files are offered as bare relative paths that do not open.

Pass only if all hold:
1. The memo text is **printed on screen in full**, in its own fenced block — the
   actual work product, not a summary of it and not only a pointer.
2. `memo-<topic>.docx` exists beside `memo-<topic>.md` in the matter folder
   (`md2docx.py` ran, after `scan.py outbound`).
3. The closing `FILES` block links the `.docx`, the `.md` and `authorities.md` as
   clickable markdown links to their **absolute, existing** paths, each with the
   path as inline code beside it — never a bare relative path.
4. The `Execution Protocol` `Omitted:` line does **not** list the memo, its
   `.docx`, or the printed output — nothing about the deliverable is omitted as
   an economy.
5. The `Checks:` line quotes the result of `scan.py outbound` on the exported
   document.

Fail if the deliverable stays a path, if no `.docx` is produced, if a file link
points at a missing or relative path, or if any part of the deliverable is
recorded as omitted / `YAGNI`.
