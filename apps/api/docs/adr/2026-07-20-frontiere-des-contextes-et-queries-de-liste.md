---
title: Les données d'un module sont servies par son API, pas par la requête du tableau des dossiers
author:
  - github.com/jessicakossibale
  - github.com/jquagliatini
date: 2026-07-20
---

## En une phrase

Quand un écran a besoin d'une donnée qui appartient à un autre module, il l'obtient par un
endpoint de ce module. On n'ajoute plus de colonnes à la requête du tableau des dossiers
pour ça.

## Contexte

Le back est découpé en modules (session, report, members...). Chaque module possède ses
tables, regroupées dans un schéma Postgres qu'on appelle un contexte.

`listNominationFilesRawQuery` est la requête qui remplit le tableau des dossiers. C'est la
plus utilisée de l'application : elle tourne pour tous les rôles, à chaque changement de
page, de tri ou de filtre. À force d'ajouts, elle fait environ 220 lignes et cinq
sous-requêtes. Certaines ne servent qu'un détail d'affichage (`hasAttachment` pour une
icône) ou qu'une partie des utilisateurs (`member_memo`).

La PR #500 proposait d'y ajouter une sous-requête de plus (`myReportId`) pour afficher un
lien vers le rapport du membre dans le panneau magistrat. La review a refusé cette
direction. Le problème : la règle n'était écrite nulle part et le code contient plusieurs
exemples qui font l'inverse. Impossible de deviner la bonne direction en lisant le code.

## Décision

- **La requête du tableau ne grossit plus.** On n'y ajoute une donnée que si elle appartient
  au module session et sert le tableau lui-même (lignes, tri, filtres).
- **Une donnée qui appartient à un autre module est servie par le service de ce module** et
  chargée seulement quand l'écran en a besoin. Exemple : le lien vers le rapport du membre
  est produit par le module report, qui expose la query sur son service
  (`internalSearchNominationFileMembersReport`). L'endpoint vit dans le contrôleur qui
  possède le chemin REST
  (`GET /api/members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/reports`)
  et il est chargé à l'ouverture du panneau. C'est le pattern posé par FON-505 et repris par
  FON-451 : une classe query, un `findFirst` Prisma et un DTO nommé selon la convention
  (`Search...Dto` en entrée, `Found...Dto` en sortie).
- **La table `users` est la seule lecture cross-module autorisée.** Afficher un nom oblige à
  lire la table des utilisateurs : sans cette lecture, pas de nom. Tous les modules peuvent
  la lire directement.
- Côté client, cette donnée a sa propre query Tanstack, avec sa clé dans le registre et un
  `enabled` pour ne charger qu'à l'usage. Elle ne passe pas par le cache du tableau.

## Cas existants et leur sort

Le code contient des cas qui semblaient contredire cette règle. La review de la PR #500 les
a tranchés :

| Cas                                                                                                           | Où                                                                                       | Décision                                                                                                               |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| le tableau contient des données propres à l'utilisateur connecté (`member_memo`, commentaires d'observations) | `listNominationFilesRawQuery`                                                            | on garde : données de l'utilisateur pour le tableau lui-même, pas un franchissement de frontière                       |
| le tableau contient un détail d'affichage (`hasAttachment`)                                                   | `listNominationFilesRawQuery`                                                            | on garde : sert le tableau, pas de problème identifié                                                                  |
| le tableau lit les noms des rapporteurs dans les tables du module identity                                    | `listNominationFilesRawQuery`                                                            | on garde : `users` est la lecture cross-module autorisée (voir Décision)                                               |
| le module session lit les tables du module report                                                             | `internalDetailsMemberSessionRawQuery`, `internalCountTotalDetailsMemberSessionRawQuery` | à trancher dans un ticket dédié                                                                                        |
| le module session supprime des lignes dans les tables du module report                                        | `deleteReportsAfterAffectationPublicationRawQuery`                                       | dette assumée : choix historique pour éviter une dépendance circulaire. À reprendre avec le socle événementiel à venir |
| le module members lit les tables des modules nominations, report et identity                                  | `detailsMemberRawQuery`, `listMembersRawQuery`                                           | on garde : écran de synthèse, il rassemble forcément plusieurs modules                                                 |
| la requête des dossiers pour l'agenda lit les tables des modules nominations et identity                      | `findAgendaNominationFilesRawQuery`                                                      | on garde : la requête vit dans le module session, qui l'expose en interne. C'est le pattern cible                      |

À savoir aussi : les tables des différents modules vivent dans la même base et certaines
sont liées entre elles (un rapport pointe vers son dossier, avec suppression en cascade).
Cette règle ne cherche pas à couper ces liens en base. Elle dit seulement que pour obtenir
la donnée d'un autre module, on passe par son API plutôt que par ses tables.

Le cas restant "à trancher" donnera un ticket dédié. Aucun n'est traité dans la PR qui
introduit cet ADR.

## Conséquences

- FON-451 (PR #500) applique la règle en premier : le lien vers le rapport est produit par
  le module report, exposé sur le chemin REST du membre et chargé seulement quand un membre
  ouvre le panneau. La réponse du tableau ne change pas.
- Créer un petit endpoint dédié (une query, un DTO, une route) est le prix accepté pour
  garder le tableau stable et les modules indépendants.
- Les cas existants listés plus haut ne deviennent pas interdits du jour au lendemain. Leur
  sort se décide cas par cas.
