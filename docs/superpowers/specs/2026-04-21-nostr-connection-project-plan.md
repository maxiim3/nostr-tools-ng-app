# Nostr Connection Project Plan

Date: 2026-04-21
Status: in_progress

## Documentation

- Mission et milestones : `docs/superpowers/documentation/mission.md`
- Architecture : `docs/superpowers/documentation/architecture.md`
- Règles agents : `AGENTS.md`
- Règles design connexion : `docs/superpowers/specs/2026-04-21-nostr-connection-rules-design.md`

## Scope

This plan tracks the ongoing migration from the legacy auth flow to the new
`nostr-connection` domain so we can resume work later without losing context.

## Completed Work

### Domain foundation

- Added explicit domain contracts for connection methods, attempts, sessions,
  signer capabilities, and HTTP auth.
- Added domain-level error model and revalidation semantics.

### Connection methods and contracts

- Implemented and tested `nip07` connection method.
- Implemented and tested `nip46-nostrconnect` connection method.
- Implemented and tested `nip46-bunker` connection method.
- Added reusable contract tests for methods and signers.

### NIP-46 infrastructure

- Added shared NIP-46 NDK helpers in
  `src/core/nostr-connection/infrastructure/ndk-nip46-shared.ts`.
- Added `NdkNip46NostrconnectStarter` integration.
- Added `NdkNip46BunkerStarter` integration.
- Added bunker starter abstraction and fakes for TDD.

### Application orchestration

- Added `ConnectionFacade` and root service
  `NostrConnectionFacadeService`.
- Added default orchestrator wiring via
  `createDefaultConnectionOrchestrator()`.
- Added coverage for facade behavior (attempt lifecycle, errors,
  revalidation, disconnect).

### Validation and commit

- Targeted test suite passed:
  `bun run test -- --include "src/core/nostr-connection/**/*.spec.ts"`
  (75 tests passed).
- Typecheck passed: `bun run typecheck`.
- Commit created: `cf395ac`
  (`feat: add nip46 bunker starter and connection facade`).

## Current State

- New `nostr-connection` domain is functional and tested.
- Existing UI/session flow still relies mainly on
  `NostrSessionService` + `NostrClientService`.
- New facade is not yet the single source of truth for auth state.
- Global lint check is currently blocked by missing builder package:
  `@angular-eslint/builder:lint`.

## Next Steps (Execution Order)

1. Integrate `NostrSessionService` with `NostrConnectionFacadeService`.
2. Map current auth entry points:
   - extension -> `nip07`
   - external app -> `nip46-nostrconnect`
   - bunker token -> `nip46-bunker`
3. Keep `nsec` as temporary controlled fallback during migration.
4. Update auth modal to consume facade state and attempt instructions.
5. Wire HTTP auth calls to `Nip98HttpAuthService` using active signer.
6. Remove legacy duplicated auth orchestration once parity is reached.

## Acceptance Criteria Per Phase

### Phase 1: session integration

- `NostrSessionService` does not directly orchestrate NIP-46 connection setup.
- Session state comes from facade current session/attempt lifecycle.
- Existing session tests are migrated and passing.

### Phase 2: auth modal migration

- Auth modal reads pending/error/attempt/session from facade state.
- Bunker token input has validation and clear UX errors.
- Timeout/cancel/retry states remain stable and tested.

### Phase 3: cleanup and hardening

- `NostrClientService` focuses on Nostr client operations, not auth orchestration.
- Legacy connection paths are removed or clearly deprecated.
- Full verification target passes once lint config is fixed:
  `bun run check`.

## Resume Checklist For Next Session

1. Run `git status` and confirm clean workspace.
2. Run `bun run test -- --include "src/core/nostr-connection/**/*.spec.ts"`.
3. Start with session integration in:
   `src/core/nostr/application/nostr-session.service.ts`.
4. Update tests first in:
   `src/core/nostr/application/nostr-session.service.spec.ts`.
5. Then migrate auth modal usage in:
   `src/core/layout/presentation/components/app-auth-modal.component.ts`.
