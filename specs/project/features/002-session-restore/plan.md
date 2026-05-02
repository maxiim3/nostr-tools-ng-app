# Plan

## Inspect First

- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr/application/nostr-session.service.spec.ts`
- `src/core/nostr-connection/application/connection-facade.ts`
- `src/core/nostr-connection/application/connection-facade.spec.ts`
- `src/core/nostr-connection/infrastructure/ndk-nip46-restore.ts`
- `specs/project/support/decisions/0002-nostr-connect-local-restore.md`
- `specs/project/support/references/nostr-auth-rules.md`

## Strategy

1. Add failing tests for startup restore in `NostrSessionService`.
2. Implement restore flow for valid NIP-07 and NIP-46 sessions.
3. Purge invalid restore payloads and fail closed.
4. Verify disconnected fallback when restore cannot be trusted.

## Risks

- False-positive authenticated state from stale local data.
- Differences between desktop extension and mobile signer behavior.
- NDK restore payload compatibility drift.

## Verification

- `bun run test`
- `bun run check`
- Manual: refresh after mobile auth with Amber and Primal.
