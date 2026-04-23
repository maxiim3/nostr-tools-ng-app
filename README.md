# ToolStr (`nostr-tools-ng-app`)

Application Angular centree sur Nostr, orientee "starter pack francophone" :

- authentification Nostr (NIP-07, NIP-46, nsec)
- requetes API signees en NIP-98
- gestion des demandes d'acces et moderation admin
- publication d'evenements Nostr (follow list, pack, DM)

## Documentation Nostr

Pour comprendre le protocole Nostr dans le contexte exact du code :

1. [Index documentation source](src/README.md)
2. [Core index](src/core/README.md)
3. [Core Nostr (session, NIP-98, follow)](src/core/nostr/README.md)
4. [Core Nostr Connection (NIP-07, NIP-46)](src/core/nostr-connection/README.md)
5. [Core Zap workflow](src/core/zap/README.md)
6. [Feature Packs workflow](src/features/packs/README.md)

Docs architecture produit existantes :

- [Mission](docs/superpowers/documentation/mission.md)
- [Architecture globale](docs/superpowers/documentation/architecture.md)
- [Tutoriel Mermaid](MERMAID.md)

## Demarrage local

Pre-requis :

- Bun
- Node.js (pour l'ecosysteme Angular CLI)

Lancer le front :

```bash
bun install
bun run start
```

Le front tourne ensuite sur `http://localhost:4200`.

Lancer l'API Bun (NIP-98 + SQLite) :

```bash
bun run api
```

Par defaut, l'API tourne sur `http://127.0.0.1:3000`.

## Scripts utiles

```bash
bun run build
bun run test
bun run lint
bun run typecheck
bun run check
```

## Base locale SQLite

Le projet utilise une base unique pour les demandes pack :

- runtime DB : `.runtime/pack-requests.sqlite`
- schema vide : `pack-requests.schema.sql`
- dump SQL : `pack-requests.dump.sql`

Variables d'environnement :

- `DATABASE_PATH=/absolute/path/to/pack-requests.sqlite`
- `DATA_DIR=/absolute/path/to/runtime-dir`

Commandes :

```bash
bun run db:reset
bun run db:dump
bun run db:restore
```

- `db:reset` : recree une base vide
- `db:dump` : exporte la table `pack_requests`
- `db:restore` : recree la base depuis `pack-requests.dump.sql`
