# Feature Registry

Status: active  
Updated: 2026-04-26

This file owns canonical feature records and links them to tasks, milestones, user stories, and references.

## Registry

| Feature ID           | Feature                                | Status                  | Priority | Milestone | Tasks                |
| -------------------- | -------------------------------------- | ----------------------- | -------- | --------- | -------------------- |
| `F-INFRA-STORAGE`    | Runtime storage persistence            | Ready                   | P0       | M1        | `INFRA-01`, `DOC-03` |
| `F-AUTH-RESTORE`     | Nostr session restore                  | In progress/ready split | P0       | M1        | `AUTH-02`, `AUTH-07` |
| `F-AUTH-MOBILE`      | Mobile external-app auth stabilization | Backlog                 | P1       | M1        | `AUTH-08`, `AUTH-04` |
| `F-AUTH-LOADING`     | Auth loading and async button feedback | Ready/backlog split     | P1       | M1        | `UI-01`, `UI-02`     |
| `F-AUTH-BUNKER`      | Advanced bunker positioning            | Ready/blocked split     | P3       | M1        | `AUTH-05`, `AUTH-06` |
| `F-AUTH-PERMS`       | Permission minimization                | Backlog                 | P2       | M1        | `AUTH-03`, `AUTH-06` |
| `F-MERGE-FOLLOWERS`  | Merge followers tool                   | Not started             | Later    | M2        | future tasks         |
| `F-FEED-FRANCOPHONE` | Feed pack francophone                  | Not started             | Later    | M3        | future tasks         |
| `F-HOME-MODULES`     | Landing module direction               | Supporting reference    | Later    | M1+       | future tasks         |

## `F-INFRA-STORAGE` - Runtime Storage Persistence

Status: ready  
Priority: P0  
Milestone: M1

Outcome:

Pack-request data survives redeployments without changing public or admin endpoint behavior.

Tasks:

- `INFRA-01` Migrate runtime storage to Supabase.
- `DOC-03` Update architecture docs after Supabase.

User stories:

- `US-PACK-01`
- `US-PACK-02`

Dependencies:

- Supabase project URL.
- Supabase service-role key for the Bun server only.
- Deployment environment variables.

Acceptance criteria:

- Existing pack-request endpoints keep external behavior.
- Admin approve/reject remains protected by NIP-98.
- Data survives redeployments.
- Supabase environment variables are documented.
- Tests cover API behavior without relying on SQLite internals.

References:

- `../../docs/architecture/overview.md`
- `../../src/features/packs/README.md`
- `../../server.mjs`
- `../../server.test.mjs`

## `F-AUTH-RESTORE` - Nostr Session Restore

Status: active split between `AUTH-02` and `AUTH-07`  
Priority: P0  
Milestone: M1

Outcome:

A valid NIP-07 or NIP-46 signer authorization can survive refresh or be cleanly rejected when invalid.

Tasks:

- `AUTH-02` Test mobile restore signer NIP-46 / Nostr Connect.
- `AUTH-07` Restore Nostr session after refresh.

User stories:

- `US-AUTH-02`
- `US-AUTH-03`
- `US-AUTH-05`

Dependencies:

- NDK restore payload behavior.
- Amber and Primal mobile behavior.
- Minimal local restore storage with no private keys.

Acceptance criteria:

- Valid NIP-07 restore succeeds when provider authorization is still valid.
- Valid NIP-46 restore succeeds where supported.
- Invalid restore payloads are purged.
- The app does not simulate login from cached profile data.

References:

- `../../docs/references/nostr-auth-rules.md`
- `../../docs/architecture/decisions/0002-nostr-connect-local-restore.md`

## `F-AUTH-MOBILE` - Mobile External-App Auth Stabilization

Status: backlog  
Priority: P1  
Milestone: M1

Outcome:

Amber and Primal flows are manually verified and any observed instability is fixed with the smallest targeted change.

Tasks:

- `AUTH-08` Stabilize Amber and Primal mobile flow.
- `AUTH-04` Review mobile auth UX.

User stories:

- `US-AUTH-02`
- `US-AUTH-05`

Dependencies:

- `AUTH-07` should complete first.
- Real mobile testing with Amber and Primal.

Acceptance criteria:

- Waiting, success, refusal, timeout, refresh, and return-to-site states are documented.
- Mobile UI states are understandable and actionable.
- App-specific limitations are captured in docs or UI copy.

References:

- `../../docs/research/nostr-auth-ux-pattern.md`
- `../../docs/research/Remote‑signer threat‑model checklist.md`

## `F-AUTH-LOADING` - Auth Loading And Async Button Feedback

Status: ready/backlog split  
Priority: P1  
Milestone: M1

Outcome:

Users get accessible feedback during async auth actions, and duplicate submissions are prevented.

Tasks:

- `UI-01` Add loader and disabled state to extension auth button.
- `UI-02` Define generic async button strategy.

User stories:

- `US-UI-01`
- `US-UI-02`

Dependencies:

- `UI-02` depends on `UI-01` and an inventory of at least three async button cases.

Acceptance criteria:

- Local fix exists for the extension button.
- Shared pattern is introduced only if repetition justifies it.
- Loading states remain accessible.

## `F-AUTH-BUNKER` - Advanced Bunker Positioning

Status: ready/blocked split  
Priority: P3  
Milestone: M1

Outcome:

`bunker://` remains available for advanced users without being the primary public path.

Tasks:

- `AUTH-05` Make `bunker://` a clearly separate advanced mode.
- `AUTH-06` One-shot bunker permissions.

User stories:

- `US-AUTH-04`
- `US-AUTH-06`

Dependencies:

- `AUTH-06` is blocked by lack of a clean NDK extension point for one-shot permission injection.

Acceptance criteria:

- Mainstream users see external app auth first.
- Bunker remains usable for advanced users.
- Blocked permission work is not mixed with ready work.

## `F-AUTH-PERMS` - Permission Minimization

Status: backlog  
Priority: P2  
Milestone: M1

Outcome:

The app asks for the minimum useful permissions at startup and requests additional permissions only when needed.

Tasks:

- `AUTH-03` Reduce login permissions.
- `AUTH-06` One-shot bunker permissions, blocked.

User stories:

- `US-AUTH-06`

Dependencies:

- Confirm the minimum startup permission set.
- Keep `AUTH-06` blocked until implementation feasibility changes.

Acceptance criteria:

- Current permissions are inventoried.
- Each permission maps to a feature need.
- Startup permissions are reduced where safe.

## `F-MERGE-FOLLOWERS` - Merge Followers Tool

Status: not started  
Priority: later  
Milestone: M2

Outcome:

Admin can compare a source pack/list against the target francophone pack and republish a selected final target.

User stories:

- `US-MERGE-01`
- `US-MERGE-02`

Acceptance criteria:

- Source and target are loaded and compared.
- Importable, already-present, and target-only members are visually distinct.
- Import is non-destructive by default.
- Credits are visible.

## `F-FEED-FRANCOPHONE` - Feed Pack Francophone

Status: not started  
Priority: later  
Milestone: M3

Outcome:

Public users can read a simple chronological feed of kind 1 posts from pack members.

User stories:

- `US-FEED-01`

Acceptance criteria:

- Kind 1 posts from pack members are shown.
- Posts are sorted chronologically descending.
- First version is read-only and paginated or load-more based.

## `F-HOME-MODULES` - Landing Module Direction

Status: supporting reference  
Priority: later  
Milestone: M1+

Outcome:

The home page keeps a clear module system that can grow without overselling unavailable tools.

References:

- `../../docs/product/landing-page-design.md`
