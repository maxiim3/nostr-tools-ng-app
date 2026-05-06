# Story 1.9: Sign Out and Clear Auth Artifacts

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a signed-in Nostr user,
I want to sign out cleanly,
so that Toolstr no longer treats me as authenticated or keeps stale signer state.

## Acceptance Criteria

1. Given a user is connected through browser extension, external signer app, or bunker, when the user signs out, then the app returns to disconnected state and protected actions such as pack join require reconnecting.
2. Given there are active or persisted auth artifacts, when sign-out completes, then active attempts, transient signer state, local NIP-46 restore data where appropriate, timers, callbacks, auth URLs, and pending UI states are cleaned up and no cached profile data keeps the user signed in.
3. Given sign-out cleanup runs, when logs or errors are produced, then sensitive values such as NIP-46 secrets, bunker tokens, auth URLs, and NIP-98 tokens are not exposed.

## Tasks / Subtasks

- [x] Inventory current sign-out paths and artifacts before changing behavior (AC: 1, 2, 3)
  - [x] Trace desktop and mobile header sign-out buttons in `AppHeaderComponent`.
  - [x] Trace auth-modal recovery disconnect paths in `AppAuthModalComponent`.
  - [x] List artifacts owned by `NostrSessionService`: current operation IDs, external/bunker attempt IDs, timers, instruction subscription, `externalAuthUri`, waiting signals, profile `user`, private-key fallback state, error state, and auth modal visibility.
  - [x] List artifacts owned by `ConnectionFacade`: current attempt/session, NDK signer signal, auth terminal status, restore status, NIP-07 restore store, NIP-46 restore store, and active connection store.
  - [x] Confirm protected pack join uses `NostrSessionService.isAuthenticated()` and NIP-98 signing, not `session.user()` alone.
- [x] Harden sign-out cleanup semantics in application services (AC: 1, 2, 3)
  - [x] Ensure `NostrSessionService.disconnect()` invalidates stale async completions before cleanup by incrementing all relevant operation/attempt IDs.
  - [x] Ensure external signer and bunker timers are cancelled and instruction callbacks unsubscribed.
  - [x] Ensure URI/auth URL, waiting flags, errors, profile user, private-key fallback state, and modal-specific pending state resolve to disconnected/reconnect UI.
  - [x] Ensure `ConnectionFacade.disconnect()` cancels the current attempt, disconnects the active connection/store, clears current session, clears NDK signer, resets restore state, resets terminal status to disconnected, and clears both restore stores.
  - [x] Preserve fail-closed behavior if attempt cancellation or active-connection disconnect throws: local session and restore artifacts must still be cleared.
- [x] Prevent stale completions after sign-out from resurrecting auth (AC: 1, 2)
  - [x] Cover late NIP-46 external signer completion after disconnect.
  - [x] Cover late bunker completion after disconnect.
  - [x] Cover extension/profile fetch completion racing with disconnect.
  - [x] Ensure stale completions either no-op or clear their signer/session artifacts and never repopulate `user`, `currentSession`, `ndkSigner`, `externalAuthUri`, or waiting flags.
- [x] Verify protected actions require reconnecting after sign-out (AC: 1)
  - [x] Add/adjust a focused pack request test showing sign-out flips `isAuthenticated()` false and the join action is unavailable or opens auth instead of submitting.
  - [x] Ensure cached `SessionUser` profile data alone cannot enable pack join, admin links, or support actions that require signer authorization.
  - [x] Do not introduce backend sessions, cookies, JWT login, OAuth replacement, or server-side identity state.
- [x] Add focused regression coverage (AC: 1, 2, 3)
  - [x] `NostrSessionService` tests for disconnect after NIP-07, NIP-46 external, bunker, and private-key fallback auth.
  - [x] `NostrSessionService` tests for disconnect during pending external and bunker attempts, including timer/callback/URI cleanup.
  - [x] `ConnectionFacade` tests that disconnect removes `nostr.connect.restore.v1` and `nostr.connect.nip46.restore.v1`, clears `currentSession`, clears `currentAttempt`, clears `ndkSigner`, and returns `authSessionState()` to `disconnected`.
  - [x] Store tests should continue to assert active connection `disconnect()` is called and store current is null after clear.
  - [x] Add a no-sensitive-logging assertion where code uses logging or error reporting in this path. If no logging exists, record that the implementation preserves no-log cleanup.
- [x] Preserve UI, accessibility, and i18n behavior (AC: 1, 2)
  - [x] Keep desktop and mobile sign-out controls as native buttons with visible labels and focus states.
  - [x] If sign-out status or error copy changes, update `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` together.
  - [x] Do not rely on color alone to communicate disconnected/reconnect-required state.
  - [x] Do not add protocol-heavy sign-out copy to the user-facing UI.
- [x] Verify with repository scripts only (AC: 1, 2, 3)
  - [x] Run `bun run typecheck`.
  - [x] Run `bun run test`.
  - [x] Run `bun run check` if practical before moving the story to review.
  - [x] Do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or underlying lint tools.

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows while preserving session continuity and clear recovery. Story 1.9 is the cleanup boundary: after sign-out, no local profile cache, restore payload, pending attempt, remote signer callback, auth URL, timer, or stale async completion may keep or recreate authenticated state. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.9: Sign Out and Clear Auth Artifacts`]

Covered requirements are FR8, FR10, FR13, and FR15. The key product risk is a false authenticated UI after a user intentionally disconnects or after a late signer response arrives from an old flow. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

### Previous Story Intelligence

Story 1.8 added local auth-modal action guards for extension, external signer, bunker, and private-key submit actions. Preserve those guards, but do not treat local in-flight button state as the source of sign-out truth. Sign-out must clear service/domain state even when UI action guards are pending. [Source: `_bmad-output/implementation-artifacts/1-8-add-accessible-auth-loading-and-anti-duplicate-submit-behavior.md#Completion Notes List`]

Story 1.7 hardened stale NIP-46 auth races, minimized NIP-46 capabilities, and emphasized operation IDs, attempt IDs, timeout cleanup, and fail-closed stale-session clearing. Story 1.9 should extend those patterns to the explicit user-initiated disconnect path rather than invent a second cancellation model. [Source: `_bmad-output/implementation-artifacts/1-8-add-accessible-auth-loading-and-anti-duplicate-submit-behavior.md#Previous Story Intelligence`]

Story 1.6 remains `in-progress` for Amber/Primal real-device validation. Do not claim real mobile signer logout behavior has been manually verified unless it is actually tested on devices. Automated tests should prove app-side stale completion and cleanup behavior. [Source: `_bmad-output/implementation-artifacts/sprint-status.yaml`]

Recent commits: `43ae5a1 feat: add auth loading guards`, `b51ef19 1.8 - create story`, `7621678 1.7`, plus architecture-note moves. Current work is concentrated in auth modal/UI guards, `NostrSessionService`, `ConnectionFacade`, restore stores, and auth tests.

### Current Code State To Preserve

`src/core/nostr/application/nostr-session.service.ts` currently:

- Exposes `user`, `authModalOpen`, `connecting`, `error`, `extensionAvailable`, `externalAuthUri`, `waitingForExternalAuth`, `waitingForBunkerAuth`, `authSessionState`, `isAuthenticated`, and `isAdmin` as signals/computed projections.
- Treats connected auth as `isAuthSessionConnected(facade.authSessionState()) || privateKeyFallbackActive()`, so a profile-only `user` must not authenticate the app.
- Uses `currentAuthOperationId`, `currentExternalAttemptId`, and `currentBunkerAttemptId` to reject stale completions.
- Uses `externalAuthTimeout`, `bunkerAuthTimeout`, and `externalInstructionsUnsubscribe` for pending NIP-46 flows.
- `disconnect()` already increments operation/attempt IDs, clears instruction subscriptions and timers, calls `facade.disconnect()` and `client.clearSigner()`, clears `user`, clears private-key fallback, clears errors, clears URI/waiting state, and refreshes method availability.
- `applySessionForDisplay()` can race with disconnect while applying signers or fetching profiles; preserve the operation-ID checks and ensure they are sufficient for sign-out races.

`src/core/nostr-connection/application/connection-facade.ts` currently:

- Owns `currentAttempt`, `currentSession`, `pending`, `error`, `_attemptId`, `_attemptTerminalStatus`, `_restoringMethodId`, and `ndkSigner`.
- Stores NIP-07 restore context in localStorage key `nostr.connect.restore.v1`.
- Stores NIP-46 restore context in localStorage key `nostr.connect.nip46.restore.v1`.
- `disconnect()` increments `_attemptId`, cancels the current attempt, disconnects the orchestrator, clears session and NDK signer, resets terminal status, clears both restore stores, clears restoring state, and resets pending.
- Catches active orchestrator disconnect failures, but `cancelCurrentAttempt()` can still throw through the awaited call path. If this story changes error handling, keep local cleanup fail-closed.

`src/core/nostr-connection/application/nip07-restore-context-store.ts` and `nip46-restore-context-store.ts` currently:

- Guard `globalThis.localStorage` access for non-browser/test contexts.
- Tolerate throwing storage reads/writes/removes.
- Remove invalid persisted payloads on load.
- Provide `clear()` methods for exact restore keys. Do not broaden this to unrelated localStorage keys.

`src/core/nostr/application/nostr-client.service.ts` currently:

- Clears NDK signer, active user, and signer capabilities in `clearSigner()`.
- Does not persist a backend login session.
- Provides NIP-98 signing through the active local signer; after sign-out there should be no signer for protected API calls.

`src/core/layout/presentation/components/app-header.component.ts` currently:

- Renders desktop and mobile sign-out buttons only when `session.user()` is present.
- Calls `session.disconnect()` from both desktop and mobile sign-out paths.
- Uses native buttons and visible labels. Keep this accessible shape.

`src/features/packs/presentation/pages/pack-request.page.ts` currently:

- Derives `isAuthenticated` from `NostrSessionService.isAuthenticated`.
- Resets request/member state to `idle`/false when auth becomes false.
- `requestJoin()` should remain protected by application/backend auth; Story 1.9 should verify sign-out leaves it unavailable or reconnect-gated.

### Required Implementation Shape

The minimal correct implementation is a focused sign-out cleanup hardening pass:

1. Start from the existing `NostrSessionService.disconnect()` and `ConnectionFacade.disconnect()` paths. Strengthen them only where tests prove a gap.
2. Keep `core/nostr-connection` responsible for connection/session/restore artifacts and `core/nostr` responsible for NDK display signer/profile bridging.
3. Do not move raw signer, NIP-46, NIP-98, relay, or Supabase logic into Angular components.
4. Make disconnect idempotent enough for desktop/mobile/recovery paths to call it repeatedly without resurrecting state or throwing user-visible protocol errors.
5. Preserve localStorage safety: clear only the known auth restore keys, tolerate unavailable/throwing storage, and do not log payload contents.
6. Ensure late completions from old attempts cannot repopulate authenticated state after disconnect.
7. Ensure protected actions use active signer/session semantics. Profile cache or `npub` display state is not proof of auth.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield foundation. Do not initialize a new app, add a third-party auth package, introduce a global state library, or migrate frameworks. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries: domain for pure types/rules, application for orchestration/ports, infrastructure for Nostr/NDK/browser adapters, and presentation for Angular UI. [Source: `_bmad-output/planning-artifacts/architecture.md#Code Organization`]
- Local restored state is a restore hint only; it is never proof of active authentication. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Backend auth remains stateless NIP-98 per request. Do not add cookies, JWT login, OAuth replacement, or server-side identity state. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Angular must not access Supabase directly and must not expose Supabase secret/service-role keys. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`]
- Auth/session state must use explicit typed states rather than loose booleans as the source of semantic truth. [Source: `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`]
- Logging must not expose private keys, service-role keys, raw authorization tokens, NIP-46 secrets, restore payloads, bunker tokens, auth URLs, or sensitive signer material. [Source: `_bmad-output/planning-artifacts/architecture.md#Security`]

### UX And Accessibility Guardrails

- Preserve the Tailwind/DaisyUI `brutal` visual foundation. This story is cleanup/reliability work, not a redesign. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Signed-in identity may include profile image/fallback, display name, identifier if needed, connected status, and sign-out access. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Connected Identity Summary`]
- Sign-out controls must remain keyboard-operable native buttons with visible labels and visible focus behavior. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Acceptance Notes`]
- If sign-out changes status messaging, status updates that do not move focus should remain programmatically determinable with roles/properties. [Source: `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`]
- Do not add scary or protocol-heavy sign-out copy. The user-facing outcome should be simple: disconnected and reconnect required.

### Latest Technical Information

- Angular current docs say components are standalone by default and imported directly by components that use them. Keep new/updated components standalone without adding `standalone: true`. [Source: `https://angular.dev/guide/components`]
- Angular signals remain appropriate for local/application state, and signals read in `OnPush` templates mark the component for update when values change. [Source: `https://angular.dev/guide/signals`]
- W3C WCAG 2.2 status-message guidance requires programmatic status messaging when content changes without focus movement. Preserve or add live/status semantics for any new sign-out status feedback. [Source: `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Transloco `^8.3.0`, and Vitest `^4.0.8`. [Source: `package.json`]

### File Structure Requirements

Likely UPDATE files:

- `src/core/nostr/application/nostr-session.service.ts`: strengthen idempotent cleanup, stale completion handling, or fail-closed disconnect behavior if tests expose gaps.
- `src/core/nostr/application/nostr-session.service.spec.ts`: add pending/connected/private-key/stale-completion sign-out coverage.
- `src/core/nostr-connection/application/connection-facade.ts`: strengthen fail-closed disconnect cleanup if tests expose a path where cancellation failure prevents local restore/session clearing.
- `src/core/nostr-connection/application/connection-facade.spec.ts`: add restore-key clearing, current attempt/session, NDK signer, terminal status, and disconnected-state tests.
- `src/core/layout/presentation/components/app-header.component.ts` and `.spec.ts` if sign-out button state/copy/accessibility needs adjustment.
- `src/features/packs/presentation/pages/pack-request.page.ts` and `.spec.ts` if tests reveal pack join can submit after sign-out.

Potential UPDATE files only if behavior changes require copy:

- `src/assets/i18n/fr.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

Avoid touching unless directly necessary:

- `server.mjs`, Supabase migrations, NIP-98 verification, pack membership persistence, broad auth modal redesign, permission policy, mobile real-device documentation, and shared UI abstractions.

### Testing Requirements

- Use co-located `*.spec.ts` tests. Domain/store tests should avoid Angular TestBed; application tests should use fake ports/signers; UI tests should assert visible states and service interactions. [Source: `_bmad-output/project-context.md#Testing Rules`]
- Required service coverage:
  - NIP-07 connected sign-out clears `user`, facade session, NDK signer, NDK client signer, restore context, errors, and auth state.
  - NIP-46 external connected sign-out clears NIP-46 restore payload and signer state.
  - Bunker connected sign-out clears waiting state and signer state; no bunker token/auth URL is retained.
  - Private-key fallback sign-out clears `privateKeyFallbackActive`, `user`, and NDK client signer.
  - Disconnect during external signer wait clears URI, callback subscription, timer, current attempt, and rejects late completion.
  - Disconnect during bunker wait clears waiting flag, timer, current attempt, and rejects late completion.
  - Profile-only `user` data does not make `isAuthenticated()` true.
- Required facade/restore coverage:
  - `ConnectionFacade.disconnect()` removes `nostr.connect.restore.v1` and `nostr.connect.nip46.restore.v1`.
  - Disconnect clears `currentAttempt`, `currentSession`, `ndkSigner`, `_restoringMethodId`, and terminal status.
  - If an active connection/store disconnect throws, local restore/session artifacts still end cleared unless the implementation intentionally surfaces the error after cleanup.
  - Existing restore-store specs continue to prove invalid payload purge and throwing-storage tolerance.
- Required UI/pack coverage:
  - Desktop and mobile sign-out call `session.disconnect()` and leave reconnect/login controls reachable.
  - Pack request page reacts to `isAuthenticated()` becoming false by resetting status/member state and not submitting protected join from a stale profile display.
- Security/logging coverage:
  - If code logs or reports disconnect errors, test redaction or avoid logging raw values.
  - If no logging is added, record in the Dev Agent Record that cleanup remains no-log and therefore does not expose NIP-46 secrets, restore payloads, bunker tokens, auth URLs, or NIP-98 tokens.
- Verification must use repository scripts: `bun run typecheck`, `bun run test`, and preferably `bun run check`. [Source: `package.json`]

### Anti-Reinvention Instructions

- Reuse `NostrSessionService.disconnect()` and `ConnectionFacade.disconnect()`; do not create a parallel logout service or UI-only auth reset.
- Reuse operation IDs and attempt IDs for stale completion invalidation.
- Reuse `Nip07RestoreContextStore.clear()` and `Nip46RestoreContextStore.clear()`; do not manually scan localStorage.
- Reuse `NostrClientService.clearSigner()` for NDK signer cleanup.
- Reuse `isAuthenticated()` for protected UI gating; do not gate protected actions on `session.user()` alone.
- Do not add a backend logout endpoint. There is no backend session to clear.
- Do not disconnect from all relays globally unless needed for signer/session cleanup; sign-out is about auth artifacts, not destroying unrelated app infrastructure.
- Do not log auth URLs, bunker tokens, NIP-46 secrets, restore payloads, NIP-98 tokens, private keys, or raw signer material.

### Out Of Scope

- Completing Story 1.6 Amber/Primal real-device validation.
- Changing NIP-46 permission policy or one-shot grants.
- Changing session restore behavior except where sign-out cleanup requires clearing restore artifacts.
- Pack membership idempotency, Supabase member schema, admin member oversight, and already-in-pack handling; Epic 2 owns those.
- New auth methods, backend sessions, OAuth/JWT/cookie login, PWA installation, broad onboarding, reusable Angular auth module extraction, and public wiki work.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.9: Sign Out and Clear Auth Artifacts`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Connected Identity Summary`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `docs/auth/nostr-auth-rules.md#Permissions`
- `docs/auth/nostr-auth-rules.md#Protocol Rules`
- `docs/auth/mobile-auth-notes.md#Implementation Notes`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-client.service.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/nip07-restore-context-store.ts`
- `src/core/nostr-connection/application/nip46-restore-context-store.ts`
- `src/core/layout/presentation/components/app-header.component.ts`
- `src/features/packs/presentation/pages/pack-request.page.ts`
- `https://angular.dev/guide/components`
- `https://angular.dev/guide/signals`
- `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`

### Saved Questions / Clarifications

- Resolved default: treat sign-out as frontend application cleanup only. Do not add a backend logout route because protected backend actions are stateless NIP-98 requests.
- Resolved default: clear both NIP-07 and NIP-46 restore contexts on explicit sign-out. The user intentionally disconnected, so future refresh should require reconnecting.
- Resolved default: do not add new user-facing sign-out copy unless tests or UX gaps require it.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `bun run test` red run: new disconnect cleanup regressions failed before implementation.
- `bun run test`: 35 spec files passed, 308 tests passed.
- `bun run typecheck`: passed.
- `bun run check`: passed lint, CSS lint, format check, typecheck, and tests.

### Completion Notes List

- Hardened `ConnectionFacade.disconnect()` to tolerate current-attempt cancellation failures while still clearing current attempt/session, NDK signer, terminal status, restore state, and both known restore stores.
- Hardened `NostrSessionService.disconnect()` to complete local cleanup even if facade disconnect or signer clearing rejects, preserving disconnected UI state without logging sensitive auth material.
- Added stale bunker completion cleanup after explicit sign-out so late completions clear facade/client signer state and cannot restore `user` or active auth.
- Added pack request auth gating so a direct join call with only stale profile display opens auth instead of submitting a protected request.
- Preserved existing UI copy/i18n and native button sign-out controls; no new user-facing sign-out text or logging was added.

### File List

- `_bmad-output/implementation-artifacts/1-9-sign-out-and-clear-auth-artifacts.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/core/layout/presentation/components/app-header.component.spec.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/connection-facade.spec.ts`
- `src/core/nostr-connection/testing/fakes/fake-connection-attempt.ts`
- `src/features/packs/presentation/pages/pack-request.page.ts`
- `src/features/packs/presentation/pages/pack-request.page.spec.ts`

## Change Log

- 2026-05-06: Created Story 1.9 developer context for clean sign-out and auth artifact cleanup.
- 2026-05-06: Implemented clean sign-out cleanup hardening and regression coverage; moved story to review.
