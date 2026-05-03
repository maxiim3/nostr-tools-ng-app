# ToolStr Architecture

Architecture: feature-first, pseudo-DDD, simplified hexagonal boundaries.

## Project Structure

```text
src/
  app/           Routes, config, root component
  core/          Cross-cutting services: nostr, nostr-connection, i18n, zap, layout, config
  features/      Product features by domain: admin, home, legal, packs, tools
  shared/        Generic reusable UI components and pure helpers
  assets/i18n/   Translation files: fr, en, es
```

## Feature Layers

Each feature follows this structure:

```text
features/<domain>/
  domain/           Business types, value objects, pure rules
  application/      Use cases, orchestration, ports
  infrastructure/   Technical adapters: Nostr, HTTP, serialization
  presentation/     Pages, components, guards, view models
```

Layer rules:

- `domain` contains only business types, value objects, and pure business rules. It has no Angular, UI, HTTP, Supabase, or direct Nostr dependency.
- `application` contains use cases, orchestration, ports, and coordination logic. It can depend on domain, but not UI components.
- `infrastructure` contains Nostr adapters, relay access, event serialization/deserialization, and technical port implementations.
- `presentation` contains Angular pages, feature components, guards, view models, UI state, and template bindings. It must not contain heavy protocol or relay logic.

Dependency direction:

1. `presentation` -> `application`
2. `application` -> `domain`
3. `infrastructure` implements required ports
4. `domain` has no technical dependency
5. No circular dependencies
6. No raw Nostr logic in page components

## Core

- `nostr/` - NDK client, app session, NIP-98 HTTP auth, follow/publish behavior.
- `nostr-connection/` - Connection domain for NIP-07, NIP-46 Nostr Connect, and NIP-46 Bunker.
- `i18n/` - Language service and Transloco loader.
- `zap/` - Zap service and modal.
- `layout/` - Header, footer, auth modal.
- `config/` - Project constants.

## Shared

`shared/` is strict. It can contain genuinely reusable UI primitives, design tokens, pure helpers, and simple cross-cutting types.

It must not become a dumping ground for pack-specific, admin-specific, or merge-specific logic.

## Product Domains

| Domain | Feature          | Description                                                 |
| ------ | ---------------- | ----------------------------------------------------------- |
| Packs  | `features/packs` | Nostr starter packs: auto-admit, membership, config.        |
| Admin  | `features/admin` | Admin interface for pack members.                           |
| Tools  | `features/tools` | Operator tools such as follower merge; not implemented yet. |
| Legal  | `features/legal` | Legal pages.                                                |
| Home   | `features/home`  | Landing page.                                               |

## Pack Config

The francophone pack is configured in `francophone-pack.config.ts`.

Current fields: `slug`, `adminNpubs`, `starterPackUrl`, `followUrl`, `externalLoginUrl`, `zapHref`.

Candidate future fields from planning, not current implementation facts: `title`, `description`, `ownerNpub`, `targetPackRef`, `targetPackUrl`, `requestEnabled`, `feedEnabled`, `publicEnabled`, `contact`, `zapAddress`, and `credits`.

## Auth Context

Current state:

- `core/nostr-connection/` is integrated for NIP-07, NIP-46 Nostr Connect, and NIP-46 Bunker.
- `NostrSessionService` is the main adapter consumed by UI.
- `NostrClientService` keeps the NDK signer/client role and temporary `nsec` path.
- The signer is the cryptographic source of truth. UI state or cached profile data is not authentication.
- Backend auth remains stateless and protected per request by NIP-98.

See [Nostr auth rules](../auth/nostr-auth-rules.md) for constraints.

## Backend

Server: Bun API in `server.mjs`.

Persistence: Supabase table `francophone_pack_members`.

Server environment variables:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE` optional
- `ADMIN_NPUBS`
- `SUPABASE_SERVICE_ROLE_KEY` accepted only as a legacy server-side fallback

Endpoints:

| Endpoint                                 | Method | Auth         | Description                     |
| ---------------------------------------- | ------ | ------------ | ------------------------------- |
| `/api/health`                            | GET    | No           | Health check.                   |
| `/api/pack-members/me`                   | GET    | NIP-98       | Current user membership status. |
| `/api/pack-members`                      | POST   | NIP-98       | Immediate admission.            |
| `/api/admin/pack-members`                | GET    | NIP-98 admin | List active members.            |
| `/api/admin/pack-members/:pubkey/remove` | POST   | NIP-98 admin | Remove a member.                |

## Relays

Relay config is centralized in `core/nostr/infrastructure/relay.config.ts`.

Base relays:

- `wss://relay.damus.io`
- `wss://relay.nostr.band`
- `wss://nostr.oxtr.dev`
- `wss://nostr-pub.wellorder.net`
- `wss://nos.lol`
- `wss://relay.primal.net`
