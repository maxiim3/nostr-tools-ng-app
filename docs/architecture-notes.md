# Architecture Notes

Updated: 2026-05-06  
Status: reference for future epics

## Current Architecture Snapshot

The project is an Angular standalone app with a small Bun backend and server-side Supabase persistence.

```txt
Angular SPA
  -> feature routes
  -> core Nostr/auth/zap services
  -> NIP-98 signed HTTP
  -> Bun API server.mjs
  -> Supabase REST with service role
```

The main structure is feature-first pseudo-DDD:

- `src/app/`: bootstrap, app config, and route definitions.
- `src/core/`: shared application domains such as Nostr auth, NDK client, zaps, i18n, and layout.
- `src/features/`: product flows such as packs, admin, home, and legal pages.
- `server.mjs`: Bun API, static serving, NIP-98 verification, Supabase access, LNURL proxy, and public pack lookup.
- `docs/`: maintained protocol and architecture references.

## Keep

- Keep Nostr signer state as the source of truth for authentication.
- Keep backend-protected actions stateless and signed request-by-request with NIP-98.
- Keep Supabase access server-side only.
- Keep auth method details behind `core/nostr-connection` strategies.
- Keep Angular pages thin and put orchestration in application services.
- Keep using signals, `computed`, `inject`, standalone components, and `OnPush`.

## Watch

- `NostrSessionService` is already a large UI/auth orchestration service. Future auth work should avoid adding more unrelated responsibilities there.
- `server.mjs` has multiple responsibilities: routing, NIP-98 auth, Supabase, LNURL, public pack lookup, and static serving. Split it when new backend surface area grows.
- `buildApiUrl()` is duplicated in multiple frontend services. Extract a shared helper or API service if another call site appears.
- Private-key login must remain advanced/fallback only, not a primary public webapp flow.
- Zap implementation is MVP-level compared with `docs/zaps/technical-integration.md`; future payment work should revisit invoice/hash/payment validation.

## Future Epic Candidates

1. Split `server.mjs` into focused backend modules once the API grows.
2. Introduce a small shared frontend API URL helper or HTTP API service.
3. Reduce `NostrSessionService` responsibility by moving modal-specific state or retry orchestration closer to presentation/application boundaries.
4. Harden zaps against the maintained Lightning/NIP-57 guidance before treating payments as production-grade.
5. Add real-device mobile auth validation notes for Amber and Primal in `docs/auth/mobile-auth-notes.md`.
