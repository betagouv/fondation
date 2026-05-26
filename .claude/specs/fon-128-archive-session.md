----
title: Archive d'une session
description: |
  Marquer une session comme archivée 
---

## Objectif principal

Une fois une session archivée, on ne peut plus la modifier. Elle reste accessible en lecture pour tous ses lecteurs, et on doit indiquer clairement à l'utilisateur qu'il consulte de l'information qui a été archivée.

## Contraintes attendues

1. On ne peut archiver une session que lorsque tous les dossiers qui la compose sont rapportés ( voir 2. )
2. Un dossier est considéré rapporté lorsque:
   2.1. Le dossier a au moins 1 rapporteur
   2.2. Son issue est `VALIDATED` ou `NON_VALIDATED`
   2.3. Le dossier apparaît dans un PV de restitution (official report)
3. Une session archivée, désactive toute modification sur celle-ci:
   3.1. Impossible de changer les méta-données de la session (date, nom, ...)
   3.2. Impossible de changer les rapporteurs, priorités, issues, synthèses des dossiers de la session
   3.3. Impossible de générer de nouveaux documents (agenda, official report, presentation plans)
4. Une session archivée, n'accepte plus de données depuis les lolfi ingestions, on met à jour toutes les données sous-jacentes ( dans le schéma `data_administration_context` et la table `nominations_context.magistrats`), mais pas les session, dossiers, documents... (du schéma `nominations_context`)
5. Lorsque l'on archive une session, toutes les données sous-jacentes sont considérées comme archivées (dossiers, synthèses, version d'affectation...), y compris les données issues des membres (les rapports, memo, commentaires...)
6. Par cascade avec le point précédent, si un utilisateur essaie de modifier une données liée à une session archivée, on rejette l'action avec une exception
7. Une session archivée, n'est plus affichée aux members sur leur page d'accueil, et parallèlement, elle n'apparait plus dans la table de gestion des sessions pour les utilisateur au role `ADJOINT_SECRETAIRE_GENERAL` ou `ADMIN`, mais dans une page dédiée, qui reprend les mêmes écrans
   7.1. Chaque fois que l'on consulte une page qui fait référence à de la donnée archivée, on doit afficher un bandeau qui prévient l'utilisateur qu'il consulte une information archivée

on doit réaliser cette fonctionnalité de façon pragmatique en évitant de rajouter trop de logique à l'existant.
