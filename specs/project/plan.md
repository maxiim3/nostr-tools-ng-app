# Implementation Plan: Project Source Of Truth Migration

**Branch**: `001-project-management-cleanup` | **Date**: 2026-04-26 | **Spec**: [spec.md](spec.md)
**Input**: Project source from `specs/project/` and the cleanup/replanning request.
**Related project input**: [archive.md](archive.md), [validation.md](validation.md), previous local docs under `docs/`, and Spec Kit artifacts superseded by this migration.

## Summary

Move ToolStr project management to one canonical source of truth under `specs/project/`. The migration extracts milestones, roadmap, user stories, features, tasks, and implementation handoff briefs from the old documentation system; removes competing active planning files; updates repository pointers and Spec Kit templates; and validates that runtime behavior is unchanged.

## Technical Context

**Language/Version**: Documentation/project-management migration only; no runtime language changes.
**Primary Dependencies**: Markdown documentation, Spec Kit scripts/templates, repository documentation conventions.
**Storage**: Local files only; no runtime storage or production data touched.
**Testing**: `bun run format:check`; manual stale-reference and changed-path validation.
**Target Platform**: Local repository documentation consumed by maintainers, Speckit, and agents.
**Project Type**: Brownfield documentation/specification system migration.
**Performance Goals**: Maintainer can find milestones, roadmap, tasks, user stories, and feature status in one directory without following old active planning links.
**Constraints**: One active planning source only; no app behavior changes; no runtime config changes; no external tracker work; preserve useful historical/reference context.
**Scale/Scope**: `specs/project/`, `.specify/feature.json`, `.specify/templates/`, `.specify/memory/constitution.md`, top-level docs pointers, supporting docs under `docs/`, and `src/README.md` links.

## Constitution Check

_GATE: Must pass before implementation. Re-check after validation._

- **Angular/TypeScript**: PASS. No application source behavior changes are planned or made.
- **Accessibility**: PASS. No user-facing UI changes are planned or made.
- **Feature boundaries**: PASS. This migration affects documentation, Spec Kit metadata, and project-management artifacts only.
- **Nostr auth/security**: PASS. Nostr auth references may be relinked, but auth behavior and protocol rules are not changed.
- **Verification**: PASS. Verification uses repo scripts and manual documentation checks.

## Project Structure

### Project Source Of Truth

```text
specs/project/
├── README.md
├── spec.md
├── plan.md
├── milestones.md
├── roadmap.md
├── user-stories.md
├── features.md
├── tasks.md
├── references.md
├── archive.md
└── validation.md
```

### Supporting Documentation

```text
docs/
├── README.md
├── architecture/
├── guides/
├── history/
├── product/
│   └── landing-page-design.md
├── references/
└── research/
```

### Removed Competing Sources

```text
docs/planning/
docs/product/mission.md
docs/product/roadmap.md
docs/product/specs/
specs/001-project-management-cleanup/
```

**Structure Decision**: `specs/project/` owns all active project-management content. `docs/` remains only for architecture, reference, research, history, guide, and product-design support material. Future Speckit templates must point work back to `specs/project/` instead of recreating competing active feature directories.

## Complexity Tracking

No constitution violations or complexity exceptions are required.

## Implementation Phases

### Phase 1: Create Canonical Project Source

- Create the `specs/project/` directory and canonical files.
- Extract project specification, milestones, roadmap, user stories, feature registry, task board, references, archive, and validation records.

### Phase 2: Remove Competing Sources

- Delete old active planning docs and the superseded cleanup feature directory after extraction.
- Keep supporting docs only where they do not own active planning status.

### Phase 3: Update Pointers And Templates

- Update repository docs and Spec Kit metadata to point to `specs/project/`.
- Update templates and constitution language so future generated work does not recreate competing active planning sources.

### Phase 4: Validate And Close Out

- Verify stale references only remain in archive/validation history.
- Verify removed directories are absent.
- Verify no runtime app/config paths changed.
- Run `bun run format:check`.

## Validation Results

Current validation is recorded in [validation.md](validation.md).

Post-implementation Constitution Check:

- **Angular/TypeScript**: PASS. Runtime source code is unchanged except `src/README.md` documentation links.
- **Accessibility**: PASS. No UI changed.
- **Feature boundaries**: PASS. Active planning now lives under `specs/project/`; supporting docs are demoted.
- **Nostr auth/security**: PASS. Stable Nostr auth rules remain in `docs/references/nostr-auth-rules.md` and are linked from `specs/project/references.md`.
- **Verification**: PASS. `bun run format:check` passes.
