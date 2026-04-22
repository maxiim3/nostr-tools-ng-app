# Nostr Connection Project Plan

Date: 2026-04-21
Updated: 2026-04-23
Status: in_progress

## Documentation

- Mission et milestones : `docs/superpowers/documentation/mission.md`
- Architecture : `docs/superpowers/documentation/architecture.md`
- Regles agents : `AGENTS.md`
- Regles design connexion : `docs/superpowers/specs/2026-04-21-nostr-connection-rules-design.md`

## Scope

Migration du legacy auth vers le domaine `nostr-connection`. Les 4 methodes d'auth
(NIP-07, NIP-46 Nostr Connect, NIP-46 Bunker, nsec) fonctionnent et sont testees.

## Completed Work

### Domain foundation

- Domain contracts for connection methods, attempts, sessions, signer capabilities, HTTP auth.
- Domain-level error model and revalidation semantics.

### Connection methods and contracts

- `nip07` connection method (extension).
- `nip46-nostrconnect` connection method (app externe).
- `nip46-bunker` connection method (bunker token).
- Reusable contract tests for methods and signers.

### NIP-46 infrastructure

- Shared NIP-46 NDK helpers (`ndk-nip46-shared.ts`).
- `NdkNip46NostrconnectStarter` + `NdkNip46BunkerStarter`.
- Bunker starter abstraction and fakes for TDD.

### Application orchestration

- `ConnectionFacade` + `NostrConnectionFacadeService` (root singleton).
- `createDefaultConnectionOrchestrator()` wiring all 3 methods.
- Coverage for facade behavior (attempt lifecycle, errors, revalidation, disconnect).

### Phase 1: session integration (done)

- `NostrSessionService` delegates to `NostrConnectionFacadeService`.
- NIP-07: facade handles connection, client sets up NDK signer.
- NIP-46 nostrconnect: facade handles full handshake, NDK signer shared via `ndkSigner` signal.
- NIP-46 bunker: facade handles connection with `connectionToken`, NDK signer shared.
- nsec: temporary direct path (no facade registration).
- `disconnect()` clears both external + bunker timeouts and increments attempt IDs.
- Commit: `29ee192` (`feat: integrate session with connection facade and add bunker auth`).

### Phase 2: auth modal migration (done)

- Auth modal reads state from `NostrSessionService` (facade-backed).
- Bunker token section added with input, waiting state, cancel, retry, timeout.
- `aria-label` on bunker input for WCAG AA.
- i18n keys added for bunker section (fr/en/es).
- 225 tests passing (29 files), `bun run check` green.
- Bunker auth tested and confirmed working end-to-end against a real bunker.
- Commit: `29ee192` (same as Phase 1).

## Current State

- All 4 auth methods work: NIP-07 extension, NIP-46 Nostr Connect, NIP-46 Bunker, nsec.
- `NostrSessionService` is the sole adapter for all consumers.
- `NostrClientService` is now clean: `connectWithPrivateKey()` kept (nsec temporary path), `getHttpAuthSigner()` + `NdkConnectionSignerAdapter` replace legacy `createHttpAuthHeader()`.
- NIP-98 unified: `NostrHttpAuthService` uses `Nip98HttpAuthService` (nostr-connection domain) as single source, with facade signer priority and client fallback.
- Extension flow: facade source of truth, client only does NDK setup via `applyNip07Signer()`.
- Commits: `e52c27d` (route francophone + unify nip98), `??????` (phase 3 auth cleanup).
- `bun run check` passes (215 tests).

## Remaining Work

### Phase 3: cleanup and hardening (done)

- `NostrClientService` legacy auth orchestration removed (`connectWithExtension()`, `beginExternalAppLogin()`, `completeExternalAppLogin()`, `cancelExternalAppLogin()`).
- Extension flow now uses facade as sole auth source; client only runs `applyNip07Signer()` for NDK setup.
- `nsec` path (`connectWithPrivateKey()`) kept as-is — temporary direct path, not registered in facade.
- NIP-98 unified via `NostrHttpAuthService` (facade signer priority, client fallback).
- Dead code removed; `bun run check` stays green (215 tests).
- Commit: `??????`

### Phase 4: milestone 1 remaining pages

- Pack landing page (`/packs/francophone`) — done. Root `/` redirects to `/packs/francophone`, same content.
- Admin dashboard members (`/packs/francophone/admin`) — postponed.

## Known Risks

1. Cross-contamination: if user triggers external app login then bunker login (or vice versa) without cancelling, the facade auto-cancels the first attempt. Pre-existing risk.
2. ~~NIP-07 double NDK instance~~: resolved — extension flow now uses facade as sole auth source; client only calls `applyNip07Signer()` (no duplicate `window.nostr` call).
3. No client-side bunker URL format validation. Facade validates server-side.

## Resume Checklist

1. Run `git status` and confirm workspace state.
2. Run `bun run check` — should pass (225 tests).
3. Phase 3 starts in `src/core/nostr/application/nostr-client.service.ts`.
4. Phase 4 starts with route config in `src/app/app.routes.ts`.
