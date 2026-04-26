# Tasks

## Active

- [ ] `INFRA-01` (ready) Migrate runtime storage from SQLite runtime to Supabase.
- [ ] `DOC-03` (backlog) Update architecture docs after storage migration is done.

## Done When

- Endpoint behavior and protection remain unchanged.
- Pack-request data survives redeployments.
- Required env vars are documented.
- Tests verify behavior without SQLite internals coupling.

## Dependencies

- Supabase project URL.
- Supabase service-role key for Bun API only.
- Deployment environment variable configuration.
