# Task Record Template (Reusable)

Date: 2026-04-26
Purpose: Standard task record fields for local planning docs and board-backed briefs.

## Template

```markdown
# <PRIORITY> <TASK-ID> <LIFECYCLE>

Task: `<TASK-ID>` <short label>

Lifecycle: Backlog | Ready | In Progress | Blocked | Done | Superseded | Archived
Priority: P0 | P1 | P2 | P3 | lane-order signal
Outcome: <user/maintainer outcome>
Planning location: <docs path that owns current status>

Dependencies: <task ids / decision / validation / access> | none
Blocker: <required only when Lifecycle = Blocked>

Acceptance criteria:

- <observable done condition>
- <observable done condition>

Mapping:

- Relationship: Active Board Item | Feature Spec | Supporting Context | Duplicate | Superseded | Archived Context | No Formal Spec Needed
- Target: <local doc or specs path>
- Rationale: <why this mapping is correct>

Next action:
<single next step that moves task forward>

Lifecycle history:

| Date       | From        | To          | Reason |
| ---------- | ----------- | ----------- | ------ |
| YYYY-MM-DD | <old state> | <new state> | <why>  |
```

## Minimum Field Rules

- `Backlog`, `Ready`, `In Progress`, and `Blocked` records must include all fields except `Blocker`
  (required only for `Blocked`).
- `Done`, `Superseded`, and `Archived` records should preserve outcome, mapping, and lifecycle history.
- If no feature spec exists, mapping must include `No Formal Spec Needed` with rationale.
