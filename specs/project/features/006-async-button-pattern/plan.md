# Plan

## Inspect First

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/features/packs/presentation/pages/pack-request.page.html`
- `src/features/admin/presentation/pages/pack-admin-requests.page.html`
- `src/features/packs/presentation/components/owner-support-card.component.ts`
- Resulting implementation from `003-extension-auth-loading`

## Strategy

1. Inventory at least three async button cases.
2. Extract a minimal shared behavior contract.
3. Apply to representative cases only.
4. Keep local-only cases local.

## Risks

- Over-abstraction for one-off interactions.
- Accessibility regressions when moving behavior.

## Verification

- `bun run test`
- `bun run check`
