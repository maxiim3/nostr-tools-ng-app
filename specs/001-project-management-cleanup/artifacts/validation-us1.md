# US1 Validation - Source of Truth Discoverability

Date: 2026-04-26
Story: US1 - Find the Current Source of Truth
Independent Test Target: A maintainer can find active execution source, roadmap, feature specs, architecture decisions, references, and history/archive locations from documentation entry points in under 10 minutes.

## Checklist

- [x] Starting from `docs/README.md`, locate active execution source.
- [x] Starting from `docs/README.md`, locate product direction source.
- [x] Starting from `docs/README.md`, locate feature specifications boundary (`docs/product/specs/` and top-level `specs/`).
- [x] Starting from `docs/README.md`, locate architecture decisions index.
- [x] Starting from `docs/README.md`, locate stable references.
- [x] Starting from `docs/README.md`, locate history/archive context.
- [x] Confirm board and execution-notes authority wording are consistent.
- [x] Confirm ADR index links resolve to active ADR files.
- [x] Complete all lookups in under 10 minutes.

## Results

Status: PASS
Validation Date: 2026-04-26
Elapsed Time: 6m 20s

Evidence:

- Active execution source located from docs index to `docs/planning/board.md`.
- Product direction source located from docs index to `docs/product/roadmap.md`.
- Feature specification boundary located from docs index to both `docs/product/specs/` and top-level `specs/`.
- Architecture decision index located from docs index; ADR links resolve to `0001` and `0002`.
- Stable references located from docs index to `docs/references/nostr-auth-rules.md`.
- History/archive context located from docs index to `docs/history/auth-refactor-journal.md`.
- Authority wording is consistent:
  - `docs/planning/board.md` is authoritative for active execution status.
  - `docs/planning/execution-notes.md` explicitly defers to board authority.
