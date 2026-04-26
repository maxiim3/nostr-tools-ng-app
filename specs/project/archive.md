# Planning Archive

Status: active  
Updated: 2026-04-26

This file records what was extracted, deleted, demoted, or superseded during the single-source-of-truth migration.

## Migration Summary

The previous cleanup made documentation less cluttered but kept `docs/planning/board.md` as the active source of truth. That did not meet the intended target.

This migration replaces that model with one canonical directory:

```text
specs/project/
```

## Extracted Sources

| Source                                  | Extracted Into                               | Result                                                  |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| `docs/product/mission.md`               | `spec.md`, `milestones.md`                   | Active product/milestone content moved to project specs |
| `docs/product/roadmap.md`               | `roadmap.md`                                 | Active roadmap moved to project specs                   |
| `docs/planning/board.md`                | `tasks.md`                                   | Active task status moved to project specs               |
| `docs/planning/execution-notes.md`      | `tasks.md`                                   | Task handoff briefs moved to project specs              |
| `docs/product/specs/auth-mobile-web.md` | `user-stories.md`, `features.md`, `tasks.md` | Auth mobile UX spec content moved to project specs      |
| `docs/history/auth-refactor-journal.md` | `tasks.md`, `features.md`, `references.md`   | Historical task context retained as supporting history  |
| `docs/product/landing-page-design.md`   | `roadmap.md`, `references.md`                | Kept as design reference only                           |
| `docs/bug-api.md`                       | `user-stories.md`, `references.md`           | Kept as local troubleshooting reference only            |
| `specs/001-project-management-cleanup/` | `archive.md`, `validation.md`                | Superseded by this project source of truth              |

## Deleted Or Superseded Active Planning Records

These records no longer own active planning after extraction:

- `docs/planning/board.md`
- `docs/planning/execution-notes.md`
- `docs/product/roadmap.md`
- `docs/product/specs/auth-mobile-web.md`
- `docs/product/mission.md`
- `specs/001-project-management-cleanup/`

## Retained Supporting Records

These records remain useful but are not active planning sources:

- `docs/architecture/`
- `docs/references/`
- `docs/research/`
- `docs/history/`
- `docs/guides/`
- `docs/product/landing-page-design.md`
- `docs/bug-api.md`

## Previously Deleted Standalone Task Briefs

The prior cleanup already merged and deleted these standalone task files into `docs/planning/execution-notes.md`. Their useful content is now carried forward into `specs/project/tasks.md`:

- `docs/planning/P0_INFRA-01_READY.md`
- `docs/planning/P0_AUTH-07_READY.md`
- `docs/planning/P1_AUTH-08_TODO.md`
- `docs/planning/P1_UI-01_READY.md`
- `docs/planning/P1_UI-02_TODO.md`
- `docs/planning/P2_AUTH-03_TODO.md`
- `docs/planning/P2_AUTH-04_TODO.md`
- `docs/planning/P2_DOC-03_TODO.md`
- `docs/planning/P3_AUTH-05_READY.md`

## Behavior Statement

This migration changes documentation and project-management structure only. It does not change application runtime behavior, production data, API behavior, or source code under `src/`.
