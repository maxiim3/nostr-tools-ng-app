---
stepsCompleted:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/project-context.md
workflowType: 'architecture'
project_name: 'nostr-tools-ng-app'
user_name: 'Maxime'
date: '2026-05-01'
lastStep: 8
status: 'complete'
completedAt: '2026-05-02'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The PRD defines 46 functional requirements across seven major areas:

- Nostr Authentication: users must authenticate through bunker, external signer app, and browser extension flows, with method selection, pending state visibility, recovery, sign-out, and explicit distinction between identity discovery and active signer authorization.
- Session Continuity: valid sessions must survive refreshes, but remembered local state must not be treated as proof of active authentication when signer authorization is expired, revoked, unavailable, or unverifiable.
- Pack Registration: authenticated users can request pack access, eligible users are auto-added, already-in-pack cases are handled idempotently, unauthenticated users are blocked, and all protected actions require valid Nostr authorization.
- Admin Pack Management: admins can view members, identify Toolstr-added users, remove users, verify auto-registration, and access admin capabilities only through enforced authorization.
- User Feedback and Recovery: users must see clear states for pending, success, failure, timeout, cancellation, expired authorization, retry, and recovery without indefinite loading.
- Migration and Knowledge Preservation: critical Speckit-era Nostr auth knowledge must be preserved before Speckit artifacts are removed.
- Scope Control: the current release explicitly excludes account creation, broad onboarding, developer tools, reusable Angular module extraction, PWA support, SEO, and polished public wiki delivery.

Architecturally, the core requirement is not simply "add login." The system needs an explicit authentication model that can represent signer availability, permission, active authorization, restoration, expiry, revocation, cancellation, timeout, and recovery across three signer contexts. Pack registration then depends on that model and must remain protected by signed authorization rather than UI state.

**Non-Functional Requirements:**

The NFRs that will drive architecture are:

- Security: never request, store, transmit, or derive private keys; protected backend actions require valid Nostr authorization; remembered local state is not sufficient proof of authentication; admin authorization must exist in both frontend and backend.
- Reliability: all three supported auth methods must be validated; auth attempts must survive focus changes, app switching, delayed approvals, denials, cancellations, and timeouts; refresh must preserve valid authenticated state only when authorization remains valid.
- Performance: sign-in must not wait on nonessential feed, notification, or broad relay data; pack registration should complete within 2-3 seconds under normal conditions; status transitions should be prompt.
- Accessibility: core auth and pack flows must meet WCAG AA expectations, including keyboard operability, visible focus states, perceivable status messages, and non-color-only state communication.
- UX clarity: every user-visible flow must resolve to an understandable state with a clear next action, avoiding generic indefinite loading or protocol-heavy explanations.
- Brownfield stability: auth changes must not regress existing pack registration, admin removal, or the accepted DaisyUI brutal visual design.

**Scale & Complexity:**

The project complexity is high because the difficult part is distributed auth behavior rather than UI surface area. The MVP has a narrow product scope, but the implementation must coordinate browser APIs, mobile app switching, Nostr signer behavior, NIP-98 protected requests, backend authorization, server-side persistence, and idempotent pack membership.

- Primary domain: full-stack web application with decentralized identity and signer-based authentication
- Complexity level: high
- Estimated architectural components: 8-10 major components or subsystems

Likely architectural components include:

- Authentication domain model and state machine
- Signer method adapters for browser extension, external signer app, and bunker
- Session restoration and authorization validation service
- NIP-98 request signing / authorization boundary
- Pack registration application service
- Backend API authorization and membership orchestration
- Supabase persistence adapter on the server side
- Admin authorization and pack management flow
- UI state components for identity, pending, recovery, pack join, and redirect
- Knowledge preservation/documentation output area

### Technical Constraints & Dependencies

Known constraints and dependencies:

- Angular 21 with standalone components, signals, strict TypeScript, and OnPush change detection.
- Frontend state should use signals and computed state where appropriate.
- Page components should remain thin and must not contain raw relay, NDK, or Supabase logic.
- Existing project structure follows feature-first pseudo-DDD: domain, application, infrastructure, presentation.
- Bun powers the backend API through `server.mjs`.
- Supabase persistence is server-side only; Angular must not access Supabase directly.
- Protected frontend-to-backend calls must include NIP-98 authorization generated from the current Nostr signer.
- Admin checks exist in both frontend and backend; UI-only authorization is insufficient.
- The backend should remain stateless with protected actions signed request-by-request.
- Nostr dependencies include `nostr-tools`, `@nostr-dev-kit/ndk`, and `@nostr-dev-kit/ndk-cache-dexie`.
- UX must preserve the current Tailwind CSS / DaisyUI brutal theme and avoid broad visual redesign.
- The MVP is desktop-first with required mobile compatibility, especially for external signer app switching and return-to-app behavior.
- Private-key login should not be a primary visible path and, if retained, should be advanced/fallback only.

### Cross-Cutting Concerns Identified

The following concerns will affect multiple architectural components:

- Explicit auth state modeling across identity, signer availability, permission, active authorization, restoration, expiry, revocation, timeout, cancellation, and recovery.
- Durable in-progress auth attempts that can survive focus changes, app switching, delayed approval, and page refresh where feasible.
- Separation between user-visible session state and cryptographic/signer authorization validity.
- NIP-98 signing as the boundary for protected backend actions.
- Backend enforcement for pack registration and admin capabilities.
- Idempotent pack registration and already-in-pack handling.
- Avoiding direct Supabase access from Angular.
- Keeping sign-in independent from nonessential relay/feed/profile data loading.
- Clear UI state projection from auth/application state without embedding protocol logic in components.
- Accessibility of pending, success, failure, recovery, and redirect states.
- Preservation of existing visual design and pack flow while improving reliability.
- Knowledge preservation before removing Speckit-era artifacts.

## Starter Template Evaluation

### Primary Technology Domain

The primary technology domain is a brownfield full-stack web application:

- Frontend: Angular 21 single-page web application
- Runtime/package manager: Bun
- Backend: Bun API through `server.mjs`
- Persistence: Supabase server-side only
- Domain: Nostr authentication, signer authorization, NIP-98 protected requests, and pack membership management

This is not a greenfield project. The architecture should preserve the existing Angular/Bun foundation and make targeted decisions for authentication reliability, backend authorization, and pack registration.

### Starter Options Considered

**Angular CLI `ng new`**

Current Angular documentation identifies `ng new <project-name>` as the standard local starter path for new Angular projects. It creates an Angular workspace and initial application, and Angular v21 documentation confirms standalone components are the default.

This starter is appropriate for new Angular apps, but not for this project because the workspace already exists and already includes the necessary Angular, TypeScript, build, lint, test, and styling foundation.

**Third-party Angular boilerplates**

No third-party Angular boilerplate should be introduced for this release. The project already has a more specific stack than a generic starter would provide: Angular 21, Bun, Tailwind/DaisyUI, Transloco, Nostr/NDK, NIP-98, Bun API, and server-side Supabase.

Introducing a boilerplate would increase migration risk and would not solve the real architectural problem, which is explicit auth state modeling and protected pack-registration orchestration.

**Full-stack starters such as Next.js/T3/Remix/SvelteKit**

These are not suitable because the product is already implemented in Angular and the project context explicitly requires Angular conventions. Switching full-stack frameworks would be unrelated to the MVP requirement and would risk regressions in the accepted UI and existing pack-registration flow.

### Selected Starter: Existing Brownfield Angular/Bun Foundation

**Rationale for Selection:**

The selected foundation is the current project rather than a new starter template.

This preserves the existing architectural choices that are already aligned with the PRD:

- Angular 21 standalone components
- Strict TypeScript
- Signals for local state
- Feature-first pseudo-DDD organization
- Bun as package manager and API runtime
- Tailwind CSS and DaisyUI brutal theme
- Vitest-based Angular testing
- Nostr/NDK dependencies already installed
- Supabase kept server-side
- Existing repo scripts for verification and quality gates

The MVP's risk is not starter setup. The risk is inconsistent implementation of Nostr authentication, session restoration, NIP-98 authorization, backend membership orchestration, and UI state projection. Architecture should focus there.

**Initialization Command:**

No project initialization command should be run.

```bash
# Not applicable: continue from the existing Angular/Bun project.
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**

The project uses TypeScript with strict compiler settings, Angular strict templates, Angular 21, and Bun as package manager/API runtime. These should remain fixed for the MVP.

**Styling Solution:**

The project uses Tailwind CSS 4 and DaisyUI 5. The UX specification locks the current DaisyUI brutal visual foundation for MVP work, so architecture should preserve existing visual conventions and avoid broad redesign decisions.

**Build Tooling:**

The Angular application uses `@angular/build:application` through Angular CLI scripts. Verification should use the repository scripts in `package.json`, especially `bun run check`, `bun run build`, `bun run test`, `bun run lint`, `bun run lint:css`, and `bun run typecheck`.

**Testing Framework:**

The project uses Angular's unit-test builder with Vitest. Architecture should plan for tests around auth state transitions, signer adapters, NIP-98 request signing, backend authorization, pack registration idempotency, and UI state projection.

**Code Organization:**

The project context establishes a feature-first pseudo-DDD layout:

- `domain` for pure business types and rules
- `application` for use cases, orchestration, and ports
- `infrastructure` for Nostr/NDK, relay, serialization, browser, HTTP, and persistence adapters
- `presentation` for Angular pages/components
- `shared` only for genuinely reusable primitives or simple cross-cutting helpers

This organization should be the foundation for subsequent architectural decisions.

**Development Experience:**

The existing project already provides local Angular development, Bun API execution, formatting, linting, CSS linting, type checking, tests, and build scripts. New architecture should strengthen implementation consistency through documented boundaries and decision records rather than replacing tooling.

**Note:** Since this is a brownfield project, the first implementation story should not initialize a starter. It should preserve the existing foundation and implement the first architectural slice within the current project structure.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Preserve the existing Angular/Bun/Supabase foundation instead of introducing a new starter or framework migration.
- Model Nostr authentication as an explicit domain state machine, not as scattered UI booleans.
- Keep signer integrations behind infrastructure adapters for browser extension, external signer app, and bunker.
- Treat remembered local identity as restorable context only, not proof of active authentication.
- Require NIP-98 signed authorization for protected backend actions.
- Keep Supabase access server-side only.
- Enforce admin and pack-registration authorization on the backend, not only in Angular.
- Keep pack registration idempotent, including already-in-pack handling.

**Important Decisions (Shape Architecture):**

- Use Angular signals for frontend application/session state projection.
- Keep page components thin and delegate orchestration to application services.
- Keep auth, pack registration, and admin flows organized by domain/application/infrastructure/presentation boundaries.
- Keep sign-in completion independent from nonessential profile/feed/relay loading.
- Preserve the Tailwind/DaisyUI brutal visual foundation and focus UI work on state clarity.
- Use repository scripts for verification and quality gates.

**Deferred Decisions (Post-MVP):**

- Reusable Angular auth module extraction.
- Installable PWA support.
- Broad Nostr onboarding/account creation.
- SEO/public discoverability.
- Public Karpathy-style wiki polish.
- Long-term browser retrocompatibility beyond Angular v21 baseline.
- Rich post-join discovery, feed, chat, trust score, or suggested follows.

### Data Architecture

**Decision: Supabase remains the persistence layer, accessed only by the backend.**

Supabase is already part of the project and should remain server-side only. Angular must never read or write Supabase directly, and Supabase service-role or secret keys must never be exposed to browser code.

**Rationale:**

This preserves the existing security boundary and aligns with the project context. The browser authenticates through Nostr signers and sends protected requests to the Bun API; the backend validates authorization and performs persistence.

**Affects:**

- Pack registration
- Admin pack management
- Membership status checks
- Toolstr-added user tracking
- Backend API authorization

**Decision: Data modeling should separate membership state from auth/session state.**

Authentication state is frontend/application runtime state. Pack membership is backend-persisted state. The architecture should not persist "logged in" as an application session in Supabase for this MVP.

**Rationale:**

The current auth model is stateless from the backend perspective: protected actions are signed request-by-request. Persisting a backend session would add complexity and contradict the PRD unless explicitly designed later.

**Decision: Migrations remain explicit Supabase migrations.**

Schema changes should be represented as Supabase migrations and validated through existing project scripts and Supabase review practices.

### Authentication & Security

**Decision: Use an explicit Nostr authentication state machine.**

Authentication should be represented as a finite set of states covering at least:

- Disconnected
- Detecting signer
- Awaiting permission
- Awaiting external signer approval
- Awaiting bunker approval
- Connected
- Restoring
- Expired
- Revoked or unavailable
- Cancelled
- Timed out
- Failed
- Recoverable retry

**Rationale:**

The PRD's hardest requirement is not method selection; it is consistent behavior across refresh, app switching, permission prompts, delayed approvals, cancellation, expiration, and recovery. A state machine gives AI agents one shared model instead of ad hoc conditionals.

**Decision: Use signer adapters per auth method.**

Browser extension, external signer app, and bunker authentication should each be implemented as infrastructure adapters behind a common application-facing port.

**Rationale:**

Each method has different mechanics and failure modes, but the rest of the app should consume consistent auth outcomes. This prevents page components from containing raw NDK, relay, extension, or bunker details.

**Decision: Local restored state is not proof of active auth.**

Local storage or cached identity may be used to attempt restoration, but the app must not treat the user as actively authenticated unless signer authorization semantics can be validated for the current action.

**Rationale:**

The PRD explicitly requires that refresh restoration preserve valid sessions but avoid false signed-in states after expiry, revocation, removal, or unavailable signer access.

**Decision: Protected backend actions require NIP-98 authorization.**

Pack registration and admin-protected calls must include NIP-98 authorization generated from the current Nostr signer.

**Rationale:**

This preserves the stateless backend model and prevents UI-only authorization from becoming a security boundary.

**Decision: Private-key login is not a primary architecture path.**

If retained at all, private-key login should be an advanced fallback hidden from the default user flow.

**Rationale:**

The UX spec prefers safe signer patterns and avoids encouraging users to expose raw private keys.

### API & Communication Patterns

**Decision: Keep the Bun API as the backend boundary.**

Angular communicates with the Bun API for protected application operations. The backend owns Supabase access, membership persistence, and authoritative authorization checks.

**Rationale:**

This matches the current architecture and prevents direct browser-to-Supabase coupling.

**Decision: Use request/response APIs for MVP pack registration and admin flows.**

REST-style endpoints are sufficient for the MVP. No GraphQL, WebSocket, or realtime API is required for authentication or pack registration.

**Rationale:**

The MVP does not require collaborative realtime data or live feed behavior. The core interactions are connect, join, check status, remove member, and recover from errors.

**Decision: Standardize API errors around user-actionable categories.**

Backend/application errors should map cleanly to UI states:

- Unauthorized or invalid signature
- Signer unavailable
- Authorization expired
- Already in pack
- Join failed
- Admin forbidden
- Retryable server failure
- Non-retryable validation failure

**Rationale:**

The UX requires concise recovery states and no indefinite loading. Error categories should support UI decisions without exposing protocol-heavy details by default.

### Frontend Architecture

**Decision: Use Angular signals for auth/session state projection.**

Application services should expose readonly signals or computed state for presentation components. Writable state remains private to the owning service.

**Rationale:**

This follows Angular v21 guidance and project rules. Signals integrate cleanly with OnPush components and make UI state derivation explicit.

**Decision: Keep components presentation-focused.**

Pages and components should display state and call application services. They must not contain raw signer, relay, NDK, NIP-98, Supabase, or backend authorization logic.

**Rationale:**

This preserves the existing pseudo-DDD boundary and prevents inconsistent auth behavior across pages.

**Decision: Use focused UX state components, not a broad redesign.**

The UI architecture should support:

- Auth method selector
- Signed-in identity summary
- Signer pending status
- Session restore status
- Pack join status
- Minimal recovery message

**Rationale:**

The UX spec locks the visual foundation and asks for reliability/state clarity rather than broad UI redesign.

**Decision: Sign-in completion must not depend on nonessential data.**

Authentication should complete as soon as signer authorization is established. Profile, relay, feed, notification, or discovery data must not block sign-in.

**Rationale:**

This directly supports the PRD's performance and reliability goals.

### Infrastructure & Deployment

**Decision: Keep current local and verification workflow.**

Use existing package scripts:

- `bun run check`
- `bun run build`
- `bun run test`
- `bun run lint`
- `bun run lint:css`
- `bun run typecheck`
- `bun run fix`

**Rationale:**

The project already defines quality gates. Architecture should reinforce these scripts rather than introduce parallel tool commands.

**Decision: Deployment architecture remains unchanged for MVP unless implementation exposes a concrete blocker.**

No new hosting, containerization, serverless, or CI/CD decision is required to implement the MVP architecture.

**Rationale:**

The PRD scope is authentication reliability and pack registration stability, not infrastructure migration.

**Decision: Logging should support auth and registration diagnosis without exposing secrets.**

Backend logs should include enough context to diagnose NIP-98 validation, membership operations, and admin authorization failures, but never log private keys, service-role keys, secrets, raw authorization tokens, or sensitive signer material.

### Decision Impact Analysis

**Implementation Sequence:**

1. Define the auth domain state model and transition rules.
2. Define application ports for signer adapters and authorization signing.
3. Implement or refactor browser extension, external signer, and bunker adapters behind those ports.
4. Implement session restoration semantics using remembered identity only as restorable context.
5. Ensure NIP-98 signing is the protected backend request boundary.
6. Refactor pack registration to depend on valid signed authorization and handle already-in-pack idempotently.
7. Keep backend Supabase operations authoritative and server-only.
8. Project auth and pack states into focused Angular UI components.
9. Add tests for state transitions, signer adapter outcomes, NIP-98 authorization, backend membership behavior, and UI recovery states.

**Cross-Component Dependencies:**

- UI state depends on application auth state, not raw signer details.
- Pack registration depends on active authorization and backend validation, not UI signed-in display.
- Session restoration depends on signer authorization semantics, not stored local identity alone.
- Admin UI depends on frontend admin checks for affordances, but backend checks remain authoritative.
- Supabase schema and membership state are accessed only through backend application logic.
- Error categories must align across signer adapters, application services, backend responses, and UI recovery messages.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**

12 areas where AI agents could make different choices:

- Auth state names and transition ownership
- Signer adapter boundaries
- Session restoration semantics
- NIP-98 request authorization placement
- Backend API endpoint naming
- API response and error formats
- Supabase table/column naming
- Angular file and component naming
- Feature directory placement
- Loading/pending/recovery state handling
- Logging and secret redaction
- Test placement and coverage boundaries

### Naming Patterns

**Database Naming Conventions:**

Use PostgreSQL/Supabase-friendly snake_case names.

- Tables: plural snake_case, for example `pack_members`, `pack_join_requests`
- Columns: snake_case, for example `pubkey`, `npub`, `created_at`, `added_by_toolstr`
- Foreign keys: `<referenced_entity>_id`, for example `pack_id`
- Indexes: `idx_<table>_<column_or_purpose>`, for example `idx_pack_members_pubkey`
- Unique constraints: `<table>_<column_or_purpose>_key`, for example `pack_members_pubkey_key`

Agents must not introduce camelCase database columns unless integrating with an already-existing schema that uses them.

**API Naming Conventions:**

Use REST-style resource paths with kebab-case only when multiple words are needed.

- Collection endpoints use plural nouns: `/api/pack-members`
- Action endpoints use clear resource actions only when a pure resource model is awkward: `/api/pack-members/join`
- Admin endpoints are grouped under `/api/admin/...`
- Route parameters use colon style in route definitions: `/api/pack-members/:pubkey`
- Query parameters use camelCase in frontend-facing APIs: `?includeStatus=true`
- Custom headers use standard HTTP casing: `Authorization`, `Content-Type`

Protected endpoints must require NIP-98 authorization in the `Authorization` header unless an existing project convention specifies a narrower exception.

**Code Naming Conventions:**

Use Angular/TypeScript conventions already established by the project.

- Files: kebab-case with role suffixes, for example `auth-state.service.ts`, `pack-join-status.component.ts`
- Components/classes/types: PascalCase, for example `AuthMethodSelectorComponent`, `AuthSessionState`
- Functions/variables: camelCase, for example `restoreSession`, `currentPubkey`
- Constants: SCREAMING_SNAKE_CASE only for true constants, for example `AUTH_RESTORE_TIMEOUT_MS`
- Signals: name by represented state, not implementation, for example `authState`, `isConnected`, `canJoinPack`
- Private writable signals: prefix with `_`, expose readonly/computed public signals, for example `_authState` and `authState`

Auth state names must use a single shared union/type rather than duplicated string literals in components.

### Structure Patterns

**Project Organization:**

Use feature-first pseudo-DDD boundaries.

- `domain`: pure business types, state unions, value objects, transition rules, and validators
- `application`: use cases, orchestration services, ports/interfaces, state projection services
- `infrastructure`: Nostr/NDK adapters, browser extension adapters, external signer adapters, bunker adapters, HTTP adapters, persistence adapters
- `presentation`: Angular pages/components/dialogs/status UI
- `shared`: only reusable primitives, simple helpers, tokens, or cross-cutting types

Agents must not put raw NDK, relay, NIP-98, Supabase, or signer-specific logic in Angular page components.

**File Structure Patterns:**

Co-locate tests with implementation files.

- Unit tests: `*.spec.ts` next to the implementation
- Domain tests: next to pure domain files, no Angular TestBed
- Application service tests: use fake ports/signers
- Presentation tests: focus on visible states and user interactions
- Backend tests: cover authorization, membership idempotency, and error mapping where test infrastructure exists

Feature-specific helpers stay inside the feature. Only move code to `shared` after at least two real feature consumers exist.

### Format Patterns

**API Response Formats:**

Use direct success payloads for successful responses and a consistent error object for failures.

Successful response examples:

```json
{
  "status": "joined",
  "pubkey": "abc123",
  "redirectUrl": "https://following.space/..."
}
```

```json
{
  "status": "already_in_pack",
  "pubkey": "abc123",
  "redirectUrl": "https://following.space/..."
}
```

Error response format:

```json
{
  "error": {
    "code": "authorization_expired",
    "message": "Reconnect to continue.",
    "recoverable": true
  }
}
```

Error codes must be stable snake_case strings. User-facing `message` values must be concise and safe to display. Do not expose raw stack traces, Supabase errors, service-role details, raw NIP-98 tokens, or signer secrets.

**Data Exchange Formats:**

- JSON fields exposed to Angular use camelCase.
- Database columns remain snake_case.
- Dates in APIs use ISO 8601 strings.
- Booleans use JSON booleans, not `0`/`1`.
- Missing optional values should be omitted or `null` consistently based on existing API style; do not use empty strings as null substitutes.
- Nostr public keys should preserve a clear naming distinction: `pubkey` for hex public keys, `npub` for bech32 display/identifier values.

### Communication Patterns

**Event System Patterns:**

No broad event bus is required for the MVP.

When domain/application events are useful, name them as past-tense facts:

- `authAttemptStarted`
- `authApprovalTimedOut`
- `authSessionRestored`
- `authAuthorizationExpired`
- `packJoinSucceeded`
- `packAlreadyJoined`
- `packJoinFailed`

Event payloads should contain domain identifiers and state context, not UI components or raw adapter instances.

Example:

```ts
type AuthApprovalTimedOut = {
  type: 'authApprovalTimedOut';
  method: 'browserExtension' | 'externalSigner' | 'bunker';
  attemptId: string;
};
```

**State Management Patterns:**

Auth/session state must be represented by explicit unions or typed state objects, not loose boolean combinations.

Good:

```ts
type AuthState =
  | { status: 'disconnected' }
  | { status: 'awaitingExternalSignerApproval'; attemptId: string }
  | { status: 'connected'; pubkey: string }
  | { status: 'expired'; reason: 'authorizationExpired' };
```

Avoid:

```ts
isConnected = true;
isLoading = false;
hasError = true;
```

State transitions should be centralized in domain/application logic. Components should render states and trigger commands, not calculate auth semantics.

Writable signals remain private. Public state is readonly or computed.

### Process Patterns

**Error Handling Patterns:**

Use layered error handling:

- Infrastructure adapters translate low-level failures into typed application outcomes.
- Application services map outcomes to domain/application states.
- Presentation components render concise recovery messages from state.
- Backend endpoints return stable error codes and safe messages.

Standard recoverable categories:

- `signer_unavailable`
- `approval_cancelled`
- `approval_timed_out`
- `authorization_expired`
- `authorization_invalid`
- `already_in_pack`
- `join_failed_retryable`
- `admin_forbidden`
- `validation_failed`

Agents must not show raw protocol, Supabase, stack trace, or NDK errors directly to users.

**Loading State Patterns:**

Avoid generic loading states for auth and pack operations. Loading/pending states must name what is happening.

Use explicit statuses:

- `detectingSigner`
- `awaitingBrowserExtensionApproval`
- `awaitingExternalSignerApproval`
- `awaitingBunkerApproval`
- `restoringSession`
- `joiningPack`
- `redirectingToPack`

Every pending state must have one of:

- A success transition
- A failure transition
- A cancellation path
- A timeout/recovery path

Do not leave auth or pack registration in indefinite loading.

### Enforcement Guidelines

**All AI Agents MUST:**

- Keep signer, NDK, NIP-98, and Supabase details out of Angular page components.
- Use the shared auth state type for all auth/session UI and orchestration.
- Treat local restored identity as restorable context only, never as proof of active authentication.
- Require signed authorization for protected backend actions.
- Keep Supabase access server-side only.
- Use stable API error codes and map them to concise recovery states.
- Use co-located `*.spec.ts` tests for new or changed domain/application behavior.
- Run repository scripts, not underlying tools directly, when verifying changes.

**Pattern Enforcement:**

- Verify frontend boundaries through code review: no page component should import NDK, Supabase clients, or low-level signer adapter internals.
- Verify auth consistency by checking all UI states derive from the shared auth/session model.
- Verify API consistency by checking every failure response follows `{ error: { code, message, recoverable } }`.
- Verify Supabase safety by checking no Angular code references Supabase secret/service-role keys or writes directly to Supabase.
- Pattern violations should be corrected in the implementation story where they appear.
- Update this architecture document or project context when a new pattern becomes necessary.

### Pattern Examples

**Good Examples:**

A page component calls an application service:

```ts
joinPack(): Promise<void> {
  return this.packRegistration.joinCurrentUser();
}
```

An application service depends on ports:

```ts
type SignedRequestPort = {
  createAuthorization(input: SignedRequestInput): Promise<string>;
};
```

A backend endpoint returns a stable recoverable error:

```json
{
  "error": {
    "code": "authorization_expired",
    "message": "Reconnect to continue.",
    "recoverable": true
  }
}
```

A UI component renders explicit state:

```html
@if (authState().status === 'awaitingExternalSignerApproval') {
<p>Approve the connection in your signer app.</p>
}
```

**Anti-Patterns:**

Do not put signer logic in a page:

```ts
// Avoid: page component directly manipulates NDK/signers.
const signer = new NDKNip07Signer();
```

Do not treat cached identity as authenticated:

```ts
// Avoid: local profile is not proof of authorization.
isConnected.set(Boolean(localStorage.getItem('pubkey')));
```

Do not expose Supabase from Angular:

```ts
// Avoid: browser code must not write pack membership.
supabase.from('pack_members').insert(...);
```

Do not use ambiguous loading:

```ts
// Avoid: user and agents cannot know what is pending.
isLoading.set(true);
```

Do not return unstable backend errors:

```json
{
  "message": "Something went wrong"
}
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
nostr-tools-ng-app/
├── package.json
├── bun.lock
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── eslint.config.js
├── stylelint.config.js
├── .prettierrc.json
├── .postcssrc.json
├── railway.json
├── server.mjs
├── server.test.mjs
├── supabase/
│   ├── README.md
│   └── migrations/
│       └── 001_francophone_pack_members.sql
├── specs/
│   └── project/
│       ├── queue.md
│       ├── roadmap.md
│       ├── milestones.md
│       ├── features/
│       │   ├── 001-auto-admit-pack-members/
│       │   ├── 002-session-restore/
│       │   ├── 003-extension-auth-loading/
│       │   ├── 004-advanced-bunker-mode/
│       │   ├── 005-mobile-auth-stability/
│       │   ├── 006-async-button-pattern/
│       │   ├── 007-permission-minimization/
│       │   ├── 008-mobile-auth-states/
│       │   ├── 009-bunker-permission-grants/
│       │   ├── 010-follower-merge/
│       │   └── 011-francophone-pack-feed/
│       └── support/
├── _bmad-output/
│   ├── project-context.md
│   └── planning-artifacts/
│       ├── prd.md
│       ├── ux-design-specification.md
│       └── architecture.md
└── src/
    ├── main.ts
    ├── index.html
    ├── styles.css
    ├── assets/i18n/
    │   ├── en.json
    │   ├── es.json
    │   └── fr.json
    ├── app/
    │   ├── app.ts
    │   ├── app.spec.ts
    │   ├── app.config.ts
    │   ├── app.routes.ts
    │   └── app.routes.spec.ts
    ├── core/
    │   ├── config/
    │   ├── i18n/
    │   ├── layout/presentation/components/
    │   ├── nostr/domain/
    │   ├── nostr/application/
    │   ├── nostr/infrastructure/
    │   ├── nostr-connection/domain/
    │   ├── nostr-connection/application/
    │   ├── nostr-connection/infrastructure/
    │   └── zap/
    ├── shared/presentation/components/
    └── features/
        ├── admin/presentation/pages/
        ├── home/presentation/pages/
        ├── legal/presentation/pages/
        └── packs/
            ├── domain/
            ├── application/
            └── presentation/
                ├── components/
                ├── guards/
                └── pages/
```

### Architectural Boundaries

**API Boundaries:**

The Bun API in `server.mjs` is the only backend boundary for protected application operations.

- Angular calls `server.mjs` endpoints for pack membership, admin actions, and any operation requiring persistence.
- `server.mjs` validates NIP-98 authorization before protected operations.
- `server.mjs` owns Supabase access.
- Angular must not import Supabase clients or use Supabase credentials.
- Backend errors must follow the stable error format defined in the implementation patterns section.

Expected API boundary groups:

- Pack membership: `/api/pack-members`, `/api/pack-members/join`, or existing equivalent endpoints.
- Admin pack management: `/api/admin/...`.
- Health/debug endpoints, if any, must not expose secrets or signed authorization contents.

**Component Boundaries:**

Angular presentation components render state and trigger application service commands.

- `src/core/layout/presentation/components/app-auth-modal.component.ts` owns auth modal presentation, not signer protocol mechanics.
- `src/features/packs/presentation/pages/*` owns pack-page presentation, not NIP-98 signing or Supabase writes.
- `src/features/admin/presentation/pages/*` owns admin UI presentation, not backend authorization.
- Shared UI primitives live in `src/shared/presentation/components/` only when genuinely reusable.

Components may depend on application services, readonly signals, computed signals, pipes, and UI primitives. Components must not depend directly on infrastructure adapters.

**Service Boundaries:**

Application services orchestrate use cases and expose presentation-ready state.

- `src/core/nostr-connection/domain/` defines pure connection/session/auth types and rules.
- `src/core/nostr-connection/application/` coordinates connection attempts, session restoration, signer use, and NIP-98 authorization.
- `src/core/nostr-connection/infrastructure/` contains NDK, NIP-07, NIP-46, bunker, and browser-specific adapter details.
- `src/features/packs/application/` owns pack registration and membership orchestration from the frontend perspective.
- `src/features/packs/domain/` owns pack-specific pure rules and configuration.
- `src/features/packs/presentation/guards/` owns frontend route/access affordances only; backend remains authoritative.

**Data Boundaries:**

Pack membership data is persisted through Supabase and accessed only by the backend.

- Supabase schema lives in `supabase/migrations/`.
- Database names use snake_case.
- API payloads exposed to Angular use camelCase.
- Auth/session state is runtime application state and should not be modeled as a persisted backend session for MVP.
- Local remembered identity may support restoration but is not proof of active authorization.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

Nostr Authentication, Session Continuity, Mobile Auth Stability, Extension Auth Loading, Advanced Bunker Mode, Permission Grants:

- Domain: `src/core/nostr-connection/domain/`
- Application: `src/core/nostr-connection/application/`
- Infrastructure: `src/core/nostr-connection/infrastructure/`
- Presentation: `src/core/layout/presentation/components/app-auth-modal.component.ts`
- Tests: co-located `*.spec.ts` files in the same directories

Pack Registration and Auto-Admit Pack Members:

- Domain: `src/features/packs/domain/`
- Application: `src/features/packs/application/`
- Presentation: `src/features/packs/presentation/pages/`
- Backend: `server.mjs`
- Persistence: `supabase/migrations/001_francophone_pack_members.sql`
- Tests: co-located frontend specs plus `server.test.mjs`

Admin Pack Management:

- Presentation: `src/features/admin/presentation/pages/`
- Frontend guard: `src/features/packs/presentation/guards/francophone-admin.guard.ts`
- Backend authorization: `server.mjs`
- Persistence: Supabase migrations and backend data access
- Tests: `pack-admin-requests.page.spec.ts`, `francophone-admin.guard.spec.ts`, `server.test.mjs`

User Feedback and Recovery:

- Auth modal/status UI: `src/core/layout/presentation/components/app-auth-modal.component.ts`
- Pack status UI: `src/features/packs/presentation/pages/pack-request.page.*`
- State model: `src/core/nostr-connection/domain/`
- Error mapping: application services and `server.mjs`

Migration and Knowledge Preservation:

- Active project source of truth: `specs/project/`
- BMAD planning output: `_bmad-output/planning-artifacts/`
- Project context: `_bmad-output/project-context.md`
- Architecture decisions: `_bmad-output/planning-artifacts/architecture.md`

**Cross-Cutting Concerns:**

NIP-98 authorization:

- Frontend signing/application boundary: `src/core/nostr-connection/application/nip98-http-auth.service.ts`
- Backend validation boundary: `server.mjs`
- Domain type support: `src/core/nostr-connection/domain/http-auth.ts`

Nostr session state:

- Current service bridge: `src/core/nostr/application/nostr-session.service.ts`
- Connection-specific state: `src/core/nostr-connection/`
- Future implementation should avoid duplicating session truth across both areas without a clear adapter or migration plan.

Internationalization:

- Translations: `src/assets/i18n/*.json`
- Loader/service: `src/core/i18n/`
- UI copy changes must update the relevant translation files.

Testing:

- Frontend unit/component tests are co-located `*.spec.ts`.
- Backend tests live in `server.test.mjs`.
- Domain logic should be tested without Angular TestBed.
- Application orchestration should use fake ports/signers.
- UI tests should assert user-visible state, controls, and service interaction.

### Integration Points

**Internal Communication:**

- Presentation calls application services.
- Application services depend on domain types and infrastructure ports/adapters.
- Infrastructure adapters call NDK, browser signer APIs, relay-related functions, or HTTP APIs.
- Backend API receives signed requests and performs Supabase operations.
- Translation keys flow from presentation templates/components to `src/assets/i18n`.

**External Integrations:**

- Nostr browser extension/NIP-07 via `src/core/nostr-connection/infrastructure/nip07-provider.ts`.
- NIP-46 bunker and Nostr Connect via `src/core/nostr-connection/infrastructure/`.
- NDK via infrastructure adapters only.
- Supabase via `server.mjs` only.
- `following.space` redirect after pack join success.
- Transloco via `src/core/i18n/`.

**Data Flow:**

1. User opens pack page.
2. Presentation reads auth/session state from application services.
3. User starts auth through the auth modal.
4. Application orchestration selects the signer method adapter.
5. Infrastructure adapter performs extension, external signer, or bunker interaction.
6. Application service transitions auth/session state.
7. User triggers pack join.
8. Frontend application service creates NIP-98 authorization through the active signer.
9. Angular sends protected request to Bun API.
10. Bun API validates authorization and admin/pack rules.
11. Bun API reads/writes Supabase.
12. API returns success or stable error code.
13. Presentation renders joined, already-in-pack, retry, expired, or redirect state.

### File Organization Patterns

**Configuration Files:**

Root-level configuration remains at project root:

- Angular workspace: `angular.json`
- TypeScript: `tsconfig*.json`
- ESLint: `eslint.config.js`
- Stylelint: `stylelint.config.js`
- Prettier: `.prettierrc.json`
- PostCSS/Tailwind pipeline: `.postcssrc.json`
- Railway deployment: `railway.json`
- Package scripts and dependencies: `package.json`

Application runtime configuration belongs in focused files:

- App configuration: `src/app/app.config.ts`
- Routes: `src/app/app.routes.ts`
- Project metadata: `src/core/config/project-info.ts`
- Relay config: `src/core/nostr/infrastructure/relay.config.ts`
- Pack config: `src/features/packs/domain/francophone-pack.config.ts`

**Source Organization:**

Use `src/core/` for cross-feature application capabilities and `src/features/` for product features.

- `core/nostr-connection` is the home for auth/session/connection mechanics.
- `core/nostr` remains for broader Nostr client/session/follow capabilities.
- `features/packs` owns pack-specific product behavior.
- `features/admin` owns admin presentation and should delegate authority to backend APIs.
- `shared` remains small and reusable only.

**Test Organization:**

Tests stay co-located.

- `*.spec.ts` for Angular/domain/application tests.
- `server.test.mjs` for Bun API tests.
- No separate broad `tests/` tree unless a future E2E framework is intentionally introduced.

**Asset Organization:**

- Static global styles: `src/styles.css`
- HTML entry: `src/index.html`
- Translation assets: `src/assets/i18n/`
- Static images/assets should remain under `src/assets/` and use Angular image guidance when rendered as static images.

### Development Workflow Integration

**Development Server Structure:**

- Angular app runs through `bun run start`.
- Bun API runs through `bun run api`.
- Frontend/backend integration should preserve the API boundary rather than bypassing it in Angular.

**Build Process Structure:**

- Angular build uses `bun run build`.
- Type checking uses `bun run typecheck`.
- Full verification uses `bun run check`.
- Formatting/lint fixes use `bun run fix`.
- Agents must use repo scripts rather than direct underlying tools.

**Deployment Structure:**

- `railway.json` defines deployment integration.
- `server.mjs` remains the backend entry point.
- Angular build output is produced by the Angular build pipeline.
- Supabase migrations remain in `supabase/migrations/`.
- Deployment changes are deferred unless implementation exposes a concrete blocker.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

The architectural decisions are compatible and mutually reinforcing.

The chosen foundation remains the existing Angular 21/Bun/Supabase/Nostr stack. This aligns with the brownfield project context and avoids framework migration risk. Angular signals, standalone components, OnPush change detection, strict TypeScript, Tailwind/DaisyUI, Transloco, Bun API, and server-side Supabase are already present and compatible with the requirements.

The auth architecture decisions form a coherent model:

- Nostr auth is represented as explicit state, not scattered UI booleans.
- Signer mechanics are isolated behind infrastructure adapters.
- Application services orchestrate auth, restoration, NIP-98 signing, and pack actions.
- Presentation components render state and trigger commands.
- Backend endpoints remain authoritative for protected operations.
- Supabase remains server-side only.

No contradictory decisions were found.

**Pattern Consistency:**

The implementation patterns support the decisions.

Naming conventions align with the selected technologies:

- Database: snake_case for Supabase/Postgres.
- API payloads: camelCase for Angular-facing JSON.
- Code: Angular/TypeScript naming with kebab-case files and PascalCase types/classes.
- Error codes: stable snake_case strings.

The state-management patterns directly support the core auth decision by requiring explicit union/state objects instead of ambiguous booleans. Error and loading patterns support UX requirements by requiring actionable states and stable error categories.

**Structure Alignment:**

The project structure supports the architecture.

The existing `src/core/nostr-connection/` area is the correct home for auth/session/connection mechanics. `domain`, `application`, and `infrastructure` subdirectories already match the boundary model.

The `src/features/packs/` area maps cleanly to pack registration and membership requirements. `server.mjs` and `supabase/migrations/` provide the backend and persistence boundary. `src/features/admin/` covers admin presentation while backend authorization remains authoritative.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

All known feature areas are supported by the architecture:

- Auto-admit pack members maps to `features/packs`, `server.mjs`, and Supabase migrations.
- Session restore maps to `core/nostr-connection` domain/application/infrastructure.
- Extension auth loading maps to signer adapters and explicit pending states.
- Advanced bunker mode maps to NIP-46/bunker infrastructure adapters.
- Mobile auth stability maps to durable auth attempts and external signer pending/recovery states.
- Async button patterns map to explicit loading states and UI state components.
- Permission minimization maps to signer adapter boundaries and advanced/private-key fallback rules.
- Mobile auth states map to explicit auth state names and recovery patterns.
- Bunker permission grants map to NIP-46/bunker adapter behavior and restoration semantics.
- Post-MVP follower merge and feed features are deferred and do not conflict with the MVP architecture.

**Functional Requirements Coverage:**

All FR categories from the PRD are architecturally supported:

- Nostr Authentication: covered by explicit auth state, signer method adapters, auth modal presentation, and application orchestration.
- Session Continuity: covered by restoration semantics that treat local identity as restorable context only.
- Pack Registration: covered by pack application services, NIP-98 protected backend requests, backend authorization, and Supabase persistence.
- Admin Pack Management: covered by admin presentation, frontend affordance checks, backend authorization, and server-side persistence.
- User Feedback and Recovery: covered by stable error codes, explicit pending states, and recovery-oriented UI state mapping.
- Migration and Knowledge Preservation: covered by `specs/project/`, `_bmad-output/`, and architecture/project context outputs.
- Scope Control: deferred decisions explicitly exclude PWA, SEO, reusable module extraction, account creation, broad onboarding, and public wiki polish.

**Non-Functional Requirements Coverage:**

Security is covered by:

- No private-key handling as a primary path.
- No Supabase access from Angular.
- No service-role/secret exposure in frontend.
- NIP-98 authorization for protected backend actions.
- Backend enforcement for pack registration and admin actions.
- No local-state-only authentication.

Reliability is covered by:

- Explicit state transitions.
- Signer adapters per auth method.
- Durable pending/recovery state modeling.
- Timeout, cancellation, expired, unavailable, and retry states.
- Idempotent already-in-pack behavior.

Performance is covered by:

- Sign-in completion decoupled from nonessential profile/feed/relay loading.
- Request/response API model for MVP.
- No realtime/feed dependency for auth or pack joining.

Accessibility and UX clarity are covered by:

- Focused state components.
- Concise pending/recovery messages.
- Non-color-only status requirements.
- Existing Tailwind/DaisyUI visual foundation preservation.

### Implementation Readiness Validation ✅

**Decision Completeness:**

Critical decisions are documented with enough specificity for implementation:

- Existing Angular/Bun foundation retained.
- Auth state machine required.
- Signer adapters required.
- NIP-98 boundary defined.
- Supabase server-only boundary defined.
- Backend authorization authority defined.
- Error formats and recovery categories defined.
- Project structure and requirement mappings defined.

**Structure Completeness:**

The structure is specific to the current brownfield repository and maps requirements to actual directories and files. It identifies where auth, pack registration, admin, backend, Supabase, i18n, tests, and planning artifacts belong.

The structure is intentionally not a greenfield skeleton. It documents the existing repository boundaries and where future implementation should extend them.

**Pattern Completeness:**

The patterns cover the main AI-agent conflict points:

- Naming
- API formats
- Error formats
- Auth state modeling
- Loading states
- Component/service boundaries
- Supabase safety
- Test placement
- Logging/secret handling
- Data flow
- Integration points

Concrete good examples and anti-patterns are included.

### Gap Analysis Results

**Critical Gaps:**

None found.

No missing architectural decision currently blocks implementation.

**Important Gaps:**

- The exact final auth state union should be created during implementation and treated as the single source of truth.
- Existing overlap between `src/core/nostr/application/nostr-session.service.ts` and `src/core/nostr-connection/` should be handled carefully to avoid two competing session truths.
- Backend API endpoint names should be aligned with existing `server.mjs` routes during implementation rather than blindly renaming working endpoints.

**Nice-to-Have Gaps:**

- A future E2E test framework could validate real browser/mobile signer flows.
- A future ADR could document final NIP-46 restoration behavior after implementation.
- A future observability/logging guide could standardize production diagnostics.
- A future public wiki can build from preserved `specs/project/support/` materials.

### Validation Issues Addressed

No critical validation issues required architectural changes.

The main validation concern is brownfield duplication risk around session state. The architecture addresses this by requiring a clear boundary: `core/nostr-connection` should own connection/session mechanics, while existing `core/nostr` services should either consume that state or be refactored behind a clear adapter. Agents must not create another independent session source.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**

- Strong alignment with existing brownfield project structure.
- Clear separation between presentation, application, infrastructure, backend, and persistence.
- Explicit handling of the hardest requirement: Nostr auth/session state correctness.
- Security boundaries are concrete and enforceable.
- AI-agent conflict points are documented with examples and anti-patterns.
- Implementation can proceed without framework migration or starter churn.

**Areas for Future Enhancement:**

- Add E2E coverage for real signer flows.
- Document final auth state union once implemented.
- Consider future reusable Angular auth module extraction after MVP stabilization.
- Add production observability guidance after auth/pack flows are stable.
- Expand preserved support knowledge into the future wiki after MVP.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.
- Do not put signer, NIP-98, NDK, or Supabase details in page components.
- Do not treat local cached identity as proof of active authentication.
- Do not introduce a new framework, starter, backend session model, or direct Angular-to-Supabase path without a new architecture decision.

**First Implementation Priority:**

Define or consolidate the shared auth/session state model in `src/core/nostr-connection/domain/`, then refactor orchestration and UI projection around that model before changing pack-registration behavior.
