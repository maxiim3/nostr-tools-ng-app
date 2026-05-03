# Feature Briefs

Updated: 2026-05-03

These briefs preserve useful feature intent, acceptance criteria, risks, and verification notes from the former planning tree.

## 001 Auto-Admit Pack Members

Status: ready  
Priority: P0 absolute  
Milestone: M1

Outcome: clicking the francophone pack join button immediately admits the authenticated user into the pack and stores the member record in Supabase.

Task anchors:

- `PACK-01`: replace manual pack-request approval with authenticated auto-admit join.
- `DATA-01`: migrate francophone pack membership storage to Supabase.
- `ADMIN-01`: replace admin request moderation with members table.
- `ADMIN-02`: add remove-from-pack action protected by admin NIP-98.
- `DOC-03`: update architecture, environment, and local setup docs after Supabase migration.

Acceptance criteria:

- A signed-in user clicks the join button and is auto-admitted without manual admin approval.
- The app no longer exposes admin approve/reject as the primary workflow.
- Supabase is the persistent database for francophone pack membership records.
- Each member record stores `pubkey`, username, profile description, avatar, joined date, follower/following counts, inferable account creation date, post count, zap count, app-origin metadata, and removal metadata where available.
- Admin can view all current francophone pack members in a table.
- Admin can remove a member while preserving database history.
- Admin routes and removal actions remain protected by server-side NIP-98 admin checks.
- Existing runtime SQLite storage is retired for this membership flow.
- Required Supabase environment variables and schema are documented.

Inspect first:

- `server.mjs`
- `server.test.mjs`
- `README.md`
- `src/features/packs/README.md`
- `src/features/packs/application/francophone-pack-membership.service.ts`
- `src/features/admin/presentation/pages/pack-admin-requests.page.ts`
- `src/features/packs/domain/francophone-pack.config.ts`
- `docs/architecture/overview.md`

Risks:

- Publishing/removing members from the pack can fail after database write unless operation ordering is explicit.
- Nostr profile and counter data may be incomplete or slow; unknown values must be allowed.
- Existing pending-request code may leave stale approve/reject routes or UI affordances.
- Supabase credentials can be misconfigured in deployment.
- Tests can stay coupled to removed SQLite internals.

Verification:

- `bun run test`
- `bun run check`
- Manual: authenticated user clicks join and appears in the pack without admin approval.
- Manual: admin sees member in table with requested-from-app metadata.
- Manual: admin removes member from pack and record remains in Supabase with removal state.
- Manual: deploy and redeploy do not lose member records.

Note: the attempted merge with the public Following.space Pack FR source was not reliable in the running app. Revisit the public pack source-of-truth integration before treating the admin table as all Pack FR members.

## 002 Session Restore

Status: ready  
Priority: P0  
Milestone: M1

Outcome: valid NIP-07 or NIP-46 authorization survives refresh. Invalid persisted auth is purged and never treated as authenticated state.

Task anchors:

- `AUTH-02`: validate mobile restore signer flow with NIP-46/Nostr Connect.
- `AUTH-07`: implement restore after refresh for valid NIP-07 and NIP-46 sessions.

Acceptance criteria:

- Valid NIP-07 authorization can be restored or revalidated after refresh.
- Valid NIP-46 authorization can be restored where supported.
- Invalid, expired, denied, or revoked restore attempts return to disconnected state.
- Invalid persisted NIP-46 restore payload is purged.
- Cached profile data alone never creates authenticated state.

Inspect first:

- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/connection-facade.spec.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`
- `docs/architecture/decisions/0002-nostr-connect-local-restore.md`
- `docs/auth/nostr-auth-rules.md`

Risks:

- False-positive authenticated state from stale local data.
- Differences between desktop extension and mobile signer behavior.
- NDK restore payload compatibility drift.

Verification:

- `bun run test`
- `bun run check`
- Manual: refresh after mobile auth with Amber and Primal.

## 003 Extension Auth Loading

Status: ready  
Priority: P1  
Milestone: M1

Outcome: the extension auth button provides accessible loading feedback and prevents duplicate submissions.

Task anchor:

- `UI-01`: add loader and disabled state to the extension auth button.

Acceptance criteria:

- The extension button shows pending feedback during auth attempt.
- The button is disabled while unavailable, connecting, or locally loading.
- Loading state is accessible.
- Loading state resets on success, error, cancel, and timeout-equivalent completion.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/core/nostr/application/nostr-session.service.ts`

Verification:

- `bun run test`
- `bun run check`

## 004 Advanced Bunker Mode

Status: ready  
Priority: P3  
Milestone: M1

Outcome: `bunker://` remains available for advanced users without dominating the mainstream auth path.

Task anchor:

- `AUTH-05`: make `bunker://` a clearly separate advanced mode without changing NIP-46 restore or permissions.

Acceptance criteria:

- External app auth remains the primary mobile path.
- `bunker://` is visually and textually marked as advanced.
- Existing advanced bunker functionality still works.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/assets/i18n/fr.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

Verification:

- `bun run test`
- `bun run check`

## 005 Mobile Auth Stability

Status: backlog  
Priority: P1  
Milestone: M1

Outcome: Amber and Primal mobile auth flows are stable across waiting, success, refusal, timeout, refresh, and return-to-site states.

Task anchor:

- `AUTH-08`: stabilize Amber and Primal mobile auth flow after session restore work.

Acceptance criteria:

- Amber flow is manually verified and documented.
- Primal flow is manually verified and documented.
- Waiting, success, refusal, timeout, and return states are explicit.
- Refresh does not break still-valid authorization.
- App-specific limitations are documented.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `docs/auth/mobile-auth-notes.md`

Risks:

- Device/browser variance hides flaky states.
- Timeout and return-to-site paths drift from desktop behavior.

## 006 Async Button Pattern

Status: backlog  
Priority: P1  
Milestone: M1

Outcome: introduce a shared async-button strategy only where repeated cases justify abstraction.

Task anchor:

- `UI-02`: define a generic async button strategy only after at least three cases justify it.

Acceptance criteria:

- At least three async button cases are inventoried.
- Shared pattern covers loading, disabled state, accessibility label, and anti-double-submit.
- Pattern is applied only where it reduces duplication.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/features/packs/presentation/pages/pack-request.page.html`
- `src/features/admin/presentation/pages/pack-admin-requests.page.html`
- `src/features/packs/presentation/components/owner-support-card.component.ts`
- The resulting implementation from extension auth loading.

Risk: over-abstraction for one-off interactions.

## 007 Permission Minimization

Status: backlog  
Priority: P2  
Milestone: M1

Outcome: the app requests only startup-required permissions, then requests additional permissions just in time.

Task anchor:

- `AUTH-03`: reduce login permissions after inventorying current permission requests.

Acceptance criteria:

- Current requested permissions are inventoried.
- Each permission maps to a concrete feature need.
- Startup permission scope is reduced where safe.
- Desktop and mobile prompts remain understandable.

Inspect first:

- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `src/core/nostr-connection/application/nip46-bunker-connection-method.ts`
- `docs/auth/nostr-auth-rules.md`

Risks:

- Breaking post-login actions if permission dependencies are missed.
- Inconsistent behavior between desktop and mobile signers.

## 008 Mobile Auth States

Status: backlog  
Priority: P2  
Milestone: M1

Outcome: mobile auth states are explicit and actionable for active signer, retry, reopen app, disconnect, and read-only mode.

Task anchor:

- `AUTH-04`: review and fix mobile auth UX states.

Acceptance criteria:

- UI clearly identifies current signer/auth state.
- UI exposes retry, reopen app, and disconnect where relevant.
- Read-only mode is explicit when not fully connected.
- State copy maps to verified mobile behavior.

Inspect first:

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- Validation output from mobile auth stability work.

## 009 Bunker Permission Grants

Status: blocked  
Priority: P3  
Milestone: M1

Outcome: enable one-shot bunker permission grants only when a clean implementation path exists.

Task anchor:

- `AUTH-06`: implement one-shot bunker permissions only if a clean NDK extension point exists; otherwise supersede with a documented replacement.

Acceptance criteria:

- Either one-shot permission flow is implemented cleanly, or this feature is explicitly superseded with a documented replacement.

Blocker: current NDK bunker flow does not expose a clean extension point to inject the full requested permission set into connect.

## 010 Follower Merge

Status: future  
Priority: later  
Milestone: M2

Outcome: admin can compare a source list with the target francophone pack and import missing follows safely.

Acceptance criteria:

- Source and target can be loaded and compared.
- Importable, already-present, and target-only members are clearly separated.
- Import flow is non-destructive by default.
- Credits to Calle and Following.space are visible.

Strategy:

- Define input contracts for source and target loading.
- Implement normalized pubkey comparison and grouping.
- Build non-destructive selection and preview flow.
- Add publish action with clear confirmation.

## 011 Francophone Pack Feed

Status: future  
Priority: later  
Milestone: M3

Outcome: public users can read recent kind 1 posts from members of the francophone pack.

Acceptance criteria:

- Feed includes kind 1 posts from pack members.
- Posts are sorted chronologically descending.
- First version is read-only.
- Pagination or load-more is available.

Strategy:

- Define source for pack members and event query.
- Implement simple read-only feed list.
- Add pagination/load-more.
- Keep scope small: no complex social engine.
