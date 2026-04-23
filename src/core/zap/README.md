# Core Zap

Ce dossier gere l'experience zap cote application : choix montant, generation facture Lightning, puis publication du zap request event via Nostr.

## Fichiers clefs

- [ZapService](./zap.service.ts)
- [Zap modal component](./presentation/zap-modal.component.ts)
- [Project config (zapAddress, owner)](../config/project-info.ts)
- [API endpoint LNURL](../../../server.mjs)

## Workflow complet

```mermaid
sequenceDiagram
  participant UI as ZapModalComponent
  participant Zap as ZapService
  participant Session as NostrSessionService
  participant API as /api/lnurl (server.mjs)
  participant LN as lightning address provider
  participant Nostr as NDK + relays

  UI->>Zap: openModal()
  Zap->>Session: isAuthenticated()
  alt non authentifie
    Zap-->>UI: authRequiredOpen = true
  else authentifie
    Zap->>API: GET /api/lnurl?address=...&amount=...
    API->>LN: fetch callback lnurlp
    LN-->>API: invoice (pr)
    API-->>Zap: { pr }
    Zap-->>UI: invoiceQr
    UI->>Zap: sendZapEvent()
    Zap->>LN: fetch /.well-known/lnurlp/<name>
    LN-->>Zap: payRequest metadata
    Zap->>Nostr: generateZapRequest + publish
    Zap-->>UI: success/error
  end
```

## Notes techniques

- Le zap exige une session Nostr active (`ndk.signer` present).
- Le QR facture est un `lightning:<invoice>` genere localement.
- La publication utilise `generateZapRequest` de `@nostr-dev-kit/ndk`.
- Les relays de publication sont :
  - les relays deja connectes dans NDK, sinon
  - la liste par defaut de [relay.config.ts](../nostr/infrastructure/relay.config.ts).
