# 008 Mobile Auth States

Status: backlog  
Priority: P2  
Milestone: M1

## Outcome

Mobile auth states are explicit and actionable for active signer, retry, reopen app, disconnect, and read-only mode.

## User Stories

- `US-AUTH-05` Understand auth failure and recovery

## Acceptance Criteria

- UI clearly identifies current signer/auth state.
- UI exposes retry, reopen app, and disconnect where relevant.
- Read-only mode is explicit when not fully connected.
- State copy maps to verified mobile behavior.

## Out of Scope

- Storage migration or backend changes.
