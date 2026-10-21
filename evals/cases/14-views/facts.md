# Fact map — eval fixture
## Facts
| ID | Proposition | Source anchor | Tag | Asserted by | Contested | Evidence |
|---|---|---|---|---|---|---|
| F1 | notice was given in time | email 2025-04-02 | [DOC] | client | N | X1 |
| F2 | the defect pre-dated delivery | call | [USER] | client | Y | — |
## Events
| ID | Date | Precision | Actor | Act | Facts | Source |
|---|---|---|---|---|---|---|
| E1 | 2025-04-02 | day | buyer | gives notice | F1 | X1 |
## Evidence
| ID | Item | Type | Supports | Weakens | Authenticity | Held by | Status |
|---|---|---|---|---|---|---|---|
| X1 | email 2025-04-02 | record | F1 | | ok | client | in file |
| X2 | expert report | expert | F2 | | unknown | client | to obtain |
## Issues
| ID | Issue | Element | Burden | Standard | Facts | Evidence | Status |
|---|---|---|---|---|---|---|---|
| I1 | price reduction | — | — | — | — | — | open |
| I1.a | | timely notice | buyer | balance of probabilities | F1 | X1 | open |
