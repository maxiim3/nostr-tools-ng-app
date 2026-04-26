# 001 Session Restore

Status: in progress  
Priority: P0  
Milestone: M1

## Outcome

A valid NIP-07 or NIP-46 authorization survives refresh. Invalid persisted auth is purged and never treated as authenticated state.

## User Stories

- `US-AUTH-02` Connect on mobile with external app
- `US-AUTH-03` Restore a valid session after refresh
- `US-AUTH-05` Understand auth failure and recovery

## Acceptance Criteria

- Valid NIP-07 authorization can be restored or revalidated after refresh.
- Valid NIP-46 authorization can be restored where supported.
- Invalid, expired, denied, or revoked restore attempts return to disconnected state.
- Invalid persisted NIP-46 restore payload is purged.
- Cached profile data alone never creates authenticated state.

## Out of Scope

- Storage migration for pack requests.
- Backend auth model changes.
- Bunker permission model redesign.
