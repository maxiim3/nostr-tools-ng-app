# Story 1.7: Minimize Startup Permissions and Request Additional Permissions Just-In-Time

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Nostr user,
I want Toolstr to ask only for permissions it needs now,
so that I can trust the connection request.

## Acceptance Criteria

1. Given the app requests signer permissions during startup auth, when current requested permissions are reviewed, then each permission is mapped to a concrete feature need and unnecessary startup permissions are removed where safe.
2. Given a later action requires additional permission, when the user initiates that action, then the app requests the additional permission just in time and the prompt remains understandable on desktop and mobile.
3. Given permissions are reduced, when browser extension, external signer, and bunker flows are validated, then required MVP auth and pack actions still work and behavior is covered by tests or explicit manual verification.
4. Given NIP-46 external signer startup currently requests broad encryption permissions, when this story is implemented, then `get_public_key` and `sign_event` are treated as the minimum startup permission set for MVP auth and NIP-98-protected pack actions unless the inventory proves a current shipped startup feature needs more.
5. Given restore and capability metadata can drift from startup permission policy, when permissions are minimized, then fresh NIP-46 login, restored NIP-46 sessions, bunker-reported capabilities, and fakes/tests use a consistent capability policy and do not silently regain removed permissions.
6. Given a required just-in-time permission cannot be requested cleanly through the current NDK/NIP-46 APIs, when implementation reaches that limitation, then the action fails safely or remains unavailable with clear recovery copy and the limitation is documented instead of pretending the permission was granted.

## Tasks / Subtasks

- [x] Inventory current signer permission and capability use (AC: 1, 3, 4)
  - [x] Map every current NIP-46 startup permission in `DEFAULT_NOSTRCONNECT_PERMS` to a concrete feature: `get_public_key`, `sign_event`, `nip04_encrypt`, `nip04_decrypt`, `nip44_encrypt`, and `nip44_decrypt`.
  - [x] Map app-level `ConnectionCapability` values to concrete current use: `sign-event`, `nip98-auth`, NIP-04/NIP-44 encrypt/decrypt.
  - [x] Verify MVP auth and pack joining only need public-key validation plus event signing for NIP-98 authorization.
  - [x] Identify any currently shipped action that still depends on encryption capability, especially `NostrClientService.sendDirectMessage()`.
- [x] Reduce startup permission scope without breaking required auth and pack actions (AC: 1, 3, 4, 5)
  - [x] Minimize `NdkNip46NostrconnectStarter` default `perms` to the safe MVP startup set if the inventory confirms no startup encryption need.
  - [x] Keep `get_public_key` available because NIP-46 clients must learn and validate the user pubkey after connect.
  - [x] Keep `sign_event` available because NIP-98 backend auth signs a `kind:27235` event and pack join/admin protected calls depend on that signer path.
  - [x] Remove NIP-04/NIP-44 encryption permissions from startup unless a current shipped startup feature demonstrably requires them.
  - [x] Ensure app-level capabilities exposed by the active connection match the minimized permission policy; do not claim encryption capability after removing encryption permissions.
- [x] Align restore, bunker, and tests with the same capability policy (AC: 3, 5, 6)
  - [x] Update NIP-46 restore connection capability construction so restored sessions do not regain broad encryption capabilities by hard-coded default.
  - [x] Decide whether to persist permission metadata in `Nip46RestoreContextStore`; if used, treat it as metadata only, not proof that a signer still grants the permission.
  - [x] Review `NdkNip46BunkerStarter` capabilities. Bunker token flow does not currently send a startup `perms` string, so do not invent unsupported bunker permission negotiation.
  - [x] If bunker one-shot or extra permissions cannot be requested through current NDK APIs, document the limitation and keep behavior fail-safe.
  - [x] Update fakes so tests exercise the same default capability policy as production.
- [x] Add just-in-time permission behavior only for real current actions that need it (AC: 2, 3, 6)
  - [x] For protected backend HTTP calls, continue using existing NIP-98 signing through `NostrHttpAuthService` and `Nip98HttpAuthService`; this is already just-in-time per request and depends on `sign_event`.
  - [x] For any encryption action that remains shipped, either implement a narrow just-in-time permission path supported by the current signer stack or present a safe unavailable/reconnect/choose-method outcome.
  - [x] Keep user-facing prompts practical and protocol-light: tell the user what action needs approval, why it is needed, and what to do next.
  - [x] Do not add a new state-management library, signer SDK, mobile native bridge, NIP-55 flow, backend session, or broad auth redesign for permission prompts.
- [x] Preserve auth UX and accessibility while changing permission behavior (AC: 2, 3, 6)
  - [x] Reuse the existing auth modal and `AuthSessionState` projection for pending, timeout, cancelled, denied, revoked/unavailable, and retry states.
  - [x] If user-facing copy changes, update `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, and `src/assets/i18n/es.json` together; preserve French as the default/fallback product language.
  - [x] Keep status messages perceivable without color only, announced through the existing `role="status"` / `aria-live="polite"` area where applicable.
  - [x] Keep desktop guidance favoring browser extension auth, mobile guidance favoring external signer app auth, and bunker as advanced.
- [x] Add targeted tests and honest validation notes (AC: 1-6)
  - [x] Add or update tests proving NIP-46 external signer startup requests only the intended minimal `perms`.
  - [x] Add or update tests proving active and restored NIP-46 sessions expose the minimized capabilities and do not regain removed encryption capabilities.
  - [x] Add or update tests proving NIP-98 authorization still works for protected pack/admin requests with the minimized capability set.
  - [x] Add or update tests for unsupported encryption capability or just-in-time permission failure if encryption remains reachable.
  - [ ] Validate browser extension, external signer, and bunker flows with tests where possible and explicit manual verification where signer permission prompts cannot be simulated.
  - [x] Do not mark manual verification complete unless it was actually performed; record pending/unverified status honestly if needed.
- [x] Verify with repository scripts only (AC: 1-6)
  - [x] Run `bun run typecheck`.
  - [x] Run `bun run test`.
  - [x] Run `bun run check` if practical before moving the story to review.

### Review Findings

- [x] [Review][Patch] Shipped DM encryption path has no just-in-time permission or safe unavailable outcome [`src/core/nostr/application/nostr-client.service.ts:106`] — added a capability guard so minimized NIP-46 signers fail safely before NIP-04 encryption, with regression coverage.
- [x] [Review][Patch] Required signer-flow/manual validation is still pending despite AC3 validation requirement [`_bmad-output/implementation-artifacts/1-7-minimize-startup-permissions-and-request-additional-permissions-just-in-time.md:56`] — restored the manual validation task to unchecked and kept the pending status explicit.

## Dev Notes

### Epic Context

Epic 1 makes Nostr authentication reliable across browser extension, external signer app, and bunker flows while preserving session continuity and clear recovery. Story 1.7 is the permission-minimization slice: startup auth should request only what Toolstr needs immediately, and later feature-specific approvals should happen only when the user initiates the feature. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.7: Minimize Startup Permissions and Request Additional Permissions Just-In-Time`]

Covered requirements are FR5, FR6, and FR32. Supporting non-functional requirements require prompt visible auth state changes, explicit recovery from interruptions, no indefinite loading, no private-key exposure, preserved valid auth flows across browser extension, external signer, and bunker, and WCAG AA-oriented core auth controls. [Source: `_bmad-output/planning-artifacts/epics.md#Requirements Inventory`]

The business value is trust. Nostr signer prompts are sensitive UX moments; asking for NIP-04/NIP-44 encryption before the user performs an encryption-related action makes the connection request look broader than the MVP needs. [Source: `_bmad-output/planning-artifacts/prd.md#What Makes This Special`]

### Previous Story Intelligence

Story 1.1 established `AuthSessionState` as the shared source for auth status semantics. Do not add a second permission or mobile auth state source; any user-visible permission outcome must project from the existing connection/session model or a focused application outcome. [Source: `_bmad-output/implementation-artifacts/1-1-define-shared-auth-session-state-model.md`]

Story 1.2 and Story 1.3 established fail-closed restoration. Permission minimization must preserve the rule that cached local state is restorable context only; restored NIP-07/NIP-46 sessions must still validate signer authorization and expected pubkey before connected state. [Source: `_bmad-output/implementation-artifacts/1-2-restore-valid-browser-extension-sessions-after-refresh.md`; `_bmad-output/implementation-artifacts/1-3-restore-valid-nip-46-external-signer-sessions-after-refresh.md`]

Story 1.4 established auth method hierarchy. Desktop still favors browser extension, mobile still favors external signer app, and bunker/private-key paths stay advanced. Do not redesign method selection or make bunker the mainstream mobile path while editing permissions. [Source: `_bmad-output/implementation-artifacts/1-4-make-auth-method-selection-and-advanced-bunker-mode-clear.md`]

Story 1.5 added explicit pending, timeout, cancelled, denied, revoked/unavailable, and retry states in the auth modal. Reuse the translated status projection; do not show raw NDK/NIP-46 permission errors as primary user copy when a safe mapped state exists. [Source: `_bmad-output/implementation-artifacts/1-5-add-explicit-pending-timeout-cancelled-denied-and-retry-states.md`]

Story 1.6 is currently `in-progress` in `sprint-status.yaml`. Its implemented notes and recent commits are useful because they harden external signer stale auth races, but the open review item says Amber/Primal real-device validation remains pending. Do not depend on unverified mobile behavior as final proof for this story; record manual verification honestly. [Source: `_bmad-output/implementation-artifacts/1-6-stabilize-mobile-external-signer-return-flow-for-amber-and-primal.md#Review Findings`]

Recent commits show the active implementation pattern: `ad2177c fix: harden external signer stale auth races`, `1412820 1.6 - feat: wip implementation`, `ec39c82 feat: add explicit auth recovery states`, `c1cbc08 feat: clarify auth method selection`, and `c19f3e8 feat: restore nip-46 sessions`. Current work is concentrated in `NostrSessionService`, `ConnectionFacade`, NIP-46 connection/restore code, the auth modal, translations, and auth docs.

### Current Code State To Preserve

`src/core/nostr-connection/infrastructure/ndk-nip46-nostrconnect-starter.ts` currently:

- Creates `NDKNip46Signer.nostrconnect(ndk, relayUrl, undefined, { name, url, image, perms })`.
- Uses `DEFAULT_NOSTRCONNECT_PERMS` with `get_public_key,sign_event,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt`.
- Exposes broad default capabilities: `sign-event`, `nip98-auth`, `nip04-encrypt`, `nip04-decrypt`, `nip44-encrypt`, and `nip44-decrypt`.
- Builds launch/copy/QR instructions from `signer.nostrConnectUri` and must keep sensitive URI handling out of logs.

`src/core/nostr-connection/infrastructure/ndk-nip46-bunker-starter.ts` currently:

- Creates `NDKNip46Signer.bunker(ndk, connectionToken)` from a user-supplied `bunker://` token.
- Does not pass a startup `perms` string.
- Exposes the same broad default capabilities as nostrconnect.
- Extracts relay URLs from the bunker token and adds default relays.

`src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts` currently:

- Starts external signer attempts through the starter and wraps them with `createNip46ConnectionAttempt()`.
- Restores NIP-46 active connections from `Nip46RestoreContext.restorePayload`.
- Hard-codes broad capabilities during restore, so restored sessions can currently regain encryption capabilities even if fresh startup permissions are reduced.
- Validates restored user pubkey against stored `pubkeyHex` and stops the remote signer on mismatch or timeout; this must be preserved.

`src/core/nostr-connection/application/nip46-restore-context-store.ts` currently:

- Supports optional `relayUrls` and `permissions` metadata.
- Validates malformed optional metadata and purges invalid payloads.
- Does not prove current signer authorization by itself; restore still depends on signer revalidation.

`src/core/nostr-connection/application/connection-facade.ts` currently:

- Persists NIP-46 restore payload, `pubkeyHex`, and `validatedAt`, but does not save permission metadata.
- Computes explicit auth states from current session, current attempt, terminal statuses, pending, and restoring method.
- Owns restore fail-closed behavior and must not be bypassed from UI code.

`src/core/nostr/application/nostr-http-auth.service.ts` currently:

- Resolves a signer from the active connection when it supports `nip98-auth`.
- Falls back to `NostrClientService.getHttpAuthSigner()` for the currently applied NDK signer.
- Delegates NIP-98 creation to `Nip98HttpAuthService`; this is the protected backend boundary and should stay just-in-time per request.

`src/core/nostr/application/nostr-client.service.ts` currently:

- Uses `publishEvent()` for event publishing, which needs signing.
- Uses `sendDirectMessage()` with `event.encrypt(..., 'nip04')`, which needs encryption capability if this action remains shipped/reachable.
- Uses `getHttpAuthSigner()` for NIP-98 HTTP auth, which needs event signing.
- Applies NIP-07 and NDK signers for display/profile enrichment; sign-in completion must not wait on nonessential data.

`src/core/layout/presentation/components/app-auth-modal.component.ts` currently:

- Keeps auth modal presentation-focused and depends on `NostrSessionService`, not low-level NIP-46/NDK code.
- Opens external signer URIs through `globalThis.location.href` and provides open/copy/QR/cancel/retry affordances.
- Renders mapped status copy with `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
- Must not import NDK, NIP-46 starters, restore stores, NIP-98 services, Supabase, or backend APIs.

### Required Implementation Shape

The minimal correct implementation is likely a focused permission-policy hardening pass, not a rewrite:

1. Inventory current permissions and capabilities before changing behavior.
2. Reduce `DEFAULT_NOSTRCONNECT_PERMS` to the minimum startup permissions needed for connection and MVP protected actions, likely `get_public_key,sign_event`.
3. Align NIP-46 active-session capabilities with the minimized permission set so `supports()` does not overpromise removed encryption capabilities.
4. Align NIP-46 restore capabilities with fresh-login capabilities so restore does not silently bypass the minimized policy.
5. Keep NIP-98 working through `sign_event`; pack join and admin protected actions must still be able to sign exact HTTP auth requests.
6. Treat encryption actions separately. If they are not MVP/currently reachable, do not request encryption at startup. If they remain reachable, implement safe just-in-time behavior only if the current signer stack supports it; otherwise fail safely with clear copy and document the limitation.
7. For bunker, do not invent one-shot permission negotiation if NDK does not expose a clean path. Align reported capabilities and document limitations instead.

### Architecture Guardrails

- Continue from the existing Angular/Bun brownfield foundation. Do not initialize a new app, introduce a component library, migrate frameworks, add a backend session model, or extract a reusable auth module. [Source: `_bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation`]
- Keep pseudo-DDD boundaries: domain for pure types/rules, application for orchestration/ports, infrastructure for Nostr/NDK/browser adapters, and presentation for Angular UI. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Organization`]
- Keep signer, NDK, NIP-46, NIP-98, and Supabase details out of Angular page/components. The auth modal renders state and calls `NostrSessionService`. [Source: `_bmad-output/planning-artifacts/architecture.md#Component Boundaries`]
- Use `ConnectionCapability` / `ConnectionSigner.supports()` as the app-level capability abstraction. Do not create parallel permission enums unless a pure mapper is necessary to prevent duplication.
- If a shared policy is needed across starter, restore, bunker, and tests, place it in a pure domain/application file under `src/core/nostr-connection/`; do not put NDK or Angular dependencies in it.
- Keep writable signals private and expose readonly/computed state for presentation. Do not add loose boolean combinations for permission status. [Source: `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`]
- Backend-protected actions must continue to use NIP-98 request-by-request. Do not introduce cookies, JWT, OAuth replacement, Supabase auth sessions, or server-side identity state. [Source: `_bmad-output/project-context.md#Critical Don't-Miss Rules`]
- Preserve exact URL/method/payload NIP-98 verification expectations on the backend; this story should not alter backend verification unless tests reveal a direct regression. [Source: `docs/auth/nostr-auth-rules.md#NIP-98`]

### UX And Accessibility Guardrails

- Preserve the existing Tailwind/DaisyUI `brutal` visual foundation. No new design system, palette, typography system, broad layout redesign, or animation layer belongs in this story. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation`]
- Permission prompts should explain the immediate action, not protocol mechanics. Prefer practical copy such as approving connection, signing a protected request, or reconnecting. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`]
- Keep one obvious primary action per state: connect, retry, reconnect, choose another method, or continue the user-initiated action. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy`]
- Pending states must name what is happening and must resolve to success, failure, cancellation, timeout, or recovery. Do not create ambiguous indefinite loading. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading And Pending Pattern`]
- Status, pending, error, and recovery feedback must be perceivable without relying only on color and understandable to screen-reader users. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Accessibility Strategy`]
- Desktop should continue to favor browser extension authentication; mobile should continue to favor external signer app authentication; bunker remains advanced. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`]

### Nostr Protocol And Security Constraints

- NIP-46 `nostrconnect://` may include optional `perms`, a comma-separated list of requested permissions. The current NIP-46 text supports method-level permissions such as `nip44_encrypt` and parameterized `sign_event:<kind>`. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Requested permissions`]
- NIP-46 client-initiated connection requires `relay` and `secret`; the client must validate the returned `secret` to avoid spoofing. Do not change that correlation behavior. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Direct connection initiated by the client`]
- NIP-46 clients must call `get_public_key` after connect to learn the final user pubkey; do not remove support for public-key validation. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Overview`]
- Current NIP-46 distinguishes remote signer pubkey from user pubkey. Do not treat remote signer identity, metadata, NIP-05, or app name as the authenticated user. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Terminology`]
- Response events use request `id` correlation. Do not implement permission handling that bypasses adapter-level NIP-46 request/response correlation. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Response Events kind24133`]
- `auth_url` may be surfaced as `authUrl` in app code when a signer requires extra authentication. Treat auth URLs as sensitive; do not log them. [Source: `docs/auth/nostr-auth-rules.md#Protocol Rules`]
- Redact NIP-46 secrets, restore payloads, bunker tokens, auth URLs, NIP-98 tokens, and signer material from logs. This story should avoid adding logs around permission URLs or tokens. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]
- Use HTTPS/WSS only and preserve `rel="noopener noreferrer"` on external auth links. [Source: `docs/auth/nostr-auth-rules.md#Security Extraction For Web Scope`]

### Latest Technical Information

- Angular v21 style guidance says to prefer consistency within files, co-locate `.spec.ts` tests, organize by feature area, use `inject()` over constructor injection where practical, keep components presentation-focused, use `protected` for template-only members, and prefer `class`/`style` bindings over `ngClass`/`ngStyle`. [Source: `https://angular.dev/style-guide`]
- Current project versions: Angular `^21.1.0`, TypeScript `~5.9.2`, Bun `1.2.13`, `nostr-tools ^2.23.3`, NDK `^3.0.3`, Tailwind CSS `^4.1.12`, DaisyUI `^5.5.19`, Transloco `^8.3.0`, Vitest `^4.0.8`, QR code `^1.5.4`. [Source: `package.json`]
- Current NIP-46 text confirms `perms` is optional and permission strings are method names with optional parameters, for example `sign_event:4`. The story should not add NIP-05 login, account creation, or native signer discovery as part of permission minimization. [Source: `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md#Changes`]

### File Structure Requirements

Likely UPDATE files:

- `src/core/nostr-connection/infrastructure/ndk-nip46-nostrconnect-starter.ts`: reduce default `perms`, align default capabilities, preserve NDK starter behavior and sensitive URI handling.
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`: align restored session capabilities with the minimized policy and keep pubkey validation/fail-closed behavior.
- `src/core/nostr-connection/infrastructure/ndk-nip46-bunker-starter.ts`: align reported bunker capabilities or document why bunker permissions cannot be minimized through startup `perms`.
- `src/core/nostr-connection/testing/fakes/fake-nip46-nostrconnect-starter.ts`: align fake default capabilities with production.
- `src/core/nostr-connection/testing/fakes/fake-nip46-bunker-starter.ts`: update only if fake bunker defaults need policy alignment.
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.spec.ts`: cover minimized restore/start capabilities.
- `src/core/nostr-connection/application/nip46-restore-context-store.ts` and `.spec.ts`: update only if permission metadata is persisted or interpreted.
- `src/core/nostr/application/nostr-http-auth.service.ts` and `.spec.ts`: update only if NIP-98 signer resolution requires coverage for minimized capabilities.
- `src/core/nostr/application/nostr-client.service.ts` and `.spec.ts`: update only if currently reachable encryption actions need a safe unavailable or just-in-time path.
- `src/assets/i18n/fr.json`, `src/assets/i18n/en.json`, `src/assets/i18n/es.json`: update together if user-facing permission/recovery copy changes.
- `docs/auth/nostr-auth-rules.md` or `docs/auth/mobile-auth-notes.md`: update only if implementation discovers a durable permission limitation or manual verification result worth preserving.

Potential NEW file only if it prevents duplication:

- `src/core/nostr-connection/domain/connection-permission-policy.ts` or similar pure helper for shared NIP-46 permission/capability policy. Keep it free of Angular, NDK, browser globals, and UI copy.

Avoid touching unless directly necessary:

- `server.mjs`, `server.test.mjs`, Supabase migrations, pack pages/services, admin pages, NIP-98 backend verification.
- NIP-07 restore behavior beyond validation.
- Auth modal layout or method hierarchy beyond concise copy if needed.
- Story 1.8 async-button abstraction and Story 1.9 sign-out cleanup.
- Native NIP-55, PWA, assetlinks/AASA, account creation, SEO, public wiki, reusable Angular auth module extraction.

### Testing Requirements

- Use co-located `*.spec.ts` tests. Domain/pure policy tests should avoid Angular TestBed. Application service tests should use fake ports/signers. Component tests should assert visible states and service interaction only when UI copy/behavior changes. [Source: `_bmad-output/project-context.md#Testing Rules`]
- Required coverage for NIP-46 permission minimization:
  - Fresh nostrconnect startup uses only the intended minimal `perms` string.
  - NIP-46 active connection exposes capabilities consistent with the minimized policy.
  - Restored NIP-46 sessions expose the same minimized capabilities and do not re-add removed encryption capability.
  - Restore still validates expected `pubkeyHex` and fails closed on mismatch, timeout, invalid payload, unavailable signer, or stale restore attempt.
  - Bunker flow still starts and validates `bunker://` token structure; reported capabilities do not overpromise unsupported permissions.
  - NIP-98 authorization header creation still works for protected pack/admin requests.
  - Any encryption action that remains reachable is covered as supported through a real just-in-time path or safely unavailable/recoverable when permission is absent.
- Required manual validation or explicit notes:
  - Browser extension login still works after permission-policy changes.
  - NIP-46 external signer login still works with the minimized `perms` prompt.
  - Bunker login still works or limitation is recorded honestly.
  - Pack join/admin protected actions can still produce NIP-98 auth.
  - Mobile prompt wording remains understandable enough for users to know what they are approving.
- Verification must use repository scripts from `package.json`: `bun run typecheck`, `bun run test`, and preferably `bun run check`. Do not call direct `tsc`, `vitest`, `ng test`, `prettier`, or lint tools. [Source: `_bmad-output/project-context.md#Development Workflow Rules`]

### Anti-Reinvention Instructions

- Reuse `ConnectionCapability`; do not add a separate app permission enum unless it is a pure protocol mapping needed to prevent duplicated strings.
- Reuse `NostrSessionService`, `ConnectionFacade`, `Nip46NostrconnectConnectionMethod`, and `Nip46ConnectionSigner`; do not bypass them from UI components.
- Reuse `NostrHttpAuthService` and `Nip98HttpAuthService` for NIP-98; do not special-case HTTP signing in pack/admin code.
- Reuse method IDs `nip07`, `nip46-nostrconnect`, and `nip46-bunker`; do not add method aliases such as `amber`, `primal`, `mobileSigner`, or `permissionedNip46`.
- Reuse the existing auth modal pending/recovery projection. Do not create a parallel permission modal unless a concrete signer API requires a small focused component and tests justify it.
- Do not add signer-specific SDKs, device detection libraries, NIP-55, native deep-link infrastructure, backend sessions, OAuth/JWT, or Supabase browser access.
- Do not claim a capability is granted merely because a permission string was requested or persisted. Capabilities should reflect what the app can safely attempt, and failures must map to recoverable states.

### Out Of Scope

- Completing Story 1.6 Amber/Primal real-device validation, except recording permission-related manual checks honestly if performed.
- Accessible async-button abstraction; Story 1.8 owns it and abstraction is only allowed after at least three real async cases are inventoried.
- Full sign-out artifact cleanup; Story 1.9 owns it, although this story must not regress existing cancellation/logout cleanup.
- Bunker one-shot permission grants if current NDK lacks a clean extension point. Architecture marks this blocked unless superseded by a documented replacement.
- Pack registration, admin membership, Supabase persistence, NIP-98 backend verification, public docs/wiki polish, SEO, PWA, reusable auth module extraction, account creation, and broad onboarding.

### References

- `_bmad-output/planning-artifacts/epics.md#Story 1.7: Minimize Startup Permissions and Request Additional Permissions Just-In-Time`
- `_bmad-output/planning-artifacts/prd.md#Nostr Authentication`
- `_bmad-output/planning-artifacts/prd.md#User Feedback and Recovery`
- `_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`
- `_bmad-output/planning-artifacts/architecture.md#Frontend Architecture`
- `_bmad-output/planning-artifacts/architecture.md#State Management Patterns`
- `_bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Signer Pending Status`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy`
- `_bmad-output/project-context.md#Critical Implementation Rules`
- `docs/auth/nostr-auth-rules.md#Permissions`
- `docs/auth/nostr-auth-rules.md#Protocol Rules`
- `docs/auth/mobile-auth-notes.md#Applicable Security Notes`
- `src/core/nostr-connection/infrastructure/ndk-nip46-nostrconnect-starter.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-bunker-starter.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-restore-context-store.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr/application/nostr-http-auth.service.ts`
- `src/core/nostr/application/nostr-client.service.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `https://angular.dev/style-guide`
- `https://raw.githubusercontent.com/nostr-protocol/nips/master/46.md`

### Saved Questions / Clarifications

- Story 1.6 is still marked `in-progress`; should Story 1.7 implementation wait for Amber/Primal real-device validation before final review, or proceed with its own explicit manual verification notes?
- If NDK cannot request extra bunker or encryption permissions just in time, should the implementation document the limitation only, or should affected non-MVP actions be hidden/disabled until a future signer capability story?
- Is explicit manual verification acceptable for signer permission prompts that cannot be reliably simulated in automated tests?

## Dev Agent Record

### Agent Model Used

openai/gpt-5.3-codex

### Debug Log References

- `bun run typecheck` (pass)
- `bun run test` (pass)
- `bun run check` (pass)
- `bun run format` (used once to satisfy `format:check` inside `bun run check`)

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Status set to `ready-for-dev` after source artifact, previous-story, current-code, protocol, UX/accessibility, latest technical, and checklist analysis.
- Added shared NIP-46 minimum permission policy constants and switched startup `perms` to `get_public_key,sign_event` only.
- Aligned NIP-46 capabilities for fresh nostrconnect attempts, restored nostrconnect sessions, bunker starter defaults, and test fakes to `sign-event` + `nip98-auth` only.
- Added infrastructure tests validating minimal nostrconnect `perms` and minimized bunker/nostrconnect capability exposure.
- Extended nostrconnect restore tests to assert removed encryption capabilities do not reappear on restored sessions.
- Confirmed NIP-98 signing flow still passes existing regression tests.
- Added safe NIP-04 DM capability guard for minimized NIP-46 sessions and regression coverage.
- Manual signer-prompt verification remains pending (cannot be fully simulated in automated tests in this run).

### File List

- `_bmad-output/implementation-artifacts/1-7-minimize-startup-permissions-and-request-additional-permissions-just-in-time.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/core/nostr-connection/domain/nip46-permission-policy.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-nostrconnect-starter.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-nostrconnect-starter.spec.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-bunker-starter.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-bunker-starter.spec.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.spec.ts`
- `src/core/nostr-connection/testing/fakes/fake-nip46-nostrconnect-starter.ts`

## Change Log

- 2026-05-05: Created Story 1.7 developer context for NIP-46 startup permission minimization and just-in-time permission guardrails.
- 2026-05-05: Implemented NIP-46 minimum startup permission policy, aligned active/restore/bunker capabilities, and added coverage for minimized permission behavior.
