# 003 Extension Auth Loading

Status: ready  
Priority: P1  
Milestone: M1

## Outcome

The extension auth button provides accessible loading feedback and prevents duplicate submissions.

## User Stories

- `US-AUTH-01` Connect with desktop extension
- `US-UI-01` See loading state during auth

## Acceptance Criteria

- The extension button shows pending feedback during auth attempt.
- The button is disabled while unavailable, connecting, or locally loading.
- Loading state is accessible.
- Loading state resets on success, error, cancel, and timeout-equivalent completion.

## Out of Scope

- Shared async button abstraction.
- Mobile external-app auth flow changes.
- Bunker flow changes.
