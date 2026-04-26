# Feature Specification: Project Management Cleanup

**Feature Branch**: `001-project-management-cleanup`
**Created**: 2026-04-26
**Status**: Draft
**Input**: User description: "Define a brownfield project-management cleanup feature. Goal: clean up messy project management, planning docs, local tasks, Spec Kit artifacts, and documentation without changing app behavior. The spec should define current problems, target structure, document taxonomy, task/status lifecycle, how local planning records should map to local docs, what should be archived, merged, renamed, or deleted, and acceptance criteria for a cleaned-up project state."
**Related Source**: Existing local documentation under `docs/`, local planning docs, task records, and Spec Kit artifacts

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Find the Current Source of Truth (Priority: P1)

As a project maintainer, I want one obvious place to understand what work is active, what is planned, what is blocked, and what has already been completed so that I can resume project work without re-reading scattered or contradictory documents.

**Why this priority**: Cleanup only succeeds if the current state becomes discoverable. This is the minimum useful outcome for maintainers and agents.

**Independent Test**: A maintainer unfamiliar with the latest project state can identify the active work, current priorities, blocked work, and recently completed work in under 10 minutes using the cleaned documentation entry points.

**Acceptance Scenarios**:

1. **Given** the project contains multiple planning and documentation files, **When** a maintainer opens the documented entry point, **Then** they can identify the active execution source of truth and its relationship to roadmap, specs, references, and history.
2. **Given** a document contains stale or superseded planning information, **When** the maintainer reads it, **Then** the document either links to the current source of truth, is clearly archived, or has been merged into the appropriate current document.
3. **Given** two documents disagree about project status, **When** the cleanup is complete, **Then** the maintained taxonomy states which document wins and the losing document no longer presents itself as active guidance.

---

### User Story 2 - Manage Tasks Through a Consistent Lifecycle (Priority: P1)

As a contributor, I want every task to have a clear status, owner-neutral description, readiness level, dependency notes, and done criteria so that I can choose work and complete it without guessing what the task means.

**Why this priority**: The current cleanup is about project management. A consistent lifecycle prevents the cleaned documents from becoming messy again.

**Independent Test**: For a representative sample of active and planned tasks, a contributor can classify each task into one lifecycle state and determine the next action without asking for additional context.

**Acceptance Scenarios**:

1. **Given** a task is ready to execute, **When** a contributor reads it, **Then** it includes a stable identifier, target outcome, readiness status, dependencies, acceptance criteria, and references to relevant local documents or Spec Kit artifacts.
2. **Given** a task is blocked, **When** a contributor reads it, **Then** the blocker is explicit and the task is not mixed with ready work.
3. **Given** a task has been completed or superseded, **When** the cleanup is complete, **Then** it is moved out of active planning and remains discoverable through history or archive records.

---

### User Story 3 - Map Local Planning Records to Documentation (Priority: P2)

As a maintainer using local documentation and Spec Kit, I want a clear mapping between local tasks, planning records, feature specs, and documentation so that project management records do not duplicate, contradict, or lose work.

**Why this priority**: The cleanup is fully local. Local documents need explicit relationships so planning, feature specification, execution notes, and archive content stay coherent.

**Independent Test**: For each local planning record in scope, a maintainer can determine whether it is an active task, formal feature spec, supporting context, duplicate, superseded note, archive item, or out of scope.

**Acceptance Scenarios**:

1. **Given** a local planning file describes active or ready work, **When** the cleanup is complete, **Then** it links to the active board, feature spec, supporting context, or archive location that owns the work.
2. **Given** a local task belongs to a larger feature, **When** the cleanup is complete, **Then** the task references the corresponding local feature spec or states that no formal spec is needed.
3. **Given** two local records describe the same work, **When** the cleanup is complete, **Then** the duplicate relationship and retained source are clear.

---

### User Story 4 - Remove or Archive Documentation Noise (Priority: P2)

As a contributor or agent, I want obsolete, duplicate, and ambiguous docs archived, merged, renamed, or deleted according to explicit rules so that future work starts from a clean information architecture.

**Why this priority**: The cleanup must reduce cognitive load without losing important project history.

**Independent Test**: A reviewer can inspect the final document tree and classify every changed document as retained active guidance, archived history, merged content, renamed content, or deleted noise with a stated reason.

**Acceptance Scenarios**:

1. **Given** duplicate documents cover the same planning topic, **When** the cleanup is complete, **Then** only one active document remains and any useful unique content has been merged or archived.
2. **Given** a historical document is still useful for context, **When** the cleanup is complete, **Then** it is labeled or located as history and does not compete with active planning.
3. **Given** a document has no current or historical value, **When** the cleanup is complete, **Then** it is deleted and the cleanup summary records the deletion rationale.

### Edge Cases

- What happens when a document contains both current guidance and historical notes?
- What happens when two local planning records conflict about status or scope?
- What happens when a task has no obvious owner, priority, or acceptance criteria?
- What happens when a document is linked from several places but is obsolete?
- What happens when cleanup discovers a potentially useful task that does not belong in the current roadmap?
- What happens when deleting a document would break a useful reference chain?

## Requirements _(mandatory)_

### Current Problems

- Active work, planned work, blocked work, and completed work are spread across multiple documents and are not always easy to distinguish.
- Some planning documents contain historical notes beside current guidance, which makes it unclear which status is authoritative.
- Tasks do not consistently expose the same readiness information, dependencies, acceptance criteria, or local documentation references.
- Local planning records, feature specs, execution notes, and historical notes can duplicate each other, drift apart, or omit the relationship between them.
- Research, architecture, product direction, execution notes, and task records do not always make their role obvious from their location or title.
- Obsolete documents may still be linked as if they are active, while useful historical context may be mixed into current planning.

### Target Structure

- A single active execution document identifies current, ready, blocked, and recently completed work.
- Product direction is separated from execution status and describes why work matters rather than tracking every task.
- Feature specifications describe target outcomes and acceptance criteria for bounded work.
- Spec Kit artifacts hold formal feature specifications and downstream planning outputs for bounded work that needs structured analysis.
- Architecture decisions record durable structural choices and their rationale.
- Stable references contain rules or constraints that should not change with each task.
- Research documents remain non-normative inputs unless promoted into a reference, decision, spec, or task.
- Historical and archive documents preserve context without competing with active planning.

### Document Taxonomy

- **Product Direction**: vision, roadmap, positioning, and long-term sequencing.
- **Active Planning**: current execution board, ready tasks, blocked tasks, and recently completed work.
- **Feature Specification**: user outcomes, requirements, acceptance criteria, and measurable success criteria for one bounded feature or cleanup effort.
- **Architecture Decision**: accepted structural decision, alternatives considered, consequences, and supersession relationship when applicable.
- **Stable Reference**: durable rules, domain constraints, protocol constraints, policy, or operational guidance.
- **Research Input**: exploratory notes, inspiration, threat models, comparisons, or drafts that are not automatically binding.
- **History or Archive**: completed, superseded, or retained-for-context material that is explicitly non-active.

### Task and Status Lifecycle

- **Backlog**: potential work that is not ready for execution and may need shaping.
- **Ready**: work that has enough context, dependencies, and acceptance criteria to start.
- **In Progress**: work actively being executed now.
- **Blocked**: work that cannot proceed until a named decision, dependency, access, or validation is resolved.
- **Done**: work that met its acceptance criteria and no longer belongs in active execution.
- **Superseded**: work replaced by another task, decision, feature spec, or planning record.
- **Archived**: work retained for context but no longer actionable.

### Local Planning Mapping

- **Active Board Item**: the local execution board is the primary status tracker for the work.
- **Feature Spec**: a local Spec Kit feature spec owns the requirements and acceptance criteria for bounded work.
- **Supporting Context**: a local document provides product, architecture, reference, research, or historical context for a task.
- **Duplicate**: a local record repeats another local task, spec, or document and should point to the retained source.
- **Superseded**: a local record has been replaced by a newer task, spec, decision, or planning record.
- **Archived Context**: a local record is retained for context but is not active planning guidance.
- **No Formal Spec Needed**: a small local task is tracked directly in planning docs because a separate feature spec would not add value.

### Cleanup Actions

- **Retain**: keep as active guidance because the document or task is current, clear, and correctly located.
- **Merge**: move unique useful content into a retained active document and record the source.
- **Rename**: keep the content but change the name so the taxonomy role is obvious.
- **Archive**: move or label content as historical/non-active while preserving context.
- **Delete**: remove content that has no current or historical value after confirming no active requirement, decision, or task is lost.

### Functional Requirements

- **FR-001**: The cleanup MUST define a single active execution source of truth for current project work.
- **FR-002**: The cleanup MUST define a document taxonomy that distinguishes product direction, active planning, feature specifications, architecture decisions, stable references, research inputs, historical notes, and archives.
- **FR-003**: The cleanup MUST identify the current problems in the project-management system, including duplicate planning documents, unclear status, stale tasks, ambiguous sources of truth, local doc/task mismatch, and mixed active versus historical content.
- **FR-004**: The cleanup MUST define the target structure for project-management and documentation files, including where new planning notes, specs, task records, decisions, references, research, and history belong.
- **FR-005**: The cleanup MUST define a task lifecycle with the states Backlog, Ready, In Progress, Blocked, Done, Superseded, and Archived.
- **FR-006**: Each task retained as active or ready MUST include a stable identifier, user or maintainer outcome, status, priority or ordering signal, dependencies, acceptance criteria, and links to relevant local docs or Spec Kit artifacts.
- **FR-007**: The cleanup MUST define status transition rules, including what information is required to move a task into Ready, In Progress, Blocked, Done, Superseded, or Archived.
- **FR-008**: The cleanup MUST define how local planning records map to local docs using one of these relationships: active board item, feature spec, supporting context, duplicate, superseded, archived context, or no formal spec needed.
- **FR-009**: Every local planning record in cleanup scope MUST be mapped to an active board item, feature spec, supporting context, archive location, or documented exclusion.
- **FR-010**: Every active local task that belongs to a larger feature MUST link to its local feature spec, and every active local task without a feature spec MUST state why direct planning-board tracking is sufficient.
- **FR-011**: The cleanup MUST classify existing project-management documents and task records as retained, merged, renamed, archived, or deleted.
- **FR-012**: For merged documents, the cleanup MUST preserve unique current information in the retained active document and record where the content moved.
- **FR-013**: For renamed documents, the cleanup MUST preserve meaning, update references, and make the new name reflect the document taxonomy.
- **FR-014**: For archived documents, the cleanup MUST label them as non-active and preserve enough context to explain why they were kept.
- **FR-015**: For deleted documents, the cleanup MUST record the deletion reason and confirm that no current requirement, decision, or task is lost.
- **FR-016**: The cleanup MUST produce a final cleanup summary showing the before/after structure, local planning mapping summary, archived/merged/renamed/deleted items, and remaining follow-up items.
- **FR-017**: The cleanup MUST NOT require or introduce any change to application behavior, user-facing product behavior, runtime configuration, or production data.

### Key Entities _(include if feature involves data)_

- **Project Document**: A local file that contains product direction, active planning, feature detail, architecture decision, stable reference material, research input, historical record, or archive content.
- **Task Record**: A local unit of work with a stable identifier, status, priority/order, outcome, dependencies, acceptance criteria, local documentation mapping, and lifecycle history.
- **Spec Kit Feature Record**: A local feature directory that captures formal requirements, planning outputs, task breakdowns, and validation records for bounded work.
- **Local Planning Mapping**: The relationship between local planning records and local documentation, including whether a record is an active board item, feature spec, supporting context, duplicate, superseded item, archived context, or direct board-only task.
- **Archive Record**: A retained non-active document or task note that preserves historical context without competing with current planning.
- **Cleanup Summary**: The final audit record that lists what changed in the project-management system and how to validate the cleaned state.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A maintainer can identify the active work source, roadmap source, feature spec location, architecture decision location, and historical/archive location in under 10 minutes.
- **SC-002**: 100% of active and ready tasks have a lifecycle status, stable identifier, acceptance criteria, dependency notes, and local documentation or Spec Kit mapping.
- **SC-003**: 100% of local planning records in cleanup scope are mapped to active docs, formal feature specs, archives, duplicate/superseded records, or documented exclusions.
- **SC-004**: 0 active planning documents contain unresolved contradictions about task status or source-of-truth hierarchy.
- **SC-005**: 100% of documents touched by cleanup are classified as retained, merged, renamed, archived, or deleted in the cleanup summary.
- **SC-006**: A reviewer can validate from the cleanup summary that no application behavior change was part of the cleanup.

## Assumptions

- The cleanup is documentation and project-management only; application runtime behavior is out of scope.
- Local docs remain the only project-management system in scope for this cleanup.
- Spec Kit artifacts are used for bounded feature specifications and planning outputs, not as a replacement for the human-readable documentation taxonomy.
- The cleanup may create, move, rename, archive, or delete documentation and planning files, but it will not remove unique current decisions or active requirements without recording where they moved.
- Existing local historical docs are reviewed only when needed to resolve duplicates, superseded work, or useful context.
- No external tracker inventory, synchronization, or cleanup is in scope.
