# 005 Mobile Auth Stability

Status: backlog  
Priority: P1  
Milestone: M1

## Outcome

Amber and Primal mobile auth flows are stable across waiting, success, refusal, timeout, refresh, and return-to-site states.

## User Stories

- `US-AUTH-02` Connect on mobile with external app
- `US-AUTH-05` Understand auth failure and recovery

## Acceptance Criteria

- Amber flow is manually verified and documented.
- Primal flow is manually verified and documented.
- Waiting/success/refusal/timeout/return states are explicit.
- Refresh does not break still-valid authorization.
- App-specific limitations are documented.

## Out of Scope

- Storage migration.
- Permission model redesign not tied to verified bug.
