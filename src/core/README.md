# Core Documentation Index

## Sous-systemes documentes

- [Nostr core services](./nostr/README.md)
- [Nostr connection domain](./nostr-connection/README.md)
- [Zap domain](./zap/README.md)

## Lecture rapide

1. `nostr-connection` gere la negotiation de connexion (NIP-07 / NIP-46)
2. `nostr` gere la session app, les operations Nostr et l'auth HTTP NIP-98
3. `zap` gere l'UX lightning + publication du zap request event

## Fichiers transverses utiles

- [Project info](./config/project-info.ts)
- [Relay list](./nostr/infrastructure/relay.config.ts)
- [Auth modal UI](./layout/presentation/components/app-auth-modal.component.ts)
- [API server verification NIP-98](../../server.mjs)
