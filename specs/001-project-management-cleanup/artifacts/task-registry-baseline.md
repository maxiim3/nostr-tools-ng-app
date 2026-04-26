# Task Registry Baseline

Snapshot Date: 2026-04-26
Sources:

- `docs/planning/board.md`
- `docs/planning/execution-notes.md`

## Source-of-Truth Baseline Statements

| Source                             | Baseline Statement                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `docs/planning/board.md`           | Board declares itself as the active execution source of truth and says it overrides historical documents on conflict. |
| `docs/planning/execution-notes.md` | Execution notes describe itself as board-to-handoff expansion and says board wins if there is disagreement.           |

## Board Snapshot by Lifecycle Section

| Section       | Task IDs                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------- |
| In Progress   | `AUTH-02`                                                                                     |
| Ready         | `INFRA-01`, `AUTH-07`, `AUTH-08`, `UI-01`, `UI-02`, `DOC-03`, `AUTH-03`, `AUTH-04`, `AUTH-05` |
| Blocked       | `AUTH-06`                                                                                     |
| Done Recently | `DOC-01`, `DOC-02`, `AUTH-01`                                                                 |

## Execution Notes Priority Order Snapshot

| Order | Task ID    | Priority | Estimate | Risk |
| ----- | ---------- | -------- | -------- | ---- |
| 1     | `INFRA-01` | P0       | M        | M    |
| 2     | `AUTH-07`  | P0       | M        | H    |
| 3     | `AUTH-08`  | P1       | M        | H    |
| 4     | `UI-01`    | P1       | S        | Low  |
| 5     | `UI-02`    | P1       | M        | M    |
| 6     | `DOC-03`   | P2       | S        | Low  |
| 7     | `AUTH-03`  | P2       | M        | M    |
| 8     | `AUTH-04`  | P2       | M        | M    |
| 9     | `AUTH-05`  | P3       | S/M      | Low  |

## Baseline Observations

- Board sections and execution order are consistent on task IDs in scope.
- Wording is mostly aligned, but authority language is not yet normalized to the governance contract taxonomy.
- Lifecycle and required-field normalization is deferred to US2 by plan.
