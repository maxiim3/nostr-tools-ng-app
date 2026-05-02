# 007 Permission Minimization

Status: backlog  
Priority: P2  
Milestone: M1

## Outcome

The app requests only startup-required permissions, then requests additional permissions just in time.

## User Stories

- `US-AUTH-06` Grant fewer permissions upfront

## Acceptance Criteria

- Current requested permissions are inventoried.
- Each permission maps to a concrete feature need.
- Startup permission scope is reduced where safe.
- Desktop and mobile prompts remain understandable.

## Out of Scope

- Blocked bunker one-shot permissions implementation.
