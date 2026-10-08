---
title: Les tables LOLFI se lisent directement depuis tous les modules, comme `users`
author:
  - github.com/kornifex
date: 2026-10-07
---

## En une phrase

Les tables de `data_administration_context` remplies par l'ingestion LOLFI se lisent
directement en SQL depuis n'importe quel module, sans passer par une API.

## Contexte

L'ADR du 20/07/2026 pose qu'un module lit les données d'un autre module par son service, avec
une seule exception : la table `users`.

Les tables de `data_administration_context` (`candidate`, `position`, `function`,
`jurisdictions`…) sont écrites par le seul module ingest, à chaque import LOLFI. Ce module n'a
pas d'API de lecture, et ces tables n'appartiennent à aucun module métier : elles décrivent
les postes, les juridictions et les candidatures telles que LOLFI les transmet.

Plusieurs modules les lisaient déjà directement, et FON-550 en ajoute une : la fiche magistrat
affiche le numéro de téléphone que LOLFI recopie sur chaque candidature.

## Décision

- **Tous les modules peuvent lire directement les tables de `data_administration_context`**,
  comme la table `users`. La jointure reste en SQL.
- **Seul le module ingest les écrit.** Une donnée saisie dans Fondation vit dans les tables du
  module qui la possède, jamais dans celles de LOLFI, que chaque réingestion met à jour. Les
  numéros saisis par le Secrétariat général vivent ainsi dans
  `nominations_context.magistrat_phone_number`.

## Cas existants

| Module      | Requêtes                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| magistrat   | `findMagistratProfilesRawQuery`, `listMagistratPhoneNumbersRawQuery`, `searchMagistratRawQuery`               |
| members     | `detailsMemberRawQuery`, `listMembersRawQuery`                                                                |
| observation | `findMagistratsCurrentPositionRawQuery`                                                                       |
| session     | `findAgendaNominationFilesRawQuery`, `findNominationFileJurisdictionsRawQuery`, `listNominationFilesRawQuery` |

## Conséquences

- Afficher le poste, la juridiction ou le téléphone d'un magistrat ne demande pas d'endpoint
  dédié dans le module ingest.
- Un changement de structure de ces tables touche tous les modules qui les lisent. Les
  requêtes TypedSQL le signalent à la compilation.
