# Cleanup Action Ledger

Date: 2026-04-26
Purpose: Track retain/merge/rename/archive/delete decisions with rationale and reference impact.

## Action Values

- `Retain`
- `Merge`
- `Rename`
- `Archive`
- `Delete`

## Ledger

| Path                                    | Action | Destination (if any)               | Rationale                                                                      | Inbound References Updated                            | Status    |
| --------------------------------------- | ------ | ---------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- | --------- |
| `docs/planning/P0_INFRA-01_READY.md`    | Delete | `docs/planning/execution-notes.md` | Unique readiness and validation notes merged into consolidated brief.          | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P0_AUTH-07_READY.md`     | Delete | `docs/planning/execution-notes.md` | Unique signer-validation notes merged into consolidated brief.                 | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P1_AUTH-08_TODO.md`      | Delete | `docs/planning/execution-notes.md` | Mobile-test prerequisites and validation notes merged into consolidated brief. | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P1_UI-01_READY.md`       | Delete | `docs/planning/execution-notes.md` | Standalone brief duplicated the consolidated handoff and was merged.           | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P1_UI-02_TODO.md`        | Delete | `docs/planning/execution-notes.md` | Async-button inventory prerequisite and validation notes merged.               | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P2_AUTH-03_TODO.md`      | Delete | `docs/planning/execution-notes.md` | Permission-inventory prerequisite and validation notes merged.                 | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P2_AUTH-04_TODO.md`      | Delete | `docs/planning/execution-notes.md` | Mobile UX prerequisites and validation notes merged.                           | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P2_DOC-03_TODO.md`       | Delete | `docs/planning/execution-notes.md` | Supabase-doc validation note merged into consolidated brief.                   | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/P3_AUTH-05_READY.md`     | Delete | `docs/planning/execution-notes.md` | Advanced-bunker UX validation note merged into consolidated brief.             | `docs/planning/board.md`; prompt now references notes | completed |
| `docs/planning/board.md`                | Retain | n/a                                | Active execution source of truth; references consolidated handoff notes.       | n/a                                                   | completed |
| `docs/planning/execution-notes.md`      | Retain | n/a                                | Consolidated board-backed handoff companion after merging legacy briefs.       | n/a                                                   | completed |
| `docs/README.md`                        | Retain | n/a                                | Documentation index now names consolidated planning handoff ownership.         | n/a                                                   | completed |
| `docs/architecture/decisions/README.md` | Retain | n/a                                | ADR index clarifies task handoff briefs are outside ADR scope.                 | n/a                                                   | completed |

## Notes

- Decisions populated in US4 (`T031-T034`).
- Every touched document appears in exactly one action category in the final cleanup summary.
