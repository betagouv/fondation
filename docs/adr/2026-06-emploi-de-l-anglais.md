---
title: Emploi de l'anglais
authors:
  - github.com/jquagliatini
  - github.com/jessicakossibale
date: 2026-06-15
---

Le projet a subi plusieurs changements d'équipe, provoquant des changement d'une version en anglais, puis
avec une évolution vers le français, pour maintenant revenir à une version en anglais.

> [!IMPORTANT]
> **tl;dr**: Nous utiliserons désormais l'anglais comme langage principal, sauf lorsque des équivalents
> métiers n'existent pas.

---

## Pourquoi

1. Cela permet une homogénéité avec les termes techniques.
   Même si le mélange existe de toute façon autant limiter la [charge cognitive][^1] (voir [Points négatifs](#points-négatifs))

2. C'est plus cohérent avec les outils.
   Particulièrement vrai avec jest / vitest. `it('should ...')` est plus simple à lire.

3. Cela implique de bien réfléchir son glossaire métier

[^1]: https://github.com/zakirullin/cognitive-load

## Points négatifs

Même si le choix est pragmatique, il implique de jongler entre le français et l'anglais
lors des discussions ce qui peut augmenter la fameuse [charge cognitive][^1].

## Cas particuliers

_Quand ne pas utiliser l'anglais ?_

1. Lorsque c'est le produit qui drive.
   Certains tests par exemple sont directement issus de discussions avec le produit.

2. Lorsqu'un terme métier n'a pas vraiment d'équivalent.
   Certaines traduction peuvent créer beaucoup de confusion, et parfois si le terme est trop spécifique
   en anglais il peut être mal connu. Autant utiliser le terme en français

3. Dans les documents plus verbeux (comme celui-ci).

## Glossaire métier _partiel_

### Nomination

| **Anglais**         | Français                            | Définition                                                                  |
| ------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| **Nomination File** | Proposition de nomination / Dossier | La combinaison de la candidature et de l'identité des magistrats concernés. |

### Éditique et documents

| **Anglais**                   | Français                         | Définition                                                                                     |
| ----------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Documents / Docs**          | Éditique                         | Génération documentaire                                                                        |
| **Agenda**                    | Ordre du jour                    | L'ordre du jour annoncé à la DSJ                                                               |
| **Official report**           | Procès verbal de restitution     | Le document rapportant les décisions du conseils à la Direction des Services Judiciaires (DSJ) |
| **Justice Presentation Plan** | Notice de restitutution à la DSJ | La notice / trame interne fournit au président pour l'accompagner dans sa restitution à la DSJ |

## Termes non traduits

1. **Transparence**, on utilise relativement peu ce terme. On privilégie le terme de `Nomination session` lorsque c'est possible.
   Néanmoins le `TypeDeSaisine` nécessite ce détail

2. **Magistrat**
