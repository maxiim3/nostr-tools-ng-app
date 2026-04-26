# P0 INFRA-01 TODO

Task: `INFRA-01` Migrate runtime storage to Supabase

Status: TODO

Readiness note: Needs Supabase environment access before full production validation.

Why:
The implementation is clear and mostly backend-contained, but it depends on a real Supabase project,
server-side credentials, and deployment environment validation.

Prerequisites:

- Supabase project URL.
- Supabase service-role key for the Bun server only.
- Deployment environment variable access.

LLM-safe scope:

- Add a pack-request storage boundary in `server.mjs`.
- Preserve current endpoint behavior.
- Replace SQLite-backed storage with Supabase-backed storage.
- Update tests to assert API behavior instead of SQLite internals.
- Document required environment variables.

Human/manual validation needed:

- Confirm Supabase credentials are configured in production.
- Smoke test pack-request persistence after deploy/redeploy.

Do not change:

- Auth/session behavior.
- Public response contracts unless explicitly decided.
- Admin approve/reject semantics. Current behavior deletes the row.

Recommended session prompt:

```text
Pick up task INFRA-01 from docs/planning/P0_INFRA-01_TODO.md. Implement only this task. Preserve
existing pack-request endpoint behavior and admin NIP-98 protection. First inspect server.mjs,
server.test.mjs, README.md, docs/architecture/overview.md, and src/features/packs/README.md. Do not
change auth/session behavior.
```
