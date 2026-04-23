# Nostr Connection Rules Design

Date: 2026-04-21
Statut: reference

Execution plan: `docs/superpowers/specs/2026-04-21-nostr-connection-project-plan.md`

## Role of this document

Ce document pose les regles de conception et les contraintes produit / protocole du domaine auth.

Il sert a repondre a la question :

- `Est-ce qu'une idee auth est acceptable ?`

Il ne sert pas de board.
Pour les taches en cours, utiliser `docs/superpowers/specs/2026-04-23-product-roadmap-board.md`.

## Objectif

Definir les regles de conception du nouveau systeme de connexion Nostr avant implementation.

Ce document sert de base de design et de TDD pour un nouveau domaine de connexion additif.
Le systeme existant reste en place pendant cette phase. La nouvelle architecture est branchee via une nouvelle modale separee.

## Contexte

L'audit du projet a montre les points suivants:

- `NIP-07` est deja le bon chemin principal pour une webapp desktop.
- `NIP-98` est deja le bon mecanisme pour l'authentification HTTP vers le backend.
- Le flow `NIP-46` actuel est partiel et fragile.
- Le projet melange aujourd'hui plusieurs responsabilites dans les memes services: signature, session, auth HTTP, publication et UI.
- Le login par `nsec` est expose comme une methode normale alors qu'il ne correspond pas aux bonnes pratiques d'une webapp grand public.

Les documents et conclusions retenus imposent une separation claire entre:

- le signer cote utilisateur;
- l'identite utilisee par l'application;
- l'authentification serveur eventuelle;
- l'UI qui orchestre la connexion.

## Scope

Ce document couvre:

- les methodes de connexion ciblees;
- les bonnes pratiques produit et securite;
- les protocoles a respecter;
- les flows applicatifs;
- les interdictions et anti-patterns;
- la strategie TDD du nouveau domaine.

Ce document ne couvre pas:

- le remplacement immediat du systeme existant;
- une session serveur classique post-login;
- le design visuel de la nouvelle modale;
- une migration backend hors `NIP-98`.

## Principes d'architecture

Le nouveau systeme de connexion suit les regles suivantes:

- il est additif et ne remplace pas les services existants au depart;
- il est consomme via une nouvelle modale separee;
- il n'y a pas de switch runtime entre ancien et nouveau systeme;
- il repose sur un strategy pattern par methode de connexion;
- une methode de connexion ouvre une tentative de connexion explicite avant de produire une connexion active;
- le domaine metier et l'UI ne dependent jamais directement de `window.nostr`, `nostrconnect://`, `bunker://` ou `nostrsigner:`;
- les objets NDK, fournisseurs navigateurs et details de transport restent confines aux adaptateurs;
- la source de verite cryptographique est le signer, pas un etat UI local;
- l'identifiant interne de reference est toujours la `pubkey` hex.

## Vocabulaire de domaine

Le nouveau domaine doit introduire un vocabulaire explicite et stable.

### Connection method

Une methode de connexion est une strategie capable d'ouvrir une tentative de connexion a partir d'un protocole de signature ou d'un transport Nostr.

Elle ne retourne pas directement une session finale. Elle retourne d'abord une tentative qui peut exposer des informations intermediaires a l'UI, par exemple un URI, une valeur a copier ou un QR code.

Exemples:

- `nip07`;
- `nip46-nostrconnect`;
- `nip46-bunker`;
- `nip55-android`.

### Connection attempt

Une tentative de connexion represente une phase intermediaire entre le choix d'une strategie et l'obtention d'une connexion active.

Elle expose:

- le `methodId`;
- des instructions eventuelles pour l'utilisateur;
- une operation `complete()` qui attend ou finalise la connexion;
- une operation `cancel()` pour abandonner proprement le flow.

### Signer

Un signer est une capacite de signature. Il fournit au minimum:

- `getPublicKey()`;
- `signEvent()`;
- eventuellement `encrypt()` et `decrypt()` si les capacites le permettent.

### Session applicative

Une session applicative est la representation normalisee de l'identite connectee dans l'app.

Elle expose au minimum:

- `pubkeyHex`;
- `npub`;
- `methodId`;
- `capabilities`;
- `validatedAt`.

### HTTP auth

L'auth HTTP est un service separe qui transforme le signer courant en header `NIP-98` pour les requetes protegees.

## Regles sur les methodes

### Desktop web

- `NIP-07` est la methode principale.
- La webapp doit detecter la presence du provider navigateur, obtenir la `pubkey`, puis demander la signature seulement quand elle est necessaire.
- L'app ne doit pas supposer qu'un changement de compte est notifie automatiquement par le provider.

### Mobile web

- `NIP-46` est la methode principale.
- Le nouveau domaine doit supporter au minimum `nostrconnect://` et `bunker://`.
- `NIP-46` est considere comme la meilleure option web cross-device et multi-appareil.

### Bunker

- `bunker://` est une methode de premier rang du nouveau systeme.
- Le flow bunker ne doit pas etre traite comme un detail interne de `nostrconnect://`.
- Le bunker doit pouvoir exister comme strategie explicite avec son propre contrat et ses propres tests.

### Android

- `NIP-55` est un complement optionnel a prevoir dans le modele.
- Il n'est pas obligatoire pour la premiere iteration du refacto.
- Il doit cependant rester compatible avec l'architecture cible afin d'etre ajoute sans casser les autres strategies.

### Backend HTTP

- `NIP-98` reste la methode d'authentification HTTP du projet.
- Le backend continue a verifier les tokens `kind:27235` sur les routes protegees.
- Le nouveau domaine ne doit pas remplacer `NIP-98` par un autre mecanisme sans decision produit explicite.

### Relay auth

- `NIP-42` ne fait pas partie du login applicatif.
- `NIP-42` n'est utile que pour les relays prives ou restreints.
- Il ne doit jamais etre confondu avec l'auth HTTP ni avec la session applicative.

### Cle privee utilisateur

- `nsec` n'est pas une methode normale de connexion pour cette webapp.
- Aucun flow principal ne doit demander une cle privee brute.
- Si un mode avance existe plus tard, il doit etre separe du flow standard et traite comme import exceptionnel.

## Bonnes pratiques

### Identite et representation des cles

- stocker et traiter la cle publique en hex;
- utiliser `npub` seulement pour l'affichage, les liens, le partage et les QR;
- ne jamais utiliser `NIP-05` comme preuve d'identite;
- utiliser `NIP-05` seulement comme attribut de presentation.

### Validation de l'identite

- revalider la `pubkey` au chargement de l'application;
- revalider la `pubkey` au retour d'onglet;
- revalider la `pubkey` avant une action sensible;
- ne pas supposer qu'un compte connecte reste identique pendant toute la duree de vie de l'application.

### Permissions et reduction de surface

- demander les permissions les plus etroites possibles avec `NIP-46`;
- valider le `secret` associe au flow `NIP-46`;
- supprimer le `client-keypair` au logout;
- nettoyer tout etat transitoire au logout: URI, QR, timers, callbacks, tentative en cours.

### Separation des couches

- separer signer, session, auth HTTP et presentation;
- garder les adaptateurs de protocole hors du domaine metier;
- ne pas faire dependre l'UI d'un objet NDK ou d'un provider navigateur;
- garder les erreurs de protocole encapsulees dans des erreurs de domaine stables.

## Protocoles a respecter

### NIP-07

- sert a obtenir une `pubkey` et des signatures depuis un signer navigateur;
- ne normalise pas un mecanisme fiable de changement de compte;
- doit etre traite comme methode desktop prioritaire.

### NIP-46

- sert au remote signing via `nostrconnect://` et `bunker://`;
- doit gerer `secret`, `perms`, correlation des messages par `id`, et events `kind:24133`;
- doit gerer `auth_url` si le signer demande une authentification complementaire;
- doit limiter l'exposition de la cle privee au minimum de systemes possible.

### NIP-55

- sert a l'integration Android via `nostrsigner:` et callback;
- doit etre modele comme une strategie independante si ajoute plus tard.

### NIP-98

- sert a authentifier les requetes HTTP via un event `kind:27235`;
- le token doit contenir au minimum `u` pour l'URL absolue et `method` pour la methode HTTP;
- avec corps HTTP, le `payload` doit etre ajoute et verifie lorsque le backend l'exige;
- le serveur doit verifier `kind`, `created_at`, URL exacte, methode exacte, `payload` si applicable, et signature valide;
- toute requete invalide doit produire un `401 Unauthorized`.

### NIP-42

- sert uniquement a repondre a un challenge relay `AUTH`;
- etablit une session valable pour la connexion WebSocket courante;
- ne remplace jamais le login applicatif ni `NIP-98`.

### NIP-19

- fournit des formats de representation comme `npub` et `nsec`;
- ne definit pas une strategie d'authentification;
- ne justifie pas l'usage de `nsec` comme flow principal de webapp.

## Flows cibles

### Flow commun

1. La nouvelle modale decouvre les methodes disponibles.
2. Elle n'affiche que les strategies supportees dans le contexte courant.
3. La methode choisie ouvre une tentative de connexion.
4. La tentative peut exposer des instructions intermediaires a l'utilisateur.
5. La tentative est completee et produit une connexion active puis une session normalisee.
6. Le domaine charge l'identite publique associee a la `pubkey` finale.
7. L'application utilise cette session pour les besoins UI et metier.
8. Avant toute action sensible, la `pubkey` est revalidee.
9. Au logout, tous les artefacts de session et de transport sont nettoyes.

### Flow NIP-07

1. Detecter le provider navigateur.
2. Demander la `pubkey`.
3. Construire la session normalisee.
4. Charger le profil public si necessaire.
5. Revalider avant toute signature sensible.

### Flow NIP-46 nostrconnect

1. Generer un `client-keypair` et un `secret`.
2. Demander des `perms` minimales.
3. Generer l'URI `nostrconnect://` et l'eventuel QR.
4. Attendre la reponse du signer.
5. Valider le `secret` et la correlation du flow.
6. Recuperer la `pubkey` finale.
7. Construire la session normalisee.
8. Nettoyer tout etat transitoire en fin de flow ou en cas d'echec.

### Flow bunker

1. Recevoir ou saisir un token `bunker://`.
2. Valider sa structure et ses parametres.
3. Etablir la connexion avec le signer bunker.
4. Gerer un `auth_url` si le bunker l'exige.
5. Recuperer la `pubkey` finale.
6. Construire la session normalisee.
7. Nettoyer la session locale au logout.

### Flow NIP-55

1. Ouvrir le signer Android via `nostrsigner:`.
2. Recevoir le callback de resultat.
3. Valider la reponse.
4. Construire la session normalisee.

### Flow NIP-98

1. Le metier demande un header d'auth HTTP au domaine dedie.
2. Le domaine prepare un event `kind:27235` avec URL et methode.
3. Le signer courant signe cet event.
4. Le domaine retourne `Authorization: Nostr ...`.
5. Le backend verifie strictement le token avant de traiter la requete.

## A eviter

- exposer `nsec` dans le flow normal de connexion;
- utiliser `npub` comme cle d'autorite interne;
- utiliser `NIP-05` comme authentification;
- coder une methode de connexion directement dans un composant Angular;
- faire dependre le domaine metier d'objets NDK, de `window.nostr` ou de deep-links;
- supposer qu'un seul relay suffit par defaut pour tous les flows `NIP-46`;
- partager un etat mutable commun entre ancien et nouveau systeme;
- faire du protocole directement dans les composants de presentation.

## Ne pas faire

- ne pas faire de big bang refactor;
- ne pas remplacer les services existants avant d'avoir les contrats et les tests;
- ne pas commencer par l'UI;
- ne pas introduire une session serveur classique sans decision produit explicite;
- ne pas demander des permissions `NIP-46` trop larges par defaut;
- ne pas stocker durablement une cle privee brute;
- ne pas accepter une reponse externe non correlee et non validee;
- ne pas confondre auth app, auth relay et auth HTTP;
- ne pas rendre le domaine dependant d'une implementation concrete de transport.

## Regles TDD

Le nouveau domaine est developpe en test-driven development.

L'ordre impose est le suivant:

1. definir le vocabulaire de domaine;
2. definir les interfaces et les erreurs de domaine;
3. ecrire les tests de contrat;
4. ecrire les tests de session et de nettoyage;
5. implementer les strategies une par une;
6. brancher ensuite la nouvelle modale;
7. evaluer seulement apres cela le remplacement progressif de l'ancien systeme.

## Contrats a tester

### Connection method

Chaque strategie doit passer la meme suite de tests de contrat sur:

- disponibilite;
- ouverture de connexion;
- session retournee;
- refus utilisateur;
- erreur de protocole;
- annulation;
- nettoyage au logout.

### Signer

Le contrat signer doit etre teste sur:

- `getPublicKey()`;
- `signEvent()`;
- signature valide;
- signature invalide;
- event modifie apres signature;
- capacites non supportees.

### HTTP auth

Le contrat HTTP auth doit etre teste sur:

- creation d'un header `NIP-98` valide;
- URL exacte;
- methode exacte;
- `payload` exact quand applicable;
- erreur si aucun signer n'est disponible.

### Session store

Le store de session doit etre teste sur:

- creation session;
- invalidation session;
- revalidation `pubkey`;
- nettoyage des etats transitoires;
- logout complet.

## Matrice de tests par protocole

### NIP-07

- absence de `window.nostr`;
- refus utilisateur;
- erreur extension;
- `pubkey` changee entre deux actions;
- echec de signature.

### NIP-46

- `secret` absent ou invalide;
- permissions refusees;
- permissions trop larges rejetees par la politique du domaine;
- timeout;
- reponse tardive d'une ancienne tentative;
- `auth_url` recu puis reprise correcte du flow;
- correlation correcte par `id`;
- nettoyage complet au logout.

### NIP-98

- `kind` different de `27235`;
- `created_at` hors fenetre;
- URL `u` differente de la requete reelle;
- methode differente;
- `payload` absent ou faux quand il est exige;
- signature invalide;
- reponse `401` sur tout cas negatif.

### NIP-42

Si ajoute plus tard pour relays prives:

- challenge recu avant lecture/ecriture;
- retry apres `AUTH`;
- cas `restricted`;
- expiration logique de session a la reconnexion WebSocket.

## Strategie de migration

La migration suit les regles suivantes:

- les nouveaux services sont ajoutes en parallele;
- la nouvelle modale consomme uniquement le nouveau domaine;
- l'ancien systeme n'est pas modifie pour cette premiere phase sauf en cas de fix isole necessaire;
- le remplacement progressif des anciens services n'est envisage qu'apres validation des contrats, des tests et de la parite fonctionnelle.

## Critere de validation du design

Le design est considere valide si:

- chaque methode de connexion est abstraite par une strategie testable;
- le domaine ne depend pas d'une implementation concrete de protocole;
- `NIP-07`, `NIP-46`, `bunker` et `NIP-98` sont modelises sans ambiguite;
- `nsec` ne fait pas partie du flow principal;
- la revalidation d'identite est prise en compte explicitement;
- les tests de contrat existent avant l'UI;
- la nouvelle modale peut etre livree sans casser le systeme actuel.
