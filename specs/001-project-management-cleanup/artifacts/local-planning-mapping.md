# Local Planning Mapping Registry

Date: 2026-04-26
Purpose: Local registry mapping planning records to authoritative or supporting documentation.
Status: Foundation scaffold (US3 will populate canonical mappings).

## Mapping Fields

| Field           | Description                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `sourcePath`    | Planning record or related file being mapped                                                                                |
| `targetPath`    | Retained source, supporting context, spec, or archive target                                                                |
| `relationship`  | One of: Active Board Item, Feature Spec, Supporting Context, Duplicate, Superseded, Archived Context, No Formal Spec Needed |
| `rationale`     | Why the relationship is correct                                                                                             |
| `mappingStatus` | `seeded`, `pending-classification`, or `validated`                                                                          |

## Seeded Entries

| sourcePath                           | targetPath               | relationship       | rationale                                                                    | mappingStatus          |
| ------------------------------------ | ------------------------ | ------------------ | ---------------------------------------------------------------------------- | ---------------------- |
| `docs/planning/board.md`             | `docs/planning/board.md` | Active Board Item  | Board owns active execution status.                                          | seeded                 |
| `docs/planning/execution-notes.md`   | `docs/planning/board.md` | Supporting Context | Execution notes expand board items for handoff; board remains authoritative. | seeded                 |
| `docs/planning/P0_INFRA-01_READY.md` | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P0_AUTH-07_READY.md`  | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P1_AUTH-08_TODO.md`   | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P1_UI-01_READY.md`    | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P1_UI-02_TODO.md`     | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P2_AUTH-03_TODO.md`   | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P2_AUTH-04_TODO.md`   | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P2_DOC-03_TODO.md`    | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |
| `docs/planning/P3_AUTH-05_READY.md`  | `docs/planning/board.md` | Supporting Context | Lifecycle/mapping normalization deferred to US3.                             | pending-classification |

## Notes

- This artifact is intentionally minimal in MVP to establish a durable structure.
- US3 task set (`T025-T029`) is responsible for canonical relationship classification and validation.
