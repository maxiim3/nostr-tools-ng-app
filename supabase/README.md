# Supabase Setup

The Bun API uses Supabase REST with a server-side elevated key. Prefer `SUPABASE_SECRET_KEY`; `SUPABASE_SERVICE_ROLE_KEY` is accepted as a legacy fallback. Keep both server-only.

## Create Schema

Run [001_francophone_pack_members.sql](./migrations/001_francophone_pack_members.sql) in the Supabase SQL editor, or apply it with the Supabase CLI from this repo root:

```bash
supabase db push
```

## Environment

Copy [.env.example](../.env.example) to `.env` locally and set:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE` optional, defaults to `francophone_pack_members`
- `ADMIN_NPUBS`

Deployment must define the same server-side environment variables.

No browser Supabase key is needed for this feature. Angular calls `server.mjs`; the server performs NIP-98 authorization and writes to Supabase.
