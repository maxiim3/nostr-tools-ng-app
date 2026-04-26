# Contract: Documentation Governance

## Scope

This contract defines the local documentation and project-management rules that the cleanup must satisfy. It applies to `docs/`, local planning records, and Spec Kit feature artifacts under `specs/`.

It does not cover application runtime behavior, production data, external trackers, or code architecture changes.

## Required Taxonomy

Each maintained document must belong to exactly one primary role:

| Role                  | Purpose                                                                                 | Active Location                                                   |
| --------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Product Direction     | Product mission, roadmap, positioning, and long-term sequencing                         | `docs/product/`                                                   |
| Active Planning       | Current work, ready work, blocked work, recently completed work, and task handoff notes | `docs/planning/`                                                  |
| Feature Specification | Bounded user/project-management outcomes and acceptance criteria                        | `docs/product/specs/` or `specs/<feature>/` depending on audience |
| Architecture Decision | Durable structural decisions and consequences                                           | `docs/architecture/decisions/`                                    |
| Stable Reference      | Rules and constraints that guide repeated work                                          | `docs/references/`                                                |
| Research Input        | Non-normative exploration and inspiration                                               | `docs/research/`                                                  |
| History or Archive    | Completed, superseded, or retained-for-context records                                  | `docs/history/` or another explicitly archived location           |
| Guide                 | How to read, maintain, or contribute to the documentation                               | `docs/guides/`                                                    |

## Source-of-Truth Rules

- `docs/planning/board.md` owns active execution status.
- `docs/product/roadmap.md` owns product direction and sequencing, not detailed task status.
- `docs/architecture/decisions/` owns accepted architectural decisions.
- `docs/references/` owns durable rules and constraints.
- `docs/research/` is non-normative until promoted into a reference, decision, spec, or task.
- Top-level `specs/` owns Spec Kit feature artifacts.
- `docs/product/specs/` owns product-facing focused specs.

## Task Lifecycle Contract

Allowed states:

- Backlog
- Ready
- In Progress
- Blocked
- Done
- Superseded
- Archived

Required fields for active or ready tasks:

- stable identifier
- outcome
- status
- priority or ordering signal
- dependencies or "none"
- acceptance criteria
- planning location
- local documentation or Spec Kit mapping

Blocked tasks must name the blocker. Done, superseded, and archived tasks must not appear as current work.

## Local Planning Mapping Contract

Every local planning record in cleanup scope must map to one relationship:

- Active Board Item
- Feature Spec
- Supporting Context
- Duplicate
- Superseded
- Archived Context
- No Formal Spec Needed

Duplicate and superseded records must point to the retained source. Records marked "No Formal Spec Needed" must explain why direct board tracking is enough.

## Cleanup Action Contract

Every touched document must be classified as one action:

- Retain
- Merge
- Rename
- Archive
- Delete

Merge actions must name the destination. Rename actions must update inbound references. Archive actions must mark the content as non-active. Delete actions must record why no current requirement, decision, or active task is lost.

## Validation Contract

Cleanup is acceptable only when:

- a maintainer can find active work, roadmap, feature specs, architecture decisions, references, and archive/history locations in under 10 minutes;
- all active and ready tasks satisfy the lifecycle contract;
- all local planning records in scope have a mapping;
- no active planning documents contradict the source-of-truth rules;
- all touched documents appear in the cleanup summary;
- the cleanup summary states that app behavior was not changed.
