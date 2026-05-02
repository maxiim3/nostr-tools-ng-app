# Milestones

Status: active  
Updated: 2026-04-26

This file owns milestone definitions and milestone-level acceptance criteria.

## Milestone Summary

| Milestone                  | Status      | Outcome                                                                                 |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| M1 - Pack francophone      | Active      | Auto-admit join flow, Supabase membership storage, admin member table, auth hardening   |
| M2 - Merge followers tool  | Not started | Admin/operator compares and merges source follow lists into the target francophone pack |
| M3 - Feed pack francophone | Not started | Public feed of kind 1 posts from members of the francophone pack                        |

## M1 - Pack Francophone

Status: active

Product objective:

Provide an immediate join flow for the francophone starter pack, with an admin backoffice to view and remove members.

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

Current M1 feature set:

- `001-auto-admit-pack-members`
- `002-session-restore`
- `003-extension-auth-loading`
- `004-advanced-bunker-mode`
- `005-mobile-auth-stability`
- `006-async-button-pattern`
- `007-permission-minimization`
- `008-mobile-auth-states`
- `009-bunker-permission-grants`

Current risks:

- Runtime member storage is not persistent across redeployments until `001-auto-admit-pack-members` is done.
- Nostr session restore remains partially incomplete until `002-session-restore` is closed.
- Mobile external-app auth still needs stabilization with Amber and Primal.
- Some auth UI states remain unclear until `006` and `008` are closed.

Milestone acceptance criteria:

- Users can join the francophone pack immediately without manual approval.
- Admins can view all current members through a protected admin table.
- Admins can remove members from the pack through a protected action.
- Member data survives redeployments in Supabase.
- Desktop extension auth works with clear loading feedback.
- Valid mobile/desktop signer sessions can be restored after refresh where supported.
- Mobile auth via external app can be completed and resumed clearly.
- The UI does not present `bunker://` as the default mainstream path.
- Required product, architecture, and auth constraints are documented in feature folders and support docs.

## M2 - Merge Followers Tool

Status: not started

Product objective:

Provide an admin/operator tool to compare a source pack with the francophone target pack and selectively import missing follows.

Access:

- Admin only.

Inputs accepted:

- Following.space URL.
- Usable pack reference.
- Usable coordinate if supported.

Required visual structure:

- Left column: source.
- Right column: target.
- Center: correspondence and transfer indication.

Required ordering:

- Group 1: members present in source and absent from target. These are import candidates and appear first.
- Group 2: members already present in both source and target. These are read-only matches and appear second.
- Group 3: members present only in target. These remain visible on the right and are not removed by default.

Expected actions:

- Load source.
- Load target.
- Normalize pubkeys.
- Compare lists.
- Select and deselect importable members.
- Select all importable members.
- Preview final total.
- Republish target pack.

Milestone acceptance criteria:

- Admin can compare a supported source against the target francophone pack.
- Importable members are visually distinct from already-present members.
- The workflow is non-destructive by default.
- Credits to Calle and Following.space are visible in the relevant UI.

## M3 - Feed Pack Francophone

Status: not started

Product objective:

Provide a public feed of kind 1 posts from members of the francophone pack.

Route:

- `/packs/francophone/feed`

Initial scope:

- Show kind 1 posts.
- Include posts from members of the pack.
- Sort chronologically descending.
- Provide simple read-only browsing.
- Support pagination or load more.

Initial non-scope:

- No complex repost handling.
- No advanced long-form support.
- No SEO SSR requirement.
- No rich social engine.

Milestone acceptance criteria:

- Public users can read recent kind 1 posts from pack members.
- The feed is chronologically understandable.
- The implementation stays scoped to simple read-only browsing.

## Current Product Limits

- Do not open merge tools to non-admin users yet.
- Do not open custom request-page creation for other packs yet.
- Do not add sub-admins yet.
- Do not open a meta/self-serve mode yet.
- Keep the architecture compatible with these possibilities later.
