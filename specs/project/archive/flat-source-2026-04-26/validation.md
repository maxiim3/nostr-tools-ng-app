# Validation

Status: PASS  
Updated: 2026-04-26

This file records validation for the single-source-of-truth migration.

## Required Checks

| Check                                             | Status | Evidence                                                                                                                                                                         |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs/project/` exists and owns active planning  | PASS   | `specs/` now contains `project/` as the only feature/spec directory on disk                                                                                                      |
| Milestones are extracted                          | PASS   | `milestones.md` contains M1, M2, and M3                                                                                                                                          |
| Roadmap is extracted                              | PASS   | `roadmap.md` contains Now, Next, Later, priority themes, and sequencing rules                                                                                                    |
| User stories are extracted                        | PASS   | `user-stories.md` contains pack, auth, mobile UX, async UI, merge, feed, and zap stories                                                                                         |
| Features are extracted                            | PASS   | `features.md` contains the canonical feature registry                                                                                                                            |
| Tasks and handoff briefs are extracted            | PASS   | `tasks.md` contains the task board and detailed task briefs                                                                                                                      |
| Old active planning files are removed             | PASS   | `docs/planning/`, `docs/product/specs/`, and `specs/001-project-management-cleanup/` were removed from disk                                                                      |
| `.specify/feature.json` points to `specs/project` | PASS   | `.specify/feature.json` contains `"feature_directory": "specs/project"`                                                                                                          |
| Repo docs point to `specs/project/`               | PASS   | Stale-reference scan only finds removed paths inside `archive.md`, `plan.md`, `tasks.md`, and `validation.md`, where they are historical extraction records                      |
| No app source/server behavior changed             | PASS   | `git diff --name-status -- "src" ":(exclude)src/README.md"` and server/runtime config diff returned no app source or server paths; `src/README.md` changed as documentation only |
| Tooling ignore config change is intentional       | PASS   | `eslint.config.js` changed only to add generated/noise-path ignores required by implementation setup verification                                                                |
| Formatting passes                                 | PASS   | `bun run format:check` passed after `bun run format`                                                                                                                             |
| Commit safety                                     | PASS   | `specs/project/*` must be tracked together with the old-source deletions; otherwise links to the new source of truth would be missing from a commit                              |
| Speckit prerequisites pass                        | PASS   | `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` returns `FEATURE_DIR` as `specs/project` and includes `tasks.md`                           |
| Ignore-file setup verified                        | PASS   | `.gitignore`, `.dockerignore`, `.prettierignore`, and `eslint.config.js` cover detected Node/TypeScript, Docker, Prettier, and ESLint generated/noise paths                      |

## Final Result

PASS.

The project now has one active source of truth: `specs/project/`. Supporting docs under `docs/` and code-adjacent docs under `src/**/README.md` do not own active roadmap, milestone, task, user story, or feature status.

Before committing this migration, include the untracked `specs/project/*` files together with the deletions of the old active planning sources.
