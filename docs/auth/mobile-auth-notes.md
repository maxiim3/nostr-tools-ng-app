# Mobile Auth Notes

This document keeps the useful mobile-auth UX and security notes extracted from older planning/research material.

## Target UX Patterns

- Show one clear remote-signer handshake screen when linking a signer with QR or deeplink.
- Explain the app name, what is shared, and what the signer will be asked to sign.
- Persist a small connected status with switch/disconnect controls.
- For signature prompts, explain why a signature is needed, summarize what is signed, and show scope/duration when relevant.
- Provide recovery actions: reconnect signer, use backup signer, continue read-only when possible.
- Make remote signer latency visible, with retry or reopen-app affordances after a short wait.
- Replace generic errors with actionable copy such as `No response from signer. Open your signer app and try again.`

## Mobile Stabilization Matrix

Manual validation should cover Amber and Primal for:

- Waiting for approval.
- Successful approval.
- User refusal.
- Timeout.
- Return to site after app switch.
- Refresh while authorization is still valid.
- Expired or revoked authorization.

### Amber / Primal Validation Notes

Status: pending real-device verification. The implementation preserves Toolstr state for the web-side flow and the automated suite covers unresolved pending, simulated approval return, timeout invalidation, retry, cancellation, and stale completion after cancellation. Real Amber and Primal app behavior still needs to be checked on devices because mobile browsers and signer apps can differ in whether they return focus automatically.

| Scenario                                       | Amber result                | Primal result               | Toolstr expected behavior                                                                                                                                                  |
| ---------------------------------------------- | --------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Waiting for approval                           | Pending manual verification | Pending manual verification | Keep `awaitingExternalSignerApproval`, keep the open/reopen app link, copy link, QR, cancel, and choose-another-method controls visible.                                   |
| Successful approval                            | Pending manual verification | Pending manual verification | Complete the signer-backed session, apply the NDK signer, fetch display profile as enrichment, close the modal, and clear transient URI/waiting state.                     |
| User refusal or denial                         | Pending manual verification | Pending manual verification | Resolve to a recoverable denied/retry state with safe copy, clear URI/waiting state, and avoid raw protocol errors as the primary UI message.                              |
| Timeout                                        | Pending manual verification | Pending manual verification | Resolve to `timedOut`, clear transient URI/waiting/timer state, and offer retry. Late signer responses from the timed-out attempt must not authenticate.                   |
| Return to site after app switch                | Pending manual verification | Pending manual verification | Preserve the active attempt while the page remains alive. If the signer does not return focus automatically, the user can manually return and still see recovery guidance. |
| Refresh while authorization remains valid      | Pending manual verification | Pending manual verification | Use the existing NIP-46 restore flow only when a valid restore payload recreates a live signer and validates the expected user pubkey.                                     |
| Expired, revoked, or unavailable authorization | Pending manual verification | Pending manual verification | Fail closed to reconnect-required or recoverable retry semantics; cached profile data must not authenticate.                                                               |

App-specific limitations should be recorded here after device testing:

| App    | Limitation                  | Product behavior                                                                                  |
| ------ | --------------------------- | ------------------------------------------------------------------------------------------------- |
| Amber  | Pending manual verification | Do not assume automatic return to browser; Toolstr keeps open/reopen and copy controls available. |
| Primal | Pending manual verification | Do not assume automatic return to browser; Toolstr keeps open/reopen and copy controls available. |

## Applicable Security Notes

The broader remote-signer threat-model research included native and OAuth-like controls that are outside the current web scope. For this app, keep the following applicable constraints:

- Correlate NIP-46 responses strictly by `secret`, request `id`, and timeout.
- Request the narrowest practical permissions.
- Clean all transient state on logout: URI, QR, timers, callbacks, current attempt, and client keypair.
- Fail closed when restore or signer validation cannot be trusted.
- Redact sensitive values from logs: NIP-46 secret, bunker token, `auth_url`, and NIP-98 token.
- External links opened by the app should avoid `window.opener`, for example with `rel="noopener"` where applicable.
- The app should remain HTTPS/WSS-only and must not introduce backend sessions for Nostr auth.
