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
- `specs/project/support/architecture/overview.md`

## Strategy

1. Introduce a storage boundary for pack-request operations.
2. Convert handlers to async storage calls while still on SQLite.
3. Swap implementation to Supabase only behind the boundary.
4. Preserve endpoint behavior and admin NIP-98 protection.
5. Document architecture/env changes as follow-up task `DOC-03`.

## Risks

- Behavior drift during storage adapter swap.
- Misconfigured Supabase credentials in deployment.
- Coupling tests to SQLite internals.

## Verification

- `bun run test`
- `bun run check`
- Manual smoke test after deploy and redeploy.
