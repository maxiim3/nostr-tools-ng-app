# Supabase Setup

The Bun API uses Supabase REST with the service-role key. Keep this key server-only.

## Create Schema

Run [001_francophone_pack_members.sql](./migrations/001_francophone_pack_members.sql) in the Supabase SQL editor, or apply it with the Supabase CLI from this repo root:

```bash
supabase db push
```

## Environment

Copy [.env.example](../.env.example) to `.env` locally and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE` optional, defaults to `francophone_pack_members`
- `ADMIN_NPUBS`

Deployment must define the same server-side environment variables.
