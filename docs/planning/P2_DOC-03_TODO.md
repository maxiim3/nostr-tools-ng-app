# P2 DOC-03 TODO

Task: `DOC-03` Update architecture docs after Supabase

Status: TODO

Readiness note: Depends on `INFRA-01`.

Why:
This is documentation-only and straightforward once the final Supabase implementation exists.

Prerequisites:

- `INFRA-01` must be complete or its final implementation must be known.

LLM-safe scope:

- Update architecture docs to describe Supabase-backed persistent pack-request storage.
- Document required environment variables.
- Remove or mark legacy SQLite runtime notes.
- Update the board only if the implementation and docs are both complete.

Human/manual validation needed:

- Confirm docs match the deployed environment variable names.

Do not change:

- Runtime server code.
- Test code.
- Auth documentation unless directly affected by storage documentation.

Recommended session prompt:

```text
Pick up task DOC-03 from docs/planning/P2_DOC-03_TODO.md after INFRA-01 is complete.
Update only documentation to reflect the final Supabase storage implementation. Do not change
runtime code.
```
