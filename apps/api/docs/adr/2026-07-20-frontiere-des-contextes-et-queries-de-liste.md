---
title: Les données d'un module sont servies par son API, pas par la requête du tableau des dossiers
status: proposé
author:
  - github.com/jessicakossibale
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
- **Une donnée qui appartient à un autre module est servie par un endpoint de ce module** et
  chargée seulement quand l'écran en a besoin. Exemple : le lien vers le rapport du membre
  est servi par le module report (`GET /api/reports/v2/nomination-files/:id/mine`) et chargé
  à l'ouverture du panneau. C'est le pattern posé par FON-505 et repris par FON-451 : une
  classe query, un `findFirst` Prisma et un DTO nommé selon la convention (`Search…Dto` en
  entrée, `Found…Dto` en sortie).
- Côté client, cette donnée a sa propre query Tanstack, avec sa clé dans le registre et un
  `enabled` pour ne charger qu'à l'usage. Elle ne passe pas par le cache du tableau.

## Dette existante à trancher

Le code contient des cas qui ne suivent pas cette règle. Ils sont listés ici pour décider,
cas par cas : on garde ou on corrige ?

| Cas                                                                                                           | Où                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| le tableau contient des données propres à l'utilisateur connecté (`member_memo`, commentaires d'observations) | `listNominationFilesRawQuery`                                                            |
| le tableau contient un détail d'affichage (`hasAttachment`)                                                   | `listNominationFilesRawQuery`                                                            |
| le tableau lit les noms des rapporteurs dans les tables du module identity                                    | `listNominationFilesRawQuery`                                                            |
| le module session lit les tables du module report                                                             | `internalDetailsMemberSessionRawQuery`, `internalCountTotalDetailsMemberSessionRawQuery` |
| le module session supprime des lignes dans les tables du module report                                        | `deleteReportsAfterAffectationPublicationRawQuery`                                       |
| le module members lit les tables des modules nominations, report et identity                                  | `detailsMemberRawQuery`, `listMembersRawQuery`                                           |
| la génération d'agenda lit les tables des modules nominations et identity                                     | `findAgendaNominationFilesRawQuery`                                                      |

Tout n'est pas à corriger. Afficher le nom d'un rapporteur oblige à lire la table des
utilisateurs : sans cette lecture, pas de nom. La fiche membre est un écran de synthèse,
elle rassemble forcément des données de plusieurs modules. La liste sert à trier ce qui est
normal et ce qui est de la dette.

À savoir aussi : les tables des différents modules vivent dans la même base et certaines
sont liées entre elles (un rapport pointe vers son dossier, avec suppression en cascade).
Cette règle ne cherche pas à couper ces liens en base. Elle dit seulement que pour obtenir
la donnée d'un autre module, on passe par son API plutôt que par ses tables.

Chaque cas classé "à corriger" donnera un ticket dédié. Aucun n'est traité dans la PR qui
introduit cet ADR.

## Conséquences

- FON-451 (PR #500) applique la règle en premier : le lien vers le rapport est servi par le
  module report et payé seulement par les membres qui ouvrent le panneau. La réponse du
  tableau ne change pas.
- Créer un petit endpoint dédié (une query, un DTO, une route) est le prix accepté pour
  garder le tableau stable et les modules indépendants.
- Les cas existants listés plus haut ne deviennent pas interdits du jour au lendemain. Leur
  sort se décide cas par cas.
