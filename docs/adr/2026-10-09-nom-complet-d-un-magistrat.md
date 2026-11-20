---
title: Le nom complet d'un magistrat suit le format de LODAM et des documents officiels
author:
  - github.com/kornifex
date: 2026-10-09
---

## Contexte

Deux règles d'affichage du nom d'un magistrat cohabitaient. Les tableaux, l'agenda et le procès-verbal
écrivaient `GAUTHIER Isabelle (ép. ROBERT)`, à partir du nom de naissance et du nom marital. La fiche
magistrat et les observations écrivaient `ROBERT Isabelle`, à partir du nom d'usage, et la règle était
recopiée côté client. Une même magistrate n'avait donc pas le même nom d'un écran à l'autre, ni entre
l'écran et le document officiel.

## Décision

- **Le nom complet** d'un magistrat est son nom de naissance, son prénom, puis son nom marital entre
  parenthèses : `GAUTHIER Isabelle (ép. ROBERT)`. C'est le format des documents transmis par la
  Chancellerie : le nom de naissance ne change jamais, il identifie la personne sans ambiguïté.
- **Le nom d'usage n'y figure pas**, bien que le magistrat exerce sous ce nom : il reste affiché à part,
  sur la fiche identité.
- Le nom marital est omis lorsqu'il est égal au nom de naissance, sans tenir compte de la casse ni des
  espaces en trop. `ép.` vaut pour une épouse comme pour un époux.
- **L'API construit le nom complet en un seul endroit** : les fonctions du domaine magistrat, dont une
  variante précédée de la civilité (`Mme`, `M.`) pour la fiche magistrat. Une requête qui
  joint déjà le magistrat appelle directement ces fonctions pures plutôt que d'ajouter une lecture par le
  `MagistratService` : elles ne lisent aucune donnée, elles ne font qu'écrire le nom. Le client l'affiche
  tel qu'il le reçoit, conformément à
  [l'ADR sur les libellés métier](../../apps/client/docs/adr/2026-07-13-libelles-metier-servis-par-l-api.md).
- **Les documents de séance font exception** (amendement du 2026-11-17, FON-772) : l'ordre du jour, le
  procès-verbal et la notice de restitution impriment le prénom avant le nom, `Mme Isabelle GAUTHIER (ép.
  ROBERT)`, à la demande du Secrétariat général. Une fonction du même domaine écrit ce nom en séance avec
  les mêmes règles de casse et de nom marital. Un document validé garde le nom avec lequel il a été envoyé.

## Conséquences

- Le nom stocké avec un dossier à l'import (`ROUSSEL BRIGITTE ep. HOFFMANN`) ne change pas : il sert de
  clé de rapprochement avec le nom transmis par LODAM. On affiche le nom complet du magistrat rapproché,
  et le nom stocké tel quel lorsque aucun magistrat n'a été rapproché, sans tenter de le découper.
- Le tri et la recherche des propositions restent faits sur ce nom stocké.
- Les membres du CSM ne sont pas concernés : ce sont des utilisateurs, affichés `Honorine VALROSE`.
