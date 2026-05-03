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

## Applicable Security Notes

The broader remote-signer threat-model research included native and OAuth-like controls that are outside the current web scope. For this app, keep the following applicable constraints:

- Correlate NIP-46 responses strictly by `secret`, request `id`, and timeout.
- Request the narrowest practical permissions.
- Clean all transient state on logout: URI, QR, timers, callbacks, current attempt, and client keypair.
- Fail closed when restore or signer validation cannot be trusted.
- Redact sensitive values from logs: NIP-46 secret, bunker token, `auth_url`, and NIP-98 token.
- External links opened by the app should avoid `window.opener`, for example with `rel="noopener"` where applicable.
- The app should remain HTTPS/WSS-only and must not introduce backend sessions for Nostr auth.
