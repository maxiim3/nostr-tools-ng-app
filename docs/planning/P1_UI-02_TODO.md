# P1 UI-02 TODO

Task: `UI-02` Define generic async button strategy

Status: TODO

Readiness note: Depends on `UI-01`.

Why:
The work is achievable if kept small, but there is a risk of overengineering. It should follow
`UI-01` so the shared pattern is grounded in at least one concrete implementation.

Prerequisites:

- `UI-01` should be complete first.
- At least three async button cases should be inventoried.

LLM-safe scope:

- Inventory async buttons.
- Choose the smallest shared strategy that fits existing Angular patterns.
- Apply it to representative cases only.
- Add tests for the shared pattern or migrated cases.

Human/manual validation needed:

- Optional visual check for migrated buttons.
- Confirm the abstraction does not make simple cases harder to maintain.

Do not change:

- Auth behavior.
- Pack-request API behavior.
- UI copy beyond accessible loading states.

Recommended session prompt:

```text
Pick up task UI-02 from docs/planning/P1_UI-02_TODO.md after UI-01 is complete. Inventory async
buttons first, then implement the smallest shared pattern that fits at least three confirmed cases.
Do not change auth or API behavior.
```
