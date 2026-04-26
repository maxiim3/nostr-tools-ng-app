# 001 Auto-Admit Pack Members

Status: ready  
Priority: P0 absolute  
Milestone: M1

## Outcome

Clicking the francophone pack join button immediately admits the authenticated user into the pack and stores the member record in Supabase.

## User Stories

- `US-PACK-01` Join the francophone pack immediately
- `US-PACK-02` View all francophone pack members in admin
- `US-PACK-03` Remove a member from the francophone pack

## Acceptance Criteria

- A signed-in user clicks the join button and is auto-admitted without manual admin approval.
- The app no longer exposes admin approve/reject as the primary workflow.
- Supabase is the persistent database for francophone pack membership records.
- Each member record stores the internal `pubkey` plus username, profile description, avatar, joined date, follower count, following count, Nostr account creation date when inferable, post count, and zap count when visible.
- Each member record stores whether the member requested/joined from this app and, if yes, when.
- Admin can view all current francophone pack members in a table.
- Admin table columns are avatar, username, profile description, account creation date, requested from app, requested/joined-at date, and remove-from-pack action.
- Removing a member removes them from the pack and keeps a database record for audit/history.
- Admin routes and member-removal actions remain protected by server-side NIP-98 admin checks.
- Existing runtime SQLite storage is retired for this membership flow.
- Required Supabase environment variables and schema are documented.

## Data Contract

Required stored fields:

- `pubkey` as the stable unique identity key.
- `username` from latest known profile metadata.
- `description` from latest known profile metadata.
- `avatarUrl` from latest known profile metadata.
- `joinedAt` for the date the user entered the pack.
- `followerCount` when available.
- `followingCount` when available.
- `accountCreatedAt` when inferable from relay/profile history; otherwise unknown/null.
- `postCount` when available.
- `zapCount` when visible from public data; otherwise unknown/null.
- `requestedFromApp` boolean.
- `requestedAt` when the join originated from this app.
- `removedAt` when a member is removed from the pack.

## Out of Scope

- Auth/session behavior changes.
- Broad mobile auth UX redesign.
- Feed implementation.
- Merge-followers tooling.
