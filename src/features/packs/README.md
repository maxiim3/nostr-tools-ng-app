# Feature Packs

Ce dossier contient le workflow metier principal : admission immediate au pack francophone, persistance Supabase, consultation admin et retrait de membres.

## Fichiers clefs

- [StarterPackRequestService](./application/starter-pack-request.service.ts)
- [FrancophonePackMembershipService](./application/francophone-pack-membership.service.ts)
- [Pack request page](./presentation/pages/pack-request.page.ts)
- [Admin members page](../admin/presentation/pages/pack-admin-requests.page.ts)
- [Backend API](../../../server.mjs)

## Workflow admission utilisateur

```mermaid
sequenceDiagram
  participant User as PackRequestPage
  participant Service as StarterPackRequestService
  participant Auth as NostrHttpAuthService
  participant API as server.mjs
  participant DB as Supabase francophone_pack_members

  User->>Service: submitRequest()
  Service->>Auth: createAuthorizationHeader(NIP-98)
  Service->>API: POST /api/pack-members + Authorization
  API->>API: requireNostrAuth()
  API->>DB: upsert active member
  API-->>Service: 201 member
```

## Workflow admin

```mermaid
sequenceDiagram
  participant Admin as PackAdminRequestsPage
  participant Service as StarterPackRequestService
  participant API as server.mjs
  participant DB as Supabase francophone_pack_members

  Admin->>Service: listAdminRequests()
  Service->>API: GET /api/admin/pack-members (NIP-98 admin)
  API->>DB: list rows where removed_at is null
  API-->>Admin: current members

  Admin->>Service: removeMember(pubkey)
  Service->>API: POST /api/admin/pack-members/:pubkey/remove (NIP-98 admin)
  API->>DB: set removed_at
  API-->>Admin: 204
```

## Stockage

Supabase est la source persistante pour les champs `pubkey`, `username`, `description`, `avatarUrl`, `joinedAt`, compteurs visibles, metadata de demande depuis l'app et `removedAt`.

## Couplage important a connaitre

- Le controle admin UI repose sur `NostrSessionService.isAdmin()` (npub dans la config pack).
- Le backend revalide aussi le role admin via `ADMIN_NPUBS` dans [server.mjs](../../../server.mjs).
- Le retrait admin conserve la ligne Supabase et renseigne `removedAt`.
