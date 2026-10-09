---
title: Un module lit et écrit les autres par leurs services
author:
  - github.com/jessicakossibale
date: 2026-10-09
---

## En une phrase

Un module ne lit ni n'écrit les tables d'un autre module : il passe par une méthode `internal...`
du service propriétaire, dans la même transaction quand il écrit.

## Contexte

L'ADR du 20/07/2026 fixait cette règle pour le tableau des dossiers. Ailleurs, plusieurs modules
lisaient encore les tables de session. Session écrivait aussi dans celles de report à la
publication des affectations (FON-591).

Le schéma Postgres ne suffit pas à dire qui possède une table : `nominations_context` accueille
session, observation et magistrat.

## Décision

- Une table appartient au module qui l'écrit. Les tables `users` et LOLFI restent lisibles par
  tous (ADR du 07/10/2026).
- Une lecture passe par une méthode `internal...` du service propriétaire, appuyée sur un finder
  qui prend des identifiants.
- Une écriture passe aussi par une méthode `internal...`, appelée dans la transaction de
  l'appelant. Côté propriétaire, elle porte `@Transactional(Propagation.Mandatory)`. Exemple :
  session appelle `ReportService.internalSyncReportsWithAffectations` à la publication des
  affectations.
- Ces écritures ne passent pas par un évènement. Les évènements d'intégration partent après le
  commit et ne garantissent pas que les deux écritures réussissent ensemble.
- Une donnée recopiée d'un autre module est admise si la base en garantit la cohérence :
  `observation.session_id` est couverte par une clé étrangère composite (dossier, session).

## Conséquences

- Les modules qui s'appellent mutuellement le font par `forwardRef`. Trois chantiers permettraient
  de s'en passer :
  - déplacer les routes membres sur les sessions dans un contrôleur de session ;
  - regrouper dans un module dédié les écrans qui agrègent plusieurs modules ;
  - faire porter par docs le fait qu'un dossier est rapporté.
- Deux cas restent ouverts :
  - le détail d'un rapport, qui lit le dossier et la session ;
  - la charge d'un membre, dont la définition est à fixer avec le métier.
