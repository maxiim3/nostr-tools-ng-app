# Plan

## Inspect First

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/core/layout/presentation/components/app-auth-modal.component.spec.ts`
- `src/core/nostr/application/nostr-session.service.ts`

## Strategy

1. Add local `extensionLoading` state with re-entry guard.
2. Bind loading/disabled state to button and accessible labels.
3. Keep the change local without introducing abstraction.
4. Add tests for loading, disabled, and reset behavior.

## Risks

- Loading state not reset on exceptional path.
- Accessibility regressions in button labels.

## Verification

- `bun run test`
- `bun run check`
