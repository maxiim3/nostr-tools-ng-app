# Auth Refactor Journal

Date: 2026-04-21
Updated: 2026-04-23
Status: historical

## Role of this document

Ce document est un journal historique du refactor auth initial.

Il sert a comprendre :

- ce qui a ete fait
- dans quel ordre
- avec quels commits

Il ne sert plus de board actif.

Pour le travail en cours, utiliser :

- [../planning/board.md](../planning/board.md)
- [../product/specs/auth-mobile-web.md](../product/specs/auth-mobile-web.md)

## Documentation

- Mission et milestones : [../product/mission.md](../product/mission.md)
- Roadmap produit : [../product/roadmap.md](../product/roadmap.md)
- Architecture : [../architecture/overview.md](../architecture/overview.md)
- Regles agents : [../../AGENTS.md](../../AGENTS.md)
- Regles design connexion : [../references/nostr-auth-rules.md](../references/nostr-auth-rules.md)

## Scope

Migration du legacy auth vers le domaine `nostr-connection`. Les 4 methodes d'auth
(NIP-07, NIP-46 Nostr Connect, NIP-46 Bunker, nsec) fonctionnent et sont testees.

## Completed Work

### Domain foundation

- Domain contracts for connection methods, attempts, sessions, signer capabilities, HTTP auth.
- Domain-level error model and revalidation semantics.

### Connection methods and contracts

- `nip07` connection method (extension).
- `nip46-nostrconnect` connection method (app externe).
- `nip46-bunker` connection method (bunker token).
- Reusable contract tests for methods and signers.

### NIP-46 infrastructure

- Shared NIP-46 NDK helpers (`ndk-nip46-shared.ts`).
- `NdkNip46NostrconnectStarter` + `NdkNip46BunkerStarter`.
- Bunker starter abstraction and fakes for TDD.

### Application orchestration

- `ConnectionFacade` + `NostrConnectionFacadeService` (root singleton).
- `createDefaultConnectionOrchestrator()` wiring all 3 methods.
- Coverage for facade behavior (attempt lifecycle, errors, revalidation, disconnect).

### Phase 1: session integration (done)

- `NostrSessionService` delegates to `NostrConnectionFacadeService`.
- NIP-07: facade handles connection, client sets up NDK signer.
- NIP-46 nostrconnect: facade handles full handshake, NDK signer shared via `ndkSigner` signal.
- NIP-46 bunker: facade handles connection with `connectionToken`, NDK signer shared.
- nsec: temporary direct path (no facade registration).
- `disconnect()` clears both external + bunker timeouts and increments attempt IDs.
- Commit: `29ee192` (`feat: integrate session with connection facade and add bunker auth`).

### Phase 2: auth modal migration (done)

- Auth modal reads state from `NostrSessionService` (facade-backed).
- Bunker token section added with input, waiting state, cancel, retry, timeout.
- `aria-label` on bunker input for WCAG AA.
- i18n keys added for bunker section (fr/en/es).
- 225 tests passing (29 files), `bun run check` green.
- Bunker auth tested and confirmed working end-to-end against a real bunker.
- Commit: `29ee192` (same as Phase 1).

## Current State

- All 4 auth methods work: NIP-07 extension, NIP-46 Nostr Connect, NIP-46 Bunker, nsec.
- `NostrSessionService` is the sole adapter for all consumers.
- `NostrClientService` is now clean: `connectWithPrivateKey()` kept (nsec temporary path), `getHttpAuthSigner()` + `NdkConnectionSignerAdapter` replace legacy `createHttpAuthHeader()`.
- NIP-98 unified: `NostrHttpAuthService` uses `Nip98HttpAuthService` (nostr-connection domain) as single source, with facade signer priority and client fallback.
- Extension flow: facade source of truth, client only does NDK setup via `applyNip07Signer()`.
- Commits: `e52c27d` (route francophone + unify nip98), `4abaa3e` (phase 3 auth cleanup).
- `bun run check` passes (215 tests).

## Follow-up After Initial Migration

### Phase 3: cleanup and hardening (done)

- `NostrClientService` legacy auth orchestration removed (`connectWithExtension()`, `beginExternalAppLogin()`, `completeExternalAppLogin()`, `cancelExternalAppLogin()`).
- Extension flow now uses facade as sole auth source; client only runs `applyNip07Signer()` for NDK setup.
- `nsec` path (`connectWithPrivateKey()`) kept as-is — temporary direct path, not registered in facade.
- NIP-98 unified via `NostrHttpAuthService` (facade signer priority, client fallback).
- Dead code removed; `bun run check` stays green (215 tests).
- Commit: `4abaa3e`

### Phase 4: milestone 1 remaining pages

- Pack landing page (`/packs/francophone`) — done. Root `/` redirects to `/packs/francophone`, same content.
- Admin dashboard members (`/packs/francophone/admin`) — postponed.
- Active auth/mobile follow-up is no longer tracked here. Use the active board and roadmap.

## Known Risks

1. Cross-contamination: if user triggers external app login then bunker login (or vice versa) without cancelling, the facade auto-cancels the first attempt. Pre-existing risk.
2. ~~NIP-07 double NDK instance~~: resolved — extension flow now uses facade as sole auth source; client only calls `applyNip07Signer()` (no duplicate `window.nostr` call).
3. No client-side bunker URL format validation. Facade validates server-side.

## Post-deployment mobile/auth triage - 2026-04-25

Historical snapshot; active tracking remains in [../planning/board.md](../planning/board.md)
and [../product/roadmap.md](../product/roadmap.md).

Context:

- Mobile test performed after deployment.
- Browser extension auth works well and feels more fluid.
- Mobile external app auth correctly offers installed apps, including Amber and Primal.
- Auth and persistence still need hardening before the production flow can be considered stable.

### P0 - Migrate runtime database to Supabase

- Impact: critical.
- Urgency: immediate.
- Effort: M/L.
- Risk: high.
- Uncertainty: medium.
- Dependencies/blockers: Supabase schema, environment variables, backend endpoint migration, deployment configuration.

Problem:

- Current SQLite storage at `.runtime/pack-requests.sqlite` appears non-persistent in deployment.
- A previously submitted pack request was not visible after a new deployment.
- This creates a data-loss risk for users and admins.

Completion criteria:

- Existing endpoints keep the same external behavior: `GET /api/pack-requests/me`, `POST /api/pack-requests`, `GET /api/admin/pack-requests`, `POST /api/admin/pack-requests/:pubkey/approve`, `POST /api/admin/pack-requests/:pubkey/reject`.
- Pack request data survives redeployments.
- Admin access remains protected by NIP-98.
- Required Supabase environment variables are documented.
- Creation, read, approval, and rejection flows are covered by tests or a documented manual verification.

Next action:

- Audit `server.mjs` and the current SQLite scripts, then define the minimal Supabase schema for `pack_requests`.

### P0 - Fix Nostr session persistence after refresh

- Impact: critical.
- Urgency: immediate.
- Effort: M.
- Risk: high.
- Uncertainty: high.
- Dependencies/blockers: NIP-07 behavior, NIP-46 behavior, Amber/Primal authorization behavior, client-side storage, NDK signer restoration.

Problem:

- After a successful connection through either browser extension or mobile external app, refreshing the page loses the connection.
- If the external app grants authorization for five minutes, the web app should keep or revalidate that connection during that window.
- Mobile connection can feel unstable or disconnect too quickly.

Hypotheses to validate:

- The app does not persist enough client-side session information.
- The active signer is not restored or revalidated during app startup.
- The signer authorization is still valid, but the app does not ping/revalidate it correctly.
- The `nostr-connection` lifecycle clears the active state too early.

Completion criteria:

- NIP-07 extension connection survives refresh while the extension authorization is still valid.
- Mobile Amber/Primal connection is restored or revalidated after refresh while authorization is still valid.
- If authorization is expired or denied, the app cleanly returns to a disconnected state with clear UI feedback.
- Desktop extension and mobile external app verification scenarios are documented.

Next action:

- Audit startup and restore behavior in `NostrSessionService`, `NostrConnectionFacadeService`, and the active signer/session lifecycle.

### P1 - Add loading/disabled state to extension auth button

- Impact: high.
- Urgency: short term.
- Effort: S.
- Risk: low.
- Uncertainty: low.
- Dependencies/blockers: current auth modal state and connection attempt state.

Problem:

- Clicking the extension auth button has a visible latency before the extension response and redirect/waiting state.
- The button remains active during this latency and does not provide enough feedback.
- This allows double clicks and makes the flow feel unresponsive.

Completion criteria:

- The extension auth button shows a small loading indicator during the pending attempt.
- The button is disabled while the attempt is pending.
- The loading state is accessible to screen readers.
- The state resets correctly on success, error, cancellation, or timeout.

Next action:

- Identify the auth modal extension button and bind its loading/disabled state to the existing connection attempt state.

### P1 - Define a lightweight generic strategy for loading buttons

- Impact: medium.
- Urgency: short term.
- Effort: M.
- Risk: medium.
- Uncertainty: medium.
- Dependencies/blockers: existing shared UI components and number of async button usages.

Problem:

- Loading feedback is likely needed beyond the extension auth button.
- Duplicating loading/disabled behavior across several buttons would increase UI inconsistency.

Recommended approach:

- First fix the auth modal locally to address the production issue.
- Extract a shared component or directive only if at least three similar async button usages are confirmed.

Completion criteria:

- A consistent pattern exists for `loading`, `disabled`, and accessible labels.
- The loader does not remove the textual label without an accessible alternative.
- Double submission is prevented.
- Styling remains consistent with the existing UI.

Next action:

- After fixing the extension button, inventory similar async buttons: external app auth, bunker auth, request submit, admin approve/reject.

### P1 - Stabilize mobile external app flow with Amber and Primal

- Impact: high.
- Urgency: short term.
- Effort: M.
- Risk: high.
- Uncertainty: high.
- Dependencies/blockers: mobile deep links, signer callbacks, browser return flow, Amber/Primal behavior.

Problem:

- Mobile app opening works and correctly proposes Amber/Primal.
- The flow is fast, but the resulting session is not stable enough.
- It is unclear whether the issue comes from app authorization, callback handling, signer restoration, or web session lifecycle.

Completion criteria:

- Amber mobile flow is manually verified and documented.
- Primal mobile flow is manually verified and documented.
- Waiting, success, refusal, and timeout states are visible and understandable.
- Refresh does not break a still-valid external app authorization.
- Errors are explicit when authorization is refused or expired.

Next action:

- Reproduce on mobile with targeted logs around attempt start, callback handling, active signer state, active session state, and refresh.

### P2 - Update architecture documentation after Supabase migration

- Impact: medium.
- Urgency: after migration.
- Effort: S.
- Risk: low.
- Uncertainty: low.
- Dependencies/blockers: Supabase migration completed and verified.

Problem:

- `architecture.md` currently documents the backend as Bun + SQLite with `.runtime/pack-requests.sqlite`.
- That will become inaccurate after the Supabase migration.

Completion criteria:

- `architecture.md` documents Supabase as the persistent data store.
- This project plan marks the migration as complete.
- Required environment variables are listed.

Next action:

- Update documentation once the Supabase migration is implemented and verified.

## Historical Resume Checklist

Cette checklist etait utile pendant le refactor initial.

Ne plus l'utiliser comme source de travail courante.
Le pilotage actif est maintenant dans [../planning/board.md](../planning/board.md).
