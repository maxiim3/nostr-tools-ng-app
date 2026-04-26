# P1 UI-01 READY

Task: `UI-01` Add loader and disabled state to extension auth button

Status: READY

Readiness note: Can be picked up now.

Why:
This is a small, local Angular UI change with clear acceptance criteria and existing component/test
targets.

Prerequisites:

- None.

LLM-safe scope:

- Add a local loading signal and re-entry guard for the extension login handler.
- Disable the extension button while unavailable, connecting, or locally loading.
- Add accessible loading feedback while keeping the button understandable.
- Add or update focused component tests.

Human/manual validation needed:

- Optional visual check in the browser.

Do not change:

- External-app auth flow.
- Bunker auth flow.
- Shared async button abstractions.

Recommended session prompt:

```text
Pick up task UI-01 from docs/planning/P1_UI-01_READY.md. Implement only loader/disabled behavior for
the auth extension button. First inspect app-auth-modal.component.ts and its spec. Keep the change
local and accessible.
```
