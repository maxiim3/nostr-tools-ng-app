# P2 AUTH-03 TODO

Task: `AUTH-03` Reduce login permissions

Status: TODO

Readiness note: Needs permission inventory and confirmation before behavior changes.

Why:
An LLM can inventory current permissions and propose a minimum startup set. Changing behavior should
wait for confirmation that the proposed permission model is acceptable.

Prerequisites:

- Confirm the minimum startup permission set before editing behavior.

LLM-safe scope:

- Inventory current requested permissions.
- Map each permission to the feature that needs it.
- Propose a minimum startup permission set and just-in-time permission flow.
- Implement only after explicit confirmation.

Human/manual validation needed:

- Confirm product/security tradeoff for permission prompts.
- Test desktop and mobile signer prompts after any code change.

Do not change:

- Restore-after-refresh behavior unless required by permission changes.
- `bunker://` UX positioning.

Recommended session prompt:

```text
Pick up task AUTH-03 from docs/planning/P2_AUTH-03_TODO.md. First inventory current login
permissions and map them to features. Propose the minimum startup set before changing code.
```
