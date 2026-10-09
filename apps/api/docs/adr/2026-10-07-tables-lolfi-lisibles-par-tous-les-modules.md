---
title: Les tables LOLFI se lisent directement depuis tous les modules, comme `users`
author:
  - github.com/kornifex
date: 2026-10-07
---

## En une phrase

Les tables de `data_administration_context` remplies par l'ingestion LOLFI se lisent
directement (en SQL ou avec Prisma) depuis n'importe quel module, sans passer par une API.

## Contexte

L'ADR du 20/07/2026 pose qu'un module lit les données d'un autre module par son service, avec
une seule exception : la table `users`.

Les tables de `data_administration_context` (`candidate`, `position`, `function`,
`jurisdictions`...) sont écrites par le module ingest, à chaque import LOLFI. Ce module n'expose
qu'une lecture interne (`internalDetailsLolfiSession`, utilisée par session pour importer une
session). Ces tables n'appartiennent à aucun module métier : elles décrivent les postes, les
juridictions et les candidatures telles que LOLFI les transmet.

Plusieurs modules les lisaient déjà directement. FON-550 ajoute une nouvelle lecture : la fiche
magistrat affiche le numéro de téléphone que LOLFI recopie sur chaque candidature.

## Décision

- **Tous les modules peuvent lire directement les tables de `data_administration_context`**,
  comme la table `users`. La jointure reste en SQL.
- **Seul le module ingest les écrit.** Une donnée saisie dans Fondation vit dans les tables du
  module qui la possède, jamais dans celles de LOLFI, que chaque réingestion met à jour. Les
  numéros saisis par le Secrétariat général vivent ainsi dans
  `nominations_context.magistrat_phone_number`.

## Cas particuliers

- **`nominations_context.magistrat`** est elle aussi une copie LOLFI : seul ingest l'écrit
  (`insertMagistratRawQuery`). Elle relève de la même règle, même si elle n'est pas rangée dans
  `data_administration_context`.
- **`excluded_jurisdictions`** n'était pas une table LOLFI, malgré son schéma d'origine. Seul le
  module members l'écrit (les juridictions qu'un membre exclut de l'auto-affectation) et ingest
  n'y touche jamais. Depuis FON-591, elle vit dans `identity_and_access_context`, à côté de
  `users`. Elle relève de la règle générale : les autres modules la lisent par `MembersService`
  (`internalFindExcludedJurisdictions`).

## Cas existants

Lectures des tables LOLFI hors du module ingest, au 09/10/2026 :

| Module      | Requêtes SQL                                                                                                                                        | Lectures Prisma                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| magistrat   | `findMagistratProfilesRawQuery`, `listMagistratPhoneNumbersRawQuery`, `searchMagistratRawQuery`                                                     | `DetailMagistratQuery` (`position`)                                                             |
| members     | `detailsMemberRawQuery`, `listMembersRawQuery`                                                                                                      | `MemberRepository`, `SearchJurisdictionsQuery` (`jurisdiction`)                                 |
| observation | `findMagistratsCurrentPositionRawQuery`                                                                                                             |                                                                                                 |
| report      |                                                                                                                                                     | `DetailReportQuery` (`detectedJurisdiction`)                                                    |
| session     | `findAgendaNominationFilesRawQuery`, `findNominationFileJurisdictionsRawQuery`, `insertLodamNominationFilesRawQuery`, `listNominationFilesRawQuery` | `AuditionsSeenFinder`, `TransparenceFilesFinder`, `DetailSummaryQuery` (`detectedJurisdiction`) |

## Conséquences

- Afficher le poste, la juridiction ou le téléphone d'un magistrat ne demande pas d'endpoint
  dédié dans le module ingest.
- Un changement de structure de ces tables touche tous les modules qui les lisent. Les types
  Prisma et les requêtes TypedSQL le signalent à la génération du client (`prisma:generate`).
