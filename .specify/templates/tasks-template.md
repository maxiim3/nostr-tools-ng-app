---
description: 'Task list template for ToolStr feature implementation'
---

# Tasks: [FEATURE NAME]

**Input**: Project source from `/specs/project/` and approved feature-specific notes
**Prerequisites**: plan.md (required), spec.md (required for user stories),
research.md, data-model.md, contracts/

**Tests**: Include tests for auth, signer restore, storage persistence,
admin-protected backend behavior, data validation, reusable async UI patterns,
and any user-facing regression risk. For low-risk documentation-only changes,
state why tests are not applicable.

**Organization**: Tasks are grouped by independently testable user story or
operational outcome.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no
  dependency on unfinished tasks
- **[Story]**: Which user story or outcome this task belongs to (e.g. US1, OPS1)
- Include exact file paths in descriptions
- Include the repo script verification task needed for the change

## Path Conventions

- Angular app: `src/app/`, `src/core/`, `src/features/`, `src/shared/`
- Feature layers: `domain/`, `application/`, `infrastructure/`, `presentation/`
- i18n: `src/assets/i18n/`
- Bun API: `server.mjs`, `server.test.mjs`
- Documentation: `specs/project/`, `docs/`, `src/**/README.md`

<!--
  The /speckit.tasks command MUST replace the sample tasks below with actual
  tasks based on spec.md, plan.md, research.md, data-model.md, and contracts/.
  Do not keep sample tasks in generated tasks.md files.
-->

## Phase 1: Setup (Shared Understanding)

**Purpose**: Confirm scope, files, and quality gates before implementation.

- [ ] T001 Review active source documents named in plan.md and record scope in
      specs/project/plan.md
- [ ] T002 Identify exact Angular/service/server/docs files affected by this
      feature
- [ ] T003 [P] Confirm repo verification scripts required for this change from
      package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts or adapters that block user story work.

**CRITICAL**: No dependent user story work can begin until this phase is
complete.

Examples of foundational tasks (adjust based on the plan):

- [ ] T004 Define or update domain types/contracts in
      src/features/[domain]/domain/[name].ts
- [ ] T005 [P] Add failing targeted tests for shared auth/storage/UI behavior in
      [exact test file]
- [ ] T006 [P] Update application port or facade contract in
      src/features/[domain]/application/[name].ts
- [ ] T007 Implement protocol/storage adapter changes in
      src/features/[domain]/infrastructure/[name].ts or src/core/[area]/[name].ts
- [ ] T008 Update i18n labels in src/assets/i18n/[locale].json when UI text
      changes

**Checkpoint**: Shared contracts are stable and user story implementation can
start.

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1

- [ ] T009 [P] [US1] Add Angular/service/domain test for [behavior] in
      [exact .spec.ts file]
- [ ] T010 [P] [US1] Add server/API test for [protected endpoint or storage
      behavior] in server.test.mjs, if backend is affected
- [ ] T011 [P] [US1] Add accessibility or interaction coverage for [flow] where
      the existing test setup supports it

### Implementation for User Story 1

- [ ] T012 [US1] Implement domain/application behavior in
      src/features/[domain]/[layer]/[file].ts
- [ ] T013 [US1] Implement adapter/service behavior in
      src/core/[area]/[file].ts or src/features/[domain]/infrastructure/[file].ts
- [ ] T014 [US1] Implement presentation behavior in
      src/features/[domain]/presentation/[file].ts
- [ ] T015 [US1] Add loading, disabled, cancellation, timeout, retry, and focus
      handling where applicable
- [ ] T016 [US1] Ensure secrets/tokens/auth URLs are not logged or displayed

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2

- [ ] T017 [P] [US2] Add targeted test for [behavior] in [exact test file]
- [ ] T018 [P] [US2] Add regression coverage for interaction with US1 in
      [exact test file], if needed

### Implementation for User Story 2

- [ ] T019 [US2] Implement behavior in [exact source file]
- [ ] T020 [US2] Integrate with US1 components/services without breaking
      independent testability
- [ ] T021 [US2] Update i18n/docs/contracts affected by the story

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3

- [ ] T022 [P] [US3] Add targeted test for [behavior] in [exact test file]

### Implementation for User Story 3

- [ ] T023 [US3] Implement behavior in [exact source file]
- [ ] T024 [US3] Update related documentation or i18n entries

**Checkpoint**: All selected user stories are independently functional.

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final work that affects multiple stories.

- [ ] TXXX [P] Update documentation in docs/ or src/\*\*/README.md
- [ ] TXXX [P] Run `bun run format:check`
- [ ] TXXX [P] Run `bun run lint`
- [ ] TXXX [P] Run `bun run lint:css`
- [ ] TXXX [P] Run `bun run typecheck`
- [ ] TXXX [P] Run `bun run test`
- [ ] TXXX Run `bun run build` or `bun run check` when required by risk/scope
- [ ] TXXX Validate quickstart.md or manual device/browser notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup; blocks dependent stories
- **User Stories (Phase 3+)**: Depend on relevant foundational contracts
- **Polish (Final Phase)**: Depends on selected stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after required foundational tasks
- **User Story 2 (P2)**: Can start after required foundational tasks; may
  integrate with US1 while remaining independently testable
- **User Story 3 (P3)**: Can start after required foundational tasks; may
  integrate with US1/US2 while remaining independently testable

### Within Each User Story

- Tests for required behavior come before or alongside implementation
- Domain/application contracts before adapters
- Adapters/services before presentation binding
- Core implementation before i18n/docs polish
- Story complete before moving to the next priority unless parallel work is safe

### Parallel Opportunities

- Tasks marked [P] can run in parallel when they touch different files and have
  no dependency relationship
- Tests in different files can run in parallel
- Independent user stories can run in parallel after shared contracts are stable

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational tasks required for US1
3. Complete Phase 3: User Story 1
4. Stop and validate User Story 1 independently
5. Run the repo scripts listed for the feature

### Incremental Delivery

1. Complete shared contracts once
2. Deliver User Story 1 and verify independently
3. Deliver User Story 2 and verify independently
4. Deliver additional stories without regressing earlier stories
5. Finish with documentation and repo-script verification

### Parallel Team Strategy

1. Team completes Setup and shared contracts together
2. Developers split independent stories or tests by file ownership
3. Integration waits until independently verified story slices are complete

---

## Notes

- [P] tasks must not touch the same files or rely on unfinished changes
- For auth work, include timeout, cancellation, logout cleanup, restore failure,
  permission scope, and token redaction tasks
- For storage work, include persistence, environment configuration, migration,
  and documentation tasks
- For UI work, include focus, keyboard, accessible name, disabled/loading, and
  contrast validation tasks
