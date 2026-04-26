# Plan

## Inspect First

- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `src/core/nostr-connection/application/nip46-bunker-connection-method.ts`
- `specs/project/support/references/nostr-auth-rules.md`

## Strategy

1. Inventory permissions currently requested at login.
2. Map each permission to the exact feature that requires it.
3. Reduce startup requests to strict minimum.
4. Add just-in-time requests where needed.

## Risks

- Breaking post-login actions if permission dependencies are missed.
- Inconsistent behavior between desktop and mobile signers.

## Verification

- `bun run test`
- `bun run check`
