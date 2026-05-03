# ADR 0002 - Nostr Connect Local Restore Without Backend Session

Date: 2026-04-24  
Status: accepted  
Implementation: pending (`AUTH-02`)

## Context

The project needs a mobile user to return to the site without repeating a full Nostr Connect pairing when signer authorization is still valid.

The backend is already aligned with the Nostr model:

- NIP-98 verification on every protected request.
- No application session cookie.
- No application JWT.

The problem is frontend-side: the active connection is lost on reload because connection state is in memory.

## Decision

The project adopts local restore of NIP-46 Nostr Connect on the frontend.

Constraints:

- No backend session.
- No auth cookie.
- No auth JWT.
- No fallback to a fake connected state based only on a user profile.
- No persisted `nsec`.

Restore must reconstruct a real signing connection, not just display an account.

## Consequences

- The webapp persists a minimal local snapshot for restoring the NIP-46 signer.
- At startup, the webapp attempts silent restore, then revalidates the pubkey.
- On restore failure, local state is purged, the app returns to disconnected state, and reconnect is explicit.
- The backend remains stateless and continues to verify NIP-98 per request.

## Rejected Options

- Classic server session after login.
- Application JWT.
- Application session cookie.
- Local profile cache alone as connected state.
