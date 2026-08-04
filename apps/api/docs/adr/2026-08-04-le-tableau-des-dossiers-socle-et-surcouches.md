---
title: 'Le tableau des dossiers : un socle unique et des surcouches par module'
author:
  - github.com/jessicakossibale
date: 2026-08-04
---

## En une phrase

Le tableau des dossiers repose sur une requête unique possédée par le module session. Toute
donnée d'un autre module est une surcouche servie par le module propriétaire et fusionnée
côté client.

## Contexte

L'ADR du 2026-07-20 a gelé `listNominationFilesRawQuery` : la requête du tableau ne grossit
plus. Depuis, la vue membre a migré vers le tableau partagé `NominationFilesTable`, qui sert
désormais tous les rôles. Cette migration a posé la question suivante : comment afficher dans
le tableau une donnée qui appartient à un autre module, ici le statut du rapport du membre
connecté, sans rouvrir la requête gelée ?

Le code contenait déjà trois réponses partielles à cette question mais la règle n'était
écrite nulle part :

- le filtre "mes dossiers" de la vue membre passe par le paramètre générique `reporterIds`
  de la requête du tableau, sans la modifier
- le lien vers le rapport du membre (FON-451) est servi par un endpoint du module report,
  chargé à l'ouverture du panneau
- les conflits de juridictions exclues (FON-283) sont chargés par une query dédiée puis
  fusionnés au tableau dans un modèle exposé par un Context React

## Décision

Trois règles :

1. **Le socle ne grossit plus.** La requête du tableau ne contient que des données du module
   session et des primitives génériques : pagination, tri et filtres sur ses propres
   colonnes. C'est la reprise de l'ADR du 2026-07-20.
2. **Toute donnée d'un autre module est une surcouche.** Le module propriétaire l'expose par
   une query sur son service (méthode `internal...`), l'endpoint vit dans le contrôleur qui
   possède le chemin REST et la donnée est indexée par `nominationFileId`. Côté client, une
   query Tanstack dédiée la charge en parallèle du tableau et un modèle construit une fois
   dans un Context la sert à chaque ligne. Exemple : la colonne statut de la vue membre
   (`ListMemberSessionReportsQuery` côté report, `MemberReports` côté client).
3. **Filtrer sur une surcouche ne passe jamais par une jointure dans le socle.** Si un écran
   doit un jour filtrer le tableau selon une donnée de surcouche, le module propriétaire
   traduit le filtre en une liste de `nominationFileIds` et le socle se restreint à cette
   liste par une primitive générique. Cette primitive n'existe pas encore et ne sera ajoutée
   que devant un besoin confirmé.

Limite assumée : le tri serveur sur une donnée de surcouche est impossible dans ce modèle.
Le filtre couvre le besoin réel et cette limite est acceptée.

## Conséquences

- La colonne statut de la vue membre applique la règle 2 en premier. La réponse du tableau
  ne change pas.
- Les requêtes `internalDetailsMemberSessionRawQuery` et
  `internalCountTotalDetailsMemberSessionRawQuery` sont supprimées avec leur endpoint
  `detailsMemberSession`, devenu orphelin après la migration de la vue membre. Le cas
  "à trancher dans un ticket dédié" de l'ADR du 2026-07-20 (le module session lit les tables
  du module report) est soldé : cette lecture n'existe plus.
- Le prix accepté reste celui de l'ADR précédent : un petit endpoint par surcouche plutôt
  qu'une requête centrale qui accumule les sous-requêtes.
