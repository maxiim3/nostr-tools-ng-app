# Tasks

## Active

- [ ] `PACK-01` (ready, P0 absolute) Replace manual pack-request approval with authenticated auto-admit join.
- [ ] `DATA-01` (ready, P0 absolute) Migrate francophone pack membership storage to Supabase.
- [ ] `ADMIN-01` (ready, P0 absolute) Replace admin request moderation with members table.
- [ ] `ADMIN-02` (ready, P0 absolute) Add remove-from-pack action protected by admin NIP-98.
- [ ] `DOC-03` (ready, P0) Update architecture, env, and local setup docs after Supabase migration.

## Done When

- A connected user joins the francophone pack immediately after clicking the join button.
- No manual admin approve/reject step is required or presented as the main admin workflow.
- Supabase stores member rows with `pubkey`, profile fields, join date, counters, app-origin metadata, and removal metadata.
- Admin sees all current francophone pack members in a table with avatar, username, description, account creation date, requested-from-app, requested/joined-at date, and remove action.
- Remove-from-pack changes pack membership and preserves database history.
- Tests cover auto-join, Supabase storage behavior, admin list, and admin remove authorization.
- Runtime data survives redeployments.
- Required Supabase env vars and schema are documented.

## Dependencies

- Supabase project URL.
- Supabase service-role key for Bun API only.
- Deployment environment variable configuration.
- Clear source of truth for current francophone pack membership publication/update.

## Follow-Up Notes

- 2026-04-26: Admin currently lists Supabase-backed pack members, but the attempted merge with the public following.space Pack FR source is not reliable in the running app. Revisit the public pack source-of-truth integration later before treating the admin table as "all Pack FR members".
