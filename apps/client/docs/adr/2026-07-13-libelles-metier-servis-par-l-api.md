---
title: Les libellés métier sont servis par l'API, react-intl gère les textes d'interface
author:
  - github.com/jessicakossibale
  - github.com/jquagliatini
date: 2026-07-13
---

## Contexte

Les libellés des issues d'un dossier ("avis conforme", "sursis à statuer"...) étaient dupliqués
en dur côté client, alors qu'ils relèvent d'une règle métier : le libellé varie selon la
formation siège / parquet et s'accompagne d'autres règles (commentaire obligatoire, ordre
de sélection). Le serveur en a besoin pour lui-même, sans client dans la boucle (export Excel,
documents générés) : une copie côté client peut diverger, avec un écran qui n'emploie plus
les mêmes mots que le document officiel.

En parallèle, les textes d'interface migrent vers react-intl. Deux mécanismes de texte
français cohabitent donc dans le code. Ce n'est pas une incohérence à corriger :
chacun a son rôle.

## Décision

- **Le vocabulaire métier est une donnée servie par l'API**, définie une seule fois dans le
  back (`modules/shared/nomination-file-outcome.enum.ts`, `nominationFileOutcomeLabel`) et exposée
  dans les contrats (`session.outcomes[].label`, `outcome.label`). Personne ne le redéclare : ni le client
  (en dehors des factories de test) ni les consommateurs internes au serveur (export Excel,
  templates de documents).
- Les documents officiels ne connaissent que quatre issues (`DocNominationFileOutcomeEnum`) :
  les issues non finales y deviennent "sursis à statuer" et les deux formes de retrait "retrait".
  Ce vocabulaire réduit appartient au domaine docs (`doc-nomination-file-outcome.ts`) : le libellé
  (`docNominationFileOutcomeLabel`) et les titres de section du procès-verbal
  (`docNominationFileOutcomeSectionTitle`).
- **react-intl ne gère que les textes d'interface** (boutons, titres, messages, pluriels).
  Un message peut interpoler un libellé servi (`L'issue "{label}" nécessite un commentaire`),
  jamais le redéclarer en dur.
- La présentation compacte des badges (acronymes, icônes, sévérités) reste côté client :
  c'est de l'affichage, pas du vocabulaire.

## Conséquences

- Un composant **partagé entre plusieurs features** (`OutcomeBadge`, rendu dans la table,
  l'agenda et la fiche magistrat) reçoit le libellé **en prop** : chaque appelant a sa source
  légitime et le composant n'est couplé à aucune d'entre elles.
- Un composant **interne à une feature** (`NominationFileOutcomeCommentModal`, monté sous
  `NominationFilesTable`) lit le contexte de sa feature, qui porte déjà `outcomes` : le faire
  descendre en prop ne serait que du prop drilling.
- Si un autre enum acquiert une règle du même genre (libellé dépendant d'un contexte métier,
  contrainte associée), il suit ce même chemin. Sinon, ses libellés relèvent de react-intl.
