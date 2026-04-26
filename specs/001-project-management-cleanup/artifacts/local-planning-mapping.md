# Local Planning Mapping Registry

Date: 2026-04-26
Purpose: Local registry mapping planning records to authoritative or supporting documentation.
Status: Foundation scaffold with US2 lifecycle references (US3 will populate canonical mappings).

## Mapping Fields

| Field             | Description                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `sourcePath`      | Planning record or related file being mapped                                                                                |
| `targetPath`      | Retained source, supporting context, spec, or archive target                                                                |
| `relationship`    | One of: Active Board Item, Feature Spec, Supporting Context, Duplicate, Superseded, Archived Context, No Formal Spec Needed |
| `lifecycleState`  | Lifecycle state for the source record (`Backlog`, `Ready`, `In Progress`, `Blocked`, `Done`, `Superseded`, `Archived`)      |
| `lifecycleSource` | Where lifecycle status is resolved (board lane, execution notes alignment, or normalized registry)                          |
| `rationale`       | Why the relationship is correct                                                                                             |
| `mappingStatus`   | `seeded`, `pending-classification`, `seeded-with-lifecycle`, or `validated`                                                 |

## Seeded Entries with Lifecycle References

| sourcePath                           | targetPath                              | relationship       | lifecycleState | lifecycleSource                                   | rationale                                                                                      | mappingStatus         |
| ------------------------------------ | --------------------------------------- | ------------------ | -------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------- |
| `docs/planning/board.md`             | `docs/planning/board.md`                | Active Board Item  | Mixed lanes    | `docs/planning/board.md` lane sections            | Board owns active execution status and lifecycle lanes.                                        | validated             |
| `docs/planning/execution-notes.md`   | `docs/planning/board.md`                | Supporting Context | Ready+Backlog  | `docs/planning/execution-notes.md` alignment rule | Execution notes expand board items for handoff; board remains authoritative for lifecycle.     | validated             |
| `docs/planning/P0_INFRA-01_READY.md` | `docs/planning/board.md`                | Supporting Context | Ready          | `docs/planning/board.md` (`INFRA-01` lane)        | Supporting task brief for current ready task.                                                  | seeded-with-lifecycle |
| `docs/planning/P0_AUTH-07_READY.md`  | `docs/planning/board.md`                | Supporting Context | Ready          | `docs/planning/board.md` (`AUTH-07` lane)         | Supporting task brief for current ready task.                                                  | seeded-with-lifecycle |
| `docs/planning/P1_AUTH-08_TODO.md`   | `docs/planning/board.md`                | Supporting Context | Backlog        | `docs/planning/board.md` (`AUTH-08` lane)         | Filename is supporting context only; lifecycle is normalized from board ownership.             | seeded-with-lifecycle |
| `docs/planning/P1_UI-01_READY.md`    | `docs/planning/board.md`                | Supporting Context | Ready          | `docs/planning/board.md` (`UI-01` lane)           | Supporting task brief for current ready task.                                                  | seeded-with-lifecycle |
| `docs/planning/P1_UI-02_TODO.md`     | `docs/planning/board.md`                | Supporting Context | Backlog        | `docs/planning/board.md` (`UI-02` lane)           | Filename is supporting context only; lifecycle is normalized from board ownership.             | seeded-with-lifecycle |
| `docs/planning/P2_AUTH-03_TODO.md`   | `docs/planning/board.md`                | Supporting Context | Backlog        | `docs/planning/board.md` (`AUTH-03` lane)         | Requires additional shaping before execution.                                                  | seeded-with-lifecycle |
| `docs/planning/P2_AUTH-04_TODO.md`   | `docs/planning/board.md`                | Supporting Context | Backlog        | `docs/planning/board.md` (`AUTH-04` lane)         | Depends on upstream auth stabilization work.                                                   | seeded-with-lifecycle |
| `docs/planning/P2_DOC-03_TODO.md`    | `docs/planning/board.md`                | Supporting Context | Backlog        | `docs/planning/board.md` (`DOC-03` lane)          | Documentation follow-up depends on final Infra implementation.                                 | seeded-with-lifecycle |
| `docs/planning/P3_AUTH-05_READY.md`  | `docs/planning/board.md`                | Supporting Context | Ready          | `docs/planning/board.md` (`AUTH-05` lane)         | Ready but lower-priority cleanup work.                                                         | seeded-with-lifecycle |
| `docs/planning/board.md`             | `docs/product/specs/auth-mobile-web.md` | Supporting Context | In Progress    | `artifacts/task-registry-normalized.md`           | `AUTH-02` and auth UX tasks reference mobile auth behavior context from product specification. | seeded-with-lifecycle |

## Notes

- This artifact is intentionally minimal in MVP to establish a durable structure.
- Lifecycle source-of-truth is `docs/planning/board.md`; supporting files do not override lifecycle.
- US3 task set (`T025-T029`) is responsible for canonical relationship classification and validation.
