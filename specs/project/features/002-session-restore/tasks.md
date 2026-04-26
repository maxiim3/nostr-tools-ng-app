# Tasks

## Active

- [ ] `AUTH-02` (in_progress) Validate mobile restore signer flow with NIP-46/Nostr Connect.
- [ ] `AUTH-07` (ready) Implement restore after refresh for valid NIP-07 and NIP-46 sessions.

## Done When

- Restore succeeds only with valid signer authorization.
- Invalid restore data is purged.
- Tests cover restore success and failure paths.
- Manual Amber/Primal validation is documented.

## Dependencies

- NDK restore payload behavior.
- Real mobile test coverage with Amber and Primal.

## Follow-Up Notes

- 2026-04-26: Reload currently drops the active connection even when the user selected the 1 hour option. Reproduce and fix as part of `AUTH-07` without changing the Supabase pack membership flow.
