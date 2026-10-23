---
title: Les règles métier traversent le contrat comme des capacités calculées par le back
author:
  - github.com/kornifex
date: 2026-10-19
---

## En une phrase

Une règle métier vit dans le domaine du back et arrive au client comme une capacité calculée du
contrat OpenAPI : le front ne réimplémente aucun prédicat.

## Contexte

Plusieurs règles métier étaient recopiées dans le client : le commentaire obligatoire d'un avis
défavorable, les libellés d'issue selon la formation. Rien ne détectait l'écart : si le back changeait,
le client compilait toujours et l'utilisateur voyait l'ancienne règle.

Le bon motif existait déjà (`canScheduleAudition`), mais il n'était écrit nulle part. L'ADR du
13/07/2026 (`apps/client/docs/adr/2026-07-13-libelles-metier-servis-par-l-api.md`) règle le cas du
vocabulaire. Celui-ci règle celui des prédicats : ce que l'utilisateur peut ou doit faire.

## Décision

- **Une règle, un endroit** : une fonction pure du domaine, testée unitairement
  (`shared/policies/nomination-file.policies.ts` ou l'objet orchestrateur). La query l'appelle pour la
  servir, la mutation pour la faire respecter. `canScheduleAudition` est servi par
  `list-nomination-files.query.ts` et revérifié par `SessionTransparence.assertsCanScheduleAudition`.
  Le SQL charge les faits, il ne décide pas.
- **Trois formes dans le contrat**, et aucune autre :
  - `can<Action>: boolean` quand le client montre ou masque, active ou désactive une action
    (`canScheduleAudition`, `canCreateOfficialReport`) ;
  - `<chose>Required: boolean` pour une obligation (`outcome.commentRequired`, `auditionRequired`) ;
  - un statut quand le client doit expliquer pourquoi l'action est impossible
    (`lockedReason: 'ARCHIVED_SESSION' | 'REPORTED' | null`).
- **Critère de revue** : un `if` du front sur une valeur métier qui décide de ce que l'utilisateur peut
  ou doit faire (montrer ou activer une action, valider un formulaire, filtrer une liste, lever une
  alerte) est une capacité manquante dans le contrat.
- **Restent dans le front** :
  - la présentation d'une valeur servie : un `switch` sur une enum pour choisir une couleur, une icône
    ou un message (`OutcomeBadge`, le message de `DocActionDelete`) ;
  - la combinaison d'une capacité servie avec un état d'interface pas encore envoyé, comme un
    formulaire en cours de saisie.
- **Deux duplications acceptées**, le back restant l'autorité à chaque requête :
  - les guards de route par rôle (`roleGuard`, accès d'ADMIN compris) : ils évitent un écran vide ou
    une 403 ;
  - la validation de forme d'une saisie (champ requis, format) pour un retour immédiat. Une règle qui
    dépend d'une donnée métier est servie : `commentRequired` dépend de l'issue.

## Conséquences

- Deux filets repèrent les dérives. La revue repère les prédicats du front grâce au critère ci-dessus,
  repris dans le `CLAUDE.md`. Après le merge sur develop, `openapi.yml` ouvre une PR `chore/openapi`
  quand le client généré ne suit plus le contrat (#472, déplacé après le merge par #475).
- #473 a appliqué cette règle à l'issue d'un dossier : le contrat sert `{ value, label, commentRequired }`
  et le client a perdu sa copie des libellés et de la règle du commentaire obligatoire.
  `outcomeRequiresComment` ne fait plus que lire le `commentRequired` servi.
- Des prédicats restent dans le client, chacun suivi par un ticket :
  - `isAuditionMissing` et `areReportersMissing` (`utils/audition-expectation.util.ts`) : FON-646 ;
  - `hasSomethingToLose` (`PresentationPlanProvider`) : FON-647 ;
  - `PROMOTABLE_ROLES` (`AdminUserDetailPage`) : FON-648. Depuis FON-658, le toggle administrateur
    lit la capacité `canHoldAdminRight`. Il ne reste que la couleur de la fiche et le bouton d'usurpation.
- `MemberTitle` a disparu avec FON-658. La distinction d'un membre se règle désormais par son rôle
  dans l'administration.
- Une capacité peut aussi prendre la forme d'une union discriminée, que le contrat sait déjà exprimer
  (`ApiOkDiscriminatedByType`) : une issue `NON_VALIDATED` qui porte son commentaire obligatoire.
