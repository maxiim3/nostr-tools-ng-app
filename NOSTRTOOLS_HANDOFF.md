# NostrTools — Document de cadrage final

## 1. Mission

Construire une application **Angular 21 SPA** nommée **NostrTools**.

Cette application est un shell multi-pages centré sur Nostr, avec :

1. un outil opérateur/admin de merge de packs
2. un espace public pour le pack francophone
3. un feed public pour ce pack
4. une page publique de demande d’accès
5. un espace admin pour gérer membres et demandes
6. une page de design system
7. une page légale minimale

Ce document doit servir de consigne principale à un autre LLM.

## 2. Règle absolue d’exécution

Le LLM ne doit **pas** tout construire d’un coup.

Il doit travailler par **gates** stricts.

Après chaque gate, il doit **s’arrêter** et **attendre validation humaine**.

Il ne doit jamais sauter un gate.

## 3. Gates obligatoires

### Gate 0 — Setup uniquement ✅ VALIDÉ

1. ✅ projet Angular créé
2. ✅ dépendances installées
3. ✅ socle technique configuré
4. ✅ i18n configuré (Transloco, fr/en/es)
5. ✅ Tailwind CSS v4 configuré
6. ✅ daisyUI v5 configuré (thème custom `nostr-tools`)
7. ✅ MCP configuré
8. ✅ `@nostr-dev-kit/ndk` installé et utilisé, `@nostr-dev-kit/ndk-cache-dexie` installé mais **non branché**
9. ✅ serveur démarre

### Gate 1 — Règles d'architecture ✅ VALIDÉ

1. ✅ architecture feature-first pseudo DDD hexa simplifiée en place
2. ✅ couches `domain`, `application`, `infrastructure`, `presentation` par feature
3. ✅ conventions de dossiers respectées
4. ✅ règles de dépendance entre couches respectées
5. ✅ `shared` limité aux composants UI génériques (`profile-card`)
6. ✅ `core` pour les services transverses (Nostr, i18n, zap, layout)

### Gate 2 — Inventaire UI + Atomic Design ✅ VALIDÉ

1. ✅ inventaire UI réalisé
2. ✅ atoms : bouton zap, input auth, langue switch
3. ✅ molecules : profile-card (avec états skeleton/muted/success/transparent)
4. ✅ organisms : header, auth-modal, zap-modal, quiz, admin request list
5. ✅ la page `/design-system` n'a pas été créée mais les composants UI sont utilisés en production

### Gate 3 — Design System ⚠️ PARTIELLEMENT VALIDÉ

1. ❌ la page `/design-system` n'existe pas
2. ✅ les composants UI de base sont implémentés et utilisés
3. ⚠️ pas de page de référence visuelle dédiée

### Gate 4 — Layouts et skeletons ✅ VALIDÉ

1. ✅ layout principal en place (header + router-outlet)
2. ✅ pas de template extrait (un seul layout utilisé)
3. ✅ les pages actives sont structurées

### Gate 5 — Implémentation réelle ⚠️ PARTIELLEMENT VALIDÉ

1. ✅ request page complète (connexion, statut, quiz, soumission, suivi)
2. ✅ admin requests complète (liste, approve, reject, ajout pack, DM)
3. ✅ logique Nostr branchée (NDK, NIP-07, NIP-46, nsec, kind 39089, kind 4 DM)
4. ✅ backend Express + SQLite opérationnel
5. ❌ merge followers tool — **non implémenté**
6. ❌ pack landing page (`/packs/francophone`) — **non implémenté**
7. ❌ feed (`/packs/francophone/feed`) — **non implémenté**
8. ❌ admin dashboard (`/packs/francophone/admin`) — **non implémenté**
9. ✅ page CGU (`/legal/cgu`)
10. ✅ footer global comme composant dédié
11. ❌ design system page (`/design-system`) — **non implémenté**

## 4. Stack non négociable

1. Angular 21
2. Bun
3. Tailwind CSS
4. daisyUI
5. SPA
6. Atomic Design
7. i18n runtime
8. thème clair uniquement
9. TypeScript strict
10. Angular standalone uniquement

## 5. Setup initial — ÉTAT ACTUEL ✅

Le setup est complet. Voici ce qui est en place.

### Dépendances principales

| Package                          | Version  | Usage                                      |
| -------------------------------- | -------- | ------------------------------------------ |
| Angular                          | 21       | Framework                                  |
| Tailwind CSS                     | v4       | Styles utilitaires                         |
| daisyUI                          | v5       | Composants UI (thème custom `nostr-tools`) |
| `@nostr-dev-kit/ndk`             | installé | Client Nostr principal                     |
| `@nostr-dev-kit/ndk-cache-dexie` | installé | Cache IndexedDB — **non branché**          |
| `@jsverse/transloco`             | installé | i18n runtime (fr/en/es)                    |

### Backend

Le backend est un serveur **Bun + bun:sqlite** (`server.mjs`), pas du Nostr-only.

| Package       | Usage                            |
| ------------- | -------------------------------- |
| `Bun`         | Runtime HTTP et SQLite           |
| `nostr-tools` | Vérification NIP-98 côté serveur |

### Déploiement

Déploiement via `Dockerfile`. `railway.toml` ne garde que les paramètres de healthcheck/restart.

### MCP Angular

Références :

1. `https://angular.dev/ai/mcp`
2. `https://angular.dev/ai/develop-with-ai`
3. `https://angular.dev/ai/develop-with-ai#angular-cli-mcp-server-setup`

### Support éditeur daisyUI

1. `https://daisyui.com/docs/editor/`

### Évaluation IA

1. `https://github.com/angular/web-codegen-scorer`

## 6. Bonnes pratiques Angular à respecter

Le LLM doit suivre les recommandations Angular AI officielles.

### Obligations

1. standalone components uniquement
2. signaux pour l’état
3. `ChangeDetectionStrategy.OnPush`
4. lazy loading des features
5. `input()` et `output()` quand pertinent
6. `@if`, `@for`, `@switch`
7. `inject()` pour les services
8. accessibilité WCAG AA
9. compatibilité AXE
10. typage strict

### Interdictions

1. pas de NgModules applicatifs
2. pas de logique métier dans les templates
3. pas de logique Nostr directement dans les composants UI
4. pas de fourre-tout dans `shared`
5. pas de “quick and dirty” qui casse les règles fixées au Gate 1

## 7. i18n obligatoire dès le départ

Langues obligatoires :

1. français
2. anglais
3. espagnol

Décision :

1. langue par défaut : `fr`
2. stratégie runtime
3. librairie retenue : `@jsverse/transloco`
4. pas de routes localisées au départ
5. sélecteur de langue global
6. persistance de la langue choisie via `localStorage`
7. détection initiale du navigateur via `navigator.language` avec fallback `fr`

Toutes les chaînes UI doivent être externalisées.

Cela inclut :

1. labels
2. boutons
3. titres
4. messages système
5. états
6. textes de footer
7. CGU
8. futurs templates de messages

Les contenus Nostr utilisateurs ne sont pas traduits.

## 8. Structure produit

### Nom global

**NostrTools**

### Nature du produit

NostrTools est une application umbrella.

Elle contient plusieurs domaines :

1. `tools`
2. `packs`
3. `admin`
4. `legal`

### Important

Pour l’instant :

1. on n’ouvre pas le merge aux autres utilisateurs
2. on n’ouvre pas la création de request pages custom pour d’autres packs
3. on n’ouvre pas encore les sous-admins
4. on n’ouvre pas encore le mode méta/self-serve

Mais l’architecture doit être compatible avec cela plus tard.

## 9. Routes

### Routes actives

| Route                               | Composant               | Implémenté            | Accès                                 |
| ----------------------------------- | ----------------------- | --------------------- | ------------------------------------- |
| `/`                                 | `HomePage`              | ✅ Landing simplifiée | publique                              |
| `/packs/francophone/request`        | `PackRequestPage`       | ✅ Complet            | publique, connexion requise pour agir |
| `/packs/francophone/admin/requests` | `PackAdminRequestsPage` | ✅ Complet            | admin uniquement (guard)              |
| `/legal/cgu`                        | —                       | ✅ Complet            | publique                              |

### Routes en attente (commentées dans `app.routes.ts`)

| Route                      | Composant | Statut            | Accès            |
| -------------------------- | --------- | ----------------- | ---------------- |
| `/design-system`           | —         | ❌ Non implémenté | interne          |
| `/tools/merge-followers`   | —         | ❌ Non implémenté | admin uniquement |
| `/packs/francophone`       | —         | ❌ Non implémenté | publique         |
| `/packs/francophone/feed`  | —         | ❌ Non implémenté | publique         |
| `/packs/francophone/admin` | —         | ❌ Non implémenté | admin uniquement |

### Route fallback

| Route | Comportement      |
| ----- | ----------------- |
| `**`  | Redirige vers `/` |

## 10. Pages et rôle métier — ÉTAT ACTUEL

### `/` ✅ Landing simplifiée

Page d'entrée fonctionnelle.

Contenu actuel :

1. ✅ nom de l'app
2. ✅ description courte
3. ✅ CTA vers la request page
4. ❌ navigation principale complète (lien manquants vers feed, landing pack)
5. ✅ bouton connexion Nostr (dans le header)
6. ✅ switch langue (dans le header)
7. ✅ footer global (composant dédié)

### `/design-system` ❌ Non implémenté

La page de design system n'a pas été créée. Les composants UI sont utilisés directement en production.

### `/tools/merge-followers` ❌ Non implémenté

Aucun composant n'existe pour le merge tool.

### `/packs/francophone` ❌ Non implémenté

Aucun composant n'existe pour la landing du pack.

### `/packs/francophone/feed` ❌ Non implémenté

Aucun composant n'existe pour le feed.

### `/packs/francophone/request` ✅ COMPLET

Page publique de demande d'accès entièrement fonctionnelle.

Flow implémenté :

1. ✅ arrivée publique avec explication
2. ✅ connexion Nostr si nécessaire (modal avec 3 méthodes : NIP-07, NIP-46, nsec)
3. ✅ vérification automatique du statut (membre / demande existante / idle)
4. ✅ si déjà membre : message d'information
5. ✅ si demande en attente (pending) : message d'attente
6. ✅ si idle ou rejected : quiz francophone puis bouton de demande
7. ✅ quiz francophone (questions multiples avec sélection aléatoire)
8. ✅ soumission de la demande au backend Express
9. ✅ affichage du statut après soumission
10. ✅ messages de chargement rotatifs

États gérés : `non connecté`, `idle`, `pending`, `approved`, `rejected`, `already_member`, `loading`, `error`.

### `/packs/francophone/admin` ❌ Non implémenté

Aucun composant n'existe pour le dashboard admin (membres, recherche, ajout/retrait manuel, republier).

### `/packs/francophone/admin/requests` ✅ COMPLET

Page admin des demandes entièrement fonctionnelle.

Flow implémenté :

1. ✅ liste des demandes pending avec avatar, nom, npub, timestamp
2. ✅ bouton accepter : ajoute au pack (kind 39089) + envoie DM NIP-04 + met à jour la DB
3. ✅ bouton refuser : met à jour la DB
4. ✅ vérification si le demandeur est déjà membre
5. ✅ guard admin (`francophoneAdminGuard`)

### `/legal/cgu` ✅ IMPLÉMENTÉ

Page légale CGU fonctionnelle.

## 11. Scope fonctionnel — ÉTAT ACTUEL

### Implémenté

1. ✅ auth Nostr (NIP-07, NIP-46 Nostr Connect, nsec)
2. ✅ request page complète pour le pack francophone
3. ✅ quiz francophone (questions multiples avec sélection aléatoire)
4. ✅ admin requests (approve/reject avec ajout pack + DM)
5. ✅ backend Express + SQLite pour les demandes
6. ✅ header global avec nav, user, langue, zap
7. ✅ i18n fr/en/es complet
8. ✅ landing page simplifiée
9. ✅ session admin avec guard
10. ✅ zap via `lightning:` URI
11. ✅ footer global (composant dédié)
12. ✅ page CGU (`/legal/cgu`)
13. ✅ quiz francophone (questions multiples)

### Non implémenté (reste à faire)

1. ❌ pack landing page (`/packs/francophone`)
2. ❌ feed public (`/packs/francophone/feed`)
3. ❌ merge followers tool (`/tools/merge-followers`)
4. ❌ admin dashboard membres (`/packs/francophone/admin`)
5. ❌ design system page (`/design-system`)
6. ❌ NDK Dexie cache (installé mais non branché)

### Architecture compatible multi-pack

L'architecture est pack-aware via `francophone-pack.config.ts`. Les services sont nommés avec le préfixe `francophone` mais la structure permet d'étendre.

### Backend

Contrairement à la spécification initiale (Nostr-only), les demandes sont gérées par un backend Express + SQLite. Les kinds 30100/30101 ne sont pas utilisés.

## 12. Architecture projet — pseudo DDD hexa simplifiée

### Principe général

Architecture **feature-first**, avec couches internes simplifiées.

Chaque feature suit cette logique :

1. `domain`
2. `application`
3. `infrastructure`
4. `presentation`

### Définition des couches

#### `domain`

Contient uniquement :

1. types métier
2. value objects simples
3. règles métier pures
4. fonctions de domaine pures

Aucune dépendance Angular.
Aucune dépendance UI.
Aucune dépendance directe Nostr.

#### `application`

Contient :

1. cas d’usage
2. orchestration
3. ports
4. logique de coordination

Elle peut dépendre du `domain`.
Elle ne doit pas dépendre directement des composants UI.

#### `infrastructure`

Contient :

1. adaptateurs Nostr
2. services d’accès aux relays
3. sérialisation/desérialisation d’events
4. implémentations techniques des ports

Elle dépend du `domain` et de `application` si nécessaire.

#### `presentation`

Contient :

1. pages Angular
2. composants de feature
3. view models
4. state UI
5. bindings de templates

Elle ne doit pas faire de logique technique lourde.
Elle ne doit pas parler directement aux relays sans passer par une couche claire.

### Règles de dépendance

1. `presentation` peut dépendre de `application`
2. `application` peut dépendre de `domain`
3. `infrastructure` implémente les ports nécessaires
4. `domain` ne dépend de rien de technique
5. pas de dépendance circulaire
6. pas de logique Nostr brute dans les composants de page

### Dossier `shared`

`shared` doit rester strict.

Il sert uniquement à ce qui est réellement générique.

Exemples autorisés :

1. primitives UI globales
2. tokens de design
3. helpers purs vraiment partagés
4. types communs transverses simples

Exemples interdits :

1. dumping ground
2. logique métier pack-specific
3. logique admin spécifique
4. logique merge spécifique

## 13. Atomic Design — règles strictes

### Définitions

#### Atom

Primitive UI simple, indivisible, réutilisable.

Exemples :

1. texte
2. titre
3. bouton
4. lien
5. badge
6. input simple
7. checkbox
8. avatar
9. pill de statut

#### Molecule

Petit assemblage de quelques atoms.

Exemples :

1. bouton de connexion Nostr
2. item de switch langue
3. ligne de crédit
4. résumé de membre simple
5. compteur avec label

#### Organism

Bloc UI fonctionnel plus riche.

Exemples :

1. header global
2. footer global
3. liste de membres
4. panneau de statut request
5. file d’attente admin requests
6. colonne de merge
7. timeline feed

#### Template

Structure de page réutilisable sans contenu métier final.

Exemples :

1. template public
2. template admin
3. template tool

#### Page

Composition finale liée à une route.

### Règles importantes

1. les layouts ne sont pas produits au Gate 2
2. on produit d’abord les éléments UI
3. on ne crée pas d’organisms avant d’avoir stabilisé atoms et molecules
4. on n’extrait un template que s’il est vraiment partagé
5. on ne crée pas un composant abstrait inutilement

### Variantes vs composants séparés

Créer une **variante** seulement si :

1. la structure est la même
2. la responsabilité est la même
3. la différence porte surtout sur style, taille, ton, état

Créer un **composant séparé** si :

1. la structure change réellement
2. la responsabilité change
3. le comportement change
4. la sémantique change

## 14. Éléments UI à produire avant les layouts

Au Gate 2, le LLM doit produire et formaliser au minimum :

1. composant texte
2. composant titre
3. composant bouton
4. composant lien
5. composant carte

Ces éléments constituent la base du design system.

### États à prévoir

#### Texte

1. body
2. muted
3. caption
4. helper
5. danger si nécessaire

#### Titre

1. display
2. page title
3. section title
4. card title

#### Bouton

1. primary
2. secondary
3. ghost
4. link-style si besoin
5. danger si besoin
6. disabled
7. loading

#### Lien

1. standard
2. muted
3. external
4. inline action

#### Carte

1. neutral
2. selectable
3. selected
4. matched
5. muted
6. disabled
7. loading skeleton state

## 15. Design system obligatoire

La page `/design-system` doit servir à valider toute la base UI avant toute implémentation métier.

Elle doit montrer :

1. tokens visuels
2. palette
3. typographies
4. espacements utiles
5. textes
6. titres
7. boutons
8. liens
9. cartes
10. états hover
11. états focus
12. états disabled
13. états loading
14. états success
15. états error

## 16. Skeletons ensuite

Une fois le design system validé, le LLM doit produire des skeletons de pages.

Les skeletons doivent montrer :

1. structure générale
2. hiérarchie visuelle
3. zones principales
4. blocs majeurs
5. navigation
6. zones de contenu

Mais pas encore toute la logique métier.

## 17. Design visuel

### Ton général

Interface claire, propre, moderne, éditoriale/produit, inspirée Bitcoin/Nostr, pas dashboard générique fade.

### Palette imposée

1. fond blanc : texte noir, accent orange, action jaune
2. fond orange : texte blanc ou jaune
3. fond jaune : texte noir

### Usage recommandé

1. blanc = base neutre
2. orange = accent, zones fortes, identité
3. jaune = actions, CTA, mise en avant contrôlée
4. vert = succès, import confirmé, état positif
5. gris/translucide = états neutres, non actifs, déjà traités

### Thème

1. light only
2. pas de dark mode

## 18. Header global

Le header doit contenir :

1. le nom `NostrTools`
2. la navigation principale
3. le bouton de connexion Nostr
4. le switch langue
5. un bouton zap discret

Le merge tool ne doit pas être mis en avant publiquement pour un non-admin.

## 19. Footer global ✅ IMPLÉMENTÉ

Le footer est un composant dédié, inclus dans le layout global.

Contenu :

1. ✅ lien vers CGU
2. ✅ contact
3. ✅ GitHub link placeholder
4. ✅ crédit Following.space
5. ✅ crédit @calle
6. ✅ zap vers Calle
7. ✅ tes coordonnées
8. ✅ ta zap address

### Données à afficher

#### Moi

1. npub : `npub1zkse38pvfqlkcmcc7tw6zqecj7sqxe5lgj0u9ldylghmdjfppyqqtsa4du`
2. contact : `maxiim3@primal.net`
3. zap : `maxiim3@primal.net`

### Calle

1. npub : `npub12rv5lskctqxxs2c8rf2zlzc7xx3qpvzs3w4etgemauy9thegr43sf485vg`
2. zap : `npub12rv5lskctqxxs2c8rf2zlzc7xx3qpvzs3w4etgemauy9thegr43sf485vg@npub.cash`
3. projet : `Following.space`
4. GitHub : `https://github.com/callebtc/following.space`

## Crédit Calle — obligation produit

Le projet doit explicitement mentionner que l’idée de pack/following space s’appuie sur le travail de **@calle** et **Following.space**.

Ce crédit doit apparaître :

1. dans le footer global
2. dans un bloc dédié sur `/tools/merge-followers`

## 20. Nostr — choix techniques

## Librairie principale

Utiliser en priorité :

1. `@nostr-dev-kit/ndk`
2. `@nostr-dev-kit/ndk-cache-dexie` pour le cache local IndexedDB

## Auth

1. auth prioritaire : NIP-07
2. pas de saisie de clé privée dans le flow normal
3. pas de stockage de `nsec`
4. pas de session serveur centralisée
5. détection NIP-07 via `window.nostr` au boot
6. fallback lecture seule si NIP-07 n’est pas disponible

## Relays

Prévoir une config de relays centralisée.

Base de départ recommandée :

1. `wss://relay.damus.io`
2. `wss://relay.nostr.band`
3. `wss://nostr.oxtr.dev`
4. `wss://nostr-pub.wellorder.net`
5. `wss://nos.lol`
6. `wss://relay.primal.net`

## Pack cible

Le système de pack cible repose sur le modèle Following.space / kind `39089`.

Le merge doit republier le pack cible mis à jour.

## 20b. Backend Express + SQLite

### Serveur

Le backend est un serveur Bun (`server.mjs`) qui gère les demandes d'accès au pack.

### Stack backend

| Composant   | Usage                                   |
| ----------- | --------------------------------------- |
| Bun         | Runtime HTTP et SQLite via `bun:sqlite` |
| nostr-tools | Vérification NIP-98 côté serveur        |

### Base de données

Fichier : `.runtime/pack-requests.sqlite`

Scripts de gestion :

1. `scripts/db-dump.sh` — dump SQL
2. `scripts/db-reset.sh` — réinitialisation
3. `scripts/db-restore.sh` — restauration depuis dump

### Endpoints API

| Endpoint                                   | Méthode | Auth           | Description                             |
| ------------------------------------------ | ------- | -------------- | --------------------------------------- |
| `/api/health`                              | GET     | non            | Health check                            |
| `/api/pack-requests/me`                    | GET     | NIP-98         | Statut de la demande de l'user connecté |
| `/api/pack-requests`                       | POST    | NIP-98         | Soumettre une demande                   |
| `/api/admin/pack-requests`                 | GET     | NIP-98 (admin) | Lister toutes les demandes              |
| `/api/admin/pack-requests/:pubkey/approve` | POST    | NIP-98 (admin) | Approuver une demande                   |
| `/api/admin/pack-requests/:pubkey/reject`  | POST    | NIP-98 (admin) | Rejeter une demande                     |

### Déploiement

Déploiement via `Dockerfile`. `railway.toml` ne garde que les paramètres de healthcheck/restart.

### Auth backend

Tous les endpoints protégés utilisent NIP-98 HTTP auth :

1. le frontend signe un event temporaire via NIP-07
2. l'event est envoyé en header `Authorization`
3. le backend vérifie la signature avec `nostr-tools`
4. la pubkey est extraite et utilisée comme identifiant

### Note architecturale

La spec initiale prévoyait un système Nostr-only (kinds 30100/30101). Le backend SQLite a été choisi pour la simplicité et la fiabilité. L'architecture reste compatible avec une migration future vers du Nostr-only.

## 21. Merge Followers — spécification ❌ NON IMPLÉMENTÉ

Aucun composant ni service de merge n'existe. La spec ci-dessous reste valable pour l'implémentation future.

## Accès

Admin uniquement.

## But

Comparer :

1. un pack source importé
2. le pack cible francophone

## Entrées source acceptées

Au minimum :

1. URL Following.space
2. ref exploitable de pack
3. coordonnée exploitable si possible

## Structure visuelle obligatoire

1. colonne gauche = source
2. colonne droite = cible
3. centre = indication de correspondance / transfert

## Ordre de présentation obligatoire

### Groupe 1

Membres présents dans la source et absents de la cible.

Ce sont les candidats à importer.
Ils apparaissent en premier.

### Groupe 2

Membres déjà présents dans la source et dans la cible.

Ils apparaissent ensuite.

### Groupe 3

Membres présents seulement dans la cible.

Ils restent visibles à droite.
La partie gauche est vide pour cette zone.

## Règles UX obligatoires

Pour les membres importables :

1. cartes inspirées de Following.space
2. visuel grisé / translucide par défaut
3. filtre vert si sélectionnés pour import
4. checkbox de sélection
5. indicateur de mouvement vers la droite

Pour les membres déjà présents :

1. état visuel “déjà là”
2. lecture seule
3. teinte verte/translucide/matchée

Pour les membres seulement dans la cible :

1. visibles à droite
2. non supprimés par défaut
3. pas de logique destructive dans le merge tool initial

## Actions attendues

1. charger source
2. charger cible
3. normaliser les pubkeys
4. comparer
5. cocher/décocher
6. sélectionner tous les importables
7. désélectionner
8. prévisualiser le total final
9. republier le pack cible

## 22. Feed du pack francophone ❌ NON IMPLÉMENTÉ

Aucun composant ni service de feed n'existe. La spec ci-dessous reste valable pour l'implémentation future.

## Route

`/packs/francophone/feed`

## Scope initial

1. afficher les posts `kind 1`
2. issus des membres du pack
3. tri chronologique descendant
4. lecture simple
5. pagination ou “load more”

## Non-scope initial feed

1. pas de reposts complexes
2. pas de long-form avancé
3. pas de SEO SSR
4. pas de moteur social riche au départ

## 23. Request Access — ✅ IMPLÉMENTÉ

### Route

`/packs/francophone/request`

### Implémentation réelle

Le système de demandes est géré par un **backend Express + SQLite**, pas par des events Nostr.

#### Côté user (`PackRequestPage`)

1. arrivée publique avec explication du pack
2. connexion Nostr via modal (3 méthodes : NIP-07, NIP-46, nsec)
3. vérification automatique du statut via `GET /api/pack-requests/me` (NIP-98 auth)
4. si déjà membre du pack (kind 39089) → message d'information
5. si demande pending → message d'attente
6. si idle ou rejected → quiz francophone puis bouton de demande
7. quiz : 1 question ("Pain au chocolat ou chocolatine?") — le domaine supporte plusieurs questions
8. soumission via `POST /api/pack-requests` avec NIP-98 auth
9. affichage du statut pending après soumission

#### Côté admin (`PackAdminRequestsPage`)

1. liste des demandes via `GET /api/admin/pack-requests` (NIP-98 auth)
2. approve : `POST /api/admin/pack-requests/:pubkey/approve`
   - ajoute au pack (republie kind 39089 via NDK)
   - envoie un DM NIP-04 (kind 4) via `FrancophonePackNotificationService`
   - met à jour la DB (status = approved)
3. reject : `POST /api/admin/pack-requests/:pubkey/reject`
   - met à jour la DB (status = rejected)

#### Services impliqués

| Service                              | Rôle                                            |
| ------------------------------------ | ----------------------------------------------- |
| `StarterPackRequestService`          | HTTP client vers le backend Express             |
| `FrancophonePackMembershipService`   | Vérification et ajout au pack (NDK, kind 39089) |
| `FrancophonePackNotificationService` | Envoi DM NIP-04 à l'approbation                 |
| `NostrClientService`                 | NDK wrapper, auth, publish, DM                  |
| `NostrSessionService`                | Session state, admin detection                  |

#### Domaine

| Fichier                      | Rôle                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `request-status.ts`          | Résolution pure du statut à partir des timestamps      |
| `request-quiz.ts`            | Modèle du quiz (questions, choix, sélection aléatoire) |
| `francophone-pack.config.ts` | Config du pack (slug, admins, URLs)                    |

#### États gérés

1. ✅ non connecté
2. ✅ connecté sans demande (idle)
3. ✅ pending
4. ✅ approved
5. ✅ rejected
6. ✅ already_member
7. ✅ loading
8. ✅ error

#### Spécification initiale (Nostr events kinds 30100/30101)

Les kinds 30100/30101 définis dans la spec initiale ne sont **pas utilisés**. Le backend SQLite remplace ce système. La spec originale restait dans les sections précédentes comme référence si on souhaite migrer vers du Nostr-only.

## 24. Admin — ÉTAT ACTUEL

### `/packs/francophone/admin` ❌ Non implémenté

Aucun composant n’existe pour le dashboard admin.

Fonctions attendues :

1. voir les membres du pack
2. rechercher
3. ajouter manuellement
4. retirer manuellement
5. republier
6. accéder au merge
7. accéder aux demandes

### `/packs/francophone/admin/requests` ✅ COMPLET

Page admin des demandes entièrement fonctionnelle.

Flow implémenté :

1. ✅ lister les demandes pending avec profil (avatar, nom, npub, timestamp)
2. ✅ accepter : ajout au pack + republication kind 39089 + DM NIP-04 + update DB
3. ✅ refuser : update DB (status = rejected)
4. ✅ voir le profil demandeur (avatar, nom affiché)
5. ✅ indication si déjà membre du pack
6. ✅ guard admin via `francophoneAdminGuard` (CanMatchFn, compare pubkey avec `FRANCOPHONE_PACK.adminNpubs`)

## 25. Modèle de demandes — IMPLÉMENTATION RÉELLE

### Backend Express + SQLite

Les demandes sont gérées par un serveur Express avec SQLite, pas par des events Nostr.

#### Table `pack_requests`

| Colonne            | Type    | Description                         |
| ------------------ | ------- | ----------------------------------- |
| `requester_pubkey` | TEXT PK | Pubkey hex du demandeur             |
| `requester_npub`   | TEXT    | npub du demandeur                   |
| `display_name`     | TEXT    | Nom affiché                         |
| `image_url`        | TEXT    | URL de l’avatar                     |
| `question_id`      | TEXT    | ID de la question du quiz           |
| `choice_id`        | TEXT    | ID du choix sélectionné             |
| `created`          | TEXT    | Date de création                    |
| `updated`          | TEXT    | Date de mise à jour                 |
| `status`           | TEXT    | `pending` / `approved` / `rejected` |

#### API Endpoints

| Endpoint                                   | Méthode | Auth           | Description                             |
| ------------------------------------------ | ------- | -------------- | --------------------------------------- |
| `/api/health`                              | GET     | non            | Health check                            |
| `/api/pack-requests/me`                    | GET     | NIP-98         | Statut de la demande de l’user connecté |
| `/api/pack-requests`                       | POST    | NIP-98         | Soumettre une demande                   |
| `/api/admin/pack-requests`                 | GET     | NIP-98 (admin) | Lister toutes les demandes              |
| `/api/admin/pack-requests/:pubkey/approve` | POST    | NIP-98 (admin) | Approuver une demande                   |
| `/api/admin/pack-requests/:pubkey/reject`  | POST    | NIP-98 (admin) | Rejeter une demande                     |

#### Auth NIP-98

Tous les endpoints protégés utilisent NIP-98 HTTP auth. Le frontend signe un event temporaire via NIP-07 et l’envoie en header Authorization. Le backend vérifie la signature avec `nostr-tools`.

### Scripts DB

| Script                  | Rôle                         |
| ----------------------- | ---------------------------- |
| `scripts/db-dump.sh`    | Dump la DB en SQL            |
| `scripts/db-reset.sh`   | Réinitialise la DB           |
| `scripts/db-restore.sh` | Restore la DB depuis un dump |

### Spécification initiale (kinds 30100/30101) — archivée

La spec initiale prévoyait des events Nostr (kind 30100 pour la demande, kind 30101 pour la décision admin). Cette approche n’a pas été retenue au profit du backend SQLite. Elle reste disponible comme référence si on souhaite migrer vers du Nostr-only.

#### Statut calculé (spec initiale)

Le statut devait être déduit à partir :

1. du pack courant
2. de la présence ou non dans le pack
3. de la dernière demande connue
4. de la dernière décision admin connue

## 26. Permissions admin

Au départ :

1. pas de sous-admins
2. pas de rôles complexes
3. les admins d’un pack sont définis dans `PackConfig.adminNpubs`
4. le pack francophone est administré par toi

Au runtime :

1. la pubkey NIP-07 courante est comparée à `PackConfig.adminNpubs`
2. les routes `/packs/*/admin/**` et `/tools/**` sont protégées par des guards Angular fonctionnels (`CanMatch`)

## 27. Config pack

Même si un seul pack est exposé publiquement au départ, l’architecture doit être pack-aware.

Champs minimums à prévoir :

1. `slug`
2. `title`
3. `description`
4. `ownerNpub`
5. `adminNpubs`
6. `targetPackRef`
7. `targetPackUrl`
8. `requestEnabled`
9. `feedEnabled`
10. `publicEnabled`
11. `contact`
12. `zapAddress`
13. `credits`

## Pack initial

1. `francophone`

## 28. Règles de qualité

1. aucune implémentation métier avant validation du Gate 0
2. aucune page produit avant validation architecture
3. aucun layout avant validation des primitives UI
4. aucun page skeleton avant validation du design system
5. aucun branchement métier final avant validation des skeletons

## 29. Livrables — ÉTAT ACTUEL

### Livré ✅

1. ✅ shell Angular 21 moderne
2. ✅ architecture feature-first pseudo DDD hexa simplifiée
3. ✅ i18n fr/en/es complet
4. ✅ request page complète
5. ✅ admin requests complète
6. ✅ auth Nostr (NIP-07, NIP-46, nsec)
7. ✅ backend Express + SQLite
8. ✅ header global
9. ✅ landing page simplifiée
10. ✅ quiz francophone (questions multiples)
11. ✅ footer global (composant dédié)
12. ✅ page CGU (`/legal/cgu`)

### Reste à livrer ❌

1. ❌ design system page (`/design-system`)
2. ❌ merge tool admin-only (`/tools/merge-followers`)
3. ❌ pack francophone landing (`/packs/francophone`)
4. ❌ feed public (`/packs/francophone/feed`)
5. ❌ admin dashboard membres (`/packs/francophone/admin`)
6. ❌ NDK Dexie cache branché

## 30. Interdictions explicites

1. ne pas tout implémenter dès le premier passage
2. ne pas casser la séquence des gates
3. ne pas improviser une architecture hors des règles fixées
4. ne pas transformer `shared` en fourre-tout
5. ne pas exposer publiquement le merge tool au départ
6. ne pas ouvrir la création libre de packs
7. ne pas oublier les crédits Following.space / @calle
8. ne pas oublier l’i18n dès le départ

## 31. Références officielles à suivre

### Angular

1. `https://angular.dev/ai/mcp`
2. `https://angular.dev/ai/develop-with-ai`
3. `https://angular.dev/ai/develop-with-ai#angular-cli-mcp-server-setup`

### daisyUI

1. `https://daisyui.com/docs/editor/`

### Évaluation

1. `https://github.com/angular/web-codegen-scorer`

## 32. Commandes et setup attendus au Gate 0

### Création

```bash
ng new nostr-tools --package-manager bun
```

### daisyUI

```bash
bun i -D daisyui@latest
```

### Angular MCP

```bash
ng mcp
```

### Serveur

Le LLM doit lancer le serveur de dev et vérifier que le projet démarre.

Il s’arrête ensuite et attend validation.

## 33. Critère de réussite du Gate 0

Le Gate 0 est validé seulement si :

1. le projet existe
2. Bun est utilisé
3. Tailwind est prêt
4. daisyUI est prêt
5. i18n est prête structurellement
6. Angular MCP est configuré
7. daisyUI MCP/editor setup est pris en compte
8. les dépendances principales sont installées
9. le serveur démarre
10. aucune feature produit n’a encore été implémentée

## 34. Critères de réussite des Gates 1 à 5

### Gate 1

Le Gate 1 est validé seulement si :

1. les règles d’architecture sont écrites explicitement
2. les couches `domain`, `application`, `infrastructure`, `presentation` sont définies
3. les règles de dépendance entre couches sont définies
4. le rôle de `shared` est clarifié
5. la liste de ce qui est autorisé et interdit est explicite

### Gate 2

Le Gate 2 est validé seulement si :

1. l’inventaire UI est identifié
2. les définitions `atom`, `molecule`, `organism`, `template`, `page` sont clarifiées
3. les règles `variante` vs `composant séparé` sont définies
4. seuls les éléments UI de base sont produits
5. aucun layout n’est encore produit

### Gate 3

Le Gate 3 est validé seulement si :

1. la page `/design-system` existe
2. elle expose tous les éléments UI de base
3. elle montre variantes et états utiles
4. la base visuelle est validée humainement avant toute page produit

### Gate 4

Le Gate 4 est validé seulement si :

1. les layouts sont définis
2. les templates éventuels sont justifiés
3. les skeletons de pages montrent la structure attendue
4. les pages métier ne sont pas encore finalisées

### Gate 5

Le Gate 5 est validé seulement si :

1. les pages réelles sont implémentées
2. la logique Nostr est branchée
3. le merge, la request page, l’admin et le feed sont branchés
4. les validations précédentes n’ont pas été contournées
