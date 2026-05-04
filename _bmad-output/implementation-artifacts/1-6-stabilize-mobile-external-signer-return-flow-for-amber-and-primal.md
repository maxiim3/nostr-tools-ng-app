# Story 1.6: Stabilize Mobile External Signer Return Flow for Amber and Primal

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a mobile Nostr user,
I want Toolstr to handle app switching and return from my signer app reliably,
so that mobile authentication feels stable instead of fragile.

## Acceptance Criteria

1. Given a mobile user starts external signer authentication, when the user switches to Amber or Primal and returns to Toolstr, then the app preserves the auth attempt state and completes the session when signer approval succeeds.
2. Given Amber or Primal approval is delayed, denied, cancelled, expired, or interrupted, when the user returns to Toolstr, then the app displays a clear state and recovery action and app-specific limitations are documented.
3. Given the mobile flow is implemented or adjusted, when validation is performed, then Amber and Primal are manually verified across waiting, success, refusal, timeout, refresh, and return-to-site states and verification notes are preserved in project documentation.
4. Given Story 1.5 already added explicit pending/recovery states, when this story is implemented, then it reuses `AuthSessionState`, `NostrSessionService`, and the current auth modal projection instead of creating a second mobile-auth state source.
5. Given mobile app switching can trigger focus, visibility, navigation, and delayed async completion changes, when the user returns to Toolstr, then stale or timed-out attempts cannot later overwrite a newer successful, cancelled, retried, or disconnected state.
6. Given user-facing mobile auth copy or documentation changes, when implementation is complete, then `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` stay aligned for UI copy, with French preserved as the default/fallback product language.

## Tasks / Subtasks

- [x] Preserve and harden the external signer attempt across mobile app switching (AC: 1, 2, 4, 5)
  - [x] Reuse `NostrSessionService.beginExternalAppLogin()`, `finishExternalAppLogin()`, `handleExternalAuthTimeout()`, and current `currentExternalAttemptId`/`currentAuthOperationId` guards; do not bypass them from the modal.
  - [x] Verify returning from Amber or Primal leaves `authSessionState` in `awaitingExternalSignerApproval`, `connected`, `timedOut`, `cancelled`, or `recoverableRetry`; it must not fall back to ambiguous disconnected/loading while a valid attempt is active.
  - [x] Preserve `externalAuthUri`, `waitingForExternalAuth`, QR/open/copy affordances, and cancel/retry behavior while the user is away in the signer app.
  - [x] If browser focus/visibility handlers are needed, keep them in application/service-level orchestration or a narrow browser adapter; do not put protocol or signer mechanics directly in `AppAuthModalComponent`.
  - [x] Ensure a late response from an older Amber/Primal attempt cannot close the modal, set `user`, or clear state after retry, cancellation, timeout, sign-out, or a newer attempt.
- [x] Improve mobile return UX only where needed (AC: 1, 2, 6)
  - [x] Keep the current auth modal and DaisyUI brutal visual foundation; do not redesign the modal or introduce a mobile-only component framework.
  - [x] Ensure the external signer section gives a practical return path: open/reopen signer app, copy link, cancel, retry after timeout, and choose another method from the Story 1.5 status area.
  - [x] Keep default copy protocol-light: use signer app, approve, return to Toolstr, try again, choose another method. Do not expose raw NIP-46, NDK, relay, stack, or signer error text as the primary message.
  - [x] If UI copy changes, add matching keys in `fr`, `en`, and `es`; do not hard-code new visible strings in the template.
  - [x] Preserve accessibility: status area keeps `role="status"`, `aria-live="polite"`, keyboard-operable actions, visible focus states, and non-color-only feedback.
- [x] Document Amber and Primal validation results and limitations (AC: 2, 3)
  - [x] Update `docs/auth/mobile-auth-notes.md` with a concise Amber/Primal validation table or checklist.
  - [x] Capture results for waiting for approval, successful approval, user refusal/denial, timeout, return to site after app switch, refresh while authorization remains valid, and expired/revoked/unavailable authorization.
  - [x] Record app-specific limitations separately from implementation bugs. Example: if a signer does not return focus automatically, document the manual return expectation and ensure Toolstr still shows recovery guidance.
  - [x] Do not claim manual verification is complete unless it was actually performed on real devices/apps or explicitly marked as pending/unverified.
- [x] Extend targeted tests for mobile external signer return behavior (AC: 1, 2, 4, 5, 6)
  - [x] Update `src/core/nostr/application/nostr-session.service.spec.ts` to cover preserving pending state while an external attempt is unresolved, successful completion after simulated app return, timeout invalidation, retry after timeout, cancellation, and stale completion after retry/cancel.
  - [x] Update `src/core/layout/presentation/components/app-auth-modal.component.spec.ts` only if modal behavior/copy changes; assert visible external signer guidance and accessible controls.
  - [x] Add tests for any new focus/visibility/navigation handling if introduced. Simulate events directly and prove they do not create duplicate attempts or clear valid pending state.
  - [x] Preserve existing Story 1.5 tests for denied/retry/reconnect, advanced bunker visibility, QR alt text, and raw error de-emphasis.
- [x] Verify with repository scripts only (AC: 1-6)
  - [x] Run `bun run typecheck`.
  - [x] Run `bun run test`.
  - [x] Run `bun run check` if practical before moving the story to review.

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows while preserving session continuity and clear recovery. Story 1.6 is the mobile NIP-46 app-switching slice: Amber and Primal must not make Toolstr lose the current auth attempt, strand users in unclear loading, or falsely claim success without signer authorization. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.6: Stabilize Mobile External Signer Return Flow for Amber and Primal`]

Covered requirements are FR2, FR5, FR6, FR16, FR17, FR31, FR32, and FR33. Supporting NFRs require auth status changes to become visible promptly after signer approval, denial, timeout, or return-to-app; auth attempts must survive mobile focus transitions, app switching, delayed approvals, denials, cancellations, and timeouts; external signer guidance must be clear; and core auth flow must remain WCAG AA-oriented. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

### Previous Story Intelligence

Story 1.5 is complete and directly constrains this story. It added `AuthSessionState`-driven pending/recovery projection in `AppAuthModalComponent`, safe translated status copy, retry/reconnect/choose-method actions, and tests for extension, external signer, bunker, denied, timeout, expired, and revoked/unavailable states. Reuse that projection; do not create a separate mobile status model. [Source: `_bmad-output/implementation-artifacts/1-5-add-explicit-pending-timeout-cancelled-denied-and-retry-states.md#Completion Notes List`]

Key learnings from Story 1.5 and its review findings:

- Retry, cancel, and choose-another-method paths previously broke or failed to clear pending state. Keep those actions wired through `NostrSessionService` and facade cancellation.
- Dynamic auth status must remain announced to assistive technology through the existing status area.
- Stale completion bugs are high risk. Preserve `currentAuthOperationId`, `currentExternalAttemptId`, `currentBunkerAttemptId`, facade `_attemptId`, and `attemptId` checks.
- Raw signer/protocol errors must not be primary user-facing copy when a mapped auth state exists.
- Bunker advanced visibility work is unrelated but must not regress while editing shared modal code.

Recent commits confirm the active implementation pattern: `ec39c82 feat: add explicit auth recovery states`, `c1cbc08 feat: clarify auth method selection`, `c19f3e8 feat: restore nip-46 sessions`, `aaf7ae0 feat: create nip-46 restore story`, and `33ec5d2 fix: persistant connection on reload (1.2)`. Recent work is concentrated in the auth modal, `NostrSessionService`, `ConnectionFacade`, NIP-46 restore flow, and auth docs.

### Current Code State To Preserve

`src/core/layout/presentation/components/app-auth-modal.component.ts` currently:

- Uses `NostrSessionService` as the only injected auth/session dependency.
- Renders `modalStatus()` from `resolveModalStatus(this.session.authSessionState())` with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
- Shows external signer open/copy/QR/cancel/retry UI when `session.externalAuthUri()` or `session.externalAuthTimedOut()` is present.
- Calls `startExternalApp()`, which sets `lastAttemptedMethod` to `nip46-nostrconnect`, awaits `session.beginExternalAppLogin()`, resets copied state, and opens the URI through `globalThis.location.href` when a URI exists.
- Calls `cancelExternalApp()`, which clears copied/QR state and delegates to `session.cancelExternalAppLogin()`.
- Uses `retryCurrentMethod()` and `retryMethod('nip46-nostrconnect')` to retry external signer auth through `startExternalApp()`.
- Keeps modal presentation-focused; it must not import NDK, NIP-46 starters, restore stores, signer adapters, NIP-98 services, or backend APIs.

`src/core/nostr/application/nostr-session.service.ts` currently:

- Owns UI-facing signals: `authModalOpen`, `connecting`, `error`, `extensionAvailable`, `externalAuthUri`, `waitingForExternalAuth`, `waitingForBunkerAuth`, `authSessionState`, `externalAuthTimedOut`, and `bunkerAuthTimedOut`.
- Uses `currentAuthOperationId`, `currentExternalAttemptId`, and `currentBunkerAttemptId` to ignore stale async completion.
- Starts external app auth through `beginExternalAppLogin()`: clears competing bunker state, starts facade connection with `nip46-nostrconnect`, binds instruction changes, stores a resolved auth URI, sets `waitingForExternalAuth`, launches `finishExternalAppLogin(attemptId)`, and sets a 120s timeout.
- Completes external app auth through `finishExternalAppLogin(attemptId)`: waits on `facade.completeCurrentAttempt()`, rechecks attempt ID, clears URI/waiting/timer, applies session display, and closes the modal on success.
- Times out external app auth through `handleExternalAuthTimeout(attemptId)`: increments `currentExternalAttemptId`, clears instructions/URI/waiting/timer, sets a timeout error, and calls `facade.cancelCurrentAttempt({ reason: 'timedOut', attemptId: facade.getCurrentAttemptId() })`.
- On external completion failure, clears URI/waiting/timer in `finally`, so failed/denied app returns should reach a recoverable state and not leave stale QR/URI state active.

`src/core/nostr-connection/application/connection-facade.ts` currently:

- Maps active `nip46-nostrconnect` attempts to `{ status: 'awaitingExternalSignerApproval', methodId: 'nip46-nostrconnect', attemptId }`.
- Maps timeout cancellation to `{ status: 'timedOut', methodId, attemptId, reasonCode: 'approval_timed_out' }` and normal cancellation to `{ status: 'cancelled', ... }`.
- Maps failed connection errors to `recoverableRetry` with a reason code from `resolveAuthSessionFailureReasonCode()`.
- Maps messages containing reject, denied, or cancel to `user_rejected`, and timeout messages to `approval_timed_out`.
- Persists valid NIP-46 restore context only after successful session completion and stores restore payload through `Nip46RestoreContextStore`.

`src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts` and `nip46-connection-signer.ts` currently:

- Keep NIP-46 mechanics behind application/infrastructure abstractions.
- Restore active NIP-46 connections from stored payloads with timeouts and final pubkey validation.
- Convert NIP-46 signer rejection or denial messages into `ConnectionDomainError('user_rejected', ...)` and timeout messages into `ConnectionDomainError('timeout', ...)`.

`docs/auth/mobile-auth-notes.md` currently contains the manual stabilization matrix for Amber and Primal but only as a generic checklist. This story should update that doc with actual validation notes and app-specific limitations.

### Required Implementation Shape

The minimal correct implementation is likely a small hardening pass, not a rewrite:

1. Keep external signer auth rooted in `NostrSessionService.beginExternalAppLogin()` and `ConnectionFacade.startConnection('nip46-nostrconnect')`.
2. Preserve attempt IDs and operation IDs as the primary stale-completion defense.
3. Add only the smallest additional browser lifecycle handling if real Amber/Primal testing shows return-to-Toolstr does not refresh visible state. If added, it must not create duplicate attempts or mark auth failed just because focus changed.
4. Keep UI changes inside the existing auth modal external signer section and Story 1.5 status projection.
5. Update docs with manual Amber/Primal results and limitations.
6. Add tests around external signer pending/return/stale/timeout behavior before or alongside implementation changes.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield foundation. Do not initialize a new app, introduce a component library, add a state-management library, migrate routing, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries. Presentation components render state and trigger application service commands; they do not own signer mechanics. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- `src/core/nostr-connection/domain/` owns pure auth state types, `src/core/nostr-connection/application/` owns connection orchestration, `src/core/nostr-connection/infrastructure/` owns NIP-46/NDK details, and `src/core/layout/presentation/components/app-auth-modal.component.ts` owns modal presentation. [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- Components must not import NDK, `window.nostr` wrappers, NIP-46 restore helpers, NIP-46 starters, bunker starters, NIP-98 services, Supabase, or backend APIs. [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Auth/session state must be explicit unions or typed objects, not loose boolean combinations. [Source: `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`]
- Loading/pending states must name what is happening and have success, failure, cancellation, or timeout/recovery transitions. [Source: `_bmad-output/planning-artifacts/architecture.md#Loading State Patterns`]
- Sign-in completion must not wait on nonessential profile/feed/relay loading. Profile fetch can enrich display, but authorization/session completion remains signer-driven. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]
- Do not add backend sessions, cookies, JWT login, OAuth replacement, Supabase auth state, or server-side identity state. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Do not change pack registration, admin, Supabase, NIP-98 verification, NIP-07 restore, or bunker behavior unless a compile/test break directly requires a small non-behavioral adjustment.

### UX And Accessibility Guardrails

- Preserve the existing Tailwind/DaisyUI `brutal` visual foundation. No new design system, palette, typography system, broad layout redesign, animation layer, or visual direction belongs in this story. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Mobile should prioritize external signer app authentication. Desktop should continue to favor browser extension authentication. Bunker remains advanced. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`]
- The external signer pending state must be concise and practical: approve in the signer app, return to Toolstr, retry, cancel, or choose another method. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#External Signer / Mobile Pending Flow`]
- Recovery should stay minimal: one concise message, one primary action, optional secondary action only when useful. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Recovery Pattern`]
- Core buttons and recovery controls must remain keyboard-operable, visibly focused, and understandable to screen-reader users. State changes must not rely only on color or motion. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy`]
- The auth modal may remain the MVP pattern. A full-screen mobile dialog-like adjustment is allowed only if real signer usability requires it; it is not the default scope. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`]

### Nostr Protocol And Security Constraints

- NIP-46 is the primary mobile web signer path. The default mobile path is `nostrconnect://` through an external app; `bunker://` remains advanced. [Source: `docs/auth/nostr-auth-rules.md#Method Rules`]
- NIP-46 direct client-initiated connection requires `relay` and `secret` in the `nostrconnect://` URL. The client must validate the returned secret to avoid spoofing and must call `get_public_key` after connect to learn the user pubkey. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Direct connection initiated by the client`]
- Current NIP-46 text distinguishes `remote-signer-pubkey` from `user-pubkey`; do not collapse remote signer app identity into the connected user identity. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Terminology`]
- NIP-46 response events use request `id` correlation; do not implement return-flow handling that bypasses adapter-level request/response correlation. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Response Events kind24133`]
- NIP-46 auth challenges may expose an `auth_url`; app code exposes this as `authUrl` where needed. Continue treating auth URLs as sensitive and do not log them. [Source: `docs/auth/nostr-auth-rules.md#Protocol Rules`]
- Redact sensitive values from logs: NIP-46 secrets, restore payloads, bunker tokens, `auth_url`, auth URLs, and NIP-98 tokens. This story should avoid adding logs around auth URIs/tokens. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]
- External links opened by the app should avoid `window.opener`; the current external auth link uses `rel="noopener noreferrer"` and must keep that protection. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]

### Latest Technical Information

- Angular v21 style guidance continues to prefer consistency with existing files, co-located `.spec.ts` tests, feature organization, focused presentation components, `inject()`, protected template members, and `class`/`style` bindings over `ngClass`/`ngStyle`. [Source: `https://angular.dev/style-guide`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Transloco `^8.3.0`, Vitest `^4.0.8`, QR code `^1.5.4`. [Source: `package.json`]
- Current NIP-46 text introduces `remote-signer-key`, requires differentiating remote signer and user pubkeys, requires `get_public_key` after connect, and removes NIP-05 login from this flow. The story must not add NIP-05 login or trust signer app metadata as user identity. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Changes`]

### File Structure Requirements

Likely UPDATE files:

- `src/core/nostr/application/nostr-session.service.ts`: preserve or harden mobile external app pending/completion/timeout behavior, focus/visibility handling if needed, and stale attempt guards.
- `src/core/nostr/application/nostr-session.service.spec.ts`: external app pending, return, timeout, retry, cancel, stale completion, and lifecycle-event tests.
- `src/core/layout/presentation/components/app-auth-modal.component.ts`: only if UI affordance/copy changes are needed for mobile return/reopen guidance.
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`: only if modal behavior/copy changes.
- `src/assets/i18n/fr.json`: default/fallback French auth modal copy if UI copy changes.
- `src/assets/i18n/en.json`: English auth modal copy if UI copy changes.
- `src/assets/i18n/es.json`: Spanish auth modal copy if UI copy changes.
- `docs/auth/mobile-auth-notes.md`: required documentation of Amber/Primal validation results and app-specific limitations.

Potential UPDATE files only if tests or real-device findings require adapter-level changes:

- `src/core/nostr-connection/application/connection-facade.ts` and `connection-facade.spec.ts`: only for state/reason-code mapping or restore/failure semantics.
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts` and related specs: only for NIP-46 restore/connection behavior that cannot be solved at service orchestration level.
- `src/core/nostr-connection/application/nip46-connection-signer.ts`: only for signer rejection/timeout mapping gaps found by tests.
- `src/core/nostr-connection/domain/auth-session-state.ts`: only if a genuinely missing state/reason code is required; prefer existing states first.

Avoid touching unless directly necessary:

- `server.mjs`, `server.test.mjs`, Supabase migrations, pack pages/services, admin pages, NIP-98 backend verification.
- NIP-07 restore stores and browser extension flow.
- Bunker flow beyond preserving shared modal behavior.
- Broad `shared/` abstractions; Story 1.8 owns async-button abstraction and it is gated by real duplication evidence.
- PWA manifests, native Android/iOS assetlinks/AASA, NIP-55 Android integration, account creation, broad onboarding, SEO, or reusable auth module extraction.

### Testing Requirements

- Use co-located `*.spec.ts` tests. Domain tests should avoid Angular TestBed. Service tests should use fake facade/client behavior. Component tests should mock `NostrSessionService`, QR generation, and clipboard as they do today.
- Required service coverage in `nostr-session.service.spec.ts`:
  - Starting external app auth keeps `externalAuthUri`, `waitingForExternalAuth`, and `authSessionState` pending while completion is unresolved.
  - Simulated return/signer success completes the session, applies NDK signer, fetches profile, closes modal, and clears URI/waiting/timer.
  - Simulated denial/refusal reaches `recoverableRetry`/safe failure state and clears URI/waiting without showing raw error as primary modal copy.
  - Timeout invalidates the attempt and a late completion from that attempt cannot set `user` or close the modal.
  - Retry after timeout starts a new attempt and a late old attempt cannot overwrite the new attempt.
  - Cancel while pending clears URI/waiting and late completion cannot authenticate.
  - Any added focus/visibility event handling is idempotent and does not start duplicate attempts.
  - Refresh/restore for valid NIP-46 remains covered by existing restore tests and must not regress.
- Required component coverage if modal changes:
  - External signer pending guidance remains visible with open/copy/QR/cancel controls.
  - Retry/open-app affordance remains keyboard-operable and uses translated copy.
  - Status area remains announced (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`).
  - Raw errors remain hidden/de-emphasized when `modalStatus()` maps the state.
- Manual validation must be documented for Amber and Primal across waiting, success, refusal, timeout, refresh, return-to-site, and app-specific limitations. If real-device verification is not possible during implementation, the story must explicitly record that limitation instead of marking manual verification complete.
- Verification must use repository scripts from `package.json`: `bun run typecheck`, `bun run test`, and preferably `bun run check`. Do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or lint tools. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Anti-Reinvention Instructions

- Reuse `NostrSessionService`; do not bypass it with direct facade or signer adapter calls from the modal.
- Reuse `AuthSessionState`; do not create `MobileAuthState`, `AmberAuthState`, `PrimalAuthState`, or modal-only status strings unless they are a pure projection from `AuthSessionState`.
- Reuse method id `nip46-nostrconnect`; do not add method aliases like `amber`, `primal`, `mobileSigner`, or `externalApp` to domain state.
- Reuse the current external signer UI in `AppAuthModalComponent`; do not create a parallel mobile auth modal unless a concrete usability failure proves the existing modal cannot work.
- Reuse the current 120s auth timeout unless manual validation or tests prove a targeted change is needed.
- Reuse `docs/auth/mobile-auth-notes.md` for validation notes; do not create a scattered new auth doc unless the existing doc becomes too large.
- Do not add signer-specific SDKs, device detection libraries, NIP-55, PWA install/deep-link infrastructure, native app association files, backend sessions, or new auth dependencies for this story.

### Out Of Scope

- Permission minimization; Story 1.7 owns startup and just-in-time permission scope.
- Accessible async-button abstraction; Story 1.8 owns it and abstraction is only allowed after at least three real async cases are inventoried.
- Sign-out artifact cleanup beyond preserving current cancellation/disconnect behavior; Story 1.9 owns full sign-out cleanup.
- Bunker one-shot permission grants; architecture says this remains blocked until NDK exposes a clean extension point or the feature is explicitly superseded.
- Pack registration, admin membership, Supabase persistence, NIP-98 backend verification, public docs/wiki polish, SEO, PWA, or reusable auth module extraction.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.6: Stabilize Mobile External Signer Return Flow for Amber and Primal`
- `_bmad-output/planning-artifacts/prd.md#Nostr Authentication`
- `_bmad-output/planning-artifacts/prd.md#Session Continuity`
- `_bmad-output/planning-artifacts/prd.md#User Feedback and Recovery`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Loading State Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`
- `_bmad-output/planning-artifacts/ux-design-specification.md#External Signer / Mobile Pending Flow`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Signer Pending Status`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Minimal Recovery Message`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `_bmad-output/implementation-artifacts/1-5-add-explicit-pending-timeout-cancelled-denied-and-retry-states.md`
- `docs/auth/nostr-auth-rules.md#Method Rules`
- `docs/auth/mobile-auth-notes.md#Mobile Stabilization Matrix`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-signer.ts`
- `src/core/nostr-connection/domain/auth-session-state.ts`
- `https://angular.dev/style-guide`
- `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`

### Saved Questions / Clarifications

- None. The maintained docs and current implementation provide enough direction. Manual Amber/Primal verification results are intentionally part of the implementation task and must be recorded honestly.

## Dev Agent Record

### Agent Model Used

openai/gpt-5.5

### Debug Log References

- 2026-05-04T19:40:12Z: Red phase confirmed with failing `bun run test`; cancelled mobile return completion still set `user`.
- 2026-05-04T19:40:36Z: Green phase passed with `bun run test` after invalidating external auth display operations on cancel/timeout.
- 2026-05-04T19:41:42Z: `bun run typecheck` and `bun run test` passed after service, i18n, and docs updates.
- 2026-05-04T19:43:14Z: Full `bun run check` passed after formatting.

### Implementation Plan

- Hardened the existing `NostrSessionService` external signer orchestration instead of adding a second mobile-auth state source.
- Preserved the current modal and Story 1.5 `AuthSessionState` projection; updated only translated external signer copy for the mobile return path.
- Documented Amber and Primal manual validation as pending/unverified, with expected Toolstr behavior and app-specific limitation placeholders.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Status set to `ready-for-dev` after source artifact, previous-story, current-code, protocol, UX/accessibility, latest technical, and checklist analysis.
- Added operation invalidation for external signer cancellation and timeout so a late mobile return completion cannot set `user` or close the modal after cancellation.
- Added service regression coverage for preserving pending external signer state and ignoring cancelled mobile return completions during delayed display setup.
- Updated external signer copy in French, English, and Spanish to emphasize opening/reopening the signer app, approving, and returning to Toolstr.
- Updated mobile auth notes with Amber/Primal validation scenarios, expected Toolstr behavior, and pending real-device verification status.
- Verification passed: `bun run typecheck`, `bun run test`, and `bun run check`.

### File List

- `_bmad-output/implementation-artifacts/1-6-stabilize-mobile-external-signer-return-flow-for-amber-and-primal.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `docs/auth/mobile-auth-notes.md`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`
- `src/assets/i18n/fr.json`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/nostr/application/nostr-session.service.ts`

## Change Log

- 2026-05-04: Created Story 1.6 developer context for mobile external signer return-flow stabilization and Amber/Primal verification.
- 2026-05-04: Implemented Story 1.6 mobile external signer hardening, return-path copy, Amber/Primal validation documentation, and regression coverage; status set to `review`.
