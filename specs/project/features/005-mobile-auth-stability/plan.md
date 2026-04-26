# Plan

## Inspect First

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- `src/core/nostr-connection/application/nip46-nostrconnect-connection-method.ts`
- `src/core/nostr-connection/application/nip46-connection-attempt.ts`
- `specs/project/support/research/nostr-auth-ux-pattern.md`

## Strategy

1. Run post-restore manual matrix after `001-session-restore`.
2. Capture exact Amber and Primal behavior before changing code.
3. Apply smallest targeted fixes for observed failures.
4. Document app-specific constraints in support docs or UI copy.

## Risks

- Device/browser variance hides flaky states.
- Timeout and return-to-site paths drift from desktop behavior.

## Verification

- `bun run test`
- `bun run check`
- Manual mobile matrix with Amber and Primal.
