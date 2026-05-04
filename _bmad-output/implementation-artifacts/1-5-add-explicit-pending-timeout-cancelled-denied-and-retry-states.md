# Story 1.5: Add Explicit Pending, Timeout, Cancelled, Denied, and Retry States

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Nostr user,
I want every auth attempt to show what is happening and what I can do next,
so that I am not stuck in unclear loading states.

## Acceptance Criteria

1. Given a user starts browser extension, external signer, or bunker auth, when the app waits for approval, then the UI names the pending reason: extension approval, mobile signer approval, or bunker approval, and the state is perceivable without relying only on color.
2. Given an auth attempt is denied, cancelled, timed out, expired, or interrupted, when the app receives or infers that result, then the UI shows a concise recovery message and offers retry, reconnect, cancel, or choose another method where relevant.
3. Given an auth attempt is pending, when it cannot complete successfully, then it transitions to a terminal or recoverable state and never remains in indefinite loading.
4. Given the existing auth modal, session service, and connection facade already model several attempt states, when this story is implemented, then the implementation extends or projects those existing states instead of creating a parallel auth-state source.
5. Given user-facing auth state copy changes, when implementation is complete, then `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` contain matching keys with French preserved as the default/fallback product language.
6. Given auth recovery controls are rendered, when users interact by keyboard or screen reader, then pending/recovery text and retry/cancel/choose-another-method actions remain keyboard-operable, visibly focused, and understandable without color-only signals.

## Tasks / Subtasks

- [x] Map existing auth session outcomes to explicit user-facing modal states (AC: 1, 2, 3, 4)
  - [x] Reuse `NostrSessionService.authSessionState` as the source of truth; do not add loose presentation booleans that compete with `AuthSessionState`.
  - [x] Add a small presentation projection in `AppAuthModalComponent` or `NostrSessionService` only if it reduces template ambiguity, for example mapping `awaitingPermission`, `awaitingExternalSignerApproval`, `awaitingBunkerApproval`, `timedOut`, `cancelled`, and `recoverableRetry/user_rejected` to copy keys and actions.
  - [x] Map `expired` and `revokedOrUnavailable` to reconnect-required UI with safe translated copy; these states must not fall through to generic failure or disconnected copy.
  - [x] Treat browser extension pending as `awaitingPermission` for method `nip07`; name it as waiting for browser extension approval.
  - [x] Treat NIP-46 external app pending as `awaitingExternalSignerApproval`; name it as waiting for mobile signer app approval.
  - [x] Treat bunker pending as `awaitingBunkerApproval`; name it as waiting for bunker approval.
  - [x] Treat denied/refused signer outcomes as a distinct user-facing denied state. Prefer mapping existing `recoverableRetry` with `reasonCode: 'user_rejected'` unless implementation proves a dedicated domain state is required.
  - [x] Project `AuthSessionState.reasonCode` to safe translated user-facing copy. Do not render raw signer, protocol, NDK, stack, Supabase, or thrown error text as the primary recovery message.
- [x] Ensure every auth attempt reaches terminal or recoverable state without indefinite loading (AC: 2, 3)
  - [x] Preserve the existing `AUTH_TIMEOUT_MS = 120000` behavior for external app and bunker unless a concrete test failure requires a targeted adjustment.
  - [x] Preserve `cancelCurrentAttempt({ reason: 'timedOut', attemptId })` for timeout paths so `AuthSessionState` becomes `timedOut`.
  - [x] Ensure manual cancel uses `cancelCurrentAttempt()` so `AuthSessionState` becomes `cancelled` when there is an active attempt.
  - [x] For extension rejection/denial errors, preserve facade error mapping to `reasonCode: 'user_rejected'` and render denied/retry copy instead of only raw error text.
  - [x] Preserve terminal or recoverable states long enough for the user to perceive the result. A choose-another-method action may intentionally return to neutral method selection, but it must not erase the failure before guidance is shown.
  - [x] Do not leave `waitingForExternalAuth`, `waitingForBunkerAuth`, `externalAuthUri`, QR, timers, or copied state active after timeout, cancellation, success, or failure.
- [x] Update auth modal UX for concise pending and recovery guidance (AC: 1, 2, 6)
  - [x] Continue using `src/core/layout/presentation/components/app-auth-modal.component.ts`; do not create a parallel modal or broad auth component framework.
  - [x] Add state-specific text near the relevant method section or in a shared modal status area that identifies pending, timed out, cancelled, denied, failed, expired/reconnect, and retry states.
  - [x] Replace or de-emphasize the current raw `session.error()` display for auth recovery states with safe translated state copy derived from `authSessionState`; raw internal errors must not be the main user-facing message.
  - [x] Provide one obvious primary action per recovery state where practical: retry same method, reconnect, or choose another method.
  - [x] Preserve the advanced reveal from Story 1.4. Bunker timeout/cancel/retry must remain reachable even when advanced options would otherwise be collapsed.
  - [x] Keep protocol details out of default copy. Use practical messages such as approve in your extension, approve in your signer app, approval was cancelled, connection expired, try again, or choose another method.
- [x] Update translations in all supported locales (AC: 1, 2, 5, 6)
  - [x] Add or update `authModal` keys in `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` for extension pending, external signer pending, bunker pending, denied, cancelled, timeout, expired, revoked/unavailable, retry, reconnect, and choose-another-method states.
  - [x] Preserve French-first product copy; English and Spanish keys must match the same key structure.
  - [x] Do not hard-code new user-facing strings in Angular templates or services unless they are already technical internal errors not shown to users.
- [x] Extend tests for state projection, non-regression, and accessibility (AC: 1, 2, 3, 4, 6)
  - [x] Update `src/core/nostr-connection/domain/auth-session-state.spec.ts` only if domain types/helpers change.
  - [x] Update `src/core/nostr-connection/application/connection-facade.spec.ts` if facade state or reason-code mapping changes for denied, cancelled, timeout, expired, or revoked/unavailable behavior.
  - [x] Update `src/core/nostr/application/nostr-session.service.spec.ts` for timeout, cancellation, denied/rejected, stale attempt, and cleanup behavior when service logic changes.
  - [x] Update `src/core/layout/presentation/components/app-auth-modal.component.spec.ts` to assert visible pending/recovery copy and retry/cancel actions for extension, external app, and bunker flows, driven from `authSessionState` projection rather than only legacy booleans.
  - [x] Test that denied/rejected signer outcomes produce a user-facing denied/retry state rather than an indefinite loading state or only raw error output.
  - [x] Test extension denial specifically with `recoverableRetry` and `reasonCode: 'user_rejected'` because browser-extension rejection is a high-risk path.
  - [x] Test `expired` and `revokedOrUnavailable` states render reconnect-required guidance with safe copy and a reconnect/choose-another-method path.
  - [x] Test that advanced bunker recovery remains visible/reachable when bunker is pending or timed out.
  - [x] Assert practical accessibility attributes or visible text for recovery controls where stable.
- [x] Verify with repository scripts only (AC: 3, 4, 5, 6)
  - [x] Run `bun run typecheck`.
  - [x] Run `bun run test`.
  - [x] Run `bun run check` if practical before moving the story to review.

### Review Findings

- [x] [Review][Patch] Retry button does nothing for denied extension auth [src/core/layout/presentation/components/app-auth-modal.component.ts:421]
- [x] [Review][Patch] Bunker retry can submit an empty token after timeout or cancel [src/core/layout/presentation/components/app-auth-modal.component.ts:391]
- [x] [Review][Patch] Choose another method does not clear extension pending state [src/core/layout/presentation/components/app-auth-modal.component.ts:404]
- [x] [Review][Patch] Dynamic auth status is not announced to assistive technology [src/core/layout/presentation/components/app-auth-modal.component.ts:40]
- [x] [Review][Patch] Expired and revoked/unavailable states do not have distinct locale keys [src/core/layout/presentation/components/app-auth-modal.component.ts:542]
- [x] [Review][Patch] New recovery projection lacks required external and bunker path test coverage [src/core/layout/presentation/components/app-auth-modal.component.spec.ts:135]

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows while keeping users out of protocol details. Story 1.5 is the state clarity and recovery story: users must never be stranded in ambiguous loading and must always see what is pending, what failed, and what they can do next. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.5: Add Explicit Pending, Timeout, Cancelled, Denied, and Retry States`]

Covered requirements are FR5, FR6, FR7, FR16, FR17, FR31, FR32, FR33, and FR36. Supporting NFRs require prompt visible auth status changes, no indefinite loading, explicit recoverable failure states, WCAG AA core-flow behavior, and clear external signer guidance. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

### Previous Story Intelligence

Story 1.4 is complete and changed the auth modal hierarchy. Preserve those changes: browser extension and external signer remain primary visible methods, bunker and private-key fallback stay behind the advanced reveal, dialog labelling and QR alt text remain, `rel="noopener noreferrer"` remains on external auth links, and all new user-facing copy must update `fr`, `en`, and `es`. [Source: `_bmad-output/implementation-artifacts/1-4-make-auth-method-selection-and-advanced-bunker-mode-clear.md#Completion Notes List`]

Key learnings from Stories 1.1-1.4 that apply here:

- `AuthSessionState` in `src/core/nostr-connection/domain/auth-session-state.ts` is the semantic source of auth status. Do not introduce parallel status strings in components.
- `NostrSessionService` is the current presentation/session bridge. The auth modal should call/read this service; it should not import `ConnectionFacade`, NDK, NIP-46 helpers, NIP-07 providers, raw signer objects, or NIP-98 services.
- Stale async completion bugs were real in previous stories. Preserve operation/attempt guards: `currentAuthOperationId`, `currentExternalAttemptId`, `currentBunkerAttemptId`, facade `_attemptId`, and `attemptId` checks.
- Story 1.4 review found accessibility and advanced-section visibility issues. Keep bunker recovery visible when pending/timed out and avoid `aria-controls` pointing to a missing DOM node.
- Profile/display state is not authentication proof. Do not change restore or connected identity semantics for this story.

### Current Code State To Preserve

- `src/core/nostr-connection/domain/auth-session-state.ts` already defines explicit states: `disconnected`, `detectingSigner`, `awaitingPermission`, `awaitingExternalSignerApproval`, `awaitingBunkerApproval`, `connected`, `restoring`, `expired`, `revokedOrUnavailable`, `cancelled`, `timedOut`, `failed`, and `recoverableRetry`. It also defines reason codes including `user_rejected`, `approval_timed_out`, and `approval_cancelled`.
- `src/core/nostr-connection/application/connection-facade.ts` already maps active attempts to pending states. `nip46-nostrconnect` becomes `awaitingExternalSignerApproval`, `nip46-bunker` becomes `awaitingBunkerApproval`, other methods including `nip07` become `awaitingPermission`. `cancelCurrentAttempt()` maps to `cancelled`; `cancelCurrentAttempt({ reason: 'timedOut' })` maps to `timedOut`; thrown connection errors map to `recoverableRetry` with `reasonCode`.
- `src/core/nostr-connection/application/connection-facade.ts` restore failures can map to `revokedOrUnavailable` through `resolveRestoreTerminalStatus()`. If this story touches restore-visible recovery, preserve fail-closed behavior and purge invalid restore contexts.
- `resolveAuthSessionFailureReasonCode()` in `connection-facade.ts` already maps messages containing reject, denied, or cancel to `user_rejected`. Use this to render denied/refused copy unless a more explicit state is introduced with tests.
- `src/core/nostr/application/nostr-session.service.ts` owns current UI-facing signals: `authSessionState`, `connecting`, `error`, `externalAuthUri`, `waitingForExternalAuth`, `waitingForBunkerAuth`, `externalAuthTimedOut`, and `bunkerAuthTimedOut`. It owns the 120s timers and cleanup for external app and bunker auth.
- Extension flow currently calls `facade.startConnection('nip07')`, then immediately `facade.completeCurrentAttempt()`. During the prompt, `authSessionState` should be `awaitingPermission` with method `nip07`; the modal currently does not name that pending reason.
- External app flow currently starts `nip46-nostrconnect`, binds instructions, sets `externalAuthUri`, `waitingForExternalAuth`, a 120s timeout, and completes asynchronously. Timeout clears URI/waiting state, sets a raw error, and calls facade cancellation with `timedOut`.
- Bunker flow currently starts `nip46-bunker`, sets `waitingForBunkerAuth`, a 120s timeout, and completes asynchronously. Timeout clears waiting state, sets a raw error, and calls facade cancellation with `timedOut`.
- Modal close currently cancels pending external and bunker auth. Preserve this behavior and ensure it still leaves a cancelled or disconnected/recoverable state that does not strand UI.
- `src/core/layout/presentation/components/app-auth-modal.component.ts` already has primary extension/external sections, advanced reveal, bunker/private-key sections, external URI open/copy/QR, and close/cancel/retry handlers. Keep it presentation-focused.
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts` already covers extension click, external waiting/QR/copy/cancel/retry, advanced reveal, bunker submit/wait/cancel/retry, private-key fallback, dialog labels, and QR alt text. Extend these tests instead of replacing them.

### Required Implementation Shape

The minimal correct design is:

1. Reuse `AuthSessionState` and add a single presentation mapping for modal state copy/actions.
2. Render pending messages for `awaitingPermission`/`nip07`, `awaitingExternalSignerApproval`, and `awaitingBunkerApproval`.
3. Render terminal/recoverable messages for `timedOut`, `cancelled`, `expired`, `revokedOrUnavailable`, `recoverableRetry` with `user_rejected`, and other recoverable failures.
4. Prefer safe translated recovery copy derived from `AuthSessionState.status` and `reasonCode`; do not make raw `session.error()` the main auth recovery UI.
5. Provide retry and cancel/choose-another-method paths without creating duplicate auth attempts or stale timers.
6. Keep the existing method handlers: `loginWithExtension()`, `startExternalApp()`, `cancelExternalApp()`, `submitBunker()`, `cancelBunker()`, and `loginWithPrivateKey()`.
7. Update all locale files for new copy.
8. Prove with tests that each pending/recovery state is visible and does not regress the Story 1.4 advanced reveal.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield foundation. Do not initialize a new app, introduce a component library, add a state-management library, migrate routing, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries. Presentation components render state and trigger application service commands; they do not own signer mechanics. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- `src/core/nostr-connection/domain/` is the correct home for pure auth state types and helpers. `src/core/nostr-connection/application/` owns connection orchestration. `src/core/layout/presentation/components/app-auth-modal.component.ts` owns auth modal presentation. [Source: `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`]
- Components must not import NDK, `window.nostr` wrappers, NIP-46 restore helpers, bunker starters, NIP-98 services, Supabase, or backend APIs. [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]
- Auth/session state must be explicit unions or typed objects, not loose boolean combinations. [Source: `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`]
- Loading/pending states must name what is happening and have success, failure, cancellation, or timeout/recovery transitions. [Source: `_bmad-output/planning-artifacts/architecture.md#Loading State Patterns`]
- Do not add backend sessions, cookies, JWT login, OAuth replacement, Supabase auth state, or server-side identity state. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Do not change pack registration, admin, Supabase, NIP-98 verification, NIP-07/NIP-46 restore stores, or signer adapter protocol behavior unless a compile/test break directly requires a small non-behavioral adjustment.

### UX And Accessibility Guardrails

- Preserve the existing Tailwind/DaisyUI `brutal` visual foundation. No new design system, palette, typography system, broad layout redesign, animation layer, or visual direction belongs in this story. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Pending signer states must name the thing being waited on: browser extension approval, signer app approval, or bunker approval. Avoid generic `Loading...`. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading And Pending Pattern`]
- Recovery should stay minimalistic: one concise message, one primary next action, optional secondary action only when useful. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Recovery Pattern`]
- Core buttons and recovery controls must remain keyboard-operable, visibly focused, and understandable to screen-reader users. State changes must not rely only on color or motion. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy`]
- Use user-facing labels such as browser extension, mobile signer app, and bunker. Avoid protocol-heavy diagnostics in default copy. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Auth Method Selector`]
- Keep the auth modal as the MVP pattern. Mobile full-screen dialog-like changes are out of scope unless required by a concrete usability bug. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`]

### Nostr Protocol And Security Constraints

- NIP-07 remains the primary desktop web signer path. `window.nostr` exposes `getPublicKey()` and `signEvent()` and may be absent; the app must check availability. [Source: `docs/auth/nostr-auth-rules.md#NIP-07`; `https://raw.githubusercontent.com/nostr-protocol/nips/master/07.md`]
- NIP-46 remains the primary mobile external signer path. The client-generated `nostrconnect://` flow requires `secret`, relay parameters, response correlation by request `id`, and `get_public_key` after connect. UI must not flatten remote-signer identity into user identity. [Source: `docs/auth/nostr-auth-rules.md#NIP-46`; `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]
- Bunker remains an advanced `bunker://` strategy. Do not replace `nip46-bunker` with a new method alias. [Source: `docs/auth/nostr-auth-rules.md#Bunker`]
- Redact sensitive values from logs: NIP-46 secrets, restore payloads, bunker tokens, `auth_url`, auth URLs, and NIP-98 tokens. This story should avoid adding logs around auth URIs/tokens. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]
- External signer recovery should include retry/open-app affordances after delay and actionable copy such as no response from signer or try again. [Source: `docs/auth/mobile-auth-notes.md#Target UX Patterns`]

### Latest Technical Information

- Angular v21 style guidance continues to prefer consistency, feature organization, co-located `.spec.ts` tests, focused presentation components, `inject()`, protected template members, and `class`/`style` bindings over `ngClass`/`ngStyle`. [Source: `https://angular.dev/style-guide`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Transloco `^8.3.0`, Vitest `^4.0.8`, QR code `^1.5.4`. [Source: `package.json`]
- Current NIP-46 text emphasizes distinction between `remote-signer-pubkey` and `user-pubkey`, required `secret` validation, request ID correlation, and `get_public_key` after connect. Do not implement denied/retry UI by bypassing these adapter-level guarantees. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`]

### File Structure Requirements

Likely UPDATE files:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`: pending/recovery projection rendering, retry/cancel/choose-another-method UI, advanced recovery visibility.
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`: visible pending/recovery state and action coverage.
- `src/core/nostr/application/nostr-session.service.ts`: only if existing UI-facing signals need a small typed projection or cleanup adjustment.
- `src/core/nostr/application/nostr-session.service.spec.ts`: only if `NostrSessionService` behavior changes.
- `src/core/nostr-connection/domain/auth-session-state.ts`: only if a small helper or reason-code/state addition is required.
- `src/core/nostr-connection/domain/auth-session-state.spec.ts`: only if domain helpers/types change.
- `src/core/nostr-connection/application/connection-facade.spec.ts`: only if facade reason-code/state mapping changes.
- `src/assets/i18n/fr.json`: default/fallback French auth modal copy.
- `src/assets/i18n/en.json`: English auth modal copy.
- `src/assets/i18n/es.json`: Spanish auth modal copy.

Avoid touching unless directly necessary:

- `src/core/nostr-connection/infrastructure/**`: NIP-07/NIP-46/bunker adapter mechanics.
- `src/core/nostr-connection/application/nip46-*.ts`: external signer and bunker protocol behavior.
- NIP-07/NIP-46 restore stores and tests unless a state cleanup test exposes a direct dependency.
- `server.mjs`, `server.test.mjs`, Supabase migrations, pack pages/services, admin pages, NIP-98 backend verification.
- Broad `shared/` abstractions; Story 1.8 owns async-button abstraction and it is gated by real duplication evidence.

### Testing Requirements

- Domain tests should stay pure and avoid Angular TestBed.
- Service tests should use fake facade/client behavior and prove operation/attempt guards still prevent stale async completion.
- Component tests should continue mocking `NostrSessionService`, QR generation, and clipboard; do not replace with broad integration tests.
- Cover at least these visible states:
  - Extension pending: `awaitingPermission` with `methodId: 'nip07'` shows extension approval copy.
  - External pending: waiting external app state shows signer app approval copy and cancel/open/copy/QR where relevant.
  - Bunker pending: waiting bunker state is visible under advanced options and cancel is reachable.
  - Timeout: external and bunker timeout states show retry copy/action and no indefinite waiting.
  - Cancelled: cancellation produces concise cancelled/retry or choose-another-method guidance when modal remains open.
  - Denied/refused: `recoverableRetry` with `reasonCode: 'user_rejected'` shows denied/retry copy.
  - Expired/revoked/unavailable: `expired` and `revokedOrUnavailable` show reconnect-required copy and action.
  - Generic recoverable failure: no raw protocol/stack/Supabase details are displayed by default.
- Verification must use repository scripts from `package.json`: `bun run typecheck`, `bun run test`, and preferably `bun run check`. Do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or lint tools. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Git Intelligence

- Recent commits: `c1cbc08 feat: clarify auth method selection`, `c19f3e8 feat: restore nip-46 sessions`, `aaf7ae0 feat: create nip-46 restore story`, `33ec5d2 fix: persistant connection on reload (1.2)`, and `fa65520 feat: restore extension sessions`.
- Recent work concentrated in `app-auth-modal.component.ts`, `app-auth-modal.component.spec.ts`, `connection-facade.ts`, `nostr-session.service.ts`, NIP-07/NIP-46 restore stores, and auth docs.
- Previous review findings found stale completion and advanced-visibility bugs. This story must preserve attempt IDs, operation IDs, timeout cleanup, and advanced recovery visibility.

### Anti-Reinvention Instructions

- Reuse `AppAuthModalComponent`; do not create `AuthStatusComponent`, `AuthRecoveryComponent`, or `AuthMethodSelectorComponent` unless the smallest correct change becomes unmaintainable.
- Reuse `NostrSessionService`; do not bypass it with direct facade or signer adapter calls from the modal.
- Reuse `AuthSessionState`; do not create a second modal-only status union unless it is a pure projection from `AuthSessionState` and service signals.
- Reuse method ids `nip07`, `nip46-nostrconnect`, and `nip46-bunker`; do not add aliases like `extension`, `mobileSigner`, or `advancedBunker` to domain state.
- Reuse existing translation hierarchy under `authModal`; do not hard-code recovery messages.
- Reuse DaisyUI/Tailwind classes and brutal visual language; do not introduce custom CSS files unless necessary.
- Do not add device detection libraries, signer discovery, NIP-55, PWA install, account creation, broad onboarding, reusable Angular auth extraction, backend sessions, or new auth dependencies.

### Out Of Scope

- Stabilizing Amber/Primal app return behavior or documenting app-specific limitations; Story 1.6 owns that.
- Permission minimization; Story 1.7 owns that.
- Accessible async-button abstraction; Story 1.8 owns that and abstraction is only allowed after at least three real async cases are inventoried.
- Broad sign-out artifact cleanup beyond preserving current cancellation behavior; Story 1.9 owns that.
- Pack registration, admin membership, Supabase persistence, NIP-98 backend verification, public docs/wiki polish, SEO, PWA, or reusable auth module extraction.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.5: Add Explicit Pending, Timeout, Cancelled, Denied, and Retry States`
- `_bmad-output/planning-artifacts/prd.md#Nostr Authentication`
- `_bmad-output/planning-artifacts/prd.md#User Feedback and Recovery`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Loading State Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Signer Pending Status`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Minimal Recovery Message`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Loading And Pending Pattern`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `docs/auth/nostr-auth-rules.md#Method Rules`
- `docs/auth/mobile-auth-notes.md#Mobile Stabilization Matrix`
- `src/core/nostr-connection/domain/auth-session-state.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/assets/i18n/fr.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`
- `https://angular.dev/style-guide`
- `https://raw.githubusercontent.com/nostr-protocol/nips/master/07.md`
- `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`

### Saved Questions / Clarifications

- None. The existing architecture and previous story implementation provide enough direction for implementation.

## Dev Agent Record

### Agent Model Used

openai/gpt-5.5

### Debug Log References

- 2026-05-04: Added `authSessionState`-driven modal status projection and recovery actions in `AppAuthModalComponent`.
- 2026-05-04: Added pending/recovery translation keys in `fr`, `en`, and `es` locales under `authModal.status`.
- 2026-05-04: Extended `app-auth-modal.component.spec.ts` for pending/recovery rendering and reconnect/denied behavior.
- 2026-05-04: Ran `bun run typecheck`, `bun run test`, `bun run fix`, and `bun run check`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Status set to `ready-for-dev` after source artifact, previous-story, current-code, protocol, UX/accessibility, latest technical, and checklist analysis.
- Implemented `AuthSessionState` presentation mapping in modal for explicit pending and recovery states without introducing parallel auth state.
- Added state-specific pending/recovery messaging and actions (retry/reconnect/choose method), while preserving existing extension, external signer, and bunker flows.
- De-emphasized raw `session.error()` in recoverable auth states; safe translated status copy is now primary.
- Added matching `authModal.status` translation keys in `fr`, `en`, and `es` with French-first copy maintained.
- Extended modal tests to cover extension pending, denied user rejection, reconnect-required states, and reconnect action behavior.
- Validation complete: `bun run typecheck`, `bun run test`, `bun run check` all pass.

### File List

- src/core/layout/presentation/components/app-auth-modal.component.ts
- src/core/layout/presentation/components/app-auth-modal.component.spec.ts
- src/assets/i18n/fr.json
- src/assets/i18n/en.json
- src/assets/i18n/es.json

## Change Log

- 2026-05-04: Created Story 1.5 developer context for explicit auth pending, timeout, cancelled, denied, and retry states.
- 2026-05-04: Implemented explicit auth pending/recovery UI states, locale updates, and modal test coverage; story advanced to `review`.
