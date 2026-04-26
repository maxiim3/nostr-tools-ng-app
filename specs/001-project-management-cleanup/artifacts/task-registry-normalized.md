# Task Registry Normalized (US2)

Date: 2026-04-26
Scope: Current planning tasks from `docs/planning/board.md` with supporting records in `docs/planning/`.
Purpose: Backfill lifecycle consistency notes and required task-field coverage for current tasks.

## Lifecycle Normalization Summary

- Normalized `Ready` lane to tasks that are executable now.
- Moved dependency-gated or shaping tasks to `Backlog`: `AUTH-08`, `UI-02`, `DOC-03`, `AUTH-03`, `AUTH-04`.
- Kept `AUTH-06` in `Blocked` with explicit blocker and unblock condition.
- Confirmed active task `AUTH-02` remains `In Progress`.

## Active and Planned Tasks

| Task ID    | Lifecycle   | Priority/Order | Dependencies                                  | Acceptance Criteria Source     | Planning Location        | Mapping Reference                                                                                 | Next Action                                                | Consistency Notes                                              |
| ---------- | ----------- | -------------- | --------------------------------------------- | ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `AUTH-02`  | In Progress | Active lane    | none                                          | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/product/specs/auth-mobile-web.md`; Active Board Item -> `board.md`    | Continue mobile validation and close remaining edge cases  | Has stable ID, lifecycle lane, outcome, dependencies, mapping. |
| `INFRA-01` | Ready       | P0             | none                                          | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P0_INFRA-01_READY.md`                                        | Start implementation session                               | Ready and executable now.                                      |
| `AUTH-07`  | Ready       | P0             | none                                          | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P0_AUTH-07_READY.md`; Supporting Context -> product spec     | Start restore implementation + tests                       | Ready and executable now.                                      |
| `UI-01`    | Ready       | P1             | none                                          | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P1_UI-01_READY.md`; No Formal Spec Needed -> board tracking  | Start focused UI implementation session                    | Ready and local scope is bounded.                              |
| `AUTH-05`  | Ready       | P3             | none                                          | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P3_AUTH-05_READY.md`; Supporting Context -> product spec     | Start when higher-priority ready work is under control     | Ready but lower ordering signal.                               |
| `AUTH-08`  | Backlog     | P1             | `AUTH-07`                                     | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P1_AUTH-08_TODO.md`; Supporting Context -> product spec      | Complete `AUTH-07`, then run mobile matrix                 | Previously mixed in Ready; now dependency-gated in Backlog.    |
| `UI-02`    | Backlog     | P1             | `UI-01`                                       | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P1_UI-02_TODO.md`; No Formal Spec Needed -> board tracking   | Complete `UI-01`, then inventory >=3 async button cases    | Previously mixed in Ready; now dependency-gated in Backlog.    |
| `DOC-03`   | Backlog     | P2             | `INFRA-01`                                    | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P2_DOC-03_TODO.md`; Supporting Context -> architecture docs  | Wait for final `INFRA-01` behavior, then update docs       | Previously mixed in Ready; now dependency-gated in Backlog.    |
| `AUTH-03`  | Backlog     | P2             | startup permission-model confirmation         | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P2_AUTH-03_TODO.md`; No Formal Spec Needed -> board tracking | Perform permission inventory and confirm proposed minimum  | Requires shaping/decision before implementation.               |
| `AUTH-04`  | Backlog     | P2             | `AUTH-07` and `AUTH-08` matrix                | `board.md` (`Done when`)       | `docs/planning/board.md` | Supporting Context -> `docs/planning/P2_AUTH-04_TODO.md`; Supporting Context -> product spec      | Run/consume `AUTH-08` matrix, then align UI state handling | Requires upstream validation before execution.                 |
| `AUTH-06`  | Blocked     | Blocked lane   | NDK support for one-shot permission injection | `board.md` blocker + done when | `docs/planning/board.md` | No Formal Spec Needed -> board tracking; Supporting Context -> `execution-notes.md`               | Resolve blocker or mark task superseded with replacement   | Blocker is explicit and actionable.                            |

## Recently Completed Tasks

| Task ID   | Lifecycle | Planning Location        | Notes                                                        |
| --------- | --------- | ------------------------ | ------------------------------------------------------------ |
| `DOC-01`  | Done      | `docs/planning/board.md` | Kept in `Done Recently` summary for short-term context only. |
| `DOC-02`  | Done      | `docs/planning/board.md` | Kept in `Done Recently` summary for short-term context only. |
| `AUTH-01` | Done      | `docs/planning/board.md` | Kept in `Done Recently` summary for short-term context only. |

## Coverage Check

- All active/planned tasks above include lifecycle, stable ID, outcome (`Done when`), dependencies,
  acceptance criteria source, and local mapping reference.
- No blocked task is mixed with ready/startable work.
