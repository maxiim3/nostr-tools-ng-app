# Taxonomy Matrix

Date: 2026-04-26
Inputs:

- `docs/README.md`
- `docs/planning/board.md`
- `specs/001-project-management-cleanup/contracts/documentation-governance.md`

## Role Alignment Matrix (Baseline Before Wording Normalization)

| Contract Role         | Contract Active Location                     | Current Coverage in Docs Index               | Gap Before T009/T010                                                           |
| --------------------- | -------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| Product Direction     | `docs/product/`                              | Covered via mission/roadmap links.           | Role label not expressed with exact contract term.                             |
| Active Planning       | `docs/planning/`                             | Covered via board and execution notes links. | Source-of-truth wording is present but not normalized across all docs.         |
| Feature Specification | `docs/product/specs/` or `specs/<feature>/`  | Product specs are linked.                    | Top-level Spec Kit feature artifact boundary not explicit in navigation table. |
| Architecture Decision | `docs/architecture/decisions/`               | ADR index is linked.                         | ADR index entries are plain text (no direct links).                            |
| Stable Reference      | `docs/references/`                           | Reference docs are linked.                   | Role label can be normalized.                                                  |
| Research Input        | `docs/research/`                             | Research docs are linked.                    | Role label can be normalized.                                                  |
| History or Archive    | `docs/history/` or explicit archive location | History doc is linked.                       | Role label can be normalized.                                                  |
| Guide                 | `docs/guides/`                               | Mermaid guide is linked.                     | Role label can be normalized.                                                  |

## Source-of-Truth Rule Matrix

| Rule (Contract)                                                    | Baseline Evidence                                                                   | Action in MVP Slice                                        |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `docs/planning/board.md` owns active execution status              | Explicit in board and docs index.                                                   | Normalize wording across board/execution/index.            |
| `docs/product/roadmap.md` owns product direction (not task status) | Explicit in board and docs index.                                                   | Keep and normalize wording.                                |
| `docs/architecture/decisions/` owns accepted decisions             | Implicit in ADR index and docs index.                                               | Improve discoverability with direct links in ADR index.    |
| Top-level `specs/` owns Spec Kit artifacts                         | Present in plan and contract, not explicit in docs index baseline navigation table. | Add explicit boundary statement in docs index conventions. |
| `docs/product/specs/` owns product-facing specs                    | Present in docs index conventions.                                                  | Keep and normalize language.                               |

## MVP Usage

This matrix is the baseline input for taxonomy language normalization in:

- `docs/README.md` (T009, T014)
- `docs/architecture/decisions/0001-docs-taxonomy.md` (T010)
- `docs/architecture/decisions/README.md` (T015)
