# Nostr Auth Rules

Updated: 2026-05-03  
Status: reference

This document defines the stable design, product, and protocol constraints for Nostr authentication in ToolStr.

It answers: is this auth idea acceptable?

It does not act as a task board. Product sequencing lives in [product roadmap](../product/roadmap.md), and feature details live in [feature briefs](../features/README.md).

## Goal

Define design rules for the Nostr connection domain and its evolution.

These rules are the basis for design validation, security review, and TDD for auth changes.

## Context

- NIP-07 is the primary desktop web signer path.
- NIP-98 is the backend HTTP auth mechanism.
- NIP-46 is the primary mobile web signer path.
- Bunker remains supported as an advanced path.
- The project must separate signer, application identity, HTTP auth, and UI orchestration.
- Raw `nsec` login is not a normal public webapp flow.

## Scope

This document covers:

- Target connection methods.
- Product and security practices.
- Protocol constraints.
- Application flows.
- Anti-patterns.
- Test contracts for auth work.

This document does not cover:

- Replacing the current backend with a server session model.
- Cookie/JWT/OAuth login for the current app.
- Native Android/iOS assetlinks, AASA, secure enclave, or certificate pinning requirements.
- Visual design of the auth modal.
- Backend auth outside NIP-98.

## Architecture Principles

- Auth must evolve without a big-bang refactor.
- UI must consume a clear connection domain instead of raw protocol details.
- The app must not switch ambiguously between multiple auth sources of truth.
- Each connection method is a strategy.
- A connection method opens an explicit attempt before producing an active connection.
- Domain and UI must not depend directly on `window.nostr`, `nostrconnect://`, `bunker://`, or `nostrsigner:`.
- NDK objects, browser providers, and transport details stay in adapters.
- The signer is the cryptographic source of truth.
- The stable internal identity reference is hex `pubkey`.

## Domain Vocabulary

### Connection Method

A connection method is a strategy that opens a connection attempt using a signing protocol or Nostr transport.

Examples:

- `nip07`
- `nip46-nostrconnect`
- `nip46-bunker`
- `nip55-android`

### Connection Attempt

A connection attempt represents the intermediate phase between choosing a strategy and obtaining an active connection.

It exposes:

- `methodId`
- User instructions when needed
- `complete()` to wait for or finalize connection
- `cancel()` to abort cleanly

### Signer

A signer is a signing capability. At minimum it provides:

- `getPublicKey()`
- `signEvent()`
- Optional `encrypt()` and `decrypt()` when supported

### Application Session

An application session is the normalized representation of the connected identity.

It exposes at least:

- `pubkeyHex`
- `npub`
- `methodId`
- `capabilities`
- `validatedAt`

### HTTP Auth

HTTP auth is separate from app session state. It transforms the current signer into a NIP-98 header for protected HTTP requests.

## Method Rules

### Desktop Web

- NIP-07 is the primary method.
- The app detects the browser provider, obtains the pubkey, then requests signatures only when needed.
- The app must not assume account changes are automatically notified by the provider.

### Mobile Web

- NIP-46 is the primary method.
- The default mobile path is `nostrconnect://` through an external app.
- `bunker://` remains supported as advanced mode, not the mainstream UX path.

### Bunker

- `bunker://` is an advanced mode.
- Bunker must remain an explicit strategy with its own contract and tests.
- Standard mobile UI should favor external-app Nostr Connect.

### Android

- NIP-55 is an optional future complement.
- It should remain compatible with the target architecture if added later.

### Backend HTTP

- NIP-98 remains the backend HTTP authentication method.
- Backend routes verify `kind:27235` tokens on protected routes.
- Do not replace NIP-98 with another backend auth mechanism without explicit product and architecture decision.

### Relay Auth

- NIP-42 is not application login.
- NIP-42 is only useful for private or restricted relays.
- It must not be confused with HTTP auth or application session state.

### User Private Key

- `nsec` is not a normal connection method for this webapp.
- No main flow should ask for a raw private key.
- If an advanced import mode exists, it must be separate from the standard flow.

## Best Practices

### Identity

- Store and process public keys as hex.
- Use `npub` only for display, links, sharing, and QR codes.
- Never use NIP-05 as proof of identity.
- Use NIP-05 only as a presentation attribute.

### Validation

- Revalidate pubkey at app load.
- Revalidate pubkey on tab return when relevant.
- Revalidate pubkey before sensitive actions.
- Do not assume one connected account remains identical for the full app lifetime.

### Permissions

- Request the narrowest practical NIP-46 permissions.
- Validate the `secret` associated with a NIP-46 flow.
- Remove the client keypair on logout.
- Clean transient logout state: URI, QR, timers, callbacks, and current attempt.

### Local NIP-46 Persistence

- Local persistence is only for restoring a NIP-46 signer after reload.
- It must never simulate connected state if the signer is not restorable.
- Invalid restore payloads must be purged immediately.
- Restore failure returns the app to disconnected state and offers explicit reconnect.

### Security Extraction For Web Scope

- Correlate NIP-46 strictly by `secret`, request `id`, and timeout.
- Prefer minimum permissions, logout cleanup, and fail-closed behavior.
- Redact sensitive values from logs: NIP-46 secrets, bunker tokens, auth URLs, and NIP-98 tokens.
- External links should avoid `window.opener`, for example with `rel="noopener"` where applicable.
- Use HTTPS/WSS only.
- Do not introduce backend session state.

## Protocol Rules

### NIP-07

- Obtains pubkey and signatures from a browser signer.
- Does not standardize reliable account-change notification.
- Is the desktop-priority method.

### NIP-46

- Supports remote signing through `nostrconnect://` and `bunker://`.
- Must handle `secret`, `perms`, response correlation by `id`, and `kind:24133` events.
- Must handle `auth_url` when the signer asks for extra authentication.
- In app code, protocol `auth_url` may be exposed as `authUrl`.

### NIP-55

- Supports Android signer integration through `nostrsigner:` and callback.
- If added, it should be modeled as an independent strategy.

### NIP-98

- Authenticates HTTP requests via `kind:27235` events.
- Token includes absolute URL `u` and HTTP `method`.
- Requests with body include `payload` when backend verification requires it.
- Server verifies kind, created_at, exact URL, exact method, payload when applicable, and signature.
- Invalid requests return `401 Unauthorized`.
- NIP-98 must not be replaced by a server session model without explicit decision.

### NIP-42

- Responds to relay `AUTH` challenges.
- Establishes a relay WebSocket session.
- Does not replace application login or NIP-98.

### NIP-19

- Provides representation formats such as `npub` and `nsec`.
- Does not define authentication strategy.
- Does not justify `nsec` as the main webapp login flow.

## Target Flows

### Common Flow

1. Discover available methods.
2. Show only strategies supported in the current context.
3. Open a connection attempt for the chosen method.
4. Expose intermediate instructions where needed.
5. Complete the attempt and produce a normalized session.
6. Load public identity associated with the final pubkey when needed.
7. Use the session for UI and business needs.
8. Revalidate pubkey before sensitive actions.
9. Clean all session and transport artifacts on logout.

### NIP-07 Flow

1. Detect browser provider.
2. Ask for pubkey.
3. Build normalized session.
4. Load public profile if needed.
5. Revalidate before sensitive signatures.

### NIP-46 Nostr Connect Flow

1. Generate client keypair and secret.
2. Ask for minimum permissions.
3. Generate `nostrconnect://` URI and optional QR.
4. Wait for signer response.
5. Validate secret and flow correlation.
6. Read final pubkey.
7. Build normalized session.
8. Clean transient state on success or failure.

### Bunker Flow

1. Receive or enter a `bunker://` token.
2. Validate structure and parameters.
3. Connect to the bunker signer.
4. Handle `auth_url` if required.
5. Read final pubkey.
6. Build normalized session.
7. Clean local session state on logout.

### NIP-98 Flow

1. Business code asks HTTP auth service for an auth header.
2. Auth service prepares a `kind:27235` event with URL and method.
3. Current signer signs the event.
4. Service returns `Authorization: Nostr ...`.
5. Backend strictly verifies token before processing.

## Avoid

- Exposing `nsec` in normal connection flow.
- Using `npub` as internal authority key.
- Using NIP-05 as authentication.
- Coding connection methods directly in Angular components.
- Making domain depend on NDK objects, `window.nostr`, or deep links.
- Assuming one relay is sufficient for all NIP-46 flows.
- Sharing ambiguous mutable auth state between old and new systems.
- Treating cached profile data as auth proof.
- Presenting `bunker://` as the mainstream mobile path.

## Test Contracts

Connection methods should be tested for:

- Availability.
- Opening connection.
- Returned session.
- User refusal.
- Protocol error.
- Cancellation.
- Logout cleanup.

Signer contracts should be tested for:

- `getPublicKey()`.
- `signEvent()`.
- Valid signature.
- Invalid signature.
- Event modified after signature.
- Unsupported capabilities.

HTTP auth should be tested for:

- Valid NIP-98 header creation.
- Exact URL.
- Exact method.
- Exact payload when applicable.
- Error when no signer is available.

Session store should be tested for:

- Session creation.
- Session invalidation.
- Pubkey revalidation.
- Transient-state cleanup.
- Full logout.

Protocol test matrix:

- NIP-07: absent `window.nostr`, user refusal, extension error, pubkey changed between actions, signature failure.
- NIP-46: missing/invalid secret, refused permissions, excessive permissions rejected by policy, timeout, late response from old attempt, received `auth_url`, correlation by `id`, full logout cleanup.
- NIP-98: wrong kind, stale `created_at`, mismatched URL, mismatched method, missing/wrong payload, invalid signature, `401` on negative cases.
- NIP-42 if added: challenge before read/write, retry after `AUTH`, restricted cases, logical expiration on WebSocket reconnect.

## Migration Strategy

- Add new services in parallel.
- New modal consumes only the connection domain.
- Do not replace existing services before contracts and tests exist.
- Consider progressive replacement only after contract validation and functional parity.

## Design Validation

The design is valid when:

- Each connection method is abstracted by a testable strategy.
- Domain does not depend on concrete protocol implementation.
- NIP-07, NIP-46, bunker, and NIP-98 are modeled without ambiguity.
- `nsec` is not part of the main flow.
- Identity revalidation is explicit.
- Contract tests exist before UI changes.
- New auth UI can ship without breaking existing behavior.
