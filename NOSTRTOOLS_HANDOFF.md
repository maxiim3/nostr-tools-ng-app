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

### Gate 0 — Setup uniquement

Le LLM doit uniquement :

1. créer le projet Angular
2. installer les dépendances
3. configurer le socle technique
4. configurer l’i18n
5. configurer Tailwind
6. configurer daisyUI
7. configurer les outils MCP
8. installer `@nostr-dev-kit/ndk` et `@nostr-dev-kit/ndk-cache-dexie`, sans créer de service applicatif ni de composant qui les utilise
9. lancer le serveur
10. vérifier que l’app démarre

Le LLM ne doit **rien implémenter** côté produit à ce stade.

Il ne doit pas créer les pages métier.
Il ne doit pas créer les composants métier.
Il ne doit pas implémenter le merge.
Il ne doit pas implémenter la request page.
Il ne doit pas implémenter l’admin.
Il ne doit pas implémenter le feed.

Il s’arrête après le boot serveur validé.

### Gate 1 — Règles d’architecture

Après validation du Gate 0, le LLM doit :

1. définir les règles d’architecture du projet
2. définir la pseudo DDD hexa simplifiée
3. définir les conventions de dossiers
4. définir les règles de dépendances entre couches
5. définir ce qui est autorisé
6. définir ce qui est interdit

Le LLM doit ensuite respecter ces règles sans exception.

Il s’arrête après validation.

### Gate 2 — Inventaire UI + Atomic Design

Après validation du Gate 1, le LLM doit :

1. identifier tous les éléments UI nécessaires
2. définir ce qu’est un atom
3. définir ce qu’est une molecule
4. définir ce qu’est un organism
5. définir ce qu’est un template
6. définir ce qu’est une page
7. définir quand utiliser une variante
8. définir quand créer un composant séparé

À ce stade, il doit produire seulement les éléments UI nécessaires :

1. textes
2. titres
3. boutons
4. liens
5. cartes

Il ne doit pas produire les layouts.

Il s’arrête après validation.

### Gate 3 — Design System

Après validation du Gate 2, le LLM doit :

1. créer une page `/design-system`
2. y afficher tous les éléments UI
3. y afficher leurs états
4. y afficher leurs variantes
5. y afficher les combinaisons utiles

Le design system doit être validé avant toute page produit.

Il s’arrête après validation.

### Gate 4 — Layouts et skeletons

Après validation du Gate 3, le LLM doit :

1. définir les layouts de pages
2. extraire des templates seulement si c’est justifié
3. produire les skeletons des pages
4. ne pas encore finaliser les pages métier

Le LLM doit d’abord montrer les structures de pages.

Il s’arrête après validation.

### Gate 5 — Implémentation réelle

Après validation du Gate 4, le LLM peut :

1. implémenter les pages réelles
2. brancher la logique Nostr
3. brancher le merge
4. brancher la request page
5. brancher l’admin
6. brancher le feed

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

## 5. Setup initial attendu

### Création du projet

Commande recommandée :

```bash
ng new nostr-tools --package-manager bun
```

### Tailwind CSS

Installation explicite recommandée :

```bash
bun i -D tailwindcss@^4 @tailwindcss/postcss@^4
```

Note : si le projet a déjà été créé avec le setup Angular/Tailwind attendu, cette étape peut déjà être satisfaite.

### daisyUI

Installation obligatoire :

```bash
bun i -D daisyui@latest
```

### MCP Angular

Références officielles à suivre :

1. `https://angular.dev/ai/mcp`
2. `https://angular.dev/ai/develop-with-ai`
3. `https://angular.dev/ai/develop-with-ai#angular-cli-mcp-server-setup`

Le projet doit être pensé pour fonctionner avec le **Angular CLI MCP Server**.

Référence de commande :

```bash
ng mcp
```

Configuration de référence Angular MCP :

```json
{
  "mcpServers": {
    "angular-cli": {
      "command": "npx",
      "args": ["-y", "@angular/cli", "mcp"]
    }
  }
}
```

### Support éditeur daisyUI

Référence officielle :

1. `https://daisyui.com/docs/editor/`

Support éditeur via Tailwind IntelliSense + autocomplete daisyUI. Pas de serveur MCP dédié daisyUI à ce jour.

### Évaluation IA

L’application devra être évaluée ensuite avec :

1. `https://github.com/angular/web-codegen-scorer`

Variables d’environnement à prévoir :

```bash
export OPENAI_API_KEY="..."
export XAI_API_KEY="..."
```

Le LLM doit considérer qu’on utilisera ensuite :

1. OpenAI
2. Grok / xAI

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

## 9. Routes initiales

1. `/`
2. `/design-system`
3. `/tools/merge-followers`
4. `/packs/francophone`
5. `/packs/francophone/feed`
6. `/packs/francophone/request`
7. `/packs/francophone/admin`
8. `/packs/francophone/admin/requests`
9. `/legal/cgu`

### Visibilité des routes

| Route | Type | Accès |
|---|---|---|
| `/` | publique | libre |
| `/design-system` | interne produit | accessible pendant la phase de design/validation |
| `/tools/merge-followers` | outil admin | admin uniquement |
| `/packs/francophone` | publique | libre |
| `/packs/francophone/feed` | publique | libre |
| `/packs/francophone/request` | publique | libre, connexion requise au moment d’agir |
| `/packs/francophone/admin` | admin | admin uniquement |
| `/packs/francophone/admin/requests` | admin | admin uniquement |
| `/legal/cgu` | publique | libre |

## 10. Pages et rôle métier

### `/`

Page d’entrée de l’application.

Contenu attendu :

1. nom de l’app
2. explication courte
3. navigation principale
4. bouton connexion Nostr
5. switch langue
6. accès au pack francophone
7. footer global

### `/design-system`

Page de référence visuelle.

But :

1. exposer tous les éléments UI
2. montrer variantes et états
3. servir de référence avant toute vraie implémentation de page

C’est une étape obligatoire avant les skeletons métier.

### `/tools/merge-followers`

Outil opérateur/admin uniquement.

But :

1. charger un pack source
2. charger le pack cible francophone
3. comparer les deux
4. sélectionner qui importer
5. republier le pack cible

Important :
cet outil n’est pas public/self-serve au départ.

### `/packs/francophone`

Landing publique du pack francophone.

Contenu attendu :

1. titre du pack
2. description
3. CTA vers le feed
4. CTA vers la demande d’accès
5. lien externe vers Following.space
6. infos contact
7. footer

### `/packs/francophone/feed`

Feed public du pack francophone.

But :

1. afficher les posts des membres du pack
2. proposer une timeline lisible
3. rester simple au départ

### `/packs/francophone/request`

Page publique de demande d’accès.

But :

1. connexion Nostr
2. affichage du statut
3. soumission d’une demande
4. suivi de l’état

### `/packs/francophone/admin`

Page admin du pack.

But :

1. voir les membres
2. rechercher
3. ajouter manuellement
4. retirer manuellement
5. republier le pack
6. accéder aux demandes
7. accéder au merge tool

### `/packs/francophone/admin/requests`

Page admin des demandes.

But :

1. voir les demandes pending
2. accepter
3. refuser
4. ajouter au pack à l’acceptation
5. tenter un DM à l’acceptation

### `/legal/cgu`

Page légale minimale.

## 11. Scope fonctionnel actuel

### Inclus

1. un seul pack public exposé : `francophone`
2. merge admin-only
3. request page publique pour ce pack
4. admin de ce pack
5. feed de ce pack
6. architecture compatible multi-pack plus tard

### Exclu pour l’instant

1. création libre de packs par d’autres
2. merge libre pour n’importe qui
3. request pages custom pour tous
4. sous-admins
5. messages DM custom par pack
6. `zap to access`
7. plateforme méta multi-tenant
8. dark mode

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

## 19. Footer global

Le footer doit contenir :

1. lien vers CGU
2. contact
3. GitHub link placeholder
4. crédit Following.space
5. crédit @calle
6. zap vers Calle
7. tes coordonnées
8. ta zap address

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

## 21. Merge Followers — spécification

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

## 22. Feed du pack francophone

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

## 23. Request Access — spécification

## Route

`/packs/francophone/request`

## But

Permettre à un utilisateur de demander à être inclus dans le pack francophone.

## Flow

1. arrivée publique
2. explication rapide
3. connexion Nostr si nécessaire
4. affichage du statut
5. possibilité de faire une demande
6. retour visuel d’état

## États à gérer

1. non connecté
2. connecté sans demande
3. pending
4. accepted
5. rejected
6. already_member
7. loading
8. error

## 24. Admin — spécification

## `/packs/francophone/admin`

Fonctions attendues :

1. voir les membres du pack
2. rechercher
3. ajouter manuellement
4. retirer manuellement
5. republier
6. accéder au merge
7. accéder aux demandes

## `/packs/francophone/admin/requests`

Fonctions attendues :

1. lister les demandes pending en priorité
2. accepter
3. refuser
4. voir le profil demandeur
5. voir s’il est déjà membre
6. à l’acceptation : ajout + republication + tentative de DM

## 25. Modèle de demandes Nostr

Le système de demandes doit pouvoir fonctionner sans backend propriétaire obligatoire.

## Event de demande

Recommandation :

1. kind custom paramétré
2. un event par `pack + requester`

Proposition :

1. `kind`: `30100`
2. `d`: `<packSlug>:<requesterPubkey>`
3. tag `pack`: `<packSlug>`
4. contenu JSON minimal avec langue et date

## Event de décision admin

Proposition :

1. `kind`: `30101`
2. `d`: `<packSlug>:<requesterPubkey>`
3. tag `pack`: `<packSlug>`
4. tag `p`: pubkey du demandeur
5. contenu JSON avec statut et date

Note : les `kind 34550/34551` sont réservés par NIP-72. Le pack cible reste en `kind 39089` (Following.space) ; les events de demande et de décision utilisent ici des kinds addressables libres `30100/30101`.

## Statut calculé

Le statut affiché côté utilisateur doit être déduit à partir :

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

## 29. Ce que le LLM doit livrer à terme

Après toutes validations successives, le LLM doit être capable de livrer :

1. shell Angular 21 moderne
2. architecture feature-first pseudo DDD hexa simplifiée
3. design system complet
4. routes publiques et admin
5. merge tool admin-only
6. pack francophone public
7. feed public
8. request page
9. admin members
10. admin requests
11. i18n fr/en/es
12. footer avec crédits Calle et tes infos
13. page CGU minimale

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
