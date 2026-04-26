# P1 AUTH-08 TODO

Task: `AUTH-08` Stabilize Amber and Primal mobile flow

Status: TODO

Readiness note: Depends on `AUTH-07` and real mobile-device testing.

Why:
An LLM can prepare the test matrix, documentation, and code fixes for observed issues. It cannot
fully validate Amber and Primal behavior without real mobile-device testing.

Prerequisites:

- `AUTH-07` should be complete first.
- Access to Amber and Primal mobile testing.

LLM-safe scope:

- Create or refine a mobile auth test matrix.
- Document waiting, success, refusal, timeout, refresh, and return-to-site states.
- Make small code changes for clearly observed failures.

Human/manual validation needed:

- Run Amber flow on mobile.
- Run Primal flow on mobile.
- Verify refresh does not break a still-valid authorization.

Do not change:

- Storage implementation.
- Broad permission model unless tied to a verified mobile-flow bug.

Recommended session prompt:

```text
Pick up task AUTH-08 from docs/planning/P1_AUTH-08_TODO.md after AUTH-07 is complete. Verify Amber
and Primal mobile flows, document the matrix, and make only the smallest code changes needed for
observed failures. Do not change storage or broad auth permissions.
```
