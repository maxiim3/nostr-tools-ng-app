# Home Test 3 - Design Notes

## Pourquoi cette version

Cette version a ete retenue comme base parce qu'elle conserve l'identite brutaliste du site tout en rendant la landing plus lisible, plus douce et plus scalable.

Elle garde les codes visuels existants de ToolStr : bordures noires franches, typographie massive, grille de fond, contrastes nets et composants tres directs. En revanche, elle reduit l'agressivite visuelle des variantes precedentes en limitant les aplats jaunes et en utilisant le jaune comme signal ponctuel plutot que comme surface dominante.

La petite pillule `TOOLSTR · TOOLBOARD` est volontairement blanche. Dans les essais precedents, le jaune etait tres voyant et prenait trop vite le role de point focal principal. Ici, le badge reste identifiable sans voler l'attention au titre et aux modules.

## Direction produit

La page presente ToolStr comme une boite a outils Nostr francophone, pas uniquement comme une page d'acces au starter pack.

Le starter pack reste le module principal et disponible aujourd'hui, mais la structure permet d'ajouter d'autres modules plus tard sans changer la promesse generale de la home. C'est le point cle de scalabilite : chaque bloc represente un outil concret avec un statut clair.

## Choix de layout

Le layout est volontairement simple :

- un hero court pour poser la promesse produit ;
- une grille de modules pour montrer ce qui existe et ce qui peut arriver ;
- un bloc final pour expliquer la logique extensible.

Cette structure laisse de la place pour assez de contenu sans surcharger la page. Elle evite l'effet splash screen, mais ne bascule pas non plus dans une landing trop dense.

## Choix visuels

- Fond `brutal-grid` pour rester coherent avec la direction artistique existante.
- Cartes blanches avec bordures noires pour garder une lecture nette.
- Jaune reserve au statut `Disponible`, afin de signaler l'action prioritaire.
- Orange reserve au module `Soutien & zaps`, pour ajouter de l'energie sans dominer toute la page.
- Badge principal blanc pour calmer le haut de page.

Le resultat cherche une forme de douceur compatible avec la DA brutaliste : moins d'agressivite, mais toujours une identite forte.

## Regles pour les prochaines iterations

- Garder `home-test-3` comme base de travail.
- Ne pas revenir vers une palette trop jaune ou trop orange sur toute la page.
- Eviter d'ajouter trop de cartes : la force de cette version vient de sa respiration.
- Chaque nouveau module doit avoir un statut explicite : `Disponible`, `Actif`, `Bientot`, ou equivalent.
- Ne pas survendre les modules futurs : les libelles doivent rester honnetes sur ce qui existe vraiment.
- Conserver le starter pack comme premier module phare tant qu'il reste le parcours principal.
