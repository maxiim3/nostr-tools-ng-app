# Delivery Board

Date: 2026-04-23
Updated: 2026-04-25
Status: active

## Role of this document

Ce document est la source de verite active pour l'execution.

Il sert a suivre :

- ce qu'on fait maintenant
- ce qui est pret
- ce qui est bloque
- ce qui vient d'etre termine

Il ne remplace pas la roadmap produit.
Pour la direction globale, utiliser `../product/roadmap.md`.

Si ce document contredit un document historique, ce document gagne.

## Board

### In Progress

- `AUTH-02` Test mobile du restore signer `NIP-46` / `Nostr Connect`.
  Done when: le flow est valide sur mobile avec Amber Android apres push, et le signer restaure reste capable de signer apres retour/reload.
  Note: desktop extension OK; bunker via QR code scanne dans Amber Android OK; test mobile `nip46-nostrconnect` en cours.

### Ready

- `INFRA-01` Migrer le stockage runtime vers Supabase. (P0)
  Done when: les endpoints `pack-requests` (user + admin) gardent leur comportement externe, les donnees survivent aux redeploiements, l'auth admin NIP-98 reste protegee, et les variables d'environnement Supabase sont documentees.
  Source: retour mobile post-deploiement 2026-04-25 — SQLite `.runtime/pack-requests.sqlite` non persistant en production.

- `AUTH-07` Restaurer la session Nostr apres refresh. (P0)
  Done when: une connexion NIP-07 ou NIP-46 (mobile externe) survit a un refresh tant que l'autorisation distante reste valide; en cas d'expiration ou de refus, retour propre a l'etat deconnecte avec feedback UI.
  Source: retour mobile post-deploiement 2026-04-25.

- `AUTH-08` Stabiliser le flow mobile Amber et Primal. (P1)
  Done when: les flows Amber et Primal sont verifies manuellement et documentes (attente, succes, refus, timeout), et le refresh ne casse pas une autorisation encore valide.
  Depends: `AUTH-07` (la persistance bloque l'observation propre).

- `UI-01` Ajouter loader + disabled sur le bouton auth extension. (P1)
  Done when: le bouton extension affiche un indicateur pendant la tentative, est disabled, l'etat est accessible (a11y), et se reset sur succes / erreur / cancel / timeout.

- `UI-02` Definir une strategie loader/disabled generique pour les boutons async. (P1)
  Done when: apres inventaire (>= 3 cas confirmes : extension, app externe, bunker, submit request, admin approve/reject), un pattern partage existe avec gestion `loading`, `disabled`, label accessible, et anti-double-submit.
  Depends: `UI-01` (fixer d'abord le cas extension localement).

- `DOC-03` Mettre a jour `architecture.md` apres migration Supabase. (P2)
  Done when: `architecture.md` documente Supabase comme stockage persistant, ce plan marque la migration comme complete, et les variables d'environnement requises sont listees.
  Depends: `INFRA-01`.

- `AUTH-03` Reduire les permissions demandees au login au strict necessaire.
  Done when: le flow de login ne demande que ce qui est utile au demarrage, puis les autres permissions arrivent au besoin.

- `AUTH-04` Revoir l'UX auth mobile.
  Done when: l'UI affiche clairement l'etat du signer actif, propose `Reouvrir l'application`, `Reessayer`, `Se deconnecter`, et un mode lecture seule explicite.

- `AUTH-05` Faire de `bunker://` un mode avance clairement separe.
  Done when: l'utilisateur grand public voit d'abord l'application externe, bunker n'apparait plus comme le chemin principal.

### Blocked

- `AUTH-06` One-shot perms bunker complet.
  Blocker: avec notre stack NDK actuelle, le flow bunker ne donne pas un point propre pour pousser toutes les requested perms dans `connect`.
  Note: ce sujet est non-bloquant pour le chemin principal mobile PWA (`nip46-nostrconnect`) et peut rester en mode avance.

### Done Recently

- `DOC-01` Clarifier le role des specs et creer un document actif de pilotage.

- `DOC-02` Refactoriser toute l'arborescence `docs/` par role documentaire.
  Outcome: `product`, `planning`, `architecture`, `references`, `history`, `research`, `guides`.

- `AUTH-01` Corriger le flow application externe pour :
  - ouvrir l'application au premier clic
  - suivre les mises a jour d'URI pendant la tentative
  - eviter le besoin de relancer une nouvelle tentative juste pour poursuivre le meme flow

## Regles de maintien du board

- Une tache doit avoir un identifiant stable.
- Une tache doit dire ce qu'on veut obtenir, pas seulement ce qu'on va coder.
- `In Progress` = travail effectivement en cours, pas juste prioritaire.
- `Ready` = executable sans nouvelle decision produit majeure.
- `Blocked` = besoin d'une decision, d'une verification externe ou d'un changement de stack.
- `Done Recently` = garder uniquement les derniers changements utiles a la conversation.
