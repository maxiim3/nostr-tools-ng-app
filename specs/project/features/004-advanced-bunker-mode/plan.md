# Plan

## Inspect First

- `src/core/layout/presentation/components/app-auth-modal.component.ts`
- `src/assets/i18n/fr.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

## Strategy

1. Review auth modal hierarchy and copy.
2. Keep external app auth as primary path.
3. Place bunker section behind explicit advanced affordance.
4. Validate copy in all supported locales.

## Risks

- Breaking existing bunker users through hidden entry points.
- Unclear translations for advanced mode labeling.

## Verification

- `bun run test`
- `bun run check`
