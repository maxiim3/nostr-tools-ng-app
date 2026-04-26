# Tasks

Status: active  
Updated: 2026-04-26

This file is the canonical task board and implementation handoff source.

## Speckit Implementation Checklist

These tasks track the source-of-truth migration itself. Product/runtime tasks remain in the canonical board below and are not implemented by this migration.

- [x] T001 Create canonical `specs/project/` source-of-truth files.
- [x] T002 Extract milestones, roadmap, user stories, features, tasks, references, archive, and validation into `specs/project/`.
- [x] T003 Remove old competing active planning sources under `docs/planning/`, `docs/product/mission.md`, `docs/product/roadmap.md`, `docs/product/specs/`, and `specs/001-project-management-cleanup/`.
- [x] T004 Update `.specify/feature.json`, `AGENTS.md`, root `README.md`, `docs/README.md`, supporting docs, and `src/README.md` to point to `specs/project/`.
- [x] T005 Update Spec Kit templates and constitution language to avoid recreating competing active planning sources.
- [x] T006 Verify ignore-file coverage for the detected Node/TypeScript, Docker, ESLint, and Prettier project setup.
- [x] T007 Record validation results in `specs/project/validation.md`.
- [x] T008 Run `bun run format:check` successfully.

## Lifecycle Definitions

| State       | Meaning                                                                |
| ----------- | ---------------------------------------------------------------------- |
| In Progress | Work currently being executed or validated                             |
| Ready       | Work can start without new product or architecture decisions           |
| Backlog     | Candidate work that needs a dependency, shaping, or prerequisite first |
| Blocked     | Work cannot proceed until a named blocker is resolved                  |
| Done        | Work met acceptance criteria and no longer belongs in active execution |
| Superseded  | Work replaced by another task, decision, feature, or plan              |
| Archived    | Retained for context only                                              |

## Current Board

| Order | Task                                                           | State       | Priority | Feature                         | Dependencies                 | Next Action                                               |
| ----- | -------------------------------------------------------------- | ----------- | -------- | ------------------------------- | ---------------------------- | --------------------------------------------------------- |
| 0     | `AUTH-02` Test mobile restore signer NIP-46 / Nostr Connect    | In Progress | Active   | `F-AUTH-RESTORE`                | none                         | Continue mobile validation and close remaining edge cases |
| 1     | `INFRA-01` Migrate runtime storage to Supabase                 | Ready       | P0       | `F-INFRA-STORAGE`               | none                         | Start implementation with storage boundary work           |
| 2     | `AUTH-07` Restore Nostr session after refresh                  | Ready       | P0       | `F-AUTH-RESTORE`                | none                         | Add failing restore tests, then implement startup restore |
| 3     | `UI-01` Add loader and disabled state to extension auth button | Ready       | P1       | `F-AUTH-LOADING`                | none                         | Add local loading signal and re-entry guard               |
| 4     | `AUTH-05` Make `bunker://` a clearly separate advanced mode    | Ready       | P3       | `F-AUTH-BUNKER`                 | none                         | Review auth modal hierarchy and copy                      |
| 5     | `AUTH-08` Stabilize Amber and Primal mobile flow               | Backlog     | P1       | `F-AUTH-MOBILE`                 | `AUTH-07`                    | Run mobile matrix after restore work                      |
| 6     | `UI-02` Define generic async button strategy                   | Backlog     | P1       | `F-AUTH-LOADING`                | `UI-01`                      | Inventory at least three async button cases               |
| 7     | `DOC-03` Update architecture docs after Supabase               | Backlog     | P2       | `F-INFRA-STORAGE`               | `INFRA-01`                   | Update docs after final storage implementation            |
| 8     | `AUTH-03` Reduce login permissions                             | Backlog     | P2       | `F-AUTH-PERMS`                  | permission-set confirmation  | Inventory requested permissions                           |
| 9     | `AUTH-04` Review mobile auth UX                                | Backlog     | P2       | `F-AUTH-MOBILE`                 | `AUTH-07`, ideally `AUTH-08` | Map current UI states to target mobile auth states        |
| 10    | `AUTH-06` One-shot bunker permissions                          | Blocked     | P3       | `F-AUTH-BUNKER`, `F-AUTH-PERMS` | NDK extension point          | Resolve blocker or mark superseded                        |

## Recently Done

| Task      | State | Outcome                                                                                    |
| --------- | ----- | ------------------------------------------------------------------------------------------ |
| `DOC-01`  | Done  | Clarified role of specs and created active planning document in the old system             |
| `DOC-02`  | Done  | Refactored docs tree by role                                                               |
| `AUTH-01` | Done  | Fixed external app auth flow so the same attempt can continue instead of forcing a restart |

## Task Briefs

### `AUTH-02` Test Mobile Restore Signer NIP-46 / Nostr Connect

State: In Progress  
Priority: Active  
Feature: `F-AUTH-RESTORE`

Outcome:

The mobile flow is valid with Amber Android after push, and the restored signer remains able to sign after return or reload.

Done when:

- Amber Android flow is validated after push.
- Signer restore remains capable of signing after return or reload.
- Any remaining edge cases are recorded as tasks or blocked follow-ups.

Do not change:

- Pack-request storage.
- Backend auth model.
- Broad mobile UX hierarchy unless required by the validation result.

### `INFRA-01` Migrate Runtime Storage To Supabase

State: Ready  
Priority: P0  
Feature: `F-INFRA-STORAGE`  
Estimate: M  
Risk: M

Outcome:

Migrate runtime pack-request storage from local SQLite `.runtime` storage to Supabase without changing public or admin endpoint behavior.

Done when:

- `GET /api/pack-requests/me` keeps current external behavior.
- `POST /api/pack-requests` keeps current external behavior.
- `GET /api/admin/pack-requests` keeps current external behavior.
- Admin approve/reject remain protected by server-side NIP-98 auth.
- Pack-request data survives redeployments.
- Required Supabase environment variables are documented.
- Tests cover API behavior without relying on SQLite internals.

Inspect first:

- `../../server.mjs`
- `../../server.test.mjs`
- `../../README.md`
- `../../docs/architecture/overview.md`
- `../../src/features/packs/README.md`
- `../../pack-requests.schema.sql`
- `../../scripts/db-reset.sh`
- `../../scripts/db-dump.sh`
- `../../scripts/db-restore.sh`

Recommended first step:

Introduce a storage boundary in `server.mjs` around the existing pack-request operations, then convert route handlers to `await` those operations while still backed by SQLite. After that, swap only the storage implementation to Supabase.

Do not change:

- Auth/session behavior.
- Public response contracts unless explicitly decided.
- Approve/reject semantics. Current behavior deletes the row; preserve it for this task.

Dependencies/blockers:

- Supabase project URL.
- Supabase service-role key for the Bun server only.
- Deployment environment variables.

Validation note:

Confirm Supabase credentials are configured in production and smoke test pack-request persistence after deploy and redeploy.

Suggested session prompt:

```text
Pick up task INFRA-01 from specs/project/tasks.md. Implement only this task. Preserve existing pack-request endpoint behavior and admin NIP-98 protection. First inspect server.mjs, server.test.mjs, README.md, docs/architecture/overview.md, and src/features/packs/README.md. Do not change auth/session behavior.
```

### `AUTH-07` Restore Nostr Session After Refresh

State: Ready  
Priority: P0  
Feature: `F-AUTH-RESTORE`  
Estimate: M  
Risk: H

Outcome:

Restore valid NIP-07 and NIP-46 sessions after page refresh without introducing backend sessions or fake logged-in state.

Done when:

- A valid NIP-07 authorization can be restored after refresh.
- A valid NIP-46 external/mobile authorization can be restored after refresh where supported.
- Invalid, expired, or denied restore attempts return cleanly to disconnected state.
- Invalid persisted NIP-46 restore data is purged.
- The app does not treat a cached profile as authenticated unless a real signer is restored.
- Tests cover success and failure restore paths.

Inspect first:

- `../../src/core/nostr/application/nostr-session.service.ts`
- `../../src/core/nostr/application/nostr-session.service.spec.ts`
- `../../src/core/nostr-connection/application/connection-facade.ts`
- `../../src/core/nostr-connection/application/connection-facade.spec.ts`
- `../../src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`
- `../../docs/architecture/decisions/0002-nostr-connect-local-restore.md`
- `../../docs/references/nostr-auth-rules.md`

Recommended first step:

Add failing unit tests for startup restore behavior in `NostrSessionService` before changing production code.

Do not change:

- Pack-request storage.
- Backend auth model.
- Product direction for `bunker://`.

Dependencies/blockers:

- Verify NDK restore payload export behavior during implementation.
- Verify mobile signer behavior for Amber and Primal during or after implementation.
- Keep local restore storage minimal: no private keys, only data required to restore a valid signer.

Validation note:

Test Amber and Primal on mobile after implementation and confirm denied, expired, and revoked signer behavior.

Suggested session prompt:

```text
Pick up task AUTH-07 from specs/project/tasks.md. Implement only restore after refresh for NIP-07 and NIP-46 where valid. First inspect nostr-session.service.ts, connection-facade.ts, ndk-nip46-restore.ts, ADR 0002, and relevant tests. Do not change pack-request storage.
```

### `UI-01` Add Loader And Disabled State To Extension Auth Button

State: Ready  
Priority: P1  
Feature: `F-AUTH-LOADING`  
Estimate: S  
Risk: Low

Outcome:

Give the browser-extension auth button clear loading and disabled behavior during a connection attempt, with accessible state feedback and double-click protection.

Done when:

- The extension button shows an indicator while the attempt is running.
- The button is disabled while unavailable, connecting, or locally loading.
- The loading state is accessible.
- The state resets on success, error, cancel, or timeout-equivalent completion.
- Tests cover loading, disabled state, and reset behavior.

Inspect first:

- `../../src/core/layout/presentation/components/app-auth-modal.component.ts`
- `../../src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `../../src/core/nostr/application/nostr-session.service.ts`

Recommended first step:

Add a local `extensionLoading` signal and a re-entry guard around the extension login handler, then bind it to button disabled and accessible loading UI.

Do not change:

- External-app auth flow.
- Bunker auth flow.
- Shared async button abstractions.

Suggested session prompt:

```text
Pick up task UI-01 from specs/project/tasks.md. Implement only loader/disabled behavior for the auth extension button. First inspect app-auth-modal.component.ts and its spec. Keep the change local and accessible.
```

### `AUTH-05` Make `bunker://` A Clearly Separate Advanced Mode

State: Ready  
Priority: P3  
Feature: `F-AUTH-BUNKER`  
Estimate: S/M  
Risk: Low

Outcome:

Keep `bunker://` available for advanced users without presenting it as the main mobile auth path.

Done when:

- External application auth is the primary mobile path.
- `bunker://` is visually and textually marked as advanced.
- Mainstream users are not pushed toward manual bunker setup.
- Existing advanced bunker functionality still works.

Inspect first:

- `../../src/core/layout/presentation/components/app-auth-modal.component.ts`
- Translation files under `../../src/assets/i18n/`

Recommended first step:

Review the auth modal hierarchy and copy, then move bunker UI behind an advanced affordance if it is currently too prominent.

Do not change:

- NIP-46 restore mechanics.
- Permission model.
- Backend API behavior.

Suggested session prompt:

```text
Pick up task AUTH-05 from specs/project/tasks.md. Make bunker:// clearly advanced in the auth modal without removing existing functionality. Do not change NIP-46 restore or permissions.
```

### `AUTH-08` Stabilize Amber And Primal Mobile Flow

State: Backlog  
Priority: P1  
Feature: `F-AUTH-MOBILE`  
Estimate: M  
Risk: H

Outcome:

Verify and stabilize mobile external-app auth flows for Amber and Primal across waiting, success, refusal, timeout, refresh, and return-to-site states.

Done when:

- Amber flow is manually verified and documented.
- Primal flow is manually verified and documented.
- Waiting, success, refusal, and timeout outcomes are documented.
- Refresh does not break an authorization that is still valid.
- Any app-specific limitations are captured in docs or UI copy.

Inspect first:

- `../../src/core/layout/presentation/components/app-auth-modal.component.ts`
- `../../src/core/nostr/application/nostr-session.service.ts`
- `../../src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `../../src/core/nostr-connection/application/nip46-connection-attempt.ts`

Recommended first step:

After `AUTH-07`, run a manual mobile test matrix and document exact behavior before changing code.

Do not change:

- Storage implementation.
- Permission model unless tied to a verified mobile-flow bug.

Dependencies/blockers:

- Depends on `AUTH-07`.
- Requires real mobile testing with Amber and Primal.

### `UI-02` Define Generic Async Button Strategy

State: Backlog  
Priority: P1  
Feature: `F-AUTH-LOADING`  
Estimate: M  
Risk: M

Outcome:

Create a reusable async-button pattern only after confirming at least three real button cases.

Done when:

- At least three async button cases are inventoried.
- A shared pattern exists for loading, disabled state, accessible label, and anti-double-submit.
- The pattern is applied to representative cases.
- Tests cover the shared pattern or migrated cases.

Inspect first:

- `../../src/core/layout/presentation/components/app-auth-modal.component.ts`
- `../../src/features/packs/presentation/pages/pack-request.page.html`
- `../../src/features/admin/presentation/pages/pack-admin-requests.page.html`
- `../../src/features/packs/presentation/components/owner-support-card.component.ts`
- Any implementation from `UI-01`

Dependencies/blockers:

- Depends on `UI-01`.
- Requires inventorying at least three async button cases before abstraction.

### `DOC-03` Update Architecture Docs After Supabase

State: Backlog  
Priority: P2  
Feature: `F-INFRA-STORAGE`  
Estimate: S  
Risk: Low

Outcome:

Document the final Supabase-backed storage architecture after `INFRA-01` lands.

Done when:

- Architecture docs describe Supabase as persistent storage for pack requests.
- Required environment variables are listed.
- Legacy SQLite runtime notes are removed or clearly marked as legacy.
- This task is marked done in this file.

Dependencies/blockers:

- Depends on `INFRA-01` being implemented.

### `AUTH-03` Reduce Login Permissions

State: Backlog  
Priority: P2  
Feature: `F-AUTH-PERMS`  
Estimate: M  
Risk: M

Outcome:

Reduce permissions requested during initial login to the strict minimum needed at startup, then ask for additional permissions only when the user needs an action.

Done when:

- Initial login requests only startup-required permissions.
- Additional permissions are requested just in time.
- The change is covered by tests or documented manual verification.
- Mobile and desktop behavior remain understandable.

Inspect first:

- `../../src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `../../src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `../../src/core/nostr-connection/application/nip46-bunker-connection-method.ts`
- `../../docs/references/nostr-auth-rules.md`

Recommended first step:

List the current requested permissions and map each one to the feature that actually needs it.

### `AUTH-04` Review Mobile Auth UX

State: Backlog  
Priority: P2  
Feature: `F-AUTH-MOBILE`  
Estimate: M  
Risk: M

Outcome:

Make mobile auth states explicit and actionable for active signer, retry, reopen app, disconnect, and read-only mode.

Done when:

- UI clearly shows the active signer state.
- UI offers reopen application, retry, and disconnect where appropriate.
- Read-only mode is explicit when the user is not fully connected.
- Mobile states align with the target flow in [user-stories.md](user-stories.md).

Dependencies/blockers:

- Should follow `AUTH-07` and ideally `AUTH-08`.

### `AUTH-06` One-Shot Bunker Permissions

State: Blocked  
Priority: P3  
Feature: `F-AUTH-BUNKER`, `F-AUTH-PERMS`

Blocker:

With the current NDK stack, the bunker flow does not expose a clean point to push all requested permissions into `connect`.

Done when:

- Either one-shot permission flow is cleanly implementable, or this task is marked `Superseded` with a replacement source.

Note:

This is non-blocking for the main mobile PWA path using `nip46-nostrconnect` and can stay advanced-mode only.
