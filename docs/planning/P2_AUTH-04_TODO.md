# P2 AUTH-04 TODO

Task: `AUTH-04` Review mobile auth UX

Status: TODO

Readiness note: Best after `AUTH-07` and `AUTH-08`.

Why:
An LLM can improve UI state clarity, but the best UX depends on the real behavior verified through
`AUTH-07` and `AUTH-08`.

Prerequisites:

- Preferably complete `AUTH-07` first.
- Preferably complete or at least run the `AUTH-08` mobile test matrix first.

LLM-safe scope:

- Map current UI states to the target mobile auth state machine.
- Add clear states and actions for active signer, retry, reopen app, disconnect, and read-only mode.
- Keep changes focused on clarity and accessibility.

Human/manual validation needed:

- Mobile UX check with real signer flows.
- Confirm copy is understandable on small screens.

Do not change:

- Storage implementation.
- Permission strategy unless already decided in `AUTH-03`.

Recommended session prompt:

```text
Pick up task AUTH-04 from docs/planning/P2_AUTH-04_TODO.md. First map current mobile auth UI states
against docs/product/specs/auth-mobile-web.md. Implement only missing state clarity and actions.
```
