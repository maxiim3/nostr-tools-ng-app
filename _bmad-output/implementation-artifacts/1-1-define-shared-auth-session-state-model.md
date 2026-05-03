# Story 1.1: Define Shared Auth Session State Model

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Nostr user,
I want the app to represent my connection state consistently,
so that I am never shown a misleading signed-in, loading, failed, or recovery state.

## Acceptance Criteria

1. Given the app needs to represent Nostr authentication, when the shared auth/session state model is defined, then it includes explicit states for disconnected, detecting signer, awaiting permission, awaiting external signer approval, awaiting bunker approval, connected, restoring, expired, revoked or unavailable, cancelled, timed out, failed, and recoverable retry, and the model is the single shared source for auth status semantics.
2. Given remembered identity or profile data exists locally, when the app evaluates authentication state, then local data is treated only as restorable context, and it never marks the user connected without valid signer authorization semantics.
3. Given UI components render auth state, when connected, pending, failed, timeout, cancellation, expired, revoked, or retry states appear, then they derive from the shared auth/session model, and they do not duplicate loose auth booleans or raw signer checks.

## Tasks / Subtasks

- [x] Add the domain auth/session state model in `src/core/nostr-connection/domain/` (AC: 1, 2)
  - [x] Create a focused kebab-case domain file such as `auth-session-state.ts`; keep it pure TypeScript with no Angular, NDK, browser, storage, HTTP, or UI imports.
  - [x] Define a discriminated union or equivalent typed state object covering exactly the story-required states: `disconnected`, `detectingSigner`, `awaitingPermission`, `awaitingExternalSignerApproval`, `awaitingBunkerApproval`, `connected`, `restoring`, `expired`, `revokedOrUnavailable`, `cancelled`, `timedOut`, `failed`, and `recoverableRetry`.
  - [x] Include enough state data for downstream stories without overbuilding: method id where relevant, attempt id where relevant, safe stable reason/error code where relevant, and `ConnectionSession` for connected state.
  - [x] Keep domain state semantic only: no localized copy, Tailwind/DaisyUI classes, modal flags, QR data, auth URLs, raw exception messages, signer objects, callbacks, timers, browser globals, storage payloads, NIP-98 tokens, or presentation-only data.
  - [x] Add pure derived helpers only if they prevent duplicated semantics, for example `isAuthSessionConnected`, `isAuthSessionPending`, `isAuthSessionRecoverable`, or `requiresReconnect`.
  - [x] Do not add persistence, localStorage, backend sessions, cookies, JWTs, OAuth, Supabase access, or signer adapter rewrites in this story.
- [x] Add domain tests for the shared model (AC: 1, 2)
  - [x] Co-locate tests as `src/core/nostr-connection/domain/auth-session-state.spec.ts`.
  - [x] Test every required state value at least through construction or helper coverage so later UI/application code cannot silently invent unsupported status strings.
  - [x] Test that connected state requires a real `ConnectionSession` shape rather than cached profile-only data.
  - [x] Test pending/recovery helper semantics if helpers are added.
- [x] Project the shared model through the existing connection facade without replacing current flows (AC: 1, 3)
  - [x] Update `src/core/nostr-connection/application/connection-facade.ts` to expose the canonical auth/session state projection for NIP-07, NIP-46 external signer, and bunker connection flows.
  - [x] Project from existing facade signals where possible: `currentAttempt`, `currentSession`, `pending`, and `error`. If a required status cannot be truthfully derived, add only the smallest private application state needed or document that later stories wire that transition.
  - [x] Keep existing public API behavior intact: `availableMethodIds`, `currentAttempt`, `currentSession`, `pending`, `error`, `isAuthenticated`, `ndkSigner`, `startConnection`, `completeCurrentAttempt`, `cancelCurrentAttempt`, `disconnect`, and `revalidateCurrentSession` must continue to work for current callers and tests.
  - [x] Expose `authSessionState` as readonly/computed, or as private writable state with a public readonly projection. Do not add another public writable auth signal.
  - [x] Map current external signer attempts to `awaitingExternalSignerApproval`, bunker attempts to `awaitingBunkerApproval`, NIP-07 availability checks to `detectingSigner` only where the code truly detects availability, and generic pending only where a more precise state is not currently known.
  - [x] If exact `awaitingPermission`, `expired`, or `revokedOrUnavailable` transitions are not yet implemented by adapters, define the states in the model and document that later stories wire those transitions; do not fake behavior.
  - [x] Do not create a feedback loop: `ConnectionFacade` must not inject or import `NostrSessionService`, `NostrClientService`, `SessionUser`, layout components, feature code, or `core/nostr/application/**`.
- [x] Make `NostrSessionService` consume or expose the shared auth/session state as the session bridge (AC: 2, 3)
  - [x] Update `src/core/nostr/application/nostr-session.service.ts` so UI-facing auth semantics derive from `ConnectionFacade.authSessionState` instead of only `user !== null`, loose waiting booleans, raw signer checks, or English error-string parsing.
  - [x] Preserve existing behavior for extension login, private-key fallback, external signer login, bunker login, timeouts, cancellations, admin detection, and disconnect.
  - [x] Ensure cached/fetched `SessionUser` remains presentation/profile data only; it must never be the source of truth for authenticated state.
  - [x] Make `isAuthenticated` derive from a connected shared auth/session state for NIP-07/NIP-46 flows. While private-key fallback remains outside `ConnectionFacade`, isolate it as explicitly named legacy/advanced compatibility state.
  - [x] Do not create a fake `ConnectionSession` from profile data or private-key `SessionUser` unless the connection domain explicitly supports that method through a real `ConnectionMethodId` and tests.
  - [x] Presentation components should consume `NostrSessionService` signals and should not import `ConnectionFacade`, raw signer/NDK state, `ConnectionSession`, or direct domain auth-state helpers for auth semantics in this story.
- [x] Update existing tests around facade/session bridge (AC: 2, 3)
  - [x] Extend `src/core/nostr-connection/application/connection-facade.spec.ts` to assert the new shared state projection during disconnected, pending, connected, failed, cancelled, and timed-out/recoverable paths that are possible at facade level.
  - [x] Extend `src/core/nostr/application/nostr-session.service.spec.ts` to assert session-visible auth state for extension success/failure, external signer waiting/success/cancel/timeout, bunker waiting/success/cancel/timeout, and disconnect.
  - [x] Add or update tests proving `SessionUser` alone does not authenticate, timeout/retry UI semantics do not depend on error string contents, private-key fallback is explicit and isolated, and stale async completion from an old attempt cannot overwrite current auth state.
  - [x] Keep tests deterministic with existing fakes and fake timers; do not introduce real signer, relay, browser extension, or NDK network dependency.
- [x] Refresh documentation for the new source of truth (AC: 1, 3)
  - [x] Update `src/core/nostr-connection/README.md` to name the shared auth/session state model as the semantic source of truth for UI/application auth states.
  - [x] Document that `ConnectionSession` is the validated signer/session identity, while `SessionUser` or fetched profile data is display context.
  - [x] Keep README updates concise and focused; do not rewrite unrelated French documentation or broad architecture docs unless implementation creates a new durable pattern.
- [x] Verify through repository scripts (AC: 1, 2, 3)
  - [x] Run targeted tests if useful during development through repo scripts only.
  - [x] Run at minimum `bun run typecheck` and `bun run test` before marking the story complete; run `bun run check` if practical.

### Review Findings

- [x] [Review][Patch] Timeout retry controls are unreachable after timeout state clears their parent render conditions [src/core/layout/presentation/components/app-auth-modal.component.ts:62]
- [x] [Review][Patch] Stale attempt completion can set canonical auth state to connected after timeout or cancellation [src/core/nostr-connection/application/connection-facade.ts:146]
- [x] [Review][Patch] Stale cross-flow timeout can cancel the wrong active auth attempt [src/core/nostr/application/nostr-session.service.ts:298]
- [x] [Review][Patch] Concurrent startConnection calls can publish an older attempt with a newer attempt id [src/core/nostr-connection/application/connection-facade.ts:122]
- [x] [Review][Patch] Start failures fall through to disconnected instead of failed or recoverable shared auth state [src/core/nostr-connection/application/connection-facade.ts:128]
- [x] [Review][Patch] Failure reason codes are inferred from raw English error messages instead of stable domain error codes [src/core/nostr-connection/application/connection-facade.ts:242]
- [x] [Review][Patch] Timeout or cancellation terminal state is only recorded after attempt.cancel succeeds [src/core/nostr-connection/application/connection-facade.ts:173]
- [x] [Review][Patch] Timeout UI semantics are duplicated in writable bridge booleans instead of deriving from shared auth state [src/core/nostr/application/nostr-session.service.ts:32]
- [x] [Review][Patch] Failed private-key retry leaves stale profile data while disabling private-key authentication [src/core/nostr/application/nostr-session.service.ts:115]

## Dev Notes

### Epic Context

Epic 1 exists to make Nostr authentication reliable across browser extension, external signer app, and bunker flows. The user must stay connected when authorization remains valid and recover clearly from interrupted, expired, revoked, cancelled, denied, timed-out, or unavailable auth states. Story 1.1 is the foundation for every later Epic 1 story: if the state model is wrong or duplicated, later restore, pending-state, mobile, permission, and sign-out stories will diverge. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1: Reliable Nostr Authentication and Session Continuity`]

### Requirements Context

- Covered requirements: FR7, FR9, FR10, FR15, and FR36. Users must see accurate auth status, the system must distinguish identity discovery from active signer authorization, and local remembered state must not become proof of authentication. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.1: Define Shared Auth Session State Model`]
- Auth failures must resolve to explicit user-visible states such as recoverable error, retry, timeout, cancellation, expired authorization, or sign-out. Avoid indefinite loading. [Source: `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`]
- Sign-in completion must not wait on nonessential feed, notification, profile, relay, or discovery data. Profile fetching may enrich display, but it must not define the underlying signer authorization state. [Source: `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`]

### Current Code State To Preserve

- `src/core/nostr-connection/domain/connection-session.ts` already defines `ConnectionSession` with `pubkeyHex`, `npub`, `methodId`, `capabilities`, and `validatedAt`. It normalizes hex pubkeys and encodes `npub`. Preserve this as the validated connection identity rather than replacing it with profile data.
- `src/core/nostr-connection/domain/connection-attempt.ts` already defines `ConnectionAttempt` with `methodId`, optional instructions, instruction-change listener, `complete()`, and `cancel()`. Preserve this attempt abstraction; the new state model should describe its user/application semantics, not duplicate its mechanics.
- `src/core/nostr-connection/application/connection-facade.ts` currently exposes `currentAttempt`, `currentSession`, `pending`, `error`, `isAuthenticated`, and `ndkSigner` as Angular signals/computed state. It starts, completes, cancels, disconnects, and revalidates through `ConnectionOrchestrator`. Extend this facade; do not bypass it from UI.
- `src/core/nostr/application/nostr-session.service.ts` is the current UI/session bridge. It owns `user`, `authModalOpen`, `connecting`, `error`, `extensionAvailable`, `externalAuthUri`, `waitingForExternalAuth`, `waitingForBunkerAuth`, `isAuthenticated`, and `isAdmin`. It starts extension, external signer, bunker, and private-key flows, fetches profiles for display, manages timeouts, and clears state on disconnect. Preserve these behaviors while making auth semantics derive from the shared state.
- `src/core/layout/presentation/components/app-auth-modal.component.ts` currently renders auth modal state from `NostrSessionService` and uses Tailwind/DaisyUI brutal styles. Story 1.1 does not need a visual redesign; any template change should be minimal and only to consume state semantics safely.
- `src/core/nostr-connection/README.md` currently documents the connection facade, orchestrator, attempts, in-memory restore status, NIP-07 flow, NIP-46 external signer flow, bunker flow, and NIP-98 boundary. Update it to prevent future agents from inventing a second state source.

### Architecture Guardrails

- Continue from the existing brownfield Angular/Bun foundation. Do not run Angular project initialization, introduce another frontend framework, add a state library, or create a reusable auth module in this story. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep feature-first pseudo-DDD boundaries: pure auth/session state belongs in `src/core/nostr-connection/domain/`; orchestration and Angular signals belong in `src/core/nostr-connection/application/`; UI rendering remains in presentation components. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`]
- Page/components must not contain raw signer, NDK, relay, NIP-98, Supabase, or backend authorization logic. This story should reduce auth-state duplication, not move protocol details into templates. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- Auth/session state is runtime frontend/application state. Do not persist a backend login session and do not model MVP auth as Supabase state. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Boundaries`]
- Keep Supabase server-side only through `server.mjs`; this story should not touch Supabase. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Protected backend calls stay stateless and NIP-98 signed request-by-request. Story 1.1 should not change NIP-98 signing or verification. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]

### Bounded Context Decision

Decision: `src/core/nostr-connection` is the bounded context for signer-backed auth/session semantics.

- `domain` owns the pure `AuthSessionState` vocabulary and pure semantic helpers only.
- `application` owns runtime state projection, orchestration, ports/interfaces, and Angular signal exposure.
- `infrastructure` owns NDK, NIP-07, NIP-46, bunker, browser, relay, storage, and protocol mechanics.
- `src/core/nostr/application/NostrSessionService` remains the compatibility bridge for current UI, profile display, packs, and admin consumers. It adapts connection auth state; it does not define connection truth.
- Presentation consumes `NostrSessionService` signals. It must not consume raw signer/NDK objects, `ConnectionFacade`, `ConnectionSession`, or direct domain helpers for auth semantics in this story.

Allowed dependency direction for this story:

```text
src/core/nostr-connection/domain
  -> src/core/nostr-connection/application
  -> src/core/nostr/application
  -> src/core/layout/presentation and feature presentation/application consumers
```

Forbidden dependency direction:

- `src/core/nostr-connection/domain/**` importing Angular, `core/nostr`, infrastructure, layout, features, storage, browser APIs, NDK, or UI/i18n code.
- `src/core/nostr-connection/application/**` importing `NostrSessionService`, `NostrClientService`, `SessionUser`, layout components, packs/admin features, or presentation code.
- `ConnectionFacade` injecting or depending on `NostrSessionService`; this would create recursion because `NostrSessionService` already depends on `NostrConnectionFacadeService`.

Known brownfield debt to avoid worsening:

- `NostrSessionService` currently imports `FRANCOPHONE_PACK` from `features/packs/domain` for admin checks. Story 1.1 does not need to fix that, but it must not add more `core -> features` dependencies.
- `ConnectionFacade` currently exposes `ndkSigner` for compatibility. Story 1.1 must not put NDK signer objects or third-party protocol objects into the new domain state.

### State Model Requirements

The shared model must cover the following statuses with one canonical spelling and one canonical import path:

```ts
type AuthSessionStatus =
  | 'disconnected'
  | 'detectingSigner'
  | 'awaitingPermission'
  | 'awaitingExternalSignerApproval'
  | 'awaitingBunkerApproval'
  | 'connected'
  | 'restoring'
  | 'expired'
  | 'revokedOrUnavailable'
  | 'cancelled'
  | 'timedOut'
  | 'failed'
  | 'recoverableRetry';
```

Implementation may choose the exact exported type names, but every app-level auth status must come from the shared model. Avoid loose combinations like `isConnected && isLoading && hasError`; those are explicitly called out as an anti-pattern in architecture. [Source: `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`]

Define all listed statuses now, but emit only statuses the current code can truthfully detect. If adapters cannot yet detect `awaitingPermission`, `expired`, `revokedOrUnavailable`, or `restoring`, leave those states available in the union and document that later stories wire those transitions. Do not infer them from generic errors, cached local data, or profile presence.

The domain state should describe semantics only. It may contain `status`, `methodId`, `attemptId`, `ConnectionSession`, and safe stable reason codes. It must not contain `ConnectionAttempt`, `ActiveConnection`, signer instances, callbacks, cancellation functions, timers, translated labels, modal flags, QR data, `authUrl`, `launchUrl`, `bunker://` tokens, `nostrconnect://` URLs, localStorage payloads, NIP-98 authorization material, raw exception messages, or Tailwind/DaisyUI classes.

### Anti-Reinvention Instructions

- Reuse `ConnectionSession`; do not create another pubkey/session identity type unless it is a small UI projection with a clear name.
- Reuse `ConnectionMethodId`; do not create duplicate string unions for NIP-07, NIP-46 external signer, bunker, or NIP-55.
- Reuse `ConnectionDomainError` and existing error codes where possible. If new auth-state reason codes are needed, keep them safe and stable; do not expose raw errors to UI.
- Reuse existing fakes in `src/core/nostr-connection/testing/fakes/` and current test patterns. Do not add real NDK, relay, browser extension, or QR dependencies to domain/application tests.
- Keep `NostrSessionService` as the bridge for existing pack/admin code in this story. Do not refactor all consumers of `NostrSessionService` into a new service unless required to satisfy the ACs.
- Do not introduce a generic state-machine framework, reducer library, global auth store, event bus, broad facade replacement, or reusable auth module. Story 1.1 needs a focused discriminated union and minimal projections.

### Runtime State Ownership

- `AuthSessionState` in domain is vocabulary, not mutable runtime storage.
- `ConnectionFacade` is the canonical application projection for NIP-07/NIP-46/bunker auth state.
- `authSessionState` should be a computed signal where possible. If explicit terminal state is required for cancellation or timeout, keep the writable backing signal private and expose only readonly/computed state.
- Existing public writable signals in `ConnectionFacade` are brownfield compatibility. Do not add another public writable auth signal.
- `NostrSessionService` may keep compatibility signals such as `waitingForExternalAuth`, `waitingForBunkerAuth`, or `connecting` only if they are computed/adapted from shared auth state or kept clearly as legacy UI bridge state during migration.
- UI must not parse error strings such as `session.error()?.includes('timed out')` for new behavior. Retry, timeout, cancellation, and failure rendering should derive from typed state/status/reason codes.

### Private-Key Fallback Constraint

Private-key login currently bypasses `ConnectionFacade` through `NostrClientService` and produces `SessionUser`, not `ConnectionSession`. This story must not blur that boundary.

- Do not create a fake private-key `ConnectionMethodId` or synthetic `ConnectionSession` from `SessionUser`/profile data alone.
- If private-key login remains available, model it as explicit legacy/advanced compatibility in `NostrSessionService` until a later architecture decision either removes it or promotes it into a real connection method.
- `SessionUser` is display/profile context only. It cannot prove signer-backed authentication for NIP-07/NIP-46/bunker flows.

### Attempt Correlation And Stale Completion Guardrails

External signer and bunker flows are asynchronous and can complete after cancellation, timeout, or retry. Preserve the existing attempt-id protection and do not let stale completions mutate current auth state.

- Auth state for pending external signer or bunker attempts should include an `attemptId` or equivalent correlation token where application code needs it.
- Timeout, cancellation, success, and failure transitions must check the active attempt identity before mutating `authSessionState`, `user`, signer state, modal state, or error state.
- Because timeout timers currently live in `NostrSessionService`, implementation must avoid making timeout/cancel truth live independently in both services. Prefer the smallest explicit facade API or typed cancellation reason needed, such as a future-compatible `cancelCurrentAttempt({ reason: 'timedOut' })`, if `ConnectionFacade` needs to own `timedOut`/`cancelled` projection truth. If that is too much for this story, keep bridge-owned timeout compatibility state clearly documented and do not expose it as canonical connection-domain truth.
- Do not move timers, callbacks, or cancellation functions into the domain state. Those stay in application/bridge code.

### UX Guardrails

- Preserve the current Tailwind/DaisyUI `brutal` visual foundation; no design-system, palette, typography, or broad layout redesign belongs in this story. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- State wording and future UI should distinguish connected, pending signer approval, restoring, expired/revoked/unavailable, failure, and retry without protocol-heavy diagnostics. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`]
- Status and recovery states must be perceivable without relying only on color and remain understandable to screen-reader users. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility`]

### Testing Requirements

- Domain model tests should avoid Angular TestBed and test pure TypeScript directly.
- Facade/application tests should use fake connection methods, attempts, active connections, and fake timers where needed.
- Existing `NostrSessionService` tests already cover extension success/failure, external signer wait/success/cancel/timeout, bunker wait/success/cancel/timeout, private-key fallback, admin detection, and disconnect. Extend these rather than replacing them.
- Verification commands must use repo scripts from `package.json`: `bun run typecheck`, `bun run test`, or `bun run check`. Do not call underlying `tsc`, `vitest`, `ng test`, `prettier`, or lint tools directly. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Latest Technical Information

- Angular v21 signals support private writable state exposed as readonly via `.asReadonly()`, and computed signals are read-only, lazy, and memoized. This matches the architecture requirement for private writable signals and public readonly/computed projections. [Source: `https://angular.dev/guide/signals`]
- Angular style guidance prefers hyphenated filenames, co-located `.spec.ts` tests, feature-area organization, `inject()` over constructor injection, protected template-only component members, and `class`/`style` bindings instead of `ngClass`/`ngStyle`. [Source: `https://angular.dev/style-guide`]
- NIP-98 remains the HTTP auth boundary for protected requests: kind `27235`, exact absolute URL, exact method, freshness window, optional payload hash for bodies, and `Authorization: Nostr <base64-event>`. Story 1.1 should not weaken or replace this model. [Source: `https://github.com/nostr-protocol/nips/blob/master/98.md`]

### Git Intelligence

- Recent work is documentation/process cleanup rather than code implementation: `doc: update bmad workflow guidance`, `doc: move project docs out of specs`, `doc: add bmad implementation plan`, and `doc: add architecture decisions`.
- No previous story file exists for Epic 1, so there are no prior dev-agent implementation notes to inherit. Treat existing code and planning artifacts as the source of implementation patterns.

### Out Of Scope

- Do not implement refresh restoration for NIP-07 or NIP-46 in this story; later stories 1.2 and 1.3 own that behavior.
- Do not redesign the auth modal or method selection; story 1.4 owns method-selection UX.
- Do not implement all pending/timeout/cancelled/denied UI copy; story 1.5 owns explicit pending and recovery UI behavior.
- Do not stabilize Amber/Primal mobile return flow; story 1.6 owns mobile signer validation.
- Do not change pack registration, Supabase, admin flows, or backend API routes.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.1: Define Shared Auth Session State Model`
- `_bmad-output/planning-artifacts/prd.md#Nostr Authentication`
- `_bmad-output/planning-artifacts/prd.md#Session Continuity`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `src/core/nostr-connection/domain/connection-session.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- `bun run typecheck`
- `bun run lint`
- `bun run test`

### Completion Notes List

- Added canonical auth/session state model and semantic helpers in `src/core/nostr-connection/domain/auth-session-state.ts`.
- Projected shared auth semantics from `NostrConnectionFacadeService` via `authSessionState`, including typed terminal reasons for cancel/timeout/failure.
- Updated `NostrSessionService` auth bridge so signer-backed auth derives from shared state, while private-key path remains explicit compatibility behavior.
- Removed timeout detection by parsing error strings in modal flows and switched to typed timeout signals.
- Extended domain, facade, session service, and modal tests for connected/pending/cancelled/timedOut/recoverable paths and stale-attempt protection.
- Verification passed with repo scripts: typecheck, lint, and full test suite.

### File List

- `_bmad-output/implementation-artifacts/1-1-define-shared-auth-session-state-model.md`
- `src/core/nostr-connection/domain/auth-session-state.ts`
- `src/core/nostr-connection/domain/auth-session-state.spec.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/connection-facade.spec.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/core/nostr-connection/README.md`

### Change Log

- Defined shared `AuthSessionState` union and helper predicates as the auth semantic source of truth.
- Added facade-level auth state projection and explicit attempt terminal handling for `cancelled` and `timedOut` outcomes.
- Aligned `NostrSessionService` authentication semantics with shared auth state and isolated private-key fallback compatibility.
- Updated auth modal behavior to use typed timeout state rather than string-based error parsing.
- Added and updated tests to enforce state coverage and non-regression across domain/application/session/presentation boundaries.
