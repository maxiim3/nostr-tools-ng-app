# 006 Async Button Pattern

Status: backlog  
Priority: P1  
Milestone: M1

## Outcome

Introduce a shared async-button strategy only where repeated cases justify abstraction.

## User Stories

- `US-UI-02` Reuse async button behavior where it helps

## Acceptance Criteria

- At least three async button cases are inventoried.
- Shared pattern covers loading, disabled state, accessibility label, and anti-double-submit.
- Pattern is applied only where it reduces duplication.

## Out of Scope

- Forcing abstraction into simple local cases.
