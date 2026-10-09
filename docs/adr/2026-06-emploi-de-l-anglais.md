---
title: Emploi de l'anglais
authors:
  - github.com/jquagliatini
  - github.com/jessicakossibale
date: 2026-06-15
---

Au fil des changements d'équipe, le code est passé de l'anglais au français, puis revient à
l'anglais.

> [!IMPORTANT]
> **En résumé :** l'anglais est la langue principale du code, sauf pour les termes métier qui
> n'ont pas d'équivalent.

## Pourquoi

1. Le code reste homogène avec les termes techniques, déjà en anglais. Le mélange des deux
   langues ne disparaît pas. Il diminue, ce qui réduit la charge cognitive[^1] (voir
   [Points négatifs](#points-négatifs)).

2. Le code est plus cohérent avec les outils, par exemple avec Vitest : `it('should ...')` se lit
   plus simplement.

3. Le choix oblige à tenir un glossaire métier.

[^1]: https://github.com/zakirullin/cognitive-load

## Points négatifs

Les discussions se tiennent en français alors que le code est en anglais. Passer de l'un à
l'autre peut augmenter la charge cognitive[^1].

## Cas particuliers

_Quand ne pas utiliser l'anglais ?_

1. Lorsque le produit pilote : certains tests, par exemple, reprennent directement les
   discussions avec le produit.

2. Lorsqu'un terme métier n'a pas d'équivalent : une traduction approximative crée de la
   confusion. Le terme français est alors conservé.

3. Dans les documents rédigés, comme celui-ci.

## Glossaire métier _partiel_

### Nomination

| **Anglais**         | Français                            | Définition                                                                  |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| **Nomination File** | Proposition de nomination / Dossier | La combinaison de la candidature et de l'identité des magistrats concernés. |

### Éditique et documents

| **Anglais**                   | Français                       | Définition                                                                                     |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Documents / Docs**          | Éditique                       | Génération documentaire                                                                        |
| **Agenda**                    | Ordre du jour                  | L'ordre du jour annoncé à la DSJ                                                               |
| **Official report**           | Procès-verbal de restitution   | Le document rapportant les décisions du Conseil à la Direction des Services Judiciaires (DSJ)  |
| **Justice Presentation Plan** | Notice de restitution à la DSJ | La notice / trame interne fournie au président pour l'accompagner dans sa restitution à la DSJ |

## Termes non traduits

1. **Transparence** : le code emploie plutôt `Nomination session`. Le terme reste dans
   la valeur `TRANSPARENCE_GDS` de `TypeDeSaisine`.

2. **Magistrat**
