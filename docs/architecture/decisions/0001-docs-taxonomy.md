# ADR 0001 — Documentation Taxonomy by Role

Date: 2026-04-23
Status: accepted

## Context

The `docs/` tree previously mixed mission, architecture, active planning, historical journal, research, and specs under overly generic names.

This caused two recurring issues:

- maintainers could not quickly identify where to read or write
- agents could confuse active source-of-truth documents with historical or research context

## Decision

`docs/` is organized by explicit roles:

- `product/` for Product Direction
- top-level `specs/project/` for active project planning
- `architecture/` for Architecture Decision and structural overview
- `references/` for Stable Reference constraints
- `history/` for History or Archive records
- `research/` for Research Input that is not yet normative
- `guides/` for documentation Guides

Feature specifications and active planning now live together in the project source of truth:

- `specs/project/` for milestones, roadmap, user stories, features, and tasks
- `docs/product/` only for supporting product/design references

## Consequences

- active documents keep stable non-date names while they are current
- historical records keep a separate location and are not treated as active planning
- `specs/project/` owns active execution status, roadmap, milestones, user stories, and tasks
- `docs/` owns supporting architecture, references, research, history, guides, and product design notes
- top-level `specs/project/` is the project source of truth, not a generic docs catch-all
