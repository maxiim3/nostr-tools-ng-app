# ToolStr — Architecture

Architecture feature-first pseudo DDD hexagonale simplifiée.

## Structure projet

```
src/
  app/           Routes, config, composant racine
  core/          Services transverses (nostr, nostr-connection, i18n, zap, layout, config)
  features/      Features par domaine (admin, home, legal, packs, tools)
  shared/        Composants UI génériques réutilisables
  assets/i18n/   Fichiers de traduction (fr, en, es)
```

## Couches par feature

Chaque feature suit cette structure :

```
features/<domain>/
  domain/           Types métier, value objects, règles pures
  application/      Cas d'usage, orchestration, ports
  infrastructure/   Adaptateurs techniques (Nostr, HTTP)
  presentation/     Pages, composants, guards, view models
```

### domain

Contient uniquement :

1. types métier
2. value objects simples
3. règles métier pures
4. fonctions de domaine pures

Aucune dépendance Angular. Aucune dépendance UI. Aucune dépendance directe Nostr.

### application

Contient :

1. cas d'usage
2. orchestration
3. ports
4. logique de coordination

Peut dépendre du domain. Ne doit pas dépendre directement des composants UI.

### infrastructure

Contient :

1. adaptateurs Nostr
2. services d'accès aux relays
3. sérialisation/desérialisation d'events
4. implémentations techniques des ports

Dépend du domain et de application si nécessaire.

### presentation

Contient :

1. pages Angular
2. composants de feature
3. view models
4. state UI
5. bindings de templates

Ne doit pas faire de logique technique lourde. Ne doit pas parler directement aux relays sans passer par une couche claire.

## Règles de dépendance

1. presentation → application
2. application → domain
3. infrastructure implémente les ports nécessaires
4. domain ne dépend de rien de technique
5. pas de dépendance circulaire
6. pas de logique Nostr brute dans les composants de page

## core/

Services transverses partagés entre features :

- `nostr/` — Client Nostr (NDK), session, follow
- `nostr-connection/` — Nouveau domaine de connexion (refactor en cours)
- `i18n/` — Service de langue, loader Transloco
- `zap/` — Service et modal zap
- `layout/` — Header, footer, auth modal
- `config/` — Constantes projet (PROJECT_INFO)

## shared/

Strict. Uniquement ce qui est réellement générique :

- primitives UI globales
- tokens de design
- helpers purs partagés
- types communs transverses simples

Interdit :

- dumping ground
- logique métier pack-specific
- logique admin spécifique
- logique merge spécifique

## Domaines produit

| Domaine | Feature          | Description                                          |
| ------- | ---------------- | ---------------------------------------------------- |
| Packs   | `features/packs` | Starter packs Nostr (auto-admit, membership, config) |
| Admin   | `features/admin` | Interface admin des membres du pack                  |
| Tools   | `features/tools` | Outils opérateur (merge followers — pas implémenté)  |
| Legal   | `features/legal` | Pages légales (CGU)                                  |
| Home    | `features/home`  | Landing page                                         |

## Config pack

Le pack francophone est configuré dans `francophone-pack.config.ts`.

Champs actuels : `slug`, `adminNpubs`, `starterPackUrl`, `followUrl`, `externalLoginUrl`, `zapHref`.

Project-planning note: future pack-config shaping is tracked from `../../`; this architecture overview records only the current implementation fields. Missing candidate fields from earlier planning were `title`, `description`, `ownerNpub`, `targetPackRef`, `targetPackUrl`, `requestEnabled`, `feedEnabled`, `publicEnabled`, `contact`, `zapAddress`, and `credits`.

## Auth — current implementation context

Etat actuel :

1. `core/nostr-connection/` est integre pour `NIP-07`, `NIP-46 Nostr Connect` et `NIP-46 Bunker`
2. `NostrSessionService` reste l'adapter principal consomme par l'UI
3. `NostrClientService` garde le role NDK + signer + `nsec` temporaire
4. Active auth follow-up planning lives in `../../queue.md` and `../../features/`; this file only records implementation context

Voir :

- `../references/nostr-auth-rules.md` pour les contraintes
- `../../queue.md` pour l'ordre d'execution actif

## Backend

Serveur Bun + Supabase (`server.mjs`). Pas du Nostr-only.

Endpoints :

| Endpoint                                 | Méthode | Auth           | Description           |
| ---------------------------------------- | ------- | -------------- | --------------------- |
| `/api/health`                            | GET     | non            | Health check          |
| `/api/pack-members/me`                   | GET     | NIP-98         | Statut membre user    |
| `/api/pack-members`                      | POST    | NIP-98         | Admission immediate   |
| `/api/admin/pack-members`                | GET     | NIP-98 (admin) | Lister membres actifs |
| `/api/admin/pack-members/:pubkey/remove` | POST    | NIP-98 (admin) | Retirer du pack       |

DB : table Supabase `francophone_pack_members`. Variables serveur : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE` optionnel, `ADMIN_NPUBS`.

## Relays

Config centralisée dans `core/nostr/infrastructure/relay.config.ts`.

Base : `wss://relay.damus.io`, `wss://relay.nostr.band`, `wss://nostr.oxtr.dev`, `wss://nostr-pub.wellorder.net`, `wss://nos.lol`, `wss://relay.primal.net`.
