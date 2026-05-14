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

Documentation protocole et integration :

1. [Regles auth Nostr](docs/auth/nostr-auth-rules.md)
2. [Notes auth mobile](docs/auth/mobile-auth-notes.md)
3. [Integration zaps Nostr + Lightning](docs/zaps/technical-integration.md)
4. [Checkout LNURL + NWC](docs/zaps/lnurl-nwc-checkout.md)

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
- `FRANCOPHONE_PACK_URL=https://following.space/d/...` optionnel, par defaut le pack FR
- `FRANCOPHONE_PACK_RELAYS=wss://relay.primal.net,wss://relay.nsec.app,...` optionnel, force la liste de relais utilisee pour publier/confirmer le pack
- `FRANCOPHONE_PACK_BUNKER_URL=bunker://...` optionnel, les parametres `relay=` sont utilises si `FRANCOPHONE_PACK_RELAYS` est absent
- `PUBLIC_PACK_FETCH_TIMEOUT_MS=8000` optionnel, attente maximum de lecture relay pour la liste publique
- `PUBLIC_PACK_PUBLISH_TIMEOUT_MS=8000`, `PUBLIC_PACK_CONFIRM_ATTEMPTS=5`, `PUBLIC_PACK_CONFIRM_DELAY_MS=1000`, `PUBLIC_PACK_REQUIRED_RELAY_ACKS=1` optionnels

Angular ne parle pas directement a Supabase : Angular appelle `server.mjs`, puis `server.mjs` verifie le NIP-98 utilisateur et ecrit le statut de demande dans Supabase. L'ajout au pack public est gere manuellement par l'admin via le statut `success`. Ne jamais exposer `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` dans Angular.

Si le projet Supabase affiche encore les legacy keys, `SUPABASE_SERVICE_ROLE_KEY` reste accepte comme fallback cote serveur.

Copier [.env.example](.env.example) vers `.env` en local, puis renseigner les valeurs Supabase.

Schema SQL source : [supabase/migrations/](supabase/migrations/). Appliquer toutes les migrations dans l'ordre des noms de fichiers.

Appliquer le schema :

```bash
bun run supabase:schema
```

Puis coller tout le SQL dans l'editeur SQL Supabase, ou utiliser `bun run supabase:push` si le Supabase CLI est installe et lie au projet.

Si les demandes d'acces au pack echouent avec `PGRST204` et un message indiquant que la colonne `status` est introuvable dans `francophone_pack_members`, appliquer la migration [supabase/migrations/002_francophone_pack_member_status.sql](supabase/migrations/002_francophone_pack_member_status.sql), puis relancer la demande.
