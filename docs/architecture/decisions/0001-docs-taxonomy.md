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
- `planning/` for Active Planning
- `architecture/` for Architecture Decision and structural overview
- `references/` for Stable Reference constraints
- `history/` for History or Archive records
- `research/` for Research Input that is not yet normative
- `guides/` for documentation Guides

Feature specifications are split by audience:

- `docs/product/specs/` for product-facing focused specs
- top-level `specs/<feature>/` for Spec Kit implementation artifacts

## Consequences

- active documents keep stable non-date names while they are current
- historical records keep a separate location and are not treated as active planning
- `planning/board.md` owns active execution status
- `product/roadmap.md` owns product direction and sequencing, not board status detail
- top-level `specs/` is reserved for Spec Kit feature artifacts, not a generic docs catch-all
