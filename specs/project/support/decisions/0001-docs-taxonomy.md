# ADR 0001 — Documentation Taxonomy by Role

Date: 2026-04-23
Status: accepted

## Context

The old `docs/` tree mixed mission, architecture, active planning, historical journal, research, and specs under overly generic names.

This caused two recurring issues:

- maintainers could not quickly identify where to read or write
- agents could confuse active source-of-truth documents with historical or research context

## Decision

Supporting documentation is organized by explicit roles under `specs/project/support/`:

- `design/` for Product Direction and design references
- `architecture/` for architecture overview
- `decisions/` for ADRs
- `references/` for stable constraints
- `history/` for historical records
- `research/` for non-normative exploration
- `guides/` for contributor guides
- `incidents/` for diagnostics notes

Feature specifications and active planning now live together in the project source of truth:

- `specs/project/` for milestones, roadmap, queue, and feature execution
- `specs/project/support/design/` for supporting product/design references

## Consequences

- active documents keep stable non-date names while they are current
- historical records keep a separate location and are not treated as active planning
- `specs/project/` owns active execution status, roadmap, milestones, user stories, and tasks
- `specs/project/support/` owns supporting architecture, references, research, history, guides, design notes, and incidents
- top-level `specs/project/` is the project source of truth, not a generic docs catch-all
