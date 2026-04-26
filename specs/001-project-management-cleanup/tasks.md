---
description: 'Task list for Project Management Cleanup implementation'
---

# Tasks: Project Management Cleanup

**Input**: Design documents from `/specs/001-project-management-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Runtime tests are not required because this feature is documentation/project-management only. Validation tasks are included for each user story and in the final polish phase.

**Organization**: Tasks are grouped by user story to preserve independent delivery and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: User story label (`[US1]`, `[US2]`, `[US3]`, `[US4]`) for story phases only
- Include exact file paths in every task description

## Phase 1: Setup (Shared Understanding)

**Purpose**: Build the working inventory and baseline needed before applying taxonomy/lifecycle cleanup.

- [x] T001 Create cleanup work log in `specs/001-project-management-cleanup/artifacts/implementation-log.md`
- [x] T002 Create documentation inventory snapshot from `docs/` in `specs/001-project-management-cleanup/artifacts/docs-inventory.md`
- [x] T003 [P] Create baseline task record snapshot from `docs/planning/board.md` and `docs/planning/execution-notes.md` in `specs/001-project-management-cleanup/artifacts/task-registry-baseline.md`
- [x] T004 [P] Create baseline reference map from `docs/README.md` in `specs/001-project-management-cleanup/artifacts/reference-map-baseline.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the shared governance artifacts and action ledger that all stories depend on.

**CRITICAL**: User story implementation starts only after this phase is complete.

- [x] T005 Create taxonomy matrix from `docs/README.md`, `docs/planning/board.md`, and `specs/001-project-management-cleanup/contracts/documentation-governance.md` in `specs/001-project-management-cleanup/artifacts/taxonomy-matrix.md`
- [x] T006 Create local planning mapping registry in `specs/001-project-management-cleanup/artifacts/local-planning-mapping.md`
- [x] T007 Create cleanup action ledger template in `specs/001-project-management-cleanup/artifacts/cleanup-ledger.md`
- [x] T008 [P] Create cleanup summary skeleton in `specs/001-project-management-cleanup/artifacts/cleanup-summary.md`
- [x] T009 Align taxonomy language in `docs/README.md` with `specs/001-project-management-cleanup/contracts/documentation-governance.md`
- [x] T010 Align ADR taxonomy wording in `docs/architecture/decisions/0001-docs-taxonomy.md` with `docs/README.md`

**Checkpoint**: Governance scaffolding is complete and user stories can proceed.

---

## Phase 3: User Story 1 - Find the Current Source of Truth (Priority: P1)

**Goal**: Make authoritative navigation and source-of-truth rules unambiguous.

**Independent Test**: A maintainer can find active execution source, roadmap, feature specs, architecture decisions, references, and history/archive locations from documentation entry points in under 10 minutes.

### Validation for User Story 1

- [x] T011 [P] [US1] Create US1 validation checklist in `specs/001-project-management-cleanup/artifacts/validation-us1.md`

### Implementation for User Story 1

- [x] T012 [US1] Normalize active-source-of-truth statements in `docs/planning/board.md`
- [x] T013 [US1] Normalize board-vs-handoff authority wording in `docs/planning/execution-notes.md`
- [x] T014 [US1] Update navigation table and maintenance conventions in `docs/README.md`
- [x] T015 [US1] Update architecture decision index links in `docs/architecture/decisions/README.md`
- [x] T016 [US1] Record US1 independent validation results in `specs/001-project-management-cleanup/artifacts/validation-us1.md`

**Checkpoint**: Source-of-truth hierarchy is clear and discoverable.

---

## Phase 4: User Story 2 - Manage Tasks Through a Consistent Lifecycle (Priority: P1)

**Goal**: Standardize lifecycle states and required task fields for local planning records.

**Independent Test**: A contributor can classify each active/planned task into lifecycle state and determine next action without extra context.

### Validation for User Story 2

- [x] T017 [P] [US2] Create lifecycle validation checklist in `specs/001-project-management-cleanup/artifacts/validation-us2.md`

### Implementation for User Story 2

- [x] T018 [US2] Add lifecycle definitions and required task fields section to `docs/planning/board.md`
- [x] T019 [US2] Add execution-brief lifecycle alignment rules to `docs/planning/execution-notes.md`
- [x] T020 [P] [US2] Create reusable task-record template in `specs/001-project-management-cleanup/artifacts/task-record-template.md`
- [x] T021 [US2] Backfill lifecycle consistency notes for current tasks in `specs/001-project-management-cleanup/artifacts/task-registry-normalized.md`
- [x] T022 [US2] Update local planning mapping registry with lifecycle references in `specs/001-project-management-cleanup/artifacts/local-planning-mapping.md`
- [x] T023 [US2] Record US2 independent validation results in `specs/001-project-management-cleanup/artifacts/validation-us2.md`

**Checkpoint**: Task lifecycle is consistent for active and ready work.

---

## Phase 5: User Story 3 - Map Local Planning Records to Documentation (Priority: P2)

**Goal**: Define and apply explicit local mapping between board items, planning notes, supporting context, and feature specs.

**Independent Test**: For each planning record in scope, maintainers can identify whether it is an active board item, feature spec, supporting context, duplicate, superseded note, archived context, or no-formal-spec-needed item.

### Validation for User Story 3

- [x] T024 [P] [US3] Create mapping validation checklist in `specs/001-project-management-cleanup/artifacts/validation-us3.md`

### Implementation for User Story 3

- [x] T025 [US3] Populate canonical mapping table in `specs/001-project-management-cleanup/artifacts/local-planning-mapping.md`
- [x] T026 [US3] Add mapping maintenance section to `docs/planning/execution-notes.md`
- [x] T027 [US3] Add mapping references for planning sources in `docs/planning/board.md`
- [x] T028 [P] [US3] Add product-spec vs Spec Kit boundary note in `docs/product/specs/auth-mobile-web.md`
- [x] T029 [US3] Record US3 independent validation results in `specs/001-project-management-cleanup/artifacts/validation-us3.md`

**Checkpoint**: Local planning-to-documentation mapping is explicit and complete.

---

## Phase 6: User Story 4 - Remove or Archive Documentation Noise (Priority: P2)

**Goal**: Execute retain/merge/rename/archive/delete cleanup actions with a full audit trail.

**Independent Test**: Reviewer can classify every touched document as retained, merged, renamed, archived, or deleted with rationale, and verify no app behavior change.

### Validation for User Story 4

- [ ] T030 [P] [US4] Create cleanup-action validation checklist in `specs/001-project-management-cleanup/artifacts/validation-us4.md`

### Implementation for User Story 4

- [ ] T031 [US4] Classify action for each in-scope planning file in `specs/001-project-management-cleanup/artifacts/cleanup-ledger.md`
- [ ] T032 [US4] Apply approved retain/merge/rename/archive/delete actions across `docs/planning/P0_AUTH-07_READY.md`, `docs/planning/P0_INFRA-01_READY.md`, `docs/planning/P1_AUTH-08_TODO.md`, `docs/planning/P1_UI-01_READY.md`, `docs/planning/P1_UI-02_TODO.md`, `docs/planning/P2_AUTH-03_TODO.md`, `docs/planning/P2_AUTH-04_TODO.md`, `docs/planning/P2_DOC-03_TODO.md`, and `docs/planning/P3_AUTH-05_READY.md`
- [ ] T033 [P] [US4] Update inbound references after cleanup in `docs/README.md`, `docs/planning/board.md`, `docs/planning/execution-notes.md`, and `docs/architecture/decisions/README.md`
- [ ] T034 [US4] Finalize before/after and action audit in `specs/001-project-management-cleanup/artifacts/cleanup-summary.md`
- [ ] T035 [US4] Record US4 independent validation results in `specs/001-project-management-cleanup/artifacts/validation-us4.md`

**Checkpoint**: Documentation noise is removed with a complete local audit trail.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks and close-out validation.

- [ ] T036 [P] Run `bun run format:check`
- [ ] T037 [P] Execute quickstart validation from `specs/001-project-management-cleanup/quickstart.md` and record results in `specs/001-project-management-cleanup/artifacts/quickstart-results.md`
- [ ] T038 [P] Verify behavior-neutral scope by reviewing changed paths and record statement in `specs/001-project-management-cleanup/artifacts/cleanup-summary.md`
- [ ] T039 Consolidate residual follow-ups in `specs/001-project-management-cleanup/artifacts/cleanup-summary.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Setup and blocks all user stories.
- **User Story Phases (3-6)**: depend on Foundational. US1 and US2 should complete before US3 and US4.
- **Phase 7 (Polish)**: depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: starts after Foundational; defines source-of-truth baseline used by other stories.
- **US2 (P1)**: starts after Foundational; lifecycle consistency informs mapping and cleanup actions.
- **US3 (P2)**: depends on US1 and US2 outputs.
- **US4 (P2)**: depends on US1 and US3 outputs; uses mapping and taxonomy decisions.

### Within Each User Story

- Create story validation checklist first.
- Implement source documents next.
- Record independent validation result last.

### Parallel Opportunities

- Setup tasks `T003` and `T004` can run in parallel.
- Foundational tasks `T008` can run in parallel with `T009`/`T010` after `T005`-`T007`.
- Story validation checklist tasks (`T011`, `T017`, `T024`, `T030`) can run in parallel with prior phase close-out.
- Link/reference updates (`T033`) can run in parallel with action ledger finalization (`T034`) once cleanup actions (`T032`) are complete.
- Final checks `T036`, `T037`, and `T038` can run in parallel.

---

## Parallel Example: User Story 1

```text
Task: "T011 [P] [US1] Create US1 validation checklist in specs/001-project-management-cleanup/artifacts/validation-us1.md"
Task: "T015 [US1] Update architecture decision index links in docs/architecture/decisions/README.md"
```

## Parallel Example: User Story 3

```text
Task: "T028 [P] [US3] Add product-spec vs Spec Kit boundary note in docs/product/specs/auth-mobile-web.md"
Task: "T025 [US3] Populate canonical mapping table in specs/001-project-management-cleanup/artifacts/local-planning-mapping.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 tasks (`T011`-`T016`).
3. Validate source-of-truth discoverability.

### Incremental Delivery

1. Deliver US1 (source-of-truth clarity).
2. Deliver US2 (lifecycle consistency).
3. Deliver US3 (local mapping coverage).
4. Deliver US4 (archive/merge/rename/delete execution).
5. Run polish and close-out validation.

### Parallel Team Strategy

1. Contributor A: source-of-truth and lifecycle docs (`docs/planning/*`, `docs/README.md`).
2. Contributor B: mapping and cleanup artifacts in `specs/001-project-management-cleanup/artifacts/`.
3. Contributor C: archive/rename/delete execution and cross-reference updates.

---

## Notes

- All tasks remain local to documentation and Spec Kit artifacts.
- Any task requiring `src/`, `server.mjs`, or runtime behavior changes is out of scope for this feature and must be split into a separate feature.
