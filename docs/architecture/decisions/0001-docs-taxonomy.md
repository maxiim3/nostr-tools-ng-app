# ADR 0001 — Documentation Taxonomy by Role

Date: 2026-04-23
Status: accepted

## Context

Le dossier `docs/` melangeait auparavant mission, architecture, board actif, journal historique, inspirations et specs sous des noms trop generiques.

Le cout etait double :

- un humain ne savait pas vite ou lire ou ecrire
- un agent pouvait confondre source de verite active, historique et recherche

## Decision

Le dossier `docs/` est organise par role documentaire :

- `product/` pour la vision, la roadmap et les specs produit
- `planning/` pour le board d'execution actif
- `architecture/` pour la vue d'ensemble et les ADR
- `references/` pour les contraintes stables
- `history/` pour les journaux historiques
- `research/` pour les inspirations et inputs non normatifs
- `guides/` pour les guides de lecture et de contribution

## Consequences

- les documents actifs ont des noms stables, non dates, quand ils sont vivants
- les journaux et traces historiques gardent une place separee
- `planning/board.md` devient la source de verite active pour l'execution
- `product/roadmap.md` porte la direction, pas le detail du board
- `specs/` n'existe plus comme dossier fourre-tout
