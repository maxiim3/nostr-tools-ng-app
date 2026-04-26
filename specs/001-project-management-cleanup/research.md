# Research: Project Management Cleanup

## Decision: Keep the local docs system as the source of project-management truth

Rationale: The corrected scope is fully local. The existing documentation already has a role-based structure under `docs/`, and the cleanup should strengthen that structure rather than introduce another tracker.

Alternatives considered:

- External tracker mapping: rejected because it is explicitly out of scope.
- Single monolithic planning document: rejected because the repo already separates product direction, execution status, architecture, references, research, and history.

## Decision: Preserve `docs/planning/board.md` as active execution source

Rationale: Existing docs and ADR 0001 already define the board as the active execution source of truth. Keeping it avoids unnecessary churn and gives maintainers one stable entry point for current work.

Alternatives considered:

- Move active work into Spec Kit tasks: rejected because Spec Kit artifacts are feature-scoped, while the board is project-scoped.
- Use `execution-notes.md` as the source of truth: rejected because it is a handoff expansion of board items and already states that the board wins.

## Decision: Treat Spec Kit artifacts as bounded feature records

Rationale: The top-level `specs/` directory now holds formal feature specs, plans, contracts, and generated tasks. This is distinct from `docs/product/specs/`, which contains product-facing focused specs.

Alternatives considered:

- Merge Spec Kit artifacts into `docs/product/specs/`: rejected because planning artifacts include implementation planning and validation records, not just product spec content.
- Remove `docs/product/specs/`: rejected because product-facing specs remain useful and should not be conflated with execution artifacts.

## Decision: Use local planning mapping instead of issue mapping

Rationale: The feature needs a way to relate board items, task briefs, product specs, ADRs, references, research, history, and Spec Kit records. A local mapping model solves that without external dependencies.

Alternatives considered:

- No mapping model: rejected because it would leave duplicate and superseded records ambiguous.
- Only directory placement as mapping: rejected because relationships often cross taxonomy boundaries, such as a task referencing an ADR and a product spec.

## Decision: Require a cleanup summary

Rationale: The cleanup may merge, rename, archive, or delete documents. A summary provides the audit trail needed to prove no current requirement, decision, or active task was lost.

Alternatives considered:

- Rely on git history alone: rejected because reviewers need a human-readable before/after explanation.
- Inline notes in every changed document only: rejected because cross-document cleanup needs one consolidated validation point.
