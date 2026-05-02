# Project Source of Truth

Status: active  
Updated: 2026-04-26

This directory is the only active project-management source of truth for ToolStr.

## Structure

| Path                           | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| [queue.md](queue.md)           | Ordered execution queue (`ID-NAME`) and lifecycle status            |
| [milestones.md](milestones.md) | Milestone-level outcomes and acceptance criteria                    |
| [roadmap.md](roadmap.md)       | Now/Next/Later sequencing                                           |
| [features/](features/)         | Actionable feature units, one folder per feature                    |
| [support/](support/)           | Architecture, ADRs, references, research, design, incidents, guides |
| [archive/](archive/)           | Superseded planning formats and historical snapshots                |

## Feature Naming Contract

Feature directories MUST use execution order IDs:

`<id>-<name>`

Examples:

- `001-auto-admit-pack-members`
- `002-session-restore`
- `003-extension-auth-loading`

Inside each feature:

- `spec.md` defines the outcome and acceptance criteria.
- `plan.md` defines implementation strategy and risks.
- `tasks.md` defines executable tasks and dependencies.

## Authority Rules

- `specs/project/features/` owns active implementation work.
- `specs/project/queue.md` owns execution order and status.
- `specs/project/support/` is reference-only and does not own active status.
- If support docs conflict with queue/feature files, queue/feature files win.

## Current Entry Point

Start with [queue.md](queue.md), then open the first non-completed feature folder.
