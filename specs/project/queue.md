# Execution Queue

Status: active  
Updated: 2026-04-26

This file owns feature execution order.

## Queue

| Order | Feature                        | State       | Priority | Milestone | Depends on                                                 |
| ----- | ------------------------------ | ----------- | -------- | --------- | ---------------------------------------------------------- |
| 001   | `001-session-restore`          | In progress | P0       | M1        | none                                                       |
| 002   | `002-persistent-pack-requests` | Ready       | P0       | M1        | none                                                       |
| 003   | `003-extension-auth-loading`   | Ready       | P1       | M1        | none                                                       |
| 004   | `004-advanced-bunker-mode`     | Ready       | P3       | M1        | none                                                       |
| 005   | `005-mobile-auth-stability`    | Backlog     | P1       | M1        | `001-session-restore`                                      |
| 006   | `006-async-button-pattern`     | Backlog     | P1       | M1        | `003-extension-auth-loading`                               |
| 007   | `007-permission-minimization`  | Backlog     | P2       | M1        | permission inventory                                       |
| 008   | `008-mobile-auth-states`       | Backlog     | P2       | M1        | `001-session-restore`, ideally `005-mobile-auth-stability` |
| 009   | `009-bunker-permission-grants` | Blocked     | P3       | M1        | NDK extension point                                        |
| 010   | `010-follower-merge`           | Future      | Later    | M2        | none                                                       |
| 011   | `011-francophone-pack-feed`    | Future      | Later    | M3        | none                                                       |

## Rule

Feature directories under `features/` must follow:

`<execution-order-id>-<name>`

Task IDs (`AUTH-07`, `INFRA-01`, `UI-01`, ...) stay inside each feature `tasks.md`.
