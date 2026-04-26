# Local Planning Mapping Registry

Date: 2026-04-26
Purpose: Local registry mapping planning records to authoritative or supporting documentation.
Status: Canonical US3 mapping populated and validated.

## Mapping Fields

| Field             | Description                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `sourcePath`      | Planning record or related file being mapped                                                                                |
| `targetPath`      | Retained source, supporting context, spec, or archive target                                                                |
| `relationship`    | One of: Active Board Item, Feature Spec, Supporting Context, Duplicate, Superseded, Archived Context, No Formal Spec Needed |
| `lifecycleState`  | Lifecycle state for the source record (`Backlog`, `Ready`, `In Progress`, `Blocked`, `Done`, `Superseded`, `Archived`)      |
| `lifecycleSource` | Where lifecycle status is resolved (board lane, execution notes alignment, or normalized registry)                          |
| `rationale`       | Why the relationship is correct                                                                                             |
| `mappingStatus`   | `seeded`, `pending-classification`, `seeded-with-lifecycle`, `canonical`, or `validated`                                    |

## Canonical Planning Record Mappings

| sourcePath                                                                   | targetPath                                     | relationship          | lifecycleState | lifecycleSource                                   | rationale                                                                                        | mappingStatus |
| ---------------------------------------------------------------------------- | ---------------------------------------------- | --------------------- | -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------- |
| `docs/planning/board.md`                                                     | `docs/planning/board.md`                       | Active Board Item     | Mixed lanes    | `docs/planning/board.md` lane sections            | Board owns active execution status and lifecycle lanes.                                          | validated     |
| `docs/planning/execution-notes.md`                                           | `docs/planning/board.md`                       | Supporting Context    | Ready+Backlog  | `docs/planning/execution-notes.md` alignment rule | Execution notes expand board items for handoff; board remains authoritative for lifecycle.       | validated     |
| `docs/planning/P0_INFRA-01_READY.md`                                         | `docs/planning/board.md`                       | Supporting Context    | Ready          | `docs/planning/board.md` (`INFRA-01` lane)        | Supporting task brief for current ready task; board owns status and acceptance criteria.         | canonical     |
| `docs/planning/P0_AUTH-07_READY.md`                                          | `docs/planning/board.md`                       | Supporting Context    | Ready          | `docs/planning/board.md` (`AUTH-07` lane)         | Supporting task brief for current ready task; product auth spec supplies behavioral context.     | canonical     |
| `docs/planning/P1_AUTH-08_TODO.md`                                           | `docs/planning/board.md`                       | Supporting Context    | Backlog        | `docs/planning/board.md` (`AUTH-08` lane)         | Filename is supporting context only; lifecycle is normalized from board ownership.               | canonical     |
| `docs/planning/P1_UI-01_READY.md`                                            | `docs/planning/board.md`                       | Supporting Context    | Ready          | `docs/planning/board.md` (`UI-01` lane)           | Supporting task brief for current ready task; no formal feature spec is needed.                  | canonical     |
| `docs/planning/P1_UI-02_TODO.md`                                             | `docs/planning/board.md`                       | Supporting Context    | Backlog        | `docs/planning/board.md` (`UI-02` lane)           | Filename is supporting context only; lifecycle is normalized from board ownership.               | canonical     |
| `docs/planning/P2_AUTH-03_TODO.md`                                           | `docs/planning/board.md`                       | Supporting Context    | Backlog        | `docs/planning/board.md` (`AUTH-03` lane)         | Requires additional shaping before execution; direct board tracking is sufficient.               | canonical     |
| `docs/planning/P2_AUTH-04_TODO.md`                                           | `docs/planning/board.md`                       | Supporting Context    | Backlog        | `docs/planning/board.md` (`AUTH-04` lane)         | Depends on upstream auth stabilization work and product auth spec context.                       | canonical     |
| `docs/planning/P2_DOC-03_TODO.md`                                            | `docs/planning/board.md`                       | Supporting Context    | Backlog        | `docs/planning/board.md` (`DOC-03` lane)          | Documentation follow-up depends on final Infra implementation.                                   | canonical     |
| `docs/planning/P3_AUTH-05_READY.md`                                          | `docs/planning/board.md`                       | Supporting Context    | Ready          | `docs/planning/board.md` (`AUTH-05` lane)         | Ready but lower-priority cleanup work; product auth spec supplies UX context.                    | canonical     |
| `docs/product/specs/auth-mobile-web.md`                                      | `docs/product/specs/auth-mobile-web.md`        | Feature Spec          | N/A            | product spec status                               | Product-facing feature specification for mobile auth UX; not an active execution tracker.        | validated     |
| `specs/001-project-management-cleanup/`                                      | `specs/001-project-management-cleanup/spec.md` | Feature Spec          | tasks-ready    | `specs/001-project-management-cleanup/tasks.md`   | Spec Kit feature record for this cleanup effort, including plan, tasks, contracts, validation.   | validated     |
| `specs/001-project-management-cleanup/artifacts/task-registry-normalized.md` | `docs/planning/board.md`                       | Supporting Context    | Mixed lanes    | `docs/planning/board.md` lane sections            | US2 audit artifact records lifecycle normalization evidence; board remains current status owner. | validated     |
| `docs/planning/board.md#AUTH-02`                                             | `docs/product/specs/auth-mobile-web.md`        | Supporting Context    | In Progress    | `docs/planning/board.md` (`AUTH-02` lane)         | Active board item uses auth mobile spec as behavior context.                                     | validated     |
| `docs/planning/board.md#INFRA-01`                                            | `docs/planning/P0_INFRA-01_READY.md`           | Active Board Item     | Ready          | `docs/planning/board.md` (`INFRA-01` lane)        | Board owns task status; task brief is supporting context.                                        | validated     |
| `docs/planning/board.md#AUTH-07`                                             | `docs/planning/P0_AUTH-07_READY.md`            | Active Board Item     | Ready          | `docs/planning/board.md` (`AUTH-07` lane)         | Board owns task status; task brief and auth spec are supporting context.                         | validated     |
| `docs/planning/board.md#UI-01`                                               | `docs/planning/board.md`                       | No Formal Spec Needed | Ready          | `docs/planning/board.md` (`UI-01` lane)           | Small bounded UI state task is clear from board and brief without a separate feature spec.       | validated     |
| `docs/planning/board.md#AUTH-05`                                             | `docs/product/specs/auth-mobile-web.md`        | Active Board Item     | Ready          | `docs/planning/board.md` (`AUTH-05` lane)         | Board owns task status; auth mobile product spec supplies UX boundary.                           | validated     |
| `docs/planning/board.md#AUTH-08`                                             | `docs/product/specs/auth-mobile-web.md`        | Active Board Item     | Backlog        | `docs/planning/board.md` (`AUTH-08` lane)         | Board owns task status; auth mobile product spec supplies test-matrix behavior context.          | validated     |
| `docs/planning/board.md#UI-02`                                               | `docs/planning/board.md`                       | No Formal Spec Needed | Backlog        | `docs/planning/board.md` (`UI-02` lane)           | Cross-button pattern investigation can be tracked directly until inventory proves larger scope.  | validated     |
| `docs/planning/board.md#DOC-03`                                              | `docs/architecture/overview.md`                | Active Board Item     | Backlog        | `docs/planning/board.md` (`DOC-03` lane)          | Board owns task status; architecture overview is the documentation target after `INFRA-01`.      | validated     |
| `docs/planning/board.md#AUTH-03`                                             | `docs/planning/board.md`                       | No Formal Spec Needed | Backlog        | `docs/planning/board.md` (`AUTH-03` lane)         | Permission reduction needs shaping before a formal spec would add value.                         | validated     |
| `docs/planning/board.md#AUTH-04`                                             | `docs/product/specs/auth-mobile-web.md`        | Active Board Item     | Backlog        | `docs/planning/board.md` (`AUTH-04` lane)         | Board owns task status; auth mobile product spec supplies UX target context.                     | validated     |
| `docs/planning/board.md#AUTH-06`                                             | `docs/planning/board.md`                       | No Formal Spec Needed | Blocked        | `docs/planning/board.md` (`AUTH-06` lane)         | Blocked advanced-mode task stays board-only until NDK capability or replacement is known.        | validated     |
| `docs/planning/board.md#DOC-01`                                              | `docs/history/`                                | Archived Context      | Done           | `docs/planning/board.md` (`Done Recently`)        | Completed summary is retained only as short-term context until US4 cleanup classification.       | canonical     |
| `docs/planning/board.md#DOC-02`                                              | `docs/history/`                                | Archived Context      | Done           | `docs/planning/board.md` (`Done Recently`)        | Completed summary is retained only as short-term context until US4 cleanup classification.       | canonical     |
| `docs/planning/board.md#AUTH-01`                                             | `docs/history/auth-refactor-journal.md`        | Archived Context      | Done           | `docs/planning/board.md` (`Done Recently`)        | Completed auth flow work has historical context outside active planning.                         | canonical     |

## Relationship Coverage Summary

| Relationship          | Covered Records                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Active Board Item     | Board task anchors for current `In Progress`, `Ready`, `Backlog`, and `Blocked` work.                |
| Feature Spec          | `docs/product/specs/auth-mobile-web.md`; `specs/001-project-management-cleanup/`.                    |
| Supporting Context    | `execution-notes.md`, task brief files, normalized registry, architecture and auth spec references.  |
| Duplicate             | None identified in US3 scope; US4 will classify cleanup actions if duplicates are removed or merged. |
| Superseded            | None identified in US3 scope.                                                                        |
| Archived Context      | Done-recently board summaries and history references.                                                |
| No Formal Spec Needed | `UI-01`, `UI-02`, `AUTH-03`, and `AUTH-06` direct board tracking.                                    |

## Notes

- Lifecycle source-of-truth is `docs/planning/board.md`; supporting files do not override lifecycle.
- Product-facing specs in `docs/product/specs/` describe user/product behavior. Spec Kit records in
  `specs/` describe structured feature planning and validation.
- US4 may use this registry to decide whether supporting files should be retained, merged, renamed,
  archived, or deleted.
