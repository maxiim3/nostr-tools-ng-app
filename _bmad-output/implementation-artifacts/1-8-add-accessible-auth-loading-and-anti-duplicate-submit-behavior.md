# Story 1.8: Add Accessible Auth Loading and Anti-Duplicate-Submit Behavior

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Nostr user,
I want auth buttons to show loading and prevent duplicate submissions,
so that connection attempts feel responsive and do not accidentally run twice.

## Acceptance Criteria

1. Given a user clicks the browser extension auth button, when the auth attempt starts, then the button shows accessible loading feedback and duplicate clicks are prevented while the attempt is pending.
2. Given the auth attempt succeeds, fails, is cancelled, or times out, when the attempt resolves, then the loading and disabled state resets correctly and the user sees the next connected or recovery state.
3. Given repeated async button behavior exists in at least three real auth or pack actions, when a shared async-button pattern is considered, then abstraction is introduced only if it reduces duplication and it preserves accessible labels, visible text, keyboard operability, and anti-double-submit behavior.

## Tasks / Subtasks

- [x] Inventory current async action buttons before changing behavior (AC: 1, 3)
  - [x] Map auth modal actions: extension login, external signer start/retry, bunker submit/retry, private-key fallback, recovery retry/reconnect/choose-method, copy/cancel, and close.
  - [x] Map pack/admin/support async actions that may share the same pattern: pack join, admin member removal, owner follow, and zap submit/generate actions.
  - [x] Decide whether there are at least three real actions with the same loading/disabled/a11y needs; add a shared pattern only if it removes real duplication.
- [x] Add accessible loading and duplicate-submit prevention to browser extension auth (AC: 1, 2)
  - [x] Prevent immediate repeated clicks even before `session.connecting()` or `AuthSessionState` reflects pending state.
  - [x] Show visible loading copy or a visible loading affordance with non-color-only feedback while extension approval is pending.
  - [x] Preserve the current pending status panel using `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
  - [x] Reset the button state on success, failure, cancellation, timeout, stale operation, and unavailable extension.
- [x] Apply the same guardrails to adjacent auth submit actions where needed (AC: 2, 3)
  - [x] Ensure external signer start/retry cannot create overlapping NIP-46 attempts from double clicks.
  - [x] Ensure bunker submit/retry cannot create overlapping bunker attempts or lose the retry token.
  - [x] Ensure private-key fallback cannot submit repeatedly while the current private-key login is pending.
  - [x] Do not block cancel, choose another method, or close actions needed for recovery while an auth attempt is pending.
- [x] Preserve UI, i18n, and accessibility behavior (AC: 1-3)
  - [x] Keep desktop guidance favoring browser extension, mobile guidance favoring external signer app, and bunker/private-key paths advanced.
  - [x] If visible loading text changes, update `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` together.
  - [x] Keep button text readable on mobile and desktop; do not introduce text overflow, icon-only unlabeled buttons, color-only state, or motion-only loading.
  - [x] Use native `disabled` for buttons that must not be activated while pending; use `aria-busy` or explicit status text only when it adds useful screen-reader context.
- [x] Add focused regression coverage (AC: 1-3)
  - [x] Test extension CTA visible loading/disabled state while `authSessionState` is `awaitingPermission` for `nip07`.
  - [x] Test duplicate extension clicks call `connectWithExtension()` once until the first attempt resolves.
  - [x] Test loading/disabled state resets after extension success, rejection/failure, cancellation, timeout, and unavailable extension.
  - [x] Test external signer and bunker retry/submit double-click behavior if those handlers are changed.
  - [x] Test any shared async-button helper/component with keyboard-accessible labels and native disabled behavior (N/A in this slice: no shared helper introduced after inventory).
  - [x] Run an AXE accessibility check for the affected auth modal states if a project tool exists, or record a manual AXE/browser accessibility pass in the Dev Agent Record if no repository AXE script exists.
- [x] Verify with repository scripts only (AC: 1-3)
  - [x] Run `bun run typecheck`.
  - [x] Run `bun run test`.
  - [x] Run `bun run check` if practical before moving the story to review.
  - [x] Do not treat `bun run check` as an AXE substitute unless the repository script explicitly runs AXE.

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows while preserving session continuity and clear recovery. Story 1.8 is the interaction-safety slice: auth controls must acknowledge work in progress, prevent accidental duplicate attempts, and reset cleanly into connected or recovery states. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.8: Add Accessible Auth Loading and Anti-Duplicate-Submit Behavior`]

Covered requirements are FR3, FR7, FR31, FR33, and FR36. The key product risk is duplicate auth submission or ambiguous loading during a signer approval moment. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

### Previous Story Intelligence

Story 1.5 added the current pending/recovery projection in `AppAuthModalComponent`, including translated status copy, retry/reconnect/choose-method actions, and the live status region. Reuse this projection; do not add a second loading-state truth source that conflicts with `AuthSessionState`. [Source: `_bmad-output/implementation-artifacts/1-5-add-explicit-pending-timeout-cancelled-denied-and-retry-states.md#Completion Notes List`]

Story 1.6 is still `in-progress` and has an open review item for Amber/Primal real-device validation. Do not depend on unverified mobile signer behavior as proof for this story; automated tests should cover duplicate-submission state, while manual signer notes should remain honest if real devices are not used. [Source: `_bmad-output/implementation-artifacts/1-6-stabilize-mobile-external-signer-return-flow-for-amber-and-primal.md#Review Findings`]

Story 1.7 is `in-progress` and already hardened stale auth races and minimized NIP-46 capabilities. Its implementation notes show the current auth area has operation IDs, attempt IDs, timeout cleanup, and fail-closed stale-session clearing. Preserve those guards; do not weaken them by placing UI-only locks around an unsafe service call. [Source: `_bmad-output/implementation-artifacts/1-7-minimize-startup-permissions-and-request-additional-permissions-just-in-time.md#Previous Story Intelligence`]

Recent commits: `7621678 1.7`, `ad2177c fix: harden external signer stale auth races`, `1412820 1.6 - feat: wip implementation`, `ec39c82 feat: add explicit auth recovery states`, and `c1cbc08 feat: clarify auth method selection`. Current work is concentrated in `NostrSessionService`, `ConnectionFacade`, NIP-46 connection/restore code, the auth modal, translations, and auth docs.

### Current Code State To Preserve

`src/core/layout/presentation/components/app-auth-modal.component.ts` currently:

- Renders the auth modal inline with `ChangeDetectionStrategy.OnPush`, signals, computed state, and Reactive Forms.
- Disables primary auth buttons with `session.connecting()` but does not show per-button loading copy for extension auth.
- Calls async handlers directly from click bindings: `loginWithExtension()`, `startExternalApp()`, `submitBunker()`, and `loginWithPrivateKey()`.
- Stores retry context in `lastAttemptedMethod` and `lastBunkerToken`; bunker retry depends on keeping the previous token.
- Uses a live status panel with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"` for pending/recovery guidance.
- Must remain presentation-focused and must not import NDK, NIP-46 starters, restore stores, NIP-98 services, Supabase, or backend APIs.

`src/core/nostr/application/nostr-session.service.ts` currently:

- Exposes `connecting = computed(() => this.facade.pending())`.
- Uses `currentAuthOperationId`, `currentExternalAttemptId`, and `currentBunkerAttemptId` to reject stale completions.
- Uses timers for external signer and bunker timeouts and clears URI/waiting state in completion, cancellation, and timeout paths.
- Starts extension login by refreshing available methods before `facade.startConnection('nip07', ...)`; duplicate prevention must cover the gap before facade pending state is visible.
- Starts external signer login, binds instructions, sets `externalAuthUri`, sets `waitingForExternalAuth`, and finishes the login in the background.
- Starts bunker login, sets `waitingForBunkerAuth`, and finishes the login in the background.

`src/features/packs/presentation/pages/pack-request.page.ts` and `.html` currently:

- Use a single `loading` signal for status loading and request submission.
- Replace the join button with a loading spinner while `loading()` is true, which blocks normal duplicate button clicks.
- Do not have a dedicated `requestJoin()` early return guard, so programmatic or very fast duplicate calls may still overlap if this code is selected for shared async behavior.

`src/features/admin/presentation/pages/pack-admin-requests.page.ts` and `.html` currently:

- Use `actingOn()` to disable the active remove button while removal is pending.
- Use a two-step confirmation state and timeout; do not replace that pattern with generic async behavior.

`src/features/packs/presentation/components/owner-support-card.component.ts` currently:

- Already guards `followOwner()` with `followLoading()` and disables the follow button.
- This is a good local pattern to consider during inventory, but it does not require auth-modal changes by itself.

### Required Implementation Shape

The minimal correct implementation is a focused auth-modal hardening pass:

1. Add a local in-flight action guard or equivalent pure helper in `AppAuthModalComponent` so rapid duplicate clicks cannot call the same async auth method twice before service state updates.
2. Derive visible loading/disabled state from both local in-flight action and `AuthSessionState`/service pending state so the UI stays correct during long signer approval waits.
3. Keep recovery actions available. Cancel, close, and choose-another-method must not be blocked by a generic global disabled state when the user needs them to recover.
4. Reset local in-flight state in `finally` blocks and when auth state enters terminal/connected/disconnected states if needed.
5. Only extract a shared async-button pattern after inventory proves three real actions share the same requirements. Default to a local auth-modal helper such as `runOnce(actionId, callback)` unless the inventory shows cross-feature duplication that a shared presentation helper clearly removes.
6. Do not change connection domain semantics, signer protocol behavior, NIP-98, pack membership, or backend auth in this story.
7. Keep the implementation focused on the auth modal by default. Patch `PackRequestPage.requestJoin()` only if the inventory selects it as one of the real duplicate-submit risks being handled in this story; otherwise document that it remains out of scope for this implementation slice.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield foundation. Do not initialize a new app, introduce a component library, migrate frameworks, add a backend session model, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries: domain for pure types/rules, application for orchestration/ports, infrastructure for Nostr/NDK/browser adapters, and presentation for Angular UI. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Organization`]
- Keep signer, NDK, NIP-46, NIP-98, and Supabase details out of Angular page/components. The auth modal renders state and calls `NostrSessionService`. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- Auth state names must use the shared auth union/type rather than duplicated string literals spread across components. If extra button state is needed, keep it local to submission mechanics and do not redefine auth semantics. [Source: `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`]
- Pending states must name what is happening and must have success, failure, cancellation, timeout, or recovery transitions. [Source: `_bmad-output/planning-artifacts/architecture.md#Loading State Patterns`]
- Use repository scripts from `package.json` for verification; do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or lint tools. [Source: `package.json`; `_bmad-output/project-context.md#Development Workflow Rules`]

### UX And Accessibility Guardrails

- Preserve the existing Tailwind/DaisyUI `brutal` visual foundation. No new design system, palette, typography system, broad layout redesign, or animation layer belongs in this story. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Pending states should be announced where appropriate and must not rely only on motion or color. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Signer Pending Status`]
- Button state and status text must be clear for keyboard and screen-reader users. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Pack Join Status`]
- Pending labels must be practical and protocol-light: "Waiting for browser extension approval", "Waiting for signer app approval", or equivalent translated copy. Avoid generic "Loading..." for auth approval states. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading And Pending Pattern`]
- Keep focus predictable. Do not move focus on every pending-state update unless a new modal/dialog is opened or the current focused control is removed.
- Native disabled buttons are acceptable for preventing activation. If a disabled button's text changes to loading text, the visible label should still explain what is happening.

### Latest Technical Information

- Angular v21 style guidance continues to prefer feature organization, co-located `.spec.ts` tests, `inject()` where practical, template `class`/`style` bindings instead of `ngClass`/`ngStyle`, and presentation-focused components. [Source: `https://angular.dev/style-guide`]
- Angular accessibility guidance recommends using semantic HTML and native elements where possible because native controls include built-in keyboard and accessibility behavior. [Source: `https://angular.dev/best-practices/a11y`]
- WCAG 2.2 Success Criterion 4.1.3 requires status messages to be programmatically determinable without moving focus. The existing live status region is the right pattern to preserve for auth state changes. [Source: `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Transloco `^8.3.0`, and Vitest `^4.0.8`. [Source: `package.json`]

### File Structure Requirements

Likely UPDATE files:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`: add local duplicate-submit guard, per-action loading derivation, accessible visible loading labels, and reset behavior.
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`: add duplicate-click, loading-state, reset, and accessibility assertions.
- `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, `src/assets/i18n/es.json`: update together if new loading copy is introduced.

Potential UPDATE files only if inventory proves shared behavior belongs outside the auth modal:

- `src/features/packs/presentation/pages/pack-request.page.ts` and `.html`: add a narrow `requestJoin()` early return or shared async pattern only if selected by the inventory.
- `src/features/admin/presentation/pages/pack-admin-requests.page.ts` and `.html`: update only if a shared pattern demonstrably preserves two-step removal confirmation.
- `src/features/packs/presentation/components/owner-support-card.component.ts`: update only if the shared pattern replaces the existing `followLoading()` guard without reducing clarity.
- `src/core/zap/presentation/zap-modal.component.ts` and `src/core/zap/zap.service.ts`: update only if zap submit/generate actions are selected by the inventory as matching the same async loading/disabled/accessibility requirements.

Potential NEW file only if it prevents real duplication:

- A small shared presentation helper/component under `src/shared/presentation/` may be added only after the inventory finds at least three real matching uses. Keep it Angular-standalone, OnPush, accessible by default, and free of auth/Nostr protocol knowledge.

Avoid touching unless directly necessary:

- `NostrConnectionFacadeService`, connection methods, NIP-46 starters/restores, NIP-98 services, `server.mjs`, Supabase migrations, pack membership persistence, mobile auth docs, and Story 1.9 sign-out cleanup.

### Testing Requirements

- Use co-located `*.spec.ts` tests. Component tests should assert user-visible state, native disabled behavior, and service call counts. [Source: `_bmad-output/project-context.md#Testing Rules`]
- Required auth modal coverage:
  - Extension CTA becomes disabled and shows accessible loading feedback while extension auth is starting or `AuthSessionState` is `awaitingPermission` for `nip07`.
  - Rapid duplicate extension clicks call `session.connectWithExtension()` once.
  - Extension loading state resets after a resolved success, rejected promise/failure, unavailable extension result, timed-out state, and cancelled state.
  - Existing `role="status"`, `aria-live="polite"`, and `aria-atomic="true"` assertions continue to pass for pending/recovery states.
  - External signer and bunker changed handlers, if any, reject duplicate submits without blocking cancel/retry recovery.
  - New i18n keys, if any, appear in all three language files.
- Accessibility verification:
  - Run a project AXE/a11y test if one exists after implementation.
  - If no repository AXE script exists, use browser/DevTools AXE or equivalent manual accessibility tooling against the affected auth modal pending, recovery, and disabled states, then record what was checked in the Dev Agent Record.
  - Confirm `bun run check` currently covers lint, CSS lint, format, typecheck, and tests only; it is not an AXE substitute unless the script changes. [Source: `package.json`]
- Verification must use repository scripts: `bun run typecheck`, `bun run test`, and preferably `bun run check`. [Source: `package.json`]

### Anti-Reinvention Instructions

- Reuse `NostrSessionService.connecting()`, `authSessionState()`, `waitingForExternalAuth()`, `waitingForBunkerAuth()`, and existing retry context where possible.
- Do not add a global state-management library, RxJS subject layer, or reusable auth controller for button state.
- Do not create a protocol-level "pending button" state in the connection domain. Duplicate-click prevention is presentation interaction state unless a service method itself lacks idempotence.
- Do not replace native buttons with divs or anchors for button behavior.
- Do not introduce icon-only loading controls. If a spinner is used, keep it `aria-hidden="true"` and pair it with visible translated text or the existing live status message.
- Do not hide or disable recovery controls needed to cancel, close, choose another method, or reconnect.
- Do not log auth URIs, bunker tokens, NIP-46 secrets, NIP-98 tokens, private keys, or raw signer errors while adding loading diagnostics. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]

### Out Of Scope

- Completing Story 1.6 Amber/Primal real-device validation.
- Changing NIP-46 permission policy, NIP-07 restore, NIP-46 restore, or NIP-98 signing behavior.
- Full sign-out artifact cleanup; Story 1.9 owns that work.
- Broad accessibility redesign, formal WCAG/RGAA certification, new visual system, new component library, or frontend framework changes.
- Pack membership idempotency and Supabase persistence; Epic 2 owns those.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.8: Add Accessible Auth Loading and Anti-Duplicate-Submit Behavior`
- `_bmad-output/planning-artifacts/architecture.md#Loading State Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Signer Pending Status`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Loading And Pending Pattern`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/features/packs/presentation/pages/pack-request.page.ts`
- `src/features/admin/presentation/pages/pack-admin-requests.page.ts`
- `src/features/packs/presentation/components/owner-support-card.component.ts`
- `https://angular.dev/style-guide`
- `https://angular.dev/best-practices/a11y`
- `https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html`

### Saved Questions / Clarifications

- Resolved default: implement the auth-modal hardening first. Patch `PackRequestPage.requestJoin()` only if the inventory selects it as part of this story's concrete duplicate-submit scope.
- Resolved default: prefer a local auth-modal helper first. Create a shared presentation helper/component only if the inventory proves at least three real matching actions and the abstraction removes meaningful duplication without weakening accessibility.

## Dev Agent Record

### Agent Model Used

GPT-5 (Codex CLI)

### Debug Log References

- `bun run typecheck`
- `bun run test`
- `bun run check`

### Completion Notes List

- Added a local `runActionOnce` per-action guard in `AppAuthModalComponent` for extension/external/bunker/private-key submits to prevent duplicate clicks before session pending state propagates.
- Added computed disabled/loading selectors so extension CTA now exposes visible loading copy (`authModal.extension.loading`) and native disabled behavior from both local guard state and auth session pending state.
- Preserved recovery/cancel/close/choose-method flows as independently actionable controls while auth attempts are pending.
- Updated i18n in `en`, `fr`, and `es` for the new visible extension loading label.
- Added focused modal regression coverage for extension loading/disabled transitions, duplicate submit prevention, external/bunker/private-key anti-duplicate behavior, and pending/recovery status accessibility assertions.
- Inventory conclusion: existing async behavior across pack/admin/support/zap does not justify a shared abstraction in this slice; local auth-modal helper kept scope tight while covering at least three real auth submit actions.
- AXE note: repository has no dedicated AXE script; manual accessibility verification was recorded via auth modal status-region assertions (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`) plus native disabled-button behavior in component tests.

### File List

- src/core/layout/presentation/components/app-auth-modal.component.ts
- src/core/layout/presentation/components/app-auth-modal.component.spec.ts
- src/assets/i18n/en.json
- src/assets/i18n/fr.json
- src/assets/i18n/es.json

## Change Log

- 2026-05-06: Created Story 1.8 developer context for accessible auth loading and duplicate-submit prevention.
- 2026-05-06: Reviewed and tightened story readiness defaults, AXE verification expectations, zap inventory file scope, and empty Dev Agent Record placeholders.
- 2026-05-06: Implemented auth modal per-action duplicate-submit guards, accessible extension loading feedback, i18n updates, and regression coverage; verified with `bun run typecheck`, `bun run test`, and `bun run check`.
