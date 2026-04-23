# Core Nostr

Ce dossier porte la couche applicative Nostr "utilisee par l'UI" : session utilisateur, client NDK, auth HTTP NIP-98 et operations metier simples (follow, DM, publication).

## Fichiers clefs

- [NostrSessionService](./application/nostr-session.service.ts)
- [NostrClientService](./application/nostr-client.service.ts)
- [NostrHttpAuthService](./application/nostr-http-auth.service.ts)
- [FollowService](./application/follow.service.ts)
- [Relay config](./infrastructure/relay.config.ts)
- [Auth modal component](../layout/presentation/components/app-auth-modal.component.ts)
- [Connection facade (methodes NIP-07/NIP-46)](../nostr-connection/application/connection-facade.ts)

## Workflow auth utilisateur (UI -> session -> signer)

```mermaid
flowchart TD
  UI[Auth Modal<br/>app-auth-modal.component.ts]
  Session[NostrSessionService]
  Facade[NostrConnectionFacadeService]
  Conn[NIP-07 or NIP-46 method]
  Client[NostrClientService]
  Profile[fetchProfile + SessionUser]

  UI --> Session
  Session --> Facade
  Facade --> Conn
  Conn --> Facade
  Facade --> Session
  Session --> Client
  Client --> Profile
  Profile --> Session
```

Points importants :

- `NostrSessionService` conserve l'etat UI (`authModalOpen`, `error`, `waitingForExternalAuth`, etc.)
- la connexion est negociee via le domaine `core/nostr-connection`
- une fois connecte, le signer est applique dans `NostrClientService` (pont legacy + nouveau domaine)

## Workflow auth HTTP NIP-98 (frontend -> backend)

```mermaid
sequenceDiagram
  participant Packs as StarterPackRequestService
  participant Auth as NostrHttpAuthService
  participant N98 as Nip98HttpAuthService
  participant API as server.mjs

  Packs->>Auth: createAuthorizationHeader({url, method, body})
  Auth->>N98: createAuthorizationHeader(signer, request)
  N98-->>Packs: Authorization: Nostr <token>
  Packs->>API: HTTP request with Authorization header
  API->>API: unpackEventFromToken + verifyEvent + validateNip98Event
  API-->>Packs: 200/401/403
```

Implementations :

- creation token: [NostrHttpAuthService](./application/nostr-http-auth.service.ts)
- logique NIP-98 pure: [Nip98HttpAuthService](../nostr-connection/application/nip98-http-auth.service.ts)
- verification backend: [server.mjs](../../../server.mjs)

## Evenements Nostr utilises ici

- `kind 3` : follow list (contacts) via [FollowService](./application/follow.service.ts)
- `kind 4` : DM chiffree via [NostrClientService.sendDirectMessage](./application/nostr-client.service.ts)
- publication generique via [NostrClientService.publishEvent](./application/nostr-client.service.ts)

## Relays

Relays par defaut configures dans [relay.config.ts](./infrastructure/relay.config.ts).  
Ils sont injectes dans la creation NDK de [NostrClientService](./application/nostr-client.service.ts).
