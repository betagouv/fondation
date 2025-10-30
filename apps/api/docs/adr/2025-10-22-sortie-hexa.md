## Sortie progressive du framework hexagonal

|       |                         |
| ----- | ----------------------- |
| Qui   | @jquagliatini, @dakie62 |
| Quand | 2025-10-22              |
| Topic | Architecture technique  |

Nous avons décidé d'une sortie progressive du framework hexagonal présent dans les dossiers suivant:

- `data-administration-context`
- `files-context`
- `identity-and-access-context`
- `nomination-context`
- `reports-context`
- `shared-kernel`

Plutôt que de réécrire l'application en mode "Big Bang", nous avons décidé de procéder en différentes étapes:

## 1. Conserver la modélisation en base de données

Bien qu'elle soit imparfaite, essayer de migrer vers un nouveau modèle de données serait, à date, trop coûteux.

## 2. Proposer les évolutions demandées dans un module séparés

Toutes les évolutions demandés seront intégrées dans un espace séparé du reste de l'applicatif:

- Gagner en vélocité pour répondre rapidement aux besoin d'expérimentation et rassurer les utilisateurs quand à notre capacité à répondre à leurs attentes
- Lorsque c'est possible, faire une modélisation guidée par le métier
- Accepter de ne pas respecter certains principes, par pragmatisme, lorsqu'il y a consensus dans l'équipe de développement

## 3. Continuer à utiliser l'existant lorsque c'est nécessaire

Lorsqu'il est plus simple de dépendre d'un service existant, se permettre de les utiliser.

## 4. Porter les cas d'usages existant vers l'architecture cible

Une fois les pratiques stabilisées, et les grands principes définis, les modules existant devront
être dépréciés et portés vers l'architecture cible.

## 5. Proposer un modèle de données plus robuste

Le modèle de données respecte difficilement les formes normales, et présente un risque de dérive en performance.
Une fois les pratiques de développement définies, il faudra revoir la modélisation en base.
