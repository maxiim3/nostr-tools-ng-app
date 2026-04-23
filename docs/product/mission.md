# ToolStr — Mission

ToolStr est une application Angular 21 SPA, shell multi-pages centre sur Nostr.

## Nature du produit

ToolStr est une application umbrella contenant plusieurs domaines :

1. `packs` — gestion de starter packs Nostr
2. `admin` — interface d'administration
3. `tools` — outils opérateur
4. `legal` — pages légales

## Milestones

### Milestone 1 — Pack francophone (en cours)

Objectif produit : une page publique de demande d'acces au starter pack francophone, avec un backoffice admin de gestion.

Capacites ciblees de ce milestone :

- pages publiques pack et request (`/packs/francophone`, `/packs/francophone/request`)
- interface admin requests (`/packs/francophone/admin/requests`)
- auth Nostr webapp (NIP-07, NIP-46 Nostr Connect, bunker en mode avance, `nsec` temporaire)
- backend HTTP NIP-98 pour les routes protegees
- shell global (header/footer), zap modal, i18n fr/en/es, page CGU

Le suivi d'execution et les statuts courants sont dans :

- [roadmap.md](roadmap.md)
- [../planning/board.md](../planning/board.md)

### Milestone 2 — Merge followers tool (pas commencé)

Outil opérateur/admin pour comparer et merger des listes de follows dans un pack cible.

Accès : admin uniquement.

#### Spécification fonctionnelle

But : comparer un pack source importé avec le pack cible francophone.

Entrées source acceptées :

1. URL Following.space
2. ref exploitable de pack
3. coordonnée exploitable si possible

Structure visuelle obligatoire :

1. colonne gauche = source
2. colonne droite = cible
3. centre = indication de correspondance / transfert

Ordre de présentation obligatoire :

**Groupe 1** — Membres présents dans la source et absents de la cible. Candidats à importer. Apparaissent en premier.

**Groupe 2** — Membres déjà présents dans la source et dans la cible. Apparaissent ensuite.

**Groupe 3** — Membres présents seulement dans la cible. Visibles à droite, partie gauche vide.

Règles UX :

- Membres importables : cartes inspirées de Following.space, visuel grisé/translucide par défaut, filtre vert si sélectionnés, checkbox de sélection, indicateur de mouvement vers la droite
- Membres déjà présents : état "déjà là", lecture seule, teinte verte/translucide/matchée
- Membres seulement dans la cible : visibles à droite, non supprimés par défaut, pas de logique destructive

Actions attendues :

1. charger source
2. charger cible
3. normaliser les pubkeys
4. comparer
5. cocher/décocher
6. sélectionner tous les importables
7. désélectionner
8. prévisualiser le total final
9. republier le pack cible

### Milestone 3 — Feed pack francophone (pas commencé)

Feed public des posts kind 1 des membres du pack francophone.

Route : `/packs/francophone/feed`

Scope initial :

1. afficher les posts kind 1
2. issus des membres du pack
3. tri chronologique descendant
4. lecture simple
5. pagination ou load more

Non-scope initial :

1. pas de reposts complexes
2. pas de long-form avancé
3. pas de SEO SSR
4. pas de moteur social riche

## Limites actuelles

Pour l'instant :

1. on n'ouvre pas le merge aux autres utilisateurs
2. on n'ouvre pas la création de request pages custom pour d'autres packs
3. on n'ouvre pas encore les sous-admins
4. on n'ouvre pas encore le mode méta/self-serve

Mais l'architecture doit être compatible avec cela plus tard.

## Credits

Le projet s'appuie sur le travail de **@calle** et **Following.space**. Ce credit doit apparaitre dans le footer global et dans un bloc dédié sur le merge tool.

- Calle npub : `npub12rv5lskctqxxs2c8rf2zlzc7xx3qpvzs3w4etgemauy9thegr43sf485vg`
- Following.space : `https://following.space`
- GitHub : `https://github.com/callebtc/following.space`
