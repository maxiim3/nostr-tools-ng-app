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

| Domaine | Feature          | Description                                             |
| ------- | ---------------- | ------------------------------------------------------- |
| Packs   | `features/packs` | Starter packs Nostr (request, quiz, membership, config) |
| Admin   | `features/admin` | Interface admin (approbation/refus des demandes)        |
| Tools   | `features/tools` | Outils opérateur (merge followers — pas implémenté)     |
| Legal   | `features/legal` | Pages légales (CGU)                                     |
| Home    | `features/home`  | Landing page                                            |

## Config pack

Le pack francophone est configuré dans `francophone-pack.config.ts`.

Champs actuels : `slug`, `adminNpubs`, `starterPackUrl`, `followUrl`, `externalLoginUrl`, `zapHref`.

À clarifier — champs manquants par rapport à la spec initiale : `title`, `description`, `ownerNpub`, `targetPackRef`, `targetPackUrl`, `requestEnabled`, `feedEnabled`, `publicEnabled`, `contact`, `zapAddress`, `credits`.

## Auth — état de la migration

Etat actuel :

1. `core/nostr-connection/` est integre pour `NIP-07`, `NIP-46 Nostr Connect` et `NIP-46 Bunker`
2. `NostrSessionService` reste l'adapter principal consomme par l'UI
3. `NostrClientService` garde le role NDK + signer + `nsec` temporaire
4. Le follow-up actif porte maintenant sur l'UX mobile auth, la persistance locale de session NIP-46 (sans session backend) et la reduction des permissions demandees

Voir :

- `../references/nostr-auth-rules.md` pour les contraintes
- `../planning/board.md` pour le travail actif

## Backend

Serveur Bun + SQLite (`server.mjs`). Pas du Nostr-only.

Endpoints :

| Endpoint                                   | Méthode | Auth           | Description         |
| ------------------------------------------ | ------- | -------------- | ------------------- |
| `/api/health`                              | GET     | non            | Health check        |
| `/api/pack-requests/me`                    | GET     | NIP-98         | Statut demande user |
| `/api/pack-requests`                       | POST    | NIP-98         | Soumettre demande   |
| `/api/admin/pack-requests`                 | GET     | NIP-98 (admin) | Lister demandes     |
| `/api/admin/pack-requests/:pubkey/approve` | POST    | NIP-98 (admin) | Approuver           |
| `/api/admin/pack-requests/:pubkey/reject`  | POST    | NIP-98 (admin) | Refuser             |

DB : `.runtime/pack-requests.sqlite` — scripts dans `scripts/`.

## Relays

Config centralisée dans `core/nostr/infrastructure/relay.config.ts`.

Base : `wss://relay.damus.io`, `wss://relay.nostr.band`, `wss://nostr.oxtr.dev`, `wss://nostr-pub.wellorder.net`, `wss://nos.lol`, `wss://relay.primal.net`.
