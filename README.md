# ToolStr (`nostr-tools-ng-app`)

Application Angular centree sur Nostr, orientee "starter pack francophone" :

- authentification Nostr (NIP-07, NIP-46, nsec)
- requetes API signees en NIP-98
- admission immediate au pack francophone avec stockage Supabase
- interface admin protegee pour lister et retirer des membres
- publication d'evenements Nostr (follow list, DM)

## Documentation Nostr

Pour comprendre le protocole Nostr dans le contexte exact du code :

1. [Index documentation source](src/README.md)
2. [Core index](src/core/README.md)
3. [Core Nostr (session, NIP-98, follow)](src/core/nostr/README.md)
4. [Core Nostr Connection (NIP-07, NIP-46)](src/core/nostr-connection/README.md)
5. [Core Zap workflow](src/core/zap/README.md)
6. [Feature Packs workflow](src/features/packs/README.md)

Source de verite projet, docs produit et architecture :

1. [Documentation projet](docs/README.md)
2. [Roadmap et milestones](docs/product/roadmap.md)
3. [Features actionnables](docs/features/README.md)
4. [Architecture globale](docs/architecture/overview.md)
5. [Regles auth Nostr](docs/auth/nostr-auth-rules.md)
6. [Tutoriel Mermaid](docs/contributing/mermaid.md)

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

Lancer l'API Bun (NIP-98 + Supabase) :

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
bun run supabase:schema
bun run supabase:push
```

## Supabase pack members

L'API Bun utilise Supabase comme stockage persistant pour les membres du pack francophone.

Variables d'environnement requises :

- `SUPABASE_URL=https://<project-ref>.supabase.co`
- `SUPABASE_SECRET_KEY=<secret-key>` pour le serveur Bun uniquement
- `SUPABASE_FRANCOPHONE_PACK_MEMBERS_TABLE=francophone_pack_members` optionnel
- `ADMIN_NPUBS=npub1...,npub1...` pour les actions admin NIP-98

La cle necessaire pour cette feature est `SUPABASE_SECRET_KEY`, configuree uniquement cote serveur. Angular ne parle pas directement a Supabase : Angular appelle `server.mjs`, puis `server.mjs` ecrit dans Supabase apres verification NIP-98. Ne jamais exposer `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` dans Angular.

Si le projet Supabase affiche encore les legacy keys, `SUPABASE_SERVICE_ROLE_KEY` reste accepte comme fallback cote serveur.

Copier [.env.example](.env.example) vers `.env` en local, puis renseigner les valeurs Supabase.

Schema SQL source : [supabase/migrations/001_francophone_pack_members.sql](supabase/migrations/001_francophone_pack_members.sql).

Appliquer le schema :

```bash
bun run supabase:schema
```

Puis coller le SQL dans l'editeur SQL Supabase, ou utiliser `bun run supabase:push` si le Supabase CLI est installe et lie au projet.
