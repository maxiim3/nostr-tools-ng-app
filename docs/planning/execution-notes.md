# Execution Notes

Date: 2026-04-26
Status: active

## Role of this document

This document turns board items into agent-ready handoff briefs.

Use it when starting a fresh implementation session for one task. Active execution status still
lives in [board.md](board.md), and the board is authoritative. If this document and the board
disagree, the board wins.

This document includes briefs for both `Ready` and `Backlog` work so contributors can see the next
action for each task before starting a session. It intentionally does not expand `AUTH-02`, because
that task is already marked in progress on the board, and does not expand blocked tasks until they
return to a startable state.

## Orchestration Rules

- Use one fresh implementation session per task.
- Prefer sequential implementation for dependent work.
- Use parallel agents for research, risk assessment, or review, not for editing overlapping areas.
- Do not implement `INFRA-01` and `AUTH-07` in parallel.
- Do not edit shared docs from multiple sessions at the same time.
- Keep each session limited to its task ID unless the board explicitly says otherwise.

## Lifecycle Alignment Rules

- Allowed lifecycle states: `Backlog`, `Ready`, `In Progress`, `Blocked`, `Done`, `Superseded`, `Archived`.
- A brief in this file must include `Lifecycle` and a clear next action.
- Only `Ready` briefs are startable immediately.
- `Backlog` briefs must state the prerequisite needed to move to `Ready`.
- `Blocked`, `Done`, `Superseded`, and `Archived` tasks stay in `board.md`; they are expanded here
  only if they re-enter `Ready` or `In Progress`.
- If this file and `board.md` disagree on lifecycle, `board.md` wins and this file must be updated.
- Legacy local file names such as `_TODO` and `_READY` are supporting context only; lifecycle
  status is owned by `board.md`.

## Mapping Maintenance Rules

- Each brief in this file must map back to a task in `board.md`; this file never owns active status.
- Use `docs/product/specs/` for product-facing behavior specs and top-level `specs/` for Spec Kit
  feature artifacts, plans, task lists, contracts, and validation records.
- If a brief belongs to a larger feature, link the product spec or Spec Kit feature in the brief's
  inspect list or supporting context.
- If a brief is small enough for direct board tracking, mark it as `No Formal Spec Needed` on the
  board and keep the rationale in the mapping registry.
- When a brief duplicates or replaces another planning record, update
  `specs/001-project-management-cleanup/artifacts/local-planning-mapping.md` before changing the
  task status.
- Legacy standalone task briefs were merged into this file on 2026-04-26. Use this file for
  agent-ready handoffs instead of `P*_*.md` planning files.

## Execution Order

| Order | Task       | Lifecycle | Priority | Estimate | Risk | Next Action                                               |
| ----- | ---------- | --------- | -------- | -------- | ---- | --------------------------------------------------------- |
| 1     | `INFRA-01` | Ready     | P0       | M        | M    | Start implementation with storage boundary work           |
| 2     | `AUTH-07`  | Ready     | P0       | M        | H    | Start restore implementation and tests                    |
| 3     | `UI-01`    | Ready     | P1       | S        | Low  | Start focused auth-button loading/accessibility update    |
| 4     | `AUTH-05`  | Ready     | P3       | S/M      | Low  | Start low-risk UX hierarchy cleanup when capacity is free |
| 5     | `AUTH-08`  | Backlog   | P1       | M        | H    | Wait for `AUTH-07`, then run mobile matrix                |
| 6     | `UI-02`    | Backlog   | P1       | M        | M    | Wait for `UI-01`, then inventory at least 3 async buttons |
| 7     | `DOC-03`   | Backlog   | P2       | S        | Low  | Wait for `INFRA-01`, then update architecture docs        |
| 8     | `AUTH-03`  | Backlog   | P2       | M        | M    | Confirm minimum startup permission set                    |
| 9     | `AUTH-04`  | Backlog   | P2       | M        | M    | Wait for `AUTH-07` and `AUTH-08` test matrix              |

Note: `DOC-03` may be bundled into the `INFRA-01` implementation session if that session completes
the Supabase migration and updates the related architecture docs immediately.

## Task Briefs

### `INFRA-01` Migrate runtime storage to Supabase

Priority: P0
Lifecycle: Ready
Estimate: M
Risk: M
Uncertainty: M

Goal:
Migrate runtime pack-request storage from local SQLite `.runtime` storage to Supabase without
changing public or admin endpoint behavior.

Done when:

- `GET /api/pack-requests/me` keeps current external behavior.
- `POST /api/pack-requests` keeps current external behavior.
- `GET /api/admin/pack-requests` keeps current external behavior.
- Admin approve/reject remain protected by server-side `NIP-98` auth.
- Pack-request data survives redeployments.
- Required Supabase environment variables are documented.
- Tests cover API behavior without relying on SQLite internals.

Inspect first:

- `server.mjs`
- `server.test.mjs`
- `README.md`
- `docs/architecture/overview.md`
- `src/features/packs/README.md`
- `pack-requests.schema.sql`
- `scripts/db-reset.sh`
- `scripts/db-dump.sh`
- `scripts/db-restore.sh`

Recommended first step:
Introduce a storage boundary in `server.mjs` around the existing pack-request operations, then
convert route handlers to `await` those operations while still backed by SQLite. After that, swap
only the storage implementation to Supabase.

Do not change:

- Auth/session behavior.
- Public response contracts unless explicitly decided.
- Approve/reject semantics. Current behavior deletes the row; preserve it for this task.

Dependencies/blockers:

- Supabase project URL.
- Supabase service-role key for the Bun server only.
- Deployment environment variables.

Validation note:
Confirm Supabase credentials are configured in production and smoke test pack-request persistence
after deploy and redeploy.

Suggested session prompt:

```text
Pick up task INFRA-01 from docs/planning/execution-notes.md. Implement only this task. Preserve
existing pack-request endpoint behavior and admin NIP-98 protection. First inspect server.mjs,
server.test.mjs, README.md, docs/architecture/overview.md, and src/features/packs/README.md. Do not
change auth/session behavior.
```

### `DOC-03` Update architecture docs after Supabase

Priority: P2
Lifecycle: Backlog
Estimate: S
Risk: Low
Uncertainty: Low

Goal:
Document the final Supabase-backed storage architecture after `INFRA-01` lands.

Done when:

- Architecture docs describe Supabase as persistent storage for pack requests.
- Required environment variables are listed.
- Legacy SQLite runtime notes are removed or clearly marked as legacy.
- The board can mark the Supabase documentation follow-up as complete.

Inspect first:

- `docs/architecture/overview.md`
- `README.md`
- `src/features/packs/README.md`
- `docs/planning/board.md`
- Final `INFRA-01` implementation diff

Recommended first step:
Read the merged `INFRA-01` implementation and update only the docs that mention runtime storage.

Do not change:

- Server code.
- Test code.
- Auth documentation unless directly affected by storage documentation.

Dependencies/blockers:

- Depends on `INFRA-01` being implemented.

Validation note:
Confirm docs match the deployed environment variable names.

Suggested session prompt:

```text
Pick up task DOC-03 from docs/planning/execution-notes.md after INFRA-01 is complete. Update only
documentation to reflect the final Supabase storage implementation. Do not change runtime code.
```

### `AUTH-07` Restore Nostr session after refresh

Priority: P0
Lifecycle: Ready
Estimate: M
Risk: H
Uncertainty: H

Goal:
Restore valid NIP-07 and NIP-46 sessions after page refresh without introducing backend sessions or
fake logged-in state.

Done when:

- A valid NIP-07 authorization can be restored after refresh.
- A valid NIP-46 external/mobile authorization can be restored after refresh where supported.
- Invalid, expired, or denied restore attempts return cleanly to disconnected state.
- Invalid persisted NIP-46 restore data is purged.
- The app does not treat a cached profile as authenticated unless a real signer is restored.
- Tests cover success and failure restore paths.

Inspect first:

- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/connection-facade.spec.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`
- `docs/architecture/decisions/0002-nostr-connect-local-restore.md`
- `docs/references/nostr-auth-rules.md`

Recommended first step:
Add failing unit tests for startup restore behavior in `NostrSessionService` before changing
production code.

Do not change:

- Pack-request storage.
- Backend auth model.
- Product direction for `bunker://`.

Dependencies/blockers:

- Verify NDK restore payload export behavior during implementation.
- Verify mobile signer behavior for Amber and Primal during or after implementation.
- Keep local restore storage minimal: no private keys, only the data required to restore a valid
  signer.

Validation note:
Test Amber and Primal on mobile after implementation and confirm denied, expired, and revoked signer
behavior.

Suggested session prompt:

```text
Pick up task AUTH-07 from docs/planning/execution-notes.md. Implement only restore after refresh for
NIP-07 and NIP-46 where valid. First inspect nostr-session.service.ts, connection-facade.ts,
ndk-nip46-restore.ts, ADR 0002, and relevant tests. Do not change pack-request storage.
```

### `AUTH-08` Stabilize Amber and Primal mobile flow

Priority: P1
Lifecycle: Backlog
Estimate: M
Risk: H
Uncertainty: M

Goal:
Verify and stabilize mobile external-app auth flows for Amber and Primal across waiting, success,
refusal, timeout, refresh, and return-to-site states.

Done when:

- Amber flow is manually verified and documented.
- Primal flow is manually verified and documented.
- Waiting, success, refusal, and timeout outcomes are documented.
- Refresh does not break an authorization that is still valid.
- Any app-specific limitations are captured in docs or UI copy.

Inspect first:

- `docs/product/specs/auth-mobile-web.md`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`

Recommended first step:
After `AUTH-07`, run a manual mobile test matrix and document exact behavior before changing code.

Do not change:

- Storage implementation.
- Permission model unless tied to a verified mobile-flow bug.

Dependencies/blockers:

- Depends on `AUTH-07`.
- Requires real mobile testing with Amber and Primal.

Validation note:
Run Amber and Primal on real mobile devices and verify waiting, success, refusal, timeout, refresh,
and return-to-site states.

Suggested session prompt:

```text
Pick up task AUTH-08 from docs/planning/execution-notes.md after AUTH-07 is complete. Verify Amber
and Primal mobile flows, document the matrix, and make only the smallest code changes needed for
observed failures. Do not change storage or broad auth permissions.
```

### `UI-01` Add loader and disabled state to extension auth button

Priority: P1
Lifecycle: Ready
Estimate: S
Risk: Low
Uncertainty: Low

Goal:
Give the browser-extension auth button clear loading and disabled behavior during a connection
attempt, with accessible state feedback and double-click protection.

Done when:

- The extension button shows an indicator while the attempt is running.
- The button is disabled while unavailable, connecting, or locally loading.
- The loading state is accessible.
- The state resets on success, error, cancel, or timeout-equivalent completion.
- Tests cover loading, disabled state, and reset behavior.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/core/nostr/application/nostr-session.service.ts`

Recommended first step:
Add a local `extensionLoading` signal and a re-entry guard around the extension login handler, then
bind it to button disabled and accessible loading UI.

Do not change:

- External-app auth flow.
- Bunker auth flow.
- Shared async button abstractions.

Dependencies/blockers:

- None.

Validation note:
Optionally perform a browser visual check after tests pass.

Suggested session prompt:

```text
Pick up task UI-01 from docs/planning/execution-notes.md. Implement only loader/disabled behavior
for the auth extension button. First inspect app-auth-modal.component.ts and its spec. Keep the
change local and accessible.
```

### `UI-02` Define generic async button strategy

Priority: P1
Lifecycle: Backlog
Estimate: M
Risk: M
Uncertainty: M

Goal:
Create a reusable async-button pattern only after confirming at least three real button cases.

Done when:

- At least three async button cases are inventoried.
- A shared pattern exists for loading, disabled state, accessible label, and anti-double-submit.
- The pattern is applied to representative cases.
- Tests cover the shared pattern or migrated cases.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/features/packs/presentation/pages/pack-request.page.html`
- `src/features/admin/presentation/pages/pack-admin-requests.page.html`
- `src/features/packs/presentation/components/owner-support-card.component.ts`
- Any implementation from `UI-01`

Recommended first step:
Inventory async buttons and decide whether a component, directive, or local pattern best matches the
existing Angular style.

Do not change:

- Auth behavior.
- Pack-request API behavior.
- UI copy beyond what is required for accessible loading states.

Dependencies/blockers:

- Depends on `UI-01`.
- Requires inventorying at least three async button cases before abstraction.

Validation note:
Optionally perform visual checks for migrated buttons and confirm the abstraction does not make
simple cases harder to maintain.

Suggested session prompt:

```text
Pick up task UI-02 from docs/planning/execution-notes.md after UI-01 is complete. Inventory async
buttons first, then implement the smallest shared pattern that fits at least three confirmed cases.
Do not change auth or API behavior.
```

### `AUTH-03` Reduce login permissions

Priority: P2
Lifecycle: Backlog
Estimate: M
Risk: M
Uncertainty: M

Goal:
Reduce permissions requested during initial login to the strict minimum needed at startup, then ask
for additional permissions only when the user needs an action.

Done when:

- Initial login requests only startup-required permissions.
- Additional permissions are requested just in time.
- The change is covered by tests or documented manual verification.
- Mobile and desktop behavior remain understandable.

Inspect first:

- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `src/core/nostr-connection/application/nip46-bunker-connection-method.ts`
- `docs/references/nostr-auth-rules.md`
- `docs/product/specs/auth-mobile-web.md`

Recommended first step:
List the current requested permissions and map each one to the feature that actually needs it.

Do not change:

- Restore-after-refresh behavior unless required by permission changes.
- `bunker://` UX positioning.

Dependencies/blockers:

- No hard blocker, but confirm the minimum startup permission set before editing behavior.

Validation note:
Confirm product/security tradeoffs for permission prompts, then test desktop and mobile signer
prompts after any behavior change.

Suggested session prompt:

```text
Pick up task AUTH-03 from docs/planning/execution-notes.md. First inventory current login
permissions and map them to features. Propose the minimum startup set before changing code.
```

### `AUTH-04` Review mobile auth UX

Priority: P2
Lifecycle: Backlog
Estimate: M
Risk: M
Uncertainty: M

Goal:
Make mobile auth states explicit and actionable for active signer, retry, reopen app, disconnect,
and read-only mode.

Done when:

- UI clearly shows the active signer state.
- UI offers `Reopen application`, `Retry`, and `Disconnect` where appropriate.
- Read-only mode is explicit when the user is not fully connected.
- Mobile states align with the target flow in the spec.

Inspect first:

- `docs/product/specs/auth-mobile-web.md`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-header.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- Translation files under `src/assets/i18n/`

Recommended first step:
Map current UI states to the target state machine in the mobile auth spec, then identify missing
states before changing code.

Do not change:

- Storage implementation.
- Permission strategy unless it has already been decided in `AUTH-03`.

Dependencies/blockers:

- Should follow `AUTH-07` and ideally `AUTH-08`.

Validation note:
Check mobile UX with real signer flows and confirm copy remains understandable on small screens.

Suggested session prompt:

```text
Pick up task AUTH-04 from docs/planning/execution-notes.md. First map current mobile auth UI states
against docs/product/specs/auth-mobile-web.md. Implement only missing state clarity and actions.
```

### `AUTH-05` Make `bunker://` a clearly separate advanced mode

Priority: P3
Lifecycle: Ready
Estimate: S/M
Risk: Low
Uncertainty: Low

Goal:
Keep `bunker://` available for advanced users without presenting it as the main mobile auth path.

Done when:

- External application auth is the primary mobile path.
- `bunker://` is visually and textually marked as advanced.
- Mainstream users are not pushed toward manual bunker setup.
- Existing advanced bunker functionality still works.

Inspect first:

- `docs/product/specs/auth-mobile-web.md`
- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- Translation files under `src/assets/i18n/`

Recommended first step:
Review the auth modal hierarchy and copy, then move bunker UI behind an advanced affordance if it is
currently too prominent.

Do not change:

- NIP-46 restore mechanics.
- Permission model.
- Backend API behavior.

Dependencies/blockers:

- Best after `AUTH-04`, but can be done independently if UX scope is kept small.

Validation note:
Optionally review the UX to confirm mainstream users are not pushed toward manual bunker setup.

Suggested session prompt:

```text
Pick up task AUTH-05 from docs/planning/execution-notes.md. Make bunker:// clearly advanced in the
auth modal without removing existing functionality. Do not change NIP-46 restore or permissions.
```
