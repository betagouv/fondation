---
title: 'Le tableau des dossiers : un socle unique et des surcouches par module'
author:
  - github.com/jessicakossibale
date: 2026-08-04
---

## En une phrase

Une seule requête, possédée par le module session, produit les lignes du tableau. Elle sert
aussi bien la liste entière qu'un dossier seul. Toute donnée appartenant à un autre module est
chargée à part puis fusionnée côté client.

Le **socle** désigne cette requête (`listNominationFilesRawQuery`) et son mapping
(`ListNominationFilesQuery`), gelés par l'ADR du 2026-07-20. Une **surcouche** désigne une
donnée affichée dans le tableau mais possédée par un autre module. Le statut du rapport du
membre connecté en est un exemple.

## Contexte

La vue membre a migré vers le tableau partagé, qui sert désormais tous les rôles. Deux
questions en ont découlé. Comment afficher le statut du rapport, une donnée du module report,
sans rouvrir la requête gelée ? Et comment servir un lien profond vers un dossier situé au-delà
des lignes chargées ? Le passage au défilement infini faisait échouer ce cas sans message.

## Décision

1. **Le socle ne grossit plus.** Il ne contient que des données du module session et des
   primitives génériques : pagination, tri et filtres sur ses propres colonnes.
2. **Toute donnée d'un autre module est une surcouche.** Le module propriétaire l'expose par
   une query `internal...` sur son service. L'endpoint vit dans le contrôleur qui possède le
   chemin REST et la donnée est indexée par `nominationFileId`. Côté client, une query Tanstack
   la charge en parallèle du tableau. Un modèle construit dans un Context la sert ensuite à
   chaque ligne. `ListMemberSessionReportsQuery` côté report et `MemberReports` côté client
   suivent ce schéma.
3. **Filtrer sur une surcouche ne passe jamais par une jointure dans le socle.** Le module
   propriétaire traduit le filtre en une liste de `nominationFileIds`. Cette primitive existe
   déjà pour la règle 4. Elle reste privée : le comptage total ne la connaît pas et l'exposer
   fausserait la pagination.
4. **Le socle sert aussi un dossier seul.** La même requête, restreinte à un identifiant, et le
   même mapping (`loadFiles`) servent l'endpoint `GET /:sessionId/files/:nominationFileId`. Il
   répond un objet identique à un item de la liste. Un test e2e le vérifie. Un dossier étranger
   à la session répond 404.

Le panneau affiche un dossier hors liste sans attendre. Ses flèches de navigation exigent en
revanche que la liste contienne le dossier. En vue non filtrée, le tableau charge tranche par
tranche jusqu'à l'atteindre. En vue filtrée, il n'essaie pas et la navigation reste désactivée.

Une limite est assumée : le tri serveur sur une surcouche n'existe pas. Le filtre couvre le
besoin réel.

## Conséquences

- Les requêtes `internalDetailsMemberSession*` et l'endpoint `detailsMemberSession` sont
  devenus orphelins. Ils sont supprimés. Le cas laissé ouvert par l'ADR du 2026-07-20, où le
  module session lit les tables du module report, est soldé : cette lecture n'existe plus.
- Le prix accepté reste celui de l'ADR précédent : un petit endpoint par surcouche plutôt
  qu'une requête centrale qui accumule les sous-requêtes.
- La requête de détail ne part que lorsque les lignes chargées ne contiennent pas le dossier.
  Un clic dans le tableau n'en déclenche jamais.
- La forme servie ne peut plus diverger entre la liste et le panneau. Le test e2e qui compare
  les deux réponses casserait.
