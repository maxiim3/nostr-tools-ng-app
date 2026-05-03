# Story 1.3: Restore Valid NIP-46 External Signer Sessions After Refresh

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a mobile Nostr user,
I want my valid external signer authorization to survive refresh where supported,
so that returning to Toolstr does not force a full new pairing.

## Acceptance Criteria

1. Given a user connected through NIP-46 external signer flow, when the app reloads with a valid restore payload, then the app attempts silent signer restoration, and restores connected state only after signer authorization is validated.
2. Given the restore payload is missing, invalid, expired, revoked, or unsupported by the signer, when restoration runs, then the app purges invalid restore data, and shows disconnected or reconnect-required state.
3. Given restoration uses NIP-46 data, when protocol correlation is required, then `secret`, request identity, timeout behavior, and signer pubkey validation are respected, and sensitive restore values are not exposed in logs.

## Tasks / Subtasks

- [ ] Define safe NIP-46 restore context persistence for external signer sessions only (AC: 1, 2, 3)
  - [ ] Add a focused restore-context store in `src/core/nostr-connection/application/` or adjacent infrastructure, following the `Nip07RestoreContextStore` pattern but using a separate key and method-discriminated payload for `nip46-nostrconnect`.
  - [ ] Persist only the minimum values required by NDK/NIP-46 restore and validation: `version`, `methodId: 'nip46-nostrconnect'`, signer restore payload, expected user `pubkeyHex`, `validatedAt`, and any relay/perms metadata that is required to reconnect safely.
  - [ ] Do not persist NIP-98 tokens, signed events, profile snapshots, QR values, launch URLs, `authUrl`, callbacks, timers, raw exceptions, private keys, or unrelated pack/admin state.
  - [ ] Treat persisted restore context as an attempt hint only. It must never set `connected` without restoring a live signer and validating the signer returns the expected user pubkey.
  - [ ] Guard all browser storage access with `typeof globalThis !== 'undefined'` and tolerate throwing `localStorage` property access plus throwing `getItem`, `setItem`, and `removeItem`.
  - [ ] Purge malformed JSON, wrong version, wrong method id, missing restore payload, invalid expected pubkey, unsupported payload shape, expired payload if a TTL is introduced, and legacy data that cannot be validated.
- [ ] Add NIP-46 restore/recreate path through existing NDK/NIP-46 infrastructure (AC: 1, 2, 3)
  - [ ] Reuse and extend `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`; do not duplicate NDK dynamic import, relay connection, or `NDKNip46Signer.fromPayload(...)` handling elsewhere.
  - [ ] Use `restoreNdkNip46SignerFromPayload(...)` to obtain a remote signer, then wrap it in `Nip46ConnectionSigner` and build a normal `ConnectionSession` through existing NIP-46 session creation logic.
  - [ ] If needed, extract a reusable helper from `nip46-connection-attempt.ts` so restored NIP-46 connections and interactive NIP-46 attempts construct `Nip46ActiveConnection` and sessions identically.
  - [ ] Validate the restored signer by calling `getPublicKey()` and comparing normalized hex user pubkey to the persisted expected pubkey before committing active state.
  - [ ] Ensure NIP-46 remote-signer pubkey and user pubkey are not conflated. The connected identity is the `get_public_key` result/user pubkey, not the remote-signer pubkey from the transport.
  - [ ] Respect NIP-46 correlation semantics that NDK owns during restore: payload must include the client key/secret context needed for request/response correlation; invalid or stale payloads must fail closed.
  - [ ] Apply bounded restore timeouts for NDK relay connect, `fromPayload`, readiness, and public-key validation so restore cannot leave `authSessionState` in `restoring` indefinitely.
- [ ] Integrate NIP-46 restore into `ConnectionFacade` without regressing NIP-07 restore (AC: 1, 2, 3)
  - [ ] Generalize `ConnectionFacade.hasRestoreContext()` so startup can detect either NIP-07 or NIP-46 restore data without calling signers when no context exists.
  - [ ] Extend `restoreSessionFromStoredContext()` or add a focused method-discriminated restore API that can restore NIP-07 and `nip46-nostrconnect` while preserving existing NIP-07 behavior and tests.
  - [ ] Set `_restoringMethodId` to `nip46-nostrconnect` during external signer restore so `authSessionState` emits `{ status: 'restoring', methodId: 'nip46-nostrconnect' }`.
  - [ ] Clear restore state in every success, failure, cancellation, timeout, disconnect, superseded-login, and stale-completion branch using the existing attempt-id/operation guard style.
  - [ ] Commit restored NIP-46 active connections through `ConnectionOrchestrator.completeAttempt(...)` or an equivalent safe commit seam so the in-memory active connection, `currentSession`, and `ndkSigner` stay consistent.
  - [ ] Persist NIP-46 restore context only after successful interactive `nip46-nostrconnect` login and after signer-backed user pubkey validation.
  - [ ] Clear NIP-46 restore context on `disconnect()` even when there is no active in-memory connection and even if lower-level signer cleanup rejects.
  - [ ] Do not make `InMemoryConnectionSessionStore` a browser-storage store; persisted restore payload remains a separate restore hint.
- [ ] Bridge restored NIP-46 sessions into current UI/session behavior (AC: 1, 2)
  - [ ] Update `src/core/nostr/application/nostr-session.service.ts` startup flow to attempt NIP-46 restore when NIP-46 context exists, while preserving NIP-07 restore from Story 1.2.
  - [ ] On successful NIP-46 restore, apply the NDK signer via `NostrClientService.applyNdkSigner(ndkSigner, session.pubkeyHex)` using `facade.ndkSigner()` exactly like interactive external signer and bunker success paths.
  - [ ] Fetch profile only after connected signer state is committed. Profile fetch failure must not undo signer-backed connected state, matching NIP-07 restore behavior.
  - [ ] On restore failure, clear stale signer-backed profile/user display and present disconnected or reconnect-required semantics; cached profile data must not authenticate the user.
  - [ ] Preserve operation-generation guards so stale restore completion cannot repopulate `user`, close/open the modal, set errors, or overwrite a newer extension, external signer, bunker, private-key, or logout state.
  - [ ] Do not redesign the auth modal for this story. Successful restore should be silent except existing connected identity/actions; failure should leave the user able to reconnect.
- [ ] Preserve and extend external signer behavior without changing bunker scope (AC: 1, 2, 3)
  - [ ] Build on `Nip46NostrconnectConnectionMethod`, `NdkNip46NostrconnectStarter`, `Nip46ConnectionAttempt`, `Nip46ConnectionSigner`, and `ndk-nip46-restore.ts`; do not create another external signer stack.
  - [ ] Keep `nip46-bunker` restore out of scope unless code sharing requires method-discriminated no-op support. Bunker restoration and advanced bunker UX remain separate later work.
  - [ ] Preserve current interactive external signer flow: launch/copy/QR instructions, `authUrl` instruction updates, timeout/cancel behavior, stale completion protection, NDK signer application, and profile display.
  - [ ] Preserve current NIP-07 restore behavior and storage key compatibility. Do not convert existing `nostr.connect.restore.v1` semantics into NIP-46-only behavior.
  - [ ] Ensure sign-in completion does not wait on feed, relay discovery beyond NIP-46 signer restore needs, notifications, Supabase, pack membership, or NIP-98 calls.
- [ ] Add test coverage for success, fail-closed, race, timeout, and cleanup paths (AC: 1, 2, 3)
  - [ ] Extend `ndk-nip46-restore.spec.ts` to cover restore success, invalid payload, NDK connect failure, `fromPayload` failure, readiness timeout, and public-key validation failure.
  - [ ] Add store tests covering malformed JSON, wrong method id, missing payload, invalid expected pubkey, storage read/write/remove failures, save-after-success, and clear-on-disconnect.
  - [ ] Extend `connection-facade.spec.ts` to cover valid NIP-46 restore, restored signer pubkey mismatch, missing/invalid restore payload purge, restore timeout, restore failure state, disconnect cleanup, and late restored active connection disconnect after timeout or superseding flow.
  - [ ] Extend `nostr-session.service.spec.ts` to cover startup NIP-46 restore applying `applyNdkSigner`, profile fetch after validation, profile failure tolerance, stale restore after private-key login, stale restore after manual external login, stale restore after disconnect, and failed restore not authenticating from cached profile.
  - [ ] Keep existing NIP-07 restore, external app login, bunker login, timeout, cancellation, private-key fallback, and disconnect tests passing.
- [ ] Update documentation and verification (AC: 1, 2, 3)
  - [ ] Update `src/core/nostr-connection/README.md` to state that `nip46-nostrconnect` can restore after reload only when the stored NIP-46 restore payload can recreate a live signer and validate the expected user pubkey.
  - [ ] Update `docs/auth/nostr-auth-rules.md` or `docs/auth/mobile-auth-notes.md` only if implementation creates a new durable NIP-46 restore rule not already captured there.
  - [ ] Document that NIP-46 restore payloads and secrets must be redacted from logs and cleared on logout.
  - [ ] Run repository scripts only. Minimum verification before marking implementation complete: `bun run typecheck` and `bun run test`; run `bun run check` if practical.

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows. Story 1.3 follows Story 1.2 by adding refresh continuity for NIP-46 external signer sessions where the signer and restore payload support it. The user must remain connected after refresh only after current signer authorization is validated; invalid, expired, revoked, unavailable, or unsupported restore must fail closed. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.3: Restore Valid NIP-46 External Signer Sessions After Refresh`]

Covered requirements are FR2, FR5, FR11, FR12, FR13, FR14, FR15, and FR17. The story must preserve valid sessions after refresh, require re-authentication when remembered state is insufficient, and provide recovery when restoration cannot complete. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

### Previous Story Intelligence

Story 1.2 is complete and implemented the NIP-07 restore pattern. Reuse that design, but do not copy it blindly: NIP-46 restore needs a signer restore payload and NIP-46 request correlation context, while NIP-07 only revalidates `window.nostr.getPublicKey()`. [Source: `_bmad-output/implementation-artifacts/1-2-restore-valid-browser-extension-sessions-after-refresh.md#Completion Notes List`]

Key learnings from Story 1.2 that must carry forward:

- Restore context is never proof of auth; only current signer validation can produce `connected`.
- Stale async completions were a real source of regressions. Every restore path must be guarded by operation/attempt identity and must not mutate current state after logout or a newer auth flow.
- Restore failures must surface safe reconnect-required/recoverable semantics instead of leaving `restoring` or generic pending state.
- Profile data is display context only and cannot authenticate users.
- Restore timeout must disconnect late-created active connections so a remote signer cannot remain live after the app has already failed closed.
- `disconnect()` must clear restore data even when no active in-memory session exists.

Story 1.1 established the canonical state model in `src/core/nostr-connection/domain/auth-session-state.ts` and the facade/session bridge. Do not introduce another state source, status union, or UI boolean as semantic truth. [Source: `_bmad-output/implementation-artifacts/1-1-define-shared-auth-session-state-model.md#Completion Notes List`]

### Current Code State To Preserve

- `src/core/nostr-connection/domain/auth-session-state.ts` is the canonical auth/session vocabulary. Existing relevant statuses include `restoring`, `awaitingExternalSignerApproval`, `connected`, `revokedOrUnavailable`, `recoverableRetry`, `timedOut`, and `cancelled`.
- `src/core/nostr-connection/domain/connection-session.ts` creates the normalized signer-backed session with hex `pubkeyHex`, `npub`, `methodId`, `capabilities`, and `validatedAt`. Use this for restored NIP-46 sessions.
- `src/core/nostr-connection/application/connection-facade.ts` currently owns `currentAttempt`, `currentSession`, `pending`, `_restoringMethodId`, `_attemptId`, terminal state, NIP-07 restore, `ndkSigner`, and restore timeout handling. Extend this rather than bypassing it from `NostrSessionService`.
- `ConnectionFacade.restoreSessionFromStoredContext()` currently handles only NIP-07 by loading `Nip07RestoreContextStore`, setting `_restoringMethodId = 'nip07'`, creating a restored NIP-07 active connection through `Nip07ConnectionMethod.restoreActiveConnection(...)`, committing through the orchestrator, and failing closed.
- `src/core/nostr-connection/application/nip07-restore-context-store.ts` is specific to `nip07` and storage key `nostr.connect.restore.v1`. Do not overload it with NIP-46 data unless the result remains method-discriminated and backwards-safe.
- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts` already provides `restoreNdkNip46SignerFromPayload(payload, options)` using NDK dynamic import, `NDK.connect(...)`, `NDKNip46Signer.fromPayload(...)`, and `waitForNdkNip46SignerReady(...)`. This is the key wheel not to reinvent.
- `src/core/nostr-connection/infrastructure/ndk-nip46-shared.ts` centralizes `waitForNdkNip46SignerReady(...)`, timeout stopping, `subscribeToNdkNip46AuthUrl(...)`, and `NdkNip46RemoteSigner` wrapping. Reuse it.
- `src/core/nostr-connection/application/nip46-connection-attempt.ts` currently creates `Nip46ConnectionSigner`, builds a NIP-46 `ConnectionSession`, and defines an internal `Nip46ActiveConnection` with `revalidate()` and `disconnect()`. Restored NIP-46 active connections should use this same behavior, likely by extracting exported helpers/classes.
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts` starts interactive external signer attempts through `Nip46NostrconnectStarter`. This is the correct method for `nip46-nostrconnect`; do not add a second method id such as `externalSigner`.
- `src/core/nostr/application/nostr-session.service.ts` is the current UI/session bridge. Startup calls `initializeSession()`, refreshes method availability, attempts facade restore when restore context exists, then applies the signer for display. It currently applies NIP-07 with `applyNip07Signer(...)` and NIP-46/bunker with `facade.ndkSigner()` plus `applyNdkSigner(...)`.
- `src/core/nostr-connection/README.md` currently says reload still requires relaunching `nip46-nostrconnect` or `nip46-bunker`. Story 1.3 must update that after implementation.

### Required Implementation Shape

The minimal correct design is:

1. Persist a safe NIP-46 external signer restore context only after successful interactive `nip46-nostrconnect` connection.
2. On startup, detect NIP-46 restore context without contacting signers when no context exists.
3. Enter `AuthSessionState` `restoring` with `methodId: 'nip46-nostrconnect'`.
4. Restore a live NIP-46 signer from the stored payload using `restoreNdkNip46SignerFromPayload(...)`.
5. Build a normal `Nip46ConnectionSigner`, validate `getPublicKey()` returns the expected hex user pubkey, and create a normal `ConnectionSession`.
6. Commit the active connection through the existing orchestrator/facade path so `currentSession`, active connection storage, `ndkSigner`, and auth state stay coherent.
7. Apply the restored NDK signer to `NostrClientService` for display/NIP-98 compatibility, then fetch profile as display enrichment only.
8. On any untrusted condition, purge NIP-46 restore data, clear stale display state, stop/disconnect any partially restored signer, and resolve to disconnected, `revokedOrUnavailable`, or `recoverableRetry` without cached profile auth.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield project. Do not initialize a new app, introduce another framework, add a state-management library, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries: pure validation and data shapes in domain/application, NDK/NIP-46 mechanics in infrastructure/application adapters, and Angular UI only rendering/calling `NostrSessionService`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- Components must not import NDK, NIP-46 restore helpers, storage helpers, `ConnectionFacade`, or raw signer objects. Presentation consumes `NostrSessionService`. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- Remembered local identity and persisted restore payloads are restorable context only. `connected` requires live signer validation. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Backend remains stateless. Do not add backend sessions, cookies, JWT login, OAuth replacement, Supabase auth state, or server-side identity state. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Angular must not access Supabase. Supabase and pack membership are out of scope for this story. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Boundaries`]
- Sign-in/restore completion must not wait on profile, feed, notification, broad relay discovery, Supabase, pack membership, admin checks, or NIP-98 calls. NDK relay connection required to restore the NIP-46 signer is allowed, but keep it bounded. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]

### UX And Accessibility Guardrails

- Successful restore should be silent where possible; the visible confirmation is existing connected identity and enabled actions. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Session Restore On Return`]
- Restore failure should ask for reconnect or leave the user disconnected with a clear path; do not show protocol-heavy diagnostics. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Session Restore Status`]
- Preserve Tailwind/DaisyUI `brutal` visual foundation. No broad redesign, palette change, typography change, or new design system belongs here. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Any user-visible pending/recovery state must be perceivable without relying only on color and must remain keyboard/screen-reader understandable. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility`]

### NIP-46 Protocol And Security Constraints

- NIP-46 client-initiated `nostrconnect://` requires a client keypair and `secret`; the remote signer must return the secret in the connect response, and clients must validate it. NDK owns much of this, but persisted restore payloads must preserve the correlation context needed for NDK to continue safely. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]
- NIP-46 distinguishes client pubkey, remote-signer pubkey, and user pubkey. Toolstr connected identity must use the user pubkey from `get_public_key`, not the remote-signer pubkey. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]
- NIP-46 requests/responses use kind `24133`, response IDs, encrypted payloads, and optional auth challenges. Toolstr exposes protocol `auth_url` as app `authUrl`; do not persist or log it as restore data. [Source: `docs/auth/nostr-auth-rules.md#NIP-46`]
- Local NIP-46 persistence is only for restoring a NIP-46 signer after reload, must never simulate connected state, must purge invalid payloads immediately, and must fail closed. [Source: `docs/auth/nostr-auth-rules.md#Local NIP-46 Persistence`]
- Redact sensitive values from logs: NIP-46 secret, bunker token, auth URLs, NIP-98 tokens, restore payloads, and signed authorization material. [Source: `docs/auth/mobile-auth-notes.md#Applicable Security Notes`]
- Do not request, store, transmit, derive, or persist private keys. NIP-49/private-key encryption is unrelated to this story and must not be introduced. [Source: `_bmad-output/planning-artifacts/prd.md#Security`]

### Failure State Mapping

- No NIP-46 restore context: do nothing and remain `disconnected`; do not call NDK or the signer.
- Malformed, unsupported, wrong-method, missing-payload, or invalid expected-pubkey context: purge context and remain `disconnected`.
- NDK import, relay connect, `fromPayload`, or readiness failure: purge context and resolve to `recoverableRetry` or `revokedOrUnavailable` based on typed `ConnectionDomainError` semantics.
- Restored signer returns invalid pubkey: purge context and resolve to `revokedOrUnavailable` or `recoverableRetry` with `validation_failed`.
- Restored signer returns a different valid pubkey from expected: purge context, disconnect/stop restored signer, clear display state, and resolve to `revokedOrUnavailable`.
- Restore times out: purge context, disconnect late-created active connection if it resolves later, and resolve to `recoverableRetry` with `approval_timed_out`.
- Restore completes after logout, private-key login, extension login, another NIP-46 flow, or bunker login: ignore result, disconnect restored active connection if created, and do not mutate `user`, modal state, error state, or current auth state.
- Profile fetch fails after successful signer restore: keep signer-backed connected state, leave profile display empty or existing safe fallback, and do not set restore/auth error from profile failure.

### Anti-Reinvention Instructions

- Reuse `ConnectionSession`; do not create another canonical user/session identity type.
- Reuse `ConnectionMethodId` value `nip46-nostrconnect`; do not add `externalSigner`, `nip46`, `mobileSigner`, or other aliases.
- Reuse `Nip46ConnectionSigner`; do not sign directly with NDK objects outside the adapter.
- Reuse `restoreNdkNip46SignerFromPayload(...)`; do not implement a separate `NDKNip46Signer.fromPayload(...)` call path in `ConnectionFacade` or `NostrSessionService`.
- Reuse `ConnectionDomainError` and stable `AuthSessionFailureReasonCode` values; do not parse English errors for new restore decisions except where existing fallback handling already does.
- Reuse existing fakes and testing patterns in `src/core/nostr-connection/testing/`; do not add real NDK, relay, Amber, Primal, or browser dependencies to unit tests.
- Do not introduce an event bus, generic state-machine framework, global auth store, browser extension SDK, new mobile signer SDK, backend session, Supabase auth table, or reusable Angular auth module.
- Do not implement pack registration, admin, Supabase, NIP-98 verification, auth method selection redesign, mobile Amber/Primal return-flow stabilization, permission minimization, or bunker restore in this story.

### Suggested File Touch Points

Likely UPDATE files:

- `src/core/nostr-connection/application/connection-facade.ts`: method-discriminated restore detection, NIP-46 restore orchestration, `_restoringMethodId = 'nip46-nostrconnect'`, timeout/stale cleanup, restore-context persistence after successful external signer login, disconnect cleanup.
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`: likely extract/export helper(s) to build NIP-46 sessions and active connections from a restored `Nip46RemoteSigner`.
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`: possible home for a `restoreActiveConnection(...)` seam analogous to `Nip07ConnectionMethod.restoreActiveConnection(...)`, if that keeps method-specific logic out of the facade.
- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`: extend options/errors and ensure restored signer creation is bounded and testable.
- `src/core/nostr/application/nostr-session.service.ts`: startup bridge for restored NIP-46, `applyNdkSigner(...)`, profile display handling, stale-operation guards.
- `src/core/nostr-connection/README.md`: update NIP-46 restore documentation.

Likely NEW files:

- `src/core/nostr-connection/application/nip46-restore-context-store.ts` or similar focused store for NIP-46 restore payload parsing/writing.
- Co-located `*.spec.ts` for any new restore store/helper.

Likely TEST UPDATE files:

- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.spec.ts`
- `src/core/nostr-connection/application/connection-facade.spec.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.spec.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`

Avoid touching unless directly necessary:

- `server.mjs`, Supabase migrations, pack pages/services, admin pages, auth modal visual templates, broad UX docs, NIP-07 provider/signer semantics, bunker connection method, and NIP-98 backend verification.

### Testing Requirements

- Domain/application tests should avoid Angular TestBed unless testing Angular services. Use fakes, fake timers, and mocked NDK imports.
- If adding NIP-46 restore storage, test malformed JSON, wrong method id, missing payload, invalid pubkey, storage failures, save after interactive success, and clear on disconnect.
- If adding facade restore support, test `restoring -> connected`, `restoring -> revokedOrUnavailable/recoverable/disconnected`, timeout, stale completion, late active connection cleanup, NIP-07 non-regression, and no provider/signer call when no restore context exists.
- If updating `NostrSessionService`, test NIP-46 startup restore applies `applyNdkSigner(...)`, profile fetch is display-only, failed restore clears user, and stale async completions cannot override logout/private-key/new-auth flows.
- Keep existing interactive external signer behavior covered: launch URL/copy/QR, `authUrl` updates, cancellation, timeout, retry, and stale attempt handling.
- Verification must use repository scripts from `package.json`: `bun run typecheck`, `bun run test`, and preferably `bun run check`. Do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or lint tools. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Latest Technical Information

- NIP-46 now explicitly distinguishes `remote-signer-pubkey` from `user-pubkey` and says clients must call `get_public_key` after connect. Story 1.3 must validate restored identity using the user pubkey returned by the signer. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]
- NIP-46 client-initiated `nostrconnect://` requires `secret`; clients must validate the secret returned by the connect response. Existing NDK restore payload handling should preserve this correlation; do not manually reconstruct a weak restore path. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]
- NIP-46 auth challenges use `result: "auth_url"` and a URL in `error`; app code may expose that as `authUrl`, but restore must not persist or log auth URLs. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]
- NIP-98 remains the protected backend HTTP auth boundary and is unchanged by this story. Restored NIP-46 signer must still be capable of signing NIP-98 events through existing frontend auth services. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/98.md`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Vitest `^4.0.8`. [Source: `package.json`]

### Git Intelligence

- Recent commits: `33ec5d2 fix: persistant connection on reload (1.2)`, `fa65520 feat: restore extension sessions`, `2b9f99a feat: create extension restore story`, and `a2b3593 feat: 1-1 define shared auth session state model`.
- Recent code changed `connection-facade.ts`, NIP-07 restore store/method tests, and `nostr-session.service.ts`. Follow the same small, tested, fail-closed restore pattern and operation guard style.
- Story 1.2 review found stale async completion and late timeout cleanup bugs in this area. Treat race tests as mandatory, not optional.

### Out Of Scope

- NIP-07 restore changes except non-regression fixes needed to generalize restore detection.
- NIP-46 bunker restore and advanced bunker UX.
- Auth method selection, private-key visibility, and advanced-mode copy; Story 1.4 owns that.
- Broad pending/timeout/cancelled/denied UI copy; Story 1.5 owns broader behavior.
- Amber/Primal mobile return-flow validation and app-specific docs; Story 1.6 owns that.
- Permission minimization; Story 1.7 owns that.
- Auth loading button/async-button abstraction; Story 1.8 owns that.
- Sign-out cleanup beyond clearing new NIP-46 restore artifacts; Story 1.9 owns broad sign-out cleanup.
- Pack registration, Supabase persistence, admin oversight, backend route changes, and NIP-98 backend verification.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.3: Restore Valid NIP-46 External Signer Sessions After Refresh`
- `_bmad-output/planning-artifacts/prd.md#Session Continuity`
- `_bmad-output/planning-artifacts/prd.md#Integration Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Session Restore On Return`
- `_bmad-output/project-context.md#Critical Don't-Miss Rules`
- `docs/auth/nostr-auth-rules.md#NIP-46`
- `docs/auth/mobile-auth-notes.md#Applicable Security Notes`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-shared.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr-connection/README.md`

## Dev Agent Record

### Agent Model Used

openai/gpt-5.5

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Status set to `ready-for-dev` after source artifact, prior-story, current-code, protocol, and checklist analysis.

### File List

- `_bmad-output/implementation-artifacts/1-3-restore-valid-nip-46-external-signer-sessions-after-refresh.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
