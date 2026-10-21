# Practice profile

The one file that turns generic output into the firm's output. Every skill reads
it before the Gate Plan, and it pre-fills the stance so most `[ASSUMED]` tags
disappear. It describes **how the team works**, not any client's matters.

Location: `.legal/profile.md` for a project or team, `~/.legal/profile.md` for an
individual. The project file wins.

Above it sits the shared **practice/company context** file (`.legal/context.md`),
read first: what every matter would otherwise re-ask (house style, approvers,
confidentiality defaults). See `capabilities/configure.md`, *Shared context layer*.

## Setup interview

Ask in the user's language, one block at a time. Accept "skip". Show the draft
before writing it. Offer to read seed documents (an engagement letter
template, a house-style guide, an escalation matrix, a past memo) instead of
asking. Extract only the general practice from them, never a client's facts.

**Quick (2 minutes, 6 questions)**
1. Who are you? Law firm, in-house team or other; size; your role.
2. Main practice areas, and the side you usually act for (buyer/seller,
   employer/employee, claimant/defendant, controller/processor…).
3. Home jurisdiction(s) and working languages; the language of your deliverables.
4. Default risk posture (aggressive / balanced / defensive) and who usually reads
   your output (lawyer, client, business, court).
5. Who approves what? Deviations from your positions, sending documents out,
   filings. Roles are enough.
6. Which tools may see client data (e.g. this AI host under its business terms,
   a document system), and which may not (e.g. public web search with client
   facts)?

**Full (add 10–15 minutes)**
7. House style: citation style, defined-term conventions, numbering, letterhead
   or templates location, preferred phrasing, words to avoid.
8. Precedents and templates: where they live and which are authoritative.
9. Playbooks in use (slugs) and who owns them.
10. Escalation matrix: thresholds (amount, liability, term, regulatory exposure)
    and who decides at each level.
11. Engagement practice: conflict-check owner and system, AML/KYC procedure,
    engagement letter template, fee basis.
12. Research access: official portals only, or Westlaw / LexisNexis / Beck-online /
    ASPI / Codexis / other legal databases.
13. Output formats: Word with tracked changes, PDF, Excel grids; the file-naming
    convention.
14. Deadlines practice: who keeps the firm calendar, and how much buffer to
    build in before limitation and procedural deadlines.

## Template

Fill `<jurisdiction>` (e.g. `en-gb`, `us-ny`, `de`, `cz`, `eu`) and `<language>` (e.g. `en`, `de`, `cs; commentary en`):

```
---
updated: YYYY-MM-DD
owner: <role or person who maintains this file>
---
# Practice profile — <team name>

## Who we are
<firm | in-house | other> · <size> · <role of the main user>
Practice areas: <…>
Usual side: <…>  (overridable per matter)

## Defaults for the stance
JURISDICTION = <jurisdiction>      LANGUAGE = <language>
POSTURE = <balanced>     AUDIENCE = <lawyer>
RISK appetite: <conservative | moderate | commercial> — <one line what that means here>

## Approvals and escalation
| Decision | Threshold | Who decides |
|---|---|---|
| Accept a YELLOW (fallback) position | — | <role> |
| Accept a RED / uncovered position | — | <role> |
| Send a document outside the firm | — | <role> |
| File with a court or authority | — | <role> |

## House style
<citation style, terms, numbering, formatting, templates location>

## Precedents and playbooks
<where they live; authoritative ones; playbook slugs and owners>

## Engagement practice
Conflict check: <who/how> · AML/KYC: <who/how> · Engagement letter: <template>

## Tools and data handling
Approved for client data: <…>
Not approved for client data: <…>
Research sources: <official portals | + databases with access>

## Deadlines practice
Calendar owner: <…> · Buffer before limitation/procedural deadlines: <e.g. 10 working days>
```

## Rules

- The profile holds defaults. A matter's own instructions and decisions override
  it; mandatory law overrides everything.
- No client names, matters or confidential facts in the profile.
- Update `updated:` on every change. If it is older than 12 months, suggest a
  refresh once.
