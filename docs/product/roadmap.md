# Product Roadmap

Updated: 2026-05-03

This file owns the current product sequencing and milestone scope.

## Now

| Order | Feature                 | Outcome                                                                                   |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------- |
| 001   | Auto-admit pack members | Users join the francophone pack immediately; Supabase stores members; admin sees members. |
| 002   | Session restore         | Refresh restores valid NIP-07/NIP-46 sessions and purges invalid data.                    |
| 003   | Extension auth loading  | Extension auth button has clear loading/disabled behavior.                                |
| 004   | Advanced bunker mode    | `bunker://` remains available as an advanced mode.                                        |

## Next

| Order | Feature                 | Outcome                                                            |
| ----- | ----------------------- | ------------------------------------------------------------------ |
| 005   | Mobile auth stability   | Amber and Primal mobile flows are stable and documented.           |
| 006   | Async button pattern    | Shared async-button strategy exists only where repetition is real. |
| 007   | Permission minimization | Login asks only minimum startup permissions.                       |
| 008   | Mobile auth states      | Mobile auth states are explicit and actionable.                    |

## Later

| Order | Feature                  | Milestone | Outcome                                                  |
| ----- | ------------------------ | --------- | -------------------------------------------------------- |
| 009   | Bunker permission grants | M1        | One-shot bunker permissions or a documented replacement. |
| 010   | Follower merge           | M2        | Admin compares and imports missing follows safely.       |
| 011   | Francophone pack feed    | M3        | Public read-only feed for francophone pack members.      |

## Milestones

### M1 - Pack Francophone

Product objective: provide an immediate join flow for the francophone starter pack, with an admin backoffice to view and remove members.

Target capabilities:

- Public pack page: `/packs/francophone`.
- Public join page: `/packs/francophone/request` or replacement route.
- Admin members page: `/packs/francophone/admin/requests` or replacement route.
- Auto-admission into the francophone pack after authenticated click.
- Supabase membership database storing member profile snapshots, counters, join metadata, and removal metadata.
- Nostr auth for web/PWA: NIP-07 desktop, NIP-46 Nostr Connect mobile, `bunker://` advanced mode.
- Backend HTTP auth using NIP-98 for protected routes.
- Global shell with header and footer.
- Zap modal.
- Internationalization in French, English, and Spanish.
- Terms/legal page.

Acceptance criteria:

- Users can join the francophone pack immediately without manual approval.
- Admins can view all current members through a protected admin table.
- Admins can remove members from the pack through a protected action.
- Member data survives redeployments in Supabase.
- Desktop extension auth works with clear loading feedback.
- Valid mobile/desktop signer sessions can be restored after refresh where supported.
- Mobile auth via external app can be completed and resumed clearly.
- The UI does not present `bunker://` as the default mainstream path.
- Required product, architecture, and auth constraints are documented.

### M2 - Merge Followers Tool

Product objective: provide an admin/operator tool to compare a source pack with the francophone target pack and selectively import missing follows.

Expected workflow:

- Load source.
- Load target.
- Normalize pubkeys.
- Compare lists.
- Select and deselect importable members.
- Select all importable members.
- Preview final total.
- Republish target pack.

Acceptance criteria:

- Admin can compare a supported source against the target francophone pack.
- Importable members are visually distinct from already-present members.
- The workflow is non-destructive by default.
- Credits to Calle and Following.space are visible in the relevant UI.

### M3 - Feed Pack Francophone

Product objective: provide a public feed of kind 1 posts from members of the francophone pack.

Initial scope:

- Route: `/packs/francophone/feed`.
- Show kind 1 posts from members of the pack.
- Sort chronologically descending.
- Provide simple read-only browsing.
- Support pagination or load more.

Out of scope:

- Complex repost handling.
- Advanced long-form support.
- SEO SSR requirement.
- Rich social engine.

## Product Limits

- Do not open merge tools to non-admin users yet.
- Do not open custom request-page creation for other packs yet.
- Do not add sub-admins yet.
- Do not open a meta/self-serve mode yet.
- Keep the architecture compatible with these possibilities later.
