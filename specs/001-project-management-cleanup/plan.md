# Implementation Plan: Project Management Cleanup

**Branch**: `001-project-management-cleanup` | **Date**: 2026-04-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-project-management-cleanup/spec.md`
**Related product/docs input**: [docs/README.md](../../docs/README.md), [docs/planning/board.md](../../docs/planning/board.md), [docs/planning/execution-notes.md](../../docs/planning/execution-notes.md), [docs/architecture/decisions/0001-docs-taxonomy.md](../../docs/architecture/decisions/0001-docs-taxonomy.md)

## Summary

Clean up the local documentation and project-management architecture without changing application behavior. The work audits `docs/`, local planning records, and Spec Kit feature artifacts; defines authoritative document roles; normalizes task lifecycle states; maps local tasks to local context/specs; and records which documents are retained, merged, renamed, archived, or deleted.

## Technical Context

**Language/Version**: Documentation-only change; no application language/runtime changes.
**Primary Dependencies**: Local Markdown documentation, Spec Kit artifacts, repository documentation conventions.
**Storage**: Local files only; no runtime storage or production data touched.
**Testing**: `bun run format:check`; manual documentation validation using quickstart checklist and generated cleanup contract.
**Target Platform**: Local repository documentation consumed by maintainers and agents.
**Project Type**: Brownfield documentation/project-management cleanup.
**Performance Goals**: Maintainer can find active work, roadmap, feature specs, architecture decisions, and archive/history locations in under 10 minutes.
**Constraints**: No app behavior changes; no runtime config changes; no external tracker work; preserve unique current requirements and accepted decisions.
**Scale/Scope**: `docs/`, `specs/001-project-management-cleanup/`, `.specify/feature.json`, and documentation references required to preserve local navigation.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Angular/TypeScript**: PASS. No application source changes are planned. If implementation discovers app code impact, that work is out of scope for this feature.
- **Accessibility**: PASS. No user-facing UI changes are planned.
- **Feature boundaries**: PASS. This feature is isolated to documentation and Spec Kit artifacts. It does not change domain/application/infrastructure/presentation code.
- **Nostr auth/security**: PASS. Existing Nostr auth reference docs may be reclassified or relinked, but auth behavior and protocol rules are not changed.
- **Verification**: PASS. Verification uses repo scripts and manual documentation checks. Direct underlying tool calls are not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-management-cleanup/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── documentation-governance.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
docs/
├── README.md
├── architecture/
│   ├── overview.md
│   └── decisions/
├── guides/
├── history/
├── planning/
│   ├── board.md
│   └── execution-notes.md
├── product/
│   ├── mission.md
│   ├── roadmap.md
│   └── specs/
├── references/
└── research/

specs/
└── 001-project-management-cleanup/

AGENTS.md
```

**Structure Decision**: Work remains in local documentation and Spec Kit planning artifacts. The top-level `specs/` directory is reserved for Spec Kit feature artifacts; `docs/product/specs/` remains for product-facing focused specs. Runtime app files under `src/` and backend files such as `server.mjs` are explicitly out of scope.

## Complexity Tracking

No constitution violations or complexity exceptions are required.

## Phase 0: Research

Research output: [research.md](research.md)

Resolved decisions:

- Keep `docs/planning/board.md` as the active execution source of truth.
- Keep `docs/product/roadmap.md` as product direction, not task status.
- Keep `docs/product/specs/` for product-facing focused specs.
- Use top-level `specs/` only for Spec Kit feature artifacts and downstream planning.
- Add an explicit local planning mapping model instead of external issue mapping.
- Require a cleanup summary to document every retain/merge/rename/archive/delete action.

## Phase 1: Design & Contracts

Design artifacts:

- [data-model.md](data-model.md) defines Project Document, Task Record, Spec Kit Feature Record, Local Planning Mapping, Archive Record, and Cleanup Summary.
- [contracts/documentation-governance.md](contracts/documentation-governance.md) defines the documentation governance contract for taxonomy, lifecycle, mapping, cleanup actions, and validation.
- [quickstart.md](quickstart.md) defines the manual validation workflow for the cleaned state.

Post-design Constitution Check:

- **Angular/TypeScript**: PASS. Generated artifacts do not require app code changes.
- **Accessibility**: PASS. No UI is affected.
- **Feature boundaries**: PASS. Documentation and Spec Kit artifacts remain separate from runtime architecture.
- **Nostr auth/security**: PASS. Nostr reference content remains stable and any future relocation must preserve authority.
- **Verification**: PASS. `bun run format:check` and the quickstart validation are the planned checks.

## Phase 2: Planning Handoff

Ready for `/speckit.tasks`.

Planning guidance for task generation:

- Create an inventory task for all files under `docs/`.
- Create classification tasks for retain/merge/rename/archive/delete decisions.
- Create update tasks for `docs/README.md`, `docs/planning/board.md`, `docs/planning/execution-notes.md`, and any taxonomy ADR updates.
- Create validation tasks for source-of-truth discovery, task lifecycle consistency, local planning mapping, and no app behavior changes.
