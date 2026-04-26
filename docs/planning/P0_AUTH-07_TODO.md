# P0 AUTH-07 TODO

Task: `AUTH-07` Restore Nostr session after refresh

Status: TODO

Readiness note: Needs real signer validation after implementation.

Why:
An LLM can implement the restore flow and tests, but NIP-46 behavior must be verified against real
mobile signers. The code can be completed today, but confidence depends on manual signer validation.

Prerequisites:

- Confirm NDK restore payload behavior during implementation.
- Decide minimal local restore storage: no private keys, only data required to restore a valid signer.
- Access to mobile signer testing after implementation.

LLM-safe scope:

- Add startup restore tests first.
- Restore valid NIP-07 authorization after refresh.
- Restore valid NIP-46 external/mobile authorization where supported.
- Purge invalid restore data.
- Avoid fake authenticated state from cached profiles.

Human/manual validation needed:

- Test Amber and Primal on mobile after implementation.
- Confirm denied, expired, and revoked signer behavior.

Do not change:

- Pack-request storage.
- Backend auth model.
- Product direction for `bunker://`.

Recommended session prompt:

```text
Pick up task AUTH-07 from docs/planning/P0_AUTH-07_TODO.md. Implement only restore after refresh
for NIP-07 and NIP-46 where valid. First inspect nostr-session.service.ts, connection-facade.ts,
ndk-nip46-restore.ts, ADR 0002, and relevant tests. Do not change pack-request storage.
```
