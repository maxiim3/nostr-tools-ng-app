# Delivery Board

Date: 2026-04-23
Updated: 2026-04-26
Status: active

## Role of this document

`docs/planning/board.md` is the authoritative source of truth for active execution status.

It tracks:

- work in progress
- work ready to start
- work currently blocked
- work completed recently

This document does not replace product direction planning.
Use `../product/roadmap.md` for product sequencing and direction.

If this board conflicts with handoff notes or historical records, this board wins for active status.

## Task Lifecycle Definitions

- `Backlog`: candidate work not ready to execute yet.
- `Ready`: work can start without new product or architecture decisions.
- `In Progress`: work currently being executed.
- `Blocked`: work cannot proceed until a named blocker is resolved.
- `Done`: work met acceptance criteria and is no longer active execution.
- `Superseded`: work replaced by a newer task, spec, decision, or plan.
- `Archived`: non-active work retained only for context.

## Required Fields for Active and Planned Task Records

For each task in `In Progress`, `Ready`, `Backlog`, or `Blocked`, include:

- stable identifier
- lifecycle status (lane)
- outcome statement
- priority or ordering signal
- dependencies (or `none`)
- acceptance criteria (`Done when`)
- local documentation or Spec Kit mapping

## Planning Source Mapping

The canonical mapping registry for this cleanup is
`../../specs/001-project-management-cleanup/artifacts/local-planning-mapping.md`.

Mapping lines on board items identify whether the board item has supporting context, product-spec
context, Spec Kit feature context, or no separate formal spec. The board remains authoritative for
current lifecycle status even when a task links to a task brief, product spec, architecture doc, or
Spec Kit artifact.

Use these relationship labels consistently:

- `Active Board Item`: the board owns current status and next action.
- `Feature Spec`: a product spec or Spec Kit feature owns requirements and acceptance criteria for a
  bounded feature.
- `Supporting Context`: a local document explains scope, rationale, constraints, or implementation
  handoff details without owning status.
- `No Formal Spec Needed`: the task is small or blocked enough that direct board tracking is clearer
  than creating a separate feature spec.

## Board

### In Progress

- `AUTH-02` Test mobile du restore signer `NIP-46` / `Nostr Connect`.
  Priority: Active lane.
  Dependencies: none.
  Done when: le flow est valide sur mobile avec Amber Android apres push, et le signer restaure reste capable de signer apres retour/reload.
  Mapping: Supporting Context -> `docs/product/specs/auth-mobile-web.md`; Active Board Item -> `docs/planning/board.md`.
  Note: desktop extension OK; bunker via QR code scanne dans Amber Android OK; test mobile `nip46-nostrconnect` en cours.

### Ready

- `INFRA-01` Migrer le stockage runtime vers Supabase. (P0)
  Dependencies: none.
  Done when: les endpoints `pack-requests` (user + admin) gardent leur comportement externe, les donnees survivent aux redeploiements, l'auth admin NIP-98 reste protegee, et les variables d'environnement Supabase sont documentees.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#infra-01-migrate-runtime-storage-to-supabase`; Active Board Item -> `docs/planning/board.md`.
  Source: retour mobile post-deploiement 2026-04-25 — SQLite `.runtime/pack-requests.sqlite` non persistant en production.

- `AUTH-07` Restaurer la session Nostr apres refresh. (P0)
  Dependencies: none.
  Done when: une connexion NIP-07 ou NIP-46 (mobile externe) survit a un refresh tant que l'autorisation distante reste valide; en cas d'expiration ou de refus, retour propre a l'etat deconnecte avec feedback UI.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#auth-07-restore-nostr-session-after-refresh`; Supporting Context -> `docs/product/specs/auth-mobile-web.md`.
  Source: retour mobile post-deploiement 2026-04-25.

- `UI-01` Ajouter loader + disabled sur le bouton auth extension. (P1)
  Dependencies: none.
  Done when: le bouton extension affiche un indicateur pendant la tentative, est disabled, l'etat est accessible (a11y), et se reset sur succes / erreur / cancel / timeout.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#ui-01-add-loader-and-disabled-state-to-extension-auth-button`; No Formal Spec Needed -> direct board tracking.

- `AUTH-05` Faire de `bunker://` un mode avance clairement separe. (P3)
  Dependencies: none.
  Done when: l'utilisateur grand public voit d'abord l'application externe, bunker n'apparait plus comme le chemin principal.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#auth-05-make-bunker-a-clearly-separate-advanced-mode`; Supporting Context -> `docs/product/specs/auth-mobile-web.md`.

### Backlog

- `AUTH-08` Stabiliser le flow mobile Amber et Primal. (P1)
  Dependencies: `AUTH-07`.
  Done when: les flows Amber et Primal sont verifies manuellement et documentes (attente, succes, refus, timeout), et le refresh ne casse pas une autorisation encore valide.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#auth-08-stabilize-amber-and-primal-mobile-flow`; Supporting Context -> `docs/product/specs/auth-mobile-web.md`.

- `UI-02` Definir une strategie loader/disabled generique pour les boutons async. (P1)
  Dependencies: `UI-01`.
  Done when: apres inventaire (>= 3 cas confirmes : extension, app externe, bunker, submit request, admin approve/reject), un pattern partage existe avec gestion `loading`, `disabled`, label accessible, et anti-double-submit.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#ui-02-define-generic-async-button-strategy`; No Formal Spec Needed -> direct board tracking.

- `DOC-03` Mettre a jour `architecture.md` apres migration Supabase. (P2)
  Dependencies: `INFRA-01`.
  Done when: `architecture.md` documente Supabase comme stockage persistant, ce plan marque la migration comme complete, et les variables d'environnement requises sont listees.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#doc-03-update-architecture-docs-after-supabase`; Supporting Context -> `docs/architecture/overview.md`.

- `AUTH-03` Reduire les permissions demandees au login au strict necessaire.
  Priority: P2.
  Dependencies: confirmation du minimum permission set de demarrage.
  Done when: le flow de login ne demande que ce qui est utile au demarrage, puis les autres permissions arrivent au besoin.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#auth-03-reduce-login-permissions`; No Formal Spec Needed -> direct board tracking.

- `AUTH-04` Revoir l'UX auth mobile.
  Priority: P2.
  Dependencies: `AUTH-07` et matrice de test `AUTH-08`.
  Done when: l'UI affiche clairement l'etat du signer actif, propose `Reouvrir l'application`, `Reessayer`, `Se deconnecter`, et un mode lecture seule explicite.
  Mapping: Supporting Context -> `docs/planning/execution-notes.md#auth-04-review-mobile-auth-ux`; Supporting Context -> `docs/product/specs/auth-mobile-web.md`.

### Blocked

- `AUTH-06` One-shot perms bunker complet.
  Priority: blocked lane.
  Blocker: avec notre stack NDK actuelle, le flow bunker ne donne pas un point propre pour pousser toutes les requested perms dans `connect`.
  Dependencies: resolution d'un point d'extension NDK pour injecter les permissions au `connect`.
  Done when: soit le flow one-shot perms est implementable proprement, soit la tache est classee `Superseded` avec source de remplacement.
  Mapping: No Formal Spec Needed -> direct board tracking; Supporting Context -> `docs/planning/execution-notes.md`.
  Note: ce sujet est non-bloquant pour le chemin principal mobile PWA (`nip46-nostrconnect`) et peut rester en mode avance.

### Done Recently

- `DOC-01` Clarifier le role des specs et creer un document actif de pilotage.

- `DOC-02` Refactoriser toute l'arborescence `docs/` par role documentaire.
  Outcome: `product`, `planning`, `architecture`, `references`, `history`, `research`, `guides`.

- `AUTH-01` Corriger le flow application externe pour :
  - ouvrir l'application au premier clic
  - suivre les mises a jour d'URI pendant la tentative
  - eviter le besoin de relancer une nouvelle tentative juste pour poursuivre le meme flow

## Board Maintenance Rules

- Une tache doit avoir un identifiant stable.
- Une tache doit dire ce qu'on veut obtenir, pas seulement ce qu'on va coder.
- `In Progress` = travail effectivement en cours, pas juste prioritaire.
- `Ready` = executable maintenant.
- `Backlog` = scope encore en preparation ou en attente de preconditions.
- `Blocked` = besoin d'une decision, d'une verification externe, d'un acces, ou d'un changement de stack.
- `Done` = retiree des lanes actives; garder un resume court dans `Done Recently`.
- `Superseded` ou `Archived` = hors lanes actives, avec lien vers source retenue.
- Chaque tache active/planned doit inclure les champs obligatoires listes plus haut.
