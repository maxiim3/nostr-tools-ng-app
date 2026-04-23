# Feature Packs

Ce dossier contient le workflow metier principal : demande d'acces au starter pack francophone, moderation admin, puis publication Nostr (pack + notification).

## Fichiers clefs

- [StarterPackRequestService](./application/starter-pack-request.service.ts)
- [FrancophonePackMembershipService](./application/francophone-pack-membership.service.ts)
- [FrancophonePackNotificationService](./application/francophone-pack-notification.service.ts)
- [Pack request page](./presentation/pages/pack-request.page.ts)
- [Admin requests page](../admin/presentation/pages/pack-admin-requests.page.ts)
- [Backend API](../../../server.mjs)

## Workflow demande utilisateur

```mermaid
sequenceDiagram
  participant User as PackRequestPage
  participant Service as StarterPackRequestService
  participant Auth as NostrHttpAuthService
  participant API as server.mjs
  participant DB as SQLite pack_requests

  User->>Service: submitRequest()
  Service->>Auth: createAuthorizationHeader(NIP-98)
  Service->>API: POST /api/pack-requests + Authorization
  API->>API: requireNostrAuth()
  API->>DB: upsert pending request
  API-->>Service: 204
```

## Workflow moderation admin

```mermaid
sequenceDiagram
  participant Admin as PackAdminRequestsPage
  participant Req as StarterPackRequestService
  participant Membership as FrancophonePackMembershipService
  participant Notify as FrancophonePackNotificationService
  participant Nostr as Nostr relays
  participant API as server.mjs

  Admin->>Req: listAdminRequests()
  Req->>API: GET /api/admin/pack-requests (NIP-98)
  API-->>Admin: pending requests

  Admin->>Membership: addMember(pubkey)
  Membership->>Nostr: publish kind 39089 with updated p tags

  Admin->>Notify: sendApprovalDirectMessage(pubkey)
  Notify->>Nostr: send kind 4 DM

  Admin->>Req: approveRequest(pubkey)
  Req->>API: POST /api/admin/pack-requests/:pubkey/approve
  API-->>Admin: 204
```

## Evenements Nostr concernes

- `kind 39089` : event pack (membres stockes dans les tags `p`)
- `kind 4` : message prive d'approbation

## Couplage important a connaitre

- Le controle admin UI repose sur `NostrSessionService.isAdmin()` (npub dans la config pack).
- Le backend revalide aussi le role admin via `ADMIN_NPUBS` dans [server.mjs](../../../server.mjs).
- L'approbation supprime la demande en base apres publication/notification.
