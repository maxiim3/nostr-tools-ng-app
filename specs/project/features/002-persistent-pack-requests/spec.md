# 002 Persistent Pack Requests

Status: ready  
Priority: P0  
Milestone: M1

## Outcome

Pack-request data survives redeployments while preserving current public and admin API behavior.

## User Stories

- `US-PACK-01` Request access to the francophone pack
- `US-PACK-02` Moderate pack requests

## Acceptance Criteria

- `GET /api/pack-requests/me` keeps current external behavior.
- `POST /api/pack-requests` keeps current external behavior.
- `GET /api/admin/pack-requests` keeps current external behavior.
- Admin approve/reject remains protected by NIP-98.
- Data survives redeployments.
- Supabase environment variables are documented.

## Out of Scope

- Auth/session behavior changes.
- Public response contract redesign.
- Approve/reject semantics changes.
