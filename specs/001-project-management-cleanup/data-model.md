# Data Model: Project Management Cleanup

## Project Document

Represents a local documentation file.

Fields:

- `path`: repository-relative file path.
- `title`: document heading or intended display name.
- `taxonomyRole`: product direction, active planning, feature specification, architecture decision, stable reference, research input, history/archive, guide, or code-adjacent documentation.
- `status`: active, draft, historical, archived, superseded, or deleted.
- `authority`: source of truth, supporting context, non-normative input, or historical record.
- `owners`: role-based maintainers, if known.
- `linksTo`: local documents or Spec Kit artifacts referenced by the document.
- `linkedFrom`: local documents that reference this document.
- `cleanupAction`: retain, merge, rename, archive, delete, or unchanged.
- `cleanupRationale`: why the selected action is correct.

Validation rules:

- Every active document must have one clear taxonomy role.
- A historical or archived document must not present itself as active guidance.
- A deleted document must have a recorded deletion rationale.
- A merged document must name its retained destination.

## Task Record

Represents a local unit of project-management work.

Fields:

- `id`: stable local task identifier.
- `title`: short task label.
- `outcome`: user, maintainer, or project-management outcome.
- `status`: backlog, ready, in progress, blocked, done, superseded, or archived.
- `priority`: ordering signal such as P0, P1, P2, or P3.
- `dependencies`: local tasks, decisions, validations, or access needs.
- `acceptanceCriteria`: observable done conditions.
- `planningLocation`: local file where the task is tracked.
- `mapping`: local planning mapping relationship.
- `relatedDocs`: local context documents or Spec Kit artifacts.

Validation rules:

- Active and ready tasks must have `id`, `outcome`, `status`, `acceptanceCriteria`, and `planningLocation`.
- Blocked tasks must name the blocker.
- Done, superseded, and archived tasks must not appear as active work.

State transitions:

- Backlog -> Ready when scope, dependencies, and acceptance criteria are clear.
- Ready -> In Progress when work starts.
- In Progress -> Blocked when a named blocker prevents completion.
- Blocked -> Ready when the blocker is resolved.
- In Progress -> Done when acceptance criteria are met.
- Any active state -> Superseded when replaced by a newer task, spec, decision, or plan.
- Any non-active state -> Archived when retained only for context.

## Spec Kit Feature Record

Represents a formal local feature directory under `specs/`.

Fields:

- `path`: feature directory.
- `featureName`: feature title.
- `branch`: associated branch name, if any.
- `specFile`: requirements document.
- `planFile`: implementation planning document, if generated.
- `taskFile`: generated tasks document, if generated.
- `contracts`: local contracts generated for the feature.
- `status`: draft, planned, tasks-ready, implemented, superseded, or archived.
- `relatedPlanningRecords`: board items or local task records that reference the feature.

Validation rules:

- Feature records must not replace the project-wide active board.
- Feature records must link back to active planning when they are current.
- Superseded feature records must name the replacing record.

## Local Planning Mapping

Represents the relationship between local task/planning records and local documentation.

Fields:

- `sourcePath`: local record being mapped.
- `targetPath`: retained source, supporting context, spec, archive, or board item.
- `relationship`: active board item, feature spec, supporting context, duplicate, superseded, archived context, or no formal spec needed.
- `rationale`: why the relationship was selected.

Validation rules:

- Every active planning record in scope must have a mapping.
- Duplicate and superseded mappings must identify the retained source.
- No formal spec needed must explain why direct planning-board tracking is sufficient.

## Archive Record

Represents retained non-active context.

Fields:

- `path`: archive or history location.
- `sourcePath`: previous location, if moved.
- `reason`: why the content was archived.
- `supersededBy`: active document or task that replaces it, if applicable.
- `retainedValue`: what historical context remains useful.

Validation rules:

- Archive records must be clearly non-active.
- Archive records must not be required to understand current task status.

## Cleanup Summary

Represents the final audit record for the cleanup.

Fields:

- `date`: cleanup completion date.
- `scope`: included directories and excluded areas.
- `beforeStructure`: high-level starting layout.
- `afterStructure`: final layout.
- `retained`: unchanged active documents.
- `merged`: sources and destinations.
- `renamed`: old and new paths.
- `archived`: archive records.
- `deleted`: deleted files and rationale.
- `mappingSummary`: local planning mapping coverage.
- `remainingFollowUps`: deferred cleanup items.
- `behaviorChangeStatement`: confirmation that app behavior did not change.

Validation rules:

- Every touched document must appear in exactly one action category.
- Remaining follow-ups must be explicit and not block the cleaned state.
- The behavior change statement must confirm that runtime behavior was untouched.
