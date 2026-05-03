# ADR 0001 - Documentation Taxonomy by Role

Date: 2026-04-23  
Status: accepted

## Context

The old documentation tree mixed mission, architecture, active planning, historical journal, research, and specs under overly generic names.

This caused two recurring issues:

- Maintainers could not quickly identify where to read or write.
- Agents could confuse active source-of-truth documents with historical or research context.

## Decision

Documentation is organized by role under `docs/`:

- `product/` for roadmap, milestones, and product limits.
- `features/` for active and planned feature briefs.
- `architecture/` for implementation architecture and decisions.
- `auth/` for stable Nostr auth and security constraints.
- `design/` for product and visual design references.
- `operations/` for diagnostics and troubleshooting notes.
- `contributing/` for contributor guides.

BMAD planning artifacts remain under `_bmad-output/`, but generated planning output does not override current implementation facts or maintained docs.

## Consequences

- Active documents keep stable non-date names while current.
- Historical migration records are removed or kept only as explicitly marked history.
- `docs/` owns maintained project documentation.
- `_bmad-output/` owns generated planning/agent artifacts.
