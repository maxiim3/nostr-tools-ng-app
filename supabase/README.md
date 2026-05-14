# Supabase Setup

The Bun API uses Supabase REST with a server-side elevated key. Prefer `SUPABASE_SECRET_KEY`; `SUPABASE_SERVICE_ROLE_KEY` is accepted as a legacy fallback. Keep both server-only.

## Create Schema

Run every SQL file in [migrations](./migrations/) in filename order in the Supabase SQL editor, or apply them with the Supabase CLI from this repo root:

```bash
supabase db push
```

If pack requests fail with `PGRST204` and a message about the missing `status` column, the database was created from the older initial schema only. Apply [002_francophone_pack_member_status.sql](./migrations/002_francophone_pack_member_status.sql), then retry the request.

## Environment

Copy [.env.example](../.env.example) to `.env` locally and set:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE` optional, defaults to `francophone_pack_members`
- `ADMIN_NPUBS`
- `FRANCOPHONE_PACK_URL` optional, defaults to the configured francophone pack
- `FRANCOPHONE_PACK_SIGNER_MODE=nip46` to sign pack add/remove events via a NIP-46 bunker
- `FRANCOPHONE_PACK_BUNKER_URL` server-only, used by the Bun API to request pack signatures from the bunker
- `FRANCOPHONE_PACK_OWNER_NSEC` direct fallback only when `FRANCOPHONE_PACK_SIGNER_MODE=nsec`

Deployment must define the same server-side environment variables.

No browser Supabase key, bunker URL, or pack-owner signing key is needed in Angular. Angular calls `server.mjs`; the server performs NIP-98 authorization, publishes the public pack update through the configured server-only signer, and writes to Supabase after confirmed joins.
