---
title: Le droit d'administrateur n'est pas un rôle et reste au Secrétariat général
author:
  - github.com/kornifex
date: 2026-10-22
---

## En une phrase

Un administrateur est une personne du Secrétariat général qui détient un droit en plus : son rôle reste
`ADJOINT_SECRETAIRE_GENERAL` et le droit ne se donne pas à un membre.

## Contexte

Jusqu'à FON-658, un rôle `ADMIN` remplaçait le rôle `ADJOINT_SECRETAIRE_GENERAL`. Deux défauts en
découlaient :

- changer le rôle d'un administrateur lui retirait son droit sans passer par le toggle, donc sans trace ;
- chaque règle qui ouvre une action au Secrétariat général devait aussi penser à `ADMIN`. La lecture d'un
  rapport l'avait oublié : l'administrateur recevait une 404 sur les rapports des autres (FON-676).

## Décision

- Le droit vit à côté du rôle (`users.is_admin`), et chaque octroi ou retrait est historisé
  (`admin_right_changes`).
- Seul le Secrétariat général peut le détenir. Le domaine le fait respecter à chaque écriture
  (`AuthUser.register`, `User.promoteAdmin`, `User.assignableRoles`), et la base le garantit par la
  contrainte `users_admin_within_secretariat`.
- Le Secrétariat général se reconnaît par `isSecretariat`, jamais par une comparaison au rôle en dur.

## Alternatives écartées

- **Garder un rôle `ADMIN`** : c'est la situation qui a produit les deux défauts ci-dessus.
- **Ouvrir le droit aux membres** : administrer, c'est gérer les comptes et agir à la place de n'importe
  quel utilisateur, donc lire ses rapports et ses mémos. Un membre du CSM sortirait de son rôle de juge
  des propositions et verrait le travail de ses pairs. Le Secrétariat général prépare déjà les sessions
  pour tous.

## Conséquences

- Toute règle fondée sur `isSecretariat` couvre l'administrateur, sans cas particulier.
- L'administrateur passe en plus toutes les gardes `@HasRole`. Le domaine lui refuse quelques actions,
  que `docs/droits-par-role.md` précise.
- Une modification à la main en base qui donnerait le droit à un membre échoue, au lieu de produire en
  silence un administrateur que les règles du Secrétariat général ignorent.
