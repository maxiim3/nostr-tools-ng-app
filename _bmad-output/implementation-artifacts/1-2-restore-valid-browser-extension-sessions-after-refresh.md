# Story 1.2: Restore Valid Browser Extension Sessions After Refresh

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a desktop Nostr user,
I want my valid browser extension session to survive refresh,
so that I do not need to reconnect unnecessarily.

## Acceptance Criteria

1. Given a user previously connected with a browser extension signer, when the page refreshes and signer authorization remains valid, then the app restores or revalidates the session, and the user sees connected identity and available actions.
2. Given the extension is unavailable, revoked, changed, or cannot validate the user, when session restoration runs, then the app returns to disconnected or reconnect-required state, and cached profile data alone is not treated as authentication.
3. Given restore succeeds or fails, when auth state changes, then the state resolves without indefinite loading, and tests cover valid restore, unavailable extension, and invalid local state.

## Tasks / Subtasks

- [ ] Add persistent NIP-07 restore context without treating it as auth proof (AC: 1, 2)
  - [ ] Introduce a small browser-safe restore payload for NIP-07 only: `version: 1`, `methodId: 'nip07'`, `pubkeyHex`, and `validatedAt`.
  - [ ] Treat stored `validatedAt` as diagnostic metadata only unless a product decision introduces a TTL; current signer validation is the auth proof.
  - [ ] Do not trust persisted `npub` or capabilities. Derive `npub` from the validated hex pubkey and recompute capabilities from the current provider during restore.
  - [ ] Store restore context only after successful signer-backed NIP-07 connection, not after profile fetch, private-key fallback, or cached `SessionUser` creation.
  - [ ] Keep persistence in `src/core/nostr-connection/application/` or `src/core/nostr-connection/infrastructure/`; do not put localStorage access in domain files or presentation components.
  - [ ] Guard browser storage access with `typeof globalThis !== 'undefined'` and tolerate unavailable or throwing storage APIs, including `globalThis.localStorage` property access itself.
  - [ ] Purge invalid, malformed, non-NIP-07, or untrusted restore payloads immediately.
- [ ] Implement NIP-07 session restore/revalidation on app/session startup (AC: 1, 2, 3)
  - [ ] Add the smallest application-facing restore API, for example `restoreCurrentSession()` or `restoreSessionFromStoredContext()`, on `NostrConnectionFacadeService` or a focused application service.
  - [ ] `ConnectionFacade` must own a restore-specific internal signal/status so `authSessionState` can emit `{ status: 'restoring', methodId: 'nip07' }`; do not reuse generic `pending` alone because current `pending` projects to `detectingSigner`.
  - [ ] Clear the restore-specific signal in every success, failure, cancellation, timeout, and disconnect branch using `finally`-style cleanup.
  - [ ] Add a bounded restore timeout for provider validation so a hung `getPublicKey()` cannot leave the app in `restoring` indefinitely.
  - [ ] Resolve the current `window.nostr` provider through the existing `Nip07ConnectionMethod` / `Nip07ConnectionSigner` path where possible; do not duplicate provider or pubkey normalization logic.
  - [ ] Revalidate by calling `getPublicKey()` through the signer and comparing normalized hex pubkey against the stored restore pubkey.
  - [ ] Restore connected state only when the provider exists, returns a valid pubkey, and the pubkey matches the stored restore context; compare before committing `currentSession` or the active connection store.
  - [ ] If no restore context exists, remain `disconnected` without calling the provider.
  - [ ] If restore context is malformed or invalid, purge it and resolve to `disconnected`.
  - [ ] If the extension is missing, returns an invalid pubkey, returns a different pubkey, or cannot be trusted, purge restore data and resolve to reconnect-required semantics through `revokedOrUnavailable`.
  - [ ] If the provider rejects, throws, or times out while reading the pubkey, purge restore data and resolve to a recoverable reconnect state; do not leave stale connected UI visible.
  - [ ] Ensure restore never waits on profile, feed, relay, notifications, Supabase, pack membership, or NIP-98 calls before setting validated signer-backed connection state.
- [ ] Add a safe restored-active-connection commit path (AC: 1, 2)
  - [ ] Add a method-level NIP-07 restore seam, for example on `Nip07ConnectionMethod`, that resolves the provider, creates `Nip07ConnectionSigner`, builds a fresh `ConnectionSession`, compares against expected `pubkeyHex`, and returns `ActiveConnection` only on match.
  - [ ] Add the smallest orchestrator/facade commit hook needed for an already validated restored `ActiveConnection`; do not let the facade mutate store internals directly.
  - [ ] Do not implement restore by completing and committing a normal interactive `startConnection('nip07')` attempt before comparing the stored pubkey.
  - [ ] Keep this seam NIP-07-only for this story, but use a method-discriminated shape so Story 1.3 can add NIP-46 restore without replacing the NIP-07 design.
- [ ] Bridge restored NIP-07 sessions into current UI/session behavior (AC: 1, 2)
  - [ ] Update `NostrSessionService` startup behavior to use an initialization flow: refresh availability, attempt NIP-07 restore only when restore context exists, then bridge success/failure into display state.
  - [ ] On successful restore, apply the NIP-07 signer through existing `NostrClientService.applyNip07Signer(session.pubkeyHex)` and then fetch profile only as display context; profile fetch failure must not undo signer-backed connected state.
  - [ ] Keep `SessionUser` as profile/display data only; do not set `isAuthenticated` from cached/fetched profile unless shared `authSessionState` is connected.
  - [ ] Ensure restored users see the existing signed-in identity and pack/admin affordances exactly as after interactive extension login.
  - [ ] On restore failure, clear stale profile/user state for signer-backed auth and show a reconnect-required or disconnected state without indefinite loading.
  - [ ] Add operation-generation guards around restore, interactive extension login, and post-connection profile fetch so stale async completions cannot repopulate `user`, close the modal, set errors, or overwrite a newer auth state after logout or another login.
- [ ] Preserve and extend NIP-07 active connection behavior (AC: 1, 2)
  - [ ] Reuse `ConnectionSession`, `Nip07ConnectionSigner`, `Nip07ConnectionMethod`, `Nip07ActiveConnection`, and `InMemoryConnectionSessionStore`; avoid creating a parallel browser-extension auth stack.
  - [ ] Add persistence/restore support without changing the existing interactive `connectWithExtension()` success path except to save restore context after validation.
  - [ ] Preserve current `revalidateCurrentSession()` semantics and make restored sessions participate in the same `ActiveConnection.revalidate()` behavior.
  - [ ] Account for NIP-07 not standardizing account-change notifications: restoration and sensitive actions must rely on explicit pubkey revalidation, not an assumed extension event.
  - [ ] If `revalidateCurrentSession()` detects the extension account changed unexpectedly after restore, do not silently continue under the old identity; surface the identity change through existing `changed` semantics and keep protected actions tied to current signer validation.
  - [ ] Clear NIP-07 restore context from facade-level `disconnect()` even if there is no active in-memory session and even if lower-level signer cleanup fails.
- [ ] Add tests for restore success and fail-closed cases (AC: 1, 2, 3)
  - [ ] Add or extend tests next to implementation files as `*.spec.ts`; use existing fake connection methods/providers/signers and fake storage where practical.
  - [ ] Cover valid stored NIP-07 context plus available provider returning same pubkey restores connected auth state.
  - [ ] Cover missing provider clears restore context and does not authenticate from cached profile data.
  - [ ] Cover provider returning a different pubkey clears restore context and does not keep the previous user connected.
  - [ ] Cover invalid/malformed restore payload is purged and produces disconnected or reconnect-required state.
  - [ ] Cover provider rejection/throw during `getPublicKey()` maps to safe recovery state and does not leave `restoring` indefinitely.
  - [ ] Cover provider validation timeout exits `restoring` and leaves a safe reconnect state.
  - [ ] Cover successful interactive NIP-07 login writes restore context and `disconnect()` clears it.
  - [ ] Cover throwing `localStorage` property access and throwing `getItem`, `setItem`, and `removeItem` calls.
  - [ ] Cover stale restore completion after disconnect or manual login is ignored.
  - [ ] Cover stale profile fetch after disconnect or auth switch does not set `user` or present signed-in UI.
  - [ ] Cover stored `npub` or capabilities, if present from older payloads, are ignored or purged rather than trusted.
- [ ] Refresh docs for NIP-07 restore semantics (AC: 1, 2)
  - [ ] Update `src/core/nostr-connection/README.md` to state that NIP-07 can now restore after reload by revalidating `window.nostr.getPublicKey()` against persisted restore context.
  - [ ] Document that restore context is not auth proof; only current signer validation creates `connected` state.
  - [ ] Do not rewrite broad architecture/UX docs unless implementation creates a new durable pattern requiring documentation.
- [ ] Verify through repository scripts (AC: 1, 2, 3)
  - [ ] Run targeted tests through repo scripts if useful during development.
  - [ ] Run at minimum `bun run typecheck` and `bun run test`; run `bun run check` if practical before marking implementation complete.

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows. Story 1.2 specifically covers desktop browser extension refresh continuity: a valid signer-backed NIP-07 session should survive reload, while expired, revoked, unavailable, changed, or unverifiable signer access must fail closed. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Reliable Nostr Authentication and Session Continuity`]

Covered requirements are FR3, FR11, FR12, FR13, FR14, FR15, and FR17. Session restoration must preserve valid authenticated state after refresh, stop treating invalid authorization as authenticated, restore without unnecessary re-authentication where safe, and provide a clear recovery path when restoration cannot complete. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.2: Restore Valid Browser Extension Sessions After Refresh`]

### Previous Story Intelligence

Story 1.1 is complete and created the shared auth/session source of truth. Current implementation includes `AuthSessionState` in `src/core/nostr-connection/domain/auth-session-state.ts`, facade projection through `NostrConnectionFacadeService.authSessionState`, and UI/session bridging through `NostrSessionService.authSessionState`. Build on this; do not create loose restore booleans as the new semantic source of truth. [Source: `_bmad-output/implementation-artifacts/1-1-define-shared-auth-session-state-model.md#Completion Notes List`]

Important review learnings from Story 1.1:

- Stale async completions caused regressions before; every restore, timeout, and reconnect path must guard against old attempts overwriting current state.
- Timeout/retry controls broke when terminal states cleared their parent render conditions; restore failure states must remain reachable long enough for UI to render recovery.
- Error semantics were previously inferred from raw English strings; use typed domain errors/reason codes where adding behavior.
- `SessionUser` and cached/fetched profile data are display context only and cannot authenticate users.
- Private-key fallback is explicit legacy/advanced compatibility and must not be merged into NIP-07 restore.

### Current Code State To Preserve

- `src/core/nostr-connection/domain/auth-session-state.ts` already defines `restoring`, `connected`, `expired`, `revokedOrUnavailable`, `failed`, and `recoverableRetry`. Use these canonical statuses. Do not add duplicate string unions in UI or services.
- `src/core/nostr-connection/domain/connection-session.ts` normalizes hex pubkeys, encodes `npub`, tracks `methodId`, `capabilities`, and `validatedAt`, and exposes `didConnectionIdentityChange()`. Reuse this as the signer-validated identity.
- `src/core/nostr-connection/application/nip07-connection-method.ts` currently resolves the provider, creates `Nip07ConnectionSigner`, builds `ConnectionSession`, and supports `Nip07ActiveConnection.revalidate()` by calling `getPublicKey()` again. Extend or reuse this path for restore.
- `src/core/nostr-connection/application/nip07-connection-signer.ts` normalizes provider pubkeys and maps user rejection to `ConnectionDomainError('user_rejected', ...)`. Do not duplicate NIP-07 error mapping in `NostrSessionService`.
- `src/core/nostr-connection/infrastructure/nip07-provider.ts` is the only browser provider resolver and already guards `globalThis`. Use it instead of reading `(window as any).nostr` elsewhere.
- `src/core/nostr-connection/application/in-memory-connection-session-store.ts` is volatile by design, so reload currently loses the active connection. Story 1.2 should add minimal browser restore context while preserving the in-memory active connection abstraction.
- `src/core/nostr-connection/application/connection-facade.ts` owns attempts, active session signal, `authSessionState`, stale-attempt guards, `disconnect()`, and `revalidateCurrentSession()`. Extend this facade or a focused adjacent application service; do not bypass it from presentation.
- `src/core/nostr/application/nostr-session.service.ts` currently starts extension login through `connectWithExtension()`, calls `applyNip07Signer()`, fetches profile for display, and exposes `isAuthenticated` from shared auth state plus private-key compatibility. Startup currently only refreshes method availability; this is the likely bridge point for restore.
- `src/core/layout/presentation/components/app-auth-modal.component.ts` renders auth UI from `NostrSessionService`. Story 1.2 should not redesign the modal; only adjust UI if needed to avoid indefinite restore/reconnect states.
- `src/core/nostr-connection/README.md` currently says active connection is stored in memory and users must relaunch NIP-07/NIP-46/bunker after reload. Update this after implementing NIP-07 restore.

### Required Implementation Shape

The minimal correct design is:

1. Persist a safe NIP-07 restore context only after successful interactive extension connection.
2. On app/session startup, if restore context exists, enter `AuthSessionState` `restoring` for `nip07`.
3. Resolve the current NIP-07 provider and call `getPublicKey()` through existing signer/domain normalization.
4. If the current provider pubkey matches the stored pubkey, reconstruct an active NIP-07 connection/session and set facade `currentSession` to connected.
5. If anything cannot be trusted, purge restore context, clear signer-backed display state, and resolve to disconnected or reconnect-required without using cached profile as proof.

Concrete architecture decision for this story:

- Add a focused NIP-07 restore context store, not a persistent active-session store.
- Add a NIP-07 method-level restore/recreate path, not duplicated provider handling in `NostrSessionService`.
- Add a small orchestrator/facade commit path for a validated restored `ActiveConnection`.
- Keep `InMemoryConnectionSessionStore` volatile; persisted context is only a hint that allows restore to be attempted.
- Store only `version`, `methodId`, `pubkeyHex`, and `validatedAt`. Derive all authoritative session fields from the current signer during restore.

Do not implement NIP-46 restore in this story. `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts` exists for later Story 1.3 context, but this story is NIP-07 only. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.3: Restore Valid NIP-46 External Signer Sessions After Refresh`]

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield project. Do not initialize a new app, introduce another framework, add a state-management library, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep feature-first pseudo-DDD boundaries: pure restore payload validation can be domain/application, browser storage/provider details stay application/infrastructure, and presentation only renders state. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- Components must not import raw NDK, signer adapters, provider internals, localStorage restore helpers, or domain helpers for auth semantics. Presentation should continue consuming `NostrSessionService`. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- Remembered local identity is restorable context only, never proof of active auth. `connected` requires current signer validation. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Sign-in and restore completion must not wait on nonessential profile/feed/relay/loading. Profile fetch may happen after connected state as display enrichment. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- Protected backend calls must remain NIP-98 signed request-by-request; do not introduce backend sessions, cookies, JWTs, OAuth, or Supabase auth sessions. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Angular must not access Supabase for auth/session persistence. Supabase remains server-side only and is out of scope for this story. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Boundaries`]

### UX And Accessibility Guardrails

- Successful restore should be silent where possible; the visible confirmation is the existing connected identity and enabled actions. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Session Restore On Return`]
- Restore failure should show reconnect-required/disconnected state clearly enough for the user to know the next action, without protocol-heavy diagnostics. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Session Restore Status`]
- Do not introduce broad visual redesign, new palette, new typography, or new design system. Preserve Tailwind/DaisyUI `brutal` visual foundation. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Any status or recovery UI must be perceivable without relying only on color and must remain keyboard/screen-reader understandable. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility`]

### Security Constraints

- Never request, store, transmit, derive, or persist private keys.
- Store only public restore context for NIP-07. Do not store NIP-98 tokens, signed events, raw provider objects, callbacks, auth URLs, bunker tokens, or NIP-46 secrets.
- If provider validation fails, fail closed and clear restore context. Do not keep a user signed in because an old profile is present.
- NIP-07 does not standardize reliable account-change notifications, so revalidation must explicitly call the signer/provider when restoring and before sensitive actions where required. [Source: `docs/auth/nostr-auth-rules.md#NIP-07`]
- Logs must not expose sensitive auth data. For this NIP-07 story, avoid logging raw errors from provider failures unless safely sanitized.

### Failure State Mapping

- No restore context: remain `disconnected`; do not call the provider.
- Malformed or unsupported restore payload: purge payload and remain `disconnected`.
- Missing provider: purge payload and resolve to `revokedOrUnavailable` or equivalent reconnect-required state.
- Provider returns invalid pubkey: purge payload and resolve to `revokedOrUnavailable` or `recoverableRetry` with `validation_failed` reason.
- Provider returns a different valid pubkey: purge payload and resolve to `revokedOrUnavailable`.
- Provider rejects, throws, or times out: purge payload and resolve to `recoverableRetry` with a safe reason code such as `user_rejected`, `connection_failed`, or `approval_timed_out`.
- Every failure branch must clear `restoring`, clear stale signer-backed display state, and avoid presenting cached profile data as authenticated.

### Anti-Reinvention Instructions

- Reuse `ConnectionSession`; do not create another canonical session identity type.
- Reuse `ConnectionMethodId` value `nip07`; do not add `browserExtension`, `extension`, or other aliases as auth method ids.
- Reuse `Nip07ConnectionMethod`, `Nip07ConnectionSigner`, and `resolveDefaultNip07Provider`; do not create a separate `window.nostr` utility in layout or feature code.
- Reuse `ConnectionDomainError` and stable `AuthSessionFailureReasonCode` values; do not parse English messages for restore decisions.
- Reuse `NostrSessionService` as the compatibility bridge for current UI, packs, and admin consumers.
- Do not introduce an event bus, generic state-machine framework, global auth store, browser extension SDK dependency, backend auth session, Supabase auth table, or reusable Angular auth module.

### Suggested File Touch Points

Likely UPDATE files:

- `src/core/nostr-connection/domain/auth-session-state.ts`: only if restore needs a stable reason code not already represented.
- `src/core/nostr-connection/domain/connection-session-store.ts`: only if the store abstraction needs restore-specific API; prefer keeping persistent restore context separate if cleaner.
- `src/core/nostr-connection/application/in-memory-connection-session-store.ts`: preserve existing volatile active-connection behavior; do not turn this into browser storage unless the abstraction remains safe and testable.
- `src/core/nostr-connection/application/nip07-connection-method.ts`: likely place to expose a safe restore/recreate active connection path using current provider validation.
- `src/core/nostr-connection/application/connection-facade.ts`: likely owner for `restoring` projection, restore API, active session commit, stale restore protection, and disconnect cleanup.
- `src/core/nostr/application/nostr-session.service.ts`: likely startup bridge to call restore, apply NIP-07 signer, fetch display profile, clear display state on failure, and preserve current interactive login behavior.
- `src/core/nostr-connection/README.md`: update restore documentation.

Likely NEW files:

- `src/core/nostr-connection/application/browser-connection-restore-store.ts` or similar focused file for safe storage payload parsing/writing.
- Co-located `*.spec.ts` for any new restore store/service.

Avoid touching unless directly needed:

- `server.mjs`, Supabase migrations, pack registration, admin pages, NIP-46 restore files, mobile auth docs, and broad UX docs.

### Testing Requirements

- Domain/application tests should avoid Angular TestBed unless testing Angular services. Use fakes and fake timers where needed.
- If adding storage persistence, test malformed JSON, wrong method id, missing pubkey, invalid pubkey, storage read/write failure, and clear-on-disconnect.
- If adding facade restore API, test `restoring -> connected`, `restoring -> revokedOrUnavailable/recoverable/disconnected`, and no indefinite pending state.
- If updating `NostrSessionService`, test successful startup restore updates `user` only after signer validation, failed restore clears stale signer-backed user display, and stale profile fetches cannot repopulate `user` after logout/auth switch.
- Test restore races: restore finishing after disconnect, restore finishing after interactive login starts, overlapping extension login calls, and profile fetch from an old operation finishing after a newer session.
- Test disconnect cleanup with failure: persisted restore context and local display state must be cleared even if facade or client signer cleanup rejects.
- Keep existing extension login, private-key fallback, external signer, bunker, timeout, cancellation, and disconnect tests passing.
- Verification must use repository scripts from `package.json`, not direct underlying tools. Preferred commands are `bun run typecheck`, `bun run test`, and `bun run check`. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Latest Technical Information

- NIP-07 defines `window.nostr.getPublicKey()` as the browser signer API returning a hex public key; web apps may use `window.nostr` only after checking availability. This is the correct restore revalidation primitive for browser extension sessions. [Source: `https://github.com/nostr-protocol/nips/blob/master/07.md`]
- NIP-07 optional encryption APIs do not change this story; restore should not request optional capabilities beyond detecting them for `ConnectionSession.capabilities`. [Source: `https://github.com/nostr-protocol/nips/blob/master/07.md`]
- Angular signals support private writable signals exposed through `asReadonly()` and computed read-only derivations; this matches the existing facade pattern and should be used instead of public writable restore state. [Source: `https://angular.dev/guide/signals`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Vitest `^4.0.8`. [Source: `package.json`]

### Git Intelligence

- Recent relevant commit: `a2b3593 feat: 1-1 define shared auth session state model`. It added the canonical auth state model, facade/session bridge projection, typed cancellation/timeout handling, and tests. Build on this commit’s patterns rather than adding another state source.
- Worktree was clean at story creation time. If implementation sees unrelated changes later, preserve them and do not revert user work.

### Out Of Scope

- NIP-46 external signer restore; Story 1.3 owns it.
- Auth method selection and advanced bunker UX; Story 1.4 owns it.
- Full pending/timeout/cancelled/denied UI copy and anti-indefinite loading across all methods; Story 1.5 owns broader behavior.
- Mobile Amber/Primal return-flow stabilization; Story 1.6 owns it.
- Permission minimization; Story 1.7 owns it.
- Shared async button abstraction; only add local loading/disabled behavior if required by restore.
- Pack registration, Supabase membership persistence, admin oversight, and backend API route changes.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.2: Restore Valid Browser Extension Sessions After Refresh`
- `_bmad-output/planning-artifacts/prd.md#Session Continuity`
- `_bmad-output/planning-artifacts/prd.md#Integration Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Session Restore On Return`
- `_bmad-output/project-context.md#Critical Don't-Miss Rules`
- `docs/auth/nostr-auth-rules.md#NIP-07`
- `src/core/nostr-connection/domain/auth-session-state.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/nip07-connection-method.ts`
- `src/core/nostr-connection/application/nip07-connection-signer.ts`
- `src/core/nostr-connection/infrastructure/nip07-provider.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.

### File List
