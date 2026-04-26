# Quickstart: Validate the Project Management Cleanup

## Purpose

Use this checklist after implementation to verify that the local documentation and project-management system is clean, navigable, and behavior-neutral.

## 1. Confirm Scope

Included:

- `docs/`
- `specs/001-project-management-cleanup/`
- local planning records and references needed to keep navigation accurate

Excluded:

- application runtime behavior
- production data
- external tracker synchronization
- unrelated source code changes

## 2. Validate Source-of-Truth Discovery

Starting from `docs/README.md`, confirm a maintainer can find these in under 10 minutes:

- active execution source
- roadmap/product direction
- feature specs
- architecture decisions
- stable references
- research inputs
- history/archive content
- Spec Kit feature artifacts

Pass condition: each destination is linked or named clearly, and its role is unambiguous.

## 3. Validate Task Lifecycle

Inspect active and ready tasks in the planning area.

Each active or ready task must include:

- stable identifier
- lifecycle status
- outcome
- priority or ordering signal
- dependencies or "none"
- acceptance criteria
- local documentation or Spec Kit mapping

Pass condition: no active or ready task requires guessing the next action.

## 4. Validate Local Planning Mapping

For every planning record in scope, classify it as:

- Active Board Item
- Feature Spec
- Supporting Context
- Duplicate
- Superseded
- Archived Context
- No Formal Spec Needed

Pass condition: duplicates and superseded records point to retained sources, and all active work has a clear owner document.

## 5. Validate Cleanup Actions

Review the cleanup summary.

Every touched document must be listed under exactly one action:

- retained
- merged
- renamed
- archived
- deleted

Pass condition: merged, renamed, archived, and deleted items include enough rationale to review without reading the entire git diff.

## 6. Validate No App Behavior Change

Confirm the cleanup summary states that app behavior was not changed.

Run:

```bash
bun run format:check
```

Pass condition: formatting passes, and the diff is limited to documentation, Spec Kit artifacts, and documentation navigation/context files.
