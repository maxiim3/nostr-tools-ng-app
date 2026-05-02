# Plan

## Inspect First

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/nostr/application/nostr-session.service.ts`
- Validation output from `005-mobile-auth-stability`

## Strategy

1. Map current UI states to verified mobile flow states.
2. Update state model and copy for retry/reopen/disconnect/read-only.
3. Keep state transitions explicit and testable.
4. Validate copy in all supported locales.

## Risks

- State mismatch between actual auth state and displayed state.
- User confusion during timeout or denied flows.

## Verification

- `bun run test`
- `bun run check`
