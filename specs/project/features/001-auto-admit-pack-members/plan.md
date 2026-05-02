# Plan

## Inspect First

- `server.mjs`
- `server.test.mjs`
- `README.md`
- `src/features/packs/README.md`
- `pack-requests.schema.sql`
- `scripts/db-reset.sh`
- `scripts/db-dump.sh`
- `scripts/db-restore.sh`
- `src/features/packs/application/francophone-pack-membership.service.ts`
- `src/features/packs/application/francophone-pack-membership.service.spec.ts`
- `src/features/packs/application/starter-pack-request.service.ts`
- `src/features/admin/presentation/pages/pack-admin-requests.page.ts`
- `src/features/admin/presentation/pages/pack-admin-requests.page.html`
- `src/features/packs/domain/francophone-pack.config.ts`
- `specs/project/support/architecture/overview.md`

## Strategy

1. Define the Supabase schema for francophone pack members, using `pubkey` as the unique identity key.
2. Replace the request/approval model with an auto-admit join operation.
3. Persist every join in Supabase with profile snapshot, join metadata, visible counters, and app-origin metadata.
4. Update admin API from pending-request moderation to current-member listing.
5. Replace approve/reject UI with a members table and remove-from-pack action.
6. Keep remove-from-pack protected by NIP-98 admin checks and retain database history with `removedAt`.
7. Remove or demote SQLite runtime scripts/docs for this flow after Supabase is active.
8. Document Supabase env vars and architecture changes.

## Risks

- Publishing/removing members from the pack can fail after database write unless operation ordering is explicit.
- Nostr profile and counter data may be incomplete or slow; unknown values must be allowed.
- Existing pending-request code may leave stale approve/reject routes or UI affordances.
- Misconfigured Supabase credentials in deployment.
- Coupling tests to removed SQLite internals.

## Verification

- `bun run test`
- `bun run check`
- Manual: authenticated user clicks join and appears in the pack without admin approval.
- Manual: admin sees member in table with requested-from-app metadata.
- Manual: admin removes member from pack and record remains in Supabase with removal state.
- Manual: deploy and redeploy do not lose member records.
