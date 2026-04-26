# Project Source of Truth

Status: active  
Updated: 2026-04-26

This directory is the only active project-management source of truth for ToolStr.

Use this directory to answer:

- what the product is
- which milestones exist
- what is active now
- what is planned next
- which tasks are ready, blocked, done, or in backlog
- which user stories and acceptance criteria define the work
- which supporting docs, ADRs, references, and research inputs apply

## Files

| File                               | Purpose                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| [spec.md](spec.md)                 | Project specification, scope, source-of-truth contract, product identity  |
| [milestones.md](milestones.md)     | Canonical milestones and milestone-level acceptance criteria              |
| [roadmap.md](roadmap.md)           | Now, Next, Later sequencing and priority themes                           |
| [user-stories.md](user-stories.md) | Canonical user stories and acceptance criteria                            |
| [features.md](features.md)         | Feature registry with status, dependencies, and linked tasks              |
| [tasks.md](tasks.md)               | Canonical task board, lifecycle states, and implementation handoff briefs |
| [references.md](references.md)     | Supporting docs, ADRs, research, references, and code-adjacent docs       |
| [archive.md](archive.md)           | Extracted, deleted, demoted, or superseded planning records               |
| [validation.md](validation.md)     | Validation checks for the single-source-of-truth cleanup                  |

## Authority Rules

- `specs/project/` owns active planning, roadmap, milestones, tasks, user stories, feature status, and next actions.
- `docs/` contains supporting documentation only. It does not own active planning status.
- If any retained doc conflicts with this directory about project status, this directory wins.
- New active work must be added to [tasks.md](tasks.md) and linked to a feature in [features.md](features.md).
- New user-facing behavior should have a user story in [user-stories.md](user-stories.md) before implementation unless the task is explicitly marked as a small direct task.

## Current Next Action

Start from [tasks.md](tasks.md). The highest-priority ready task is `INFRA-01`, unless `AUTH-02` is still actively being tested in the current session.
