# Delivery Board

Date: 2026-04-23
Updated: 2026-04-24
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

- Aucun chantier n'est epingle ici a cet instant.

### Ready

- `AUTH-02` Restaurer localement le signer `Nostr Connect` dans la webapp.
  Done when: un utilisateur mobile peut revenir sur le site sans refaire un pairing complet tant que la session locale est encore valable, avec un signer restaure capable de signer (pas seulement un profil local).
  Note: prerequis technique a verifier en amont: restauration `NDKNip46Signer.fromPayload(...)` exploitable apres reload.

- `AUTH-03` Reduire les permissions demandees au login au strict necessaire.
  Done when: le flow de login ne demande que ce qui est utile au demarrage, puis les autres permissions arrivent au besoin.

- `AUTH-04` Revoir l'UX auth mobile.
  Done when: l'UI affiche clairement l'etat du signer actif, propose `Reouvrir l'application`, `Reessayer`, `Se deconnecter`, et un mode lecture seule explicite.

- `AUTH-05` Faire de `bunker://` un mode avance clairement separe.
  Done when: l'utilisateur grand public voit d'abord l'application externe, bunker n'apparait plus comme le chemin principal.

### Blocked

- `AUTH-06` One-shot perms bunker complet.
  Blocker: avec notre stack NDK actuelle, le flow bunker ne donne pas un point propre pour pousser toutes les requested perms dans `connect`.
  Decision needed: patch NDK, contourner avec une impl bas niveau, ou accepter bunker comme flow plus avance et moins optimise.

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
