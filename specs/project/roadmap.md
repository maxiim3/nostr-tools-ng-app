# Roadmap

Status: active  
Updated: 2026-04-26

This file owns product sequencing. Execution order is tracked in [queue.md](queue.md).

## Now

| Order | Feature                        | Outcome                                                               |
| ----- | ------------------------------ | --------------------------------------------------------------------- |
| 001   | `001-session-restore`          | Refresh restores valid NIP-07/NIP-46 sessions and purges invalid data |
| 002   | `002-persistent-pack-requests` | Pack-request data survives redeployments                              |
| 003   | `003-extension-auth-loading`   | Extension auth button has clear loading/disabled behavior             |
| 004   | `004-advanced-bunker-mode`     | `bunker://` remains available as advanced mode                        |

## Next

| Order | Feature                       | Outcome                                                      |
| ----- | ----------------------------- | ------------------------------------------------------------ |
| 005   | `005-mobile-auth-stability`   | Amber and Primal mobile flows are stable and documented      |
| 006   | `006-async-button-pattern`    | Shared async-button strategy exists where repetition is real |
| 007   | `007-permission-minimization` | Login asks only minimum startup permissions                  |
| 008   | `008-mobile-auth-states`      | Mobile auth states are explicit and actionable               |

## Later

| Order | Feature                        | Milestone | Outcome                                                 |
| ----- | ------------------------------ | --------- | ------------------------------------------------------- |
| 009   | `009-bunker-permission-grants` | M1        | One-shot bunker permissions or a documented replacement |
| 010   | `010-follower-merge`           | M2        | Admin compares and imports missing follows safely       |
| 011   | `011-francophone-pack-feed`    | M3        | Public read-only feed for francophone pack members      |

## Sequencing Rules

- `005-mobile-auth-stability` depends on `001-session-restore`.
- `006-async-button-pattern` depends on `003-extension-auth-loading`.
- `008-mobile-auth-states` should follow `001-session-restore` and ideally `005-mobile-auth-stability`.
- `009-bunker-permission-grants` stays blocked until a clean NDK extension point exists.
- `002-persistent-pack-requests` includes `DOC-03` as follow-up documentation work after storage migration.
