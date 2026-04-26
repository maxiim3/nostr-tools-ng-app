# P3 AUTH-05 READY

Task: `AUTH-05` Make `bunker://` a clearly separate advanced mode

Status: READY

Readiness note: Can be picked up now if lower-priority UX cleanup is desired.

Why:
This is mostly UX hierarchy, copy, and layout work with low technical risk if existing bunker
functionality is preserved.

Prerequisites:

- None, though it is best after broader mobile auth UX work if scope is allowed to grow.

LLM-safe scope:

- Make external application auth the primary mobile path.
- Mark `bunker://` as advanced in copy and visual hierarchy.
- Keep existing advanced bunker functionality available.
- Add or update focused tests if the component has coverage for the affected UI.

Human/manual validation needed:

- Optional UX review to confirm mainstream users are not pushed toward manual bunker setup.

Do not change:

- NIP-46 restore mechanics.
- Permission model.
- Backend API behavior.

Recommended session prompt:

```text
Pick up task AUTH-05 from docs/planning/P3_AUTH-05_READY.md. Make bunker:// clearly advanced in the
auth modal without removing existing functionality. Do not change NIP-46 restore or permissions.
```
