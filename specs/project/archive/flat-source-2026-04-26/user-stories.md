# User Stories

Status: active  
Updated: 2026-04-26

This file owns canonical user stories and acceptance criteria.

## Pack Access And Admin

### US-PACK-01 - Request Access To The Francophone Pack

As a public user, I want to request access to the francophone starter pack so that I can join the curated Nostr community.

Acceptance criteria:

- The user can open the francophone pack page.
- The user can open the request page.
- The user can submit a request using a Nostr-authenticated identity.
- The request status can be read later by the same identity.
- Request data survives redeployments after `INFRA-01`.

### US-PACK-02 - Moderate Pack Requests

As an admin, I want to review, approve, and reject pack requests so that the starter pack remains curated.

Acceptance criteria:

- Admin-only routes remain protected by NIP-98.
- Admin can list pending requests.
- Admin can approve a request.
- Admin can reject a request.
- Existing external endpoint behavior is preserved during storage migration.

### US-PACK-03 - Understand Product Scope From The Home Page

As a visitor, I want the home page to explain ToolStr clearly so that I understand what exists now and what is coming later.

Acceptance criteria:

- The starter pack remains the primary available module.
- Future modules are clearly marked as future or in construction.
- The page does not oversell unavailable capabilities.
- Visual direction stays aligned with the retained landing-page design reference.

## Nostr Authentication

### US-AUTH-01 - Connect With Desktop Extension

As a desktop web user, I want to connect with a browser signer so that I can use protected features without exposing a private key.

Acceptance criteria:

- NIP-07 remains the primary desktop path.
- The app validates the connected public key.
- The app can sign protected requests through the active signer.
- The extension button has clear loading and disabled behavior after `UI-01`.

### US-AUTH-02 - Connect On Mobile With External App

As a mobile web/PWA user, I want to choose an external Nostr Connect app so that I can authenticate without a browser extension.

Acceptance criteria:

- The first tap opens the external signer app when possible.
- Amber and Primal are manually verified in the mobile matrix.
- Waiting, success, refusal, timeout, and return-to-site states are visible and understandable.
- The flow does not require restarting the same auth attempt just to finish it.

### US-AUTH-03 - Restore A Valid Session After Refresh

As a returning user, I want a still-valid signer authorization to survive a refresh so that I do not repeat the whole auth flow unnecessarily.

Acceptance criteria:

- Valid NIP-07 authorization can be restored or revalidated after refresh.
- Valid NIP-46 external/mobile authorization can be restored where supported.
- Invalid, expired, denied, or revoked restore attempts return cleanly to disconnected state.
- The app never treats a cached profile as authenticated unless a real signer is restored.
- Invalid persisted NIP-46 restore data is purged.

### US-AUTH-04 - Use Bunker As Advanced Mode

As an advanced user, I want to keep `bunker://` access so that I can use remote signing without making the mainstream flow harder.

Acceptance criteria:

- External application auth remains the primary mobile path.
- `bunker://` is visually and textually marked as advanced.
- Existing advanced bunker functionality still works.
- One-shot permission work remains blocked until a clean NDK extension point or replacement is known.

### US-AUTH-05 - Understand Auth Failure And Recovery

As a user, I want clear retry, reopen, disconnect, and read-only states so that auth failures are recoverable.

Acceptance criteria:

- The UI clearly identifies the active signer state.
- The UI provides retry and disconnect actions where appropriate.
- The UI can present read-only mode when the user is not fully connected.
- Error copy explains likely recovery steps without exposing sensitive data.

### US-AUTH-06 - Grant Fewer Permissions Upfront

As a user, I want the app to request only necessary permissions at login so that the auth prompt feels safer and less intrusive.

Acceptance criteria:

- Startup login requests only startup-required permissions.
- Additional permissions are requested just in time.
- Desktop and mobile prompts remain understandable.
- Security tradeoffs are checked against the Nostr auth rules reference.

## Async UI Feedback

### US-UI-01 - See Loading State During Auth

As a user, I want auth buttons to show when work is pending so that I do not double-click or think the app is stuck.

Acceptance criteria:

- Extension auth button shows pending feedback.
- The button is disabled while unavailable, connecting, or locally loading.
- The loading state is accessible.
- State resets on success, error, cancel, or timeout-equivalent completion.

### US-UI-02 - Reuse Async Button Behavior Where It Helps

As a maintainer, I want a lightweight shared async-button strategy only when real repetition exists so that UI behavior stays consistent without over-abstraction.

Acceptance criteria:

- At least three async button cases are inventoried.
- A shared pattern covers loading, disabled state, accessible label, and anti-double-submit.
- The pattern is applied to representative cases.
- Simple local cases are not made harder to maintain.

## Merge Followers Tool

### US-MERGE-01 - Compare Source And Target Packs

As an admin, I want to compare a source list with the target francophone pack so that I can identify missing members.

Acceptance criteria:

- The admin can load a supported source.
- The admin can load the target pack.
- Pubkeys are normalized before comparison.
- Members are grouped into importable, already-present, and target-only groups.

### US-MERGE-02 - Select Members To Import

As an admin, I want to select importable members and preview the final pack so that I can update the pack safely.

Acceptance criteria:

- Importable members can be selected and deselected.
- Select-all is available for importable members.
- Already-present members are read-only.
- Target-only members are not removed by default.
- The final total can be previewed before publish.

## Feed Pack Francophone

### US-FEED-01 - Read Pack Member Posts

As a public user, I want to read recent posts from francophone pack members so that I can discover community activity.

Acceptance criteria:

- The feed shows kind 1 posts from pack members.
- Posts are sorted chronologically descending.
- The first iteration is read-only.
- Pagination or load more is available.

## Zap And Support

### US-ZAP-01 - Diagnose Local Zap API Failures

As a local developer, I want clear guidance when zap invoice generation fails so that I can identify whether the local API is running on the expected port.

Acceptance criteria:

- The local API health check is documented.
- Port collision with another process is easy to diagnose.
- The expected local API command remains clear.
