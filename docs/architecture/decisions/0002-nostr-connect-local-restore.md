# ADR 0002 — Nostr Connect Local Restore Without Backend Session

Date: 2026-04-24
Status: accepted

## Context

Le board actif demande `AUTH-02`: permettre a un utilisateur mobile de revenir sur le site sans refaire un pairing complet Nostr Connect.

Le backend actuel est deja aligne avec le modele Nostr:

- verification `NIP-98` sur chaque requete protegee;
- aucun cookie de session applicative;
- aucun JWT applicatif.

Le probleme actuel est cote webapp: la connexion active est perdue au reload car le store de connexion est en memoire.

## Decision

Le projet adopte un restore local de connexion `NIP-46 nostrconnect` cote frontend.

Contraintes de decision:

- pas de session backend;
- pas de cookie auth;
- pas de JWT auth;
- pas de fallback vers un faux etat connecte base uniquement sur un profil utilisateur;
- pas de persistance `nsec`.

Le restore doit reconstruire une connexion signante reelle, pas seulement un affichage de compte.

## Consequences

- la webapp persiste un snapshot local minimal pour restaurer le signer `NIP-46`;
- au demarrage, la webapp tente un restore silencieux puis revalide la pubkey;
- en cas d'echec de restore: purge locale + retour a l'etat non connecte + action de reconnexion explicite;
- le backend reste stateless cote auth et continue a verifier `NIP-98`.

Risques acceptes:

- le payload local de restore est sensible;
- une revocation distante peut invalider la reprise;
- le restore peut echouer selon le signer externe et doit rester robuste.

## Rejected options

- session serveur classique post-login;
- JWT applicatif;
- cookie de session applicative;
- cache profil seul en local pour simuler un etat connecte.
