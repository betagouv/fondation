---
title: Architecture front feature-first
author:
  - github.com/jessicakossibale
  - github.com/jquagliatini
date: 2026-06-18
---

Suite à l'audit du front, on range désormais le code **par domaine métier**
plutôt que par type technique. Cet ADR explique où va chaque fichier et pourquoi.

## Le problème

Avant, le code était rangé par _type technique_ :

```txt
src/
├─ components/
│  ├─ guards/
│  ├─ layout/
│  ├─ login/
│  ├─ reports/
│  ├─ secretariat-general/
│  ├─ shared/
│  └─ summary/
├─ hooks/
└─ design-system/
```

Conséquences :

1. Pour travailler sur une fonctionnalité (ex. `reports`), il fallait sauter entre
   `components/reports`, `hooks/`, `utils/`, `constants/`... un même domaine était éparpillé.
2. `components/secretariat-general` mélangeait plusieurs domaines (sessions, observations,
   membres, documents) dans un seul dossier fourre-tout.
3. Le front ne ressemblait pas au back, qui lui est déjà découpé par `modules` métier.

## La décision

On distingue **trois zones**, selon la nature du fichier :

| Zone                            | Question à se poser                                                                                                        | Exemple                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `features/<domaine>/`           | Ce fichier appartient-il à **un** domaine métier ?                                                                         | `features/reports/components/ReportList.tsx` |
| `shared/`                       | Est-ce une **brique React** (composant, hook, context) réutilisée par plusieurs domaines, **sans** logique métier propre ? | `shared/ui/card`                             |
| Dossiers techniques à la racine | Est-ce une **couche technique** ou une **primitive** transverse (accès aux données, types, fonctions pures, constantes) ?  | `queries/`, `utils/`                         |

> [!NOTE]
> Règle d'or : on classe par **nature** du fichier, pas par "est-ce partagé ?".
> À la racine du `src`, **tout** est partagé par construction donc "partagé" ne
> peut pas être le critère de rangement (voir [Pourquoi pas tout dans shared](#pourquoi-pas-tout-dans-shared-)).

## `features/` : le code d'un domaine métier

Un dossier par domaine. Tout ce qui sert **ce** domaine y est co-localisé :
composants, hooks, context, constantes, libellés, utilitaires.

```txt
src/features/
├─ administration/
├─ agenda/
├─ auth/
├─ documents/
├─ jobs/
├─ members/
├─ nomination-files-table/
├─ observations/
├─ official-report/
├─ presentations/
├─ reports/
├─ sessions/
├─ summary/
└─ transparence/
```

Structure interne d'une feature (ex. `reports`) :

```txt
src/features/reports/
├─ components/
├─ constants/
├─ hooks/
├─ labels/
└─ utils/
```

**Critère d'appartenance** : si supprimer le domaine supprimerait le fichier, alors le
fichier appartient à la feature. Un formatter spécifique aux rapports vit dans
`features/reports/utils`, pas dans le `utils/` global.

## `shared/` : les briques React réutilisables

`shared/` contient les composants, hooks et context **réutilisés par plusieurs features**
et qui ne portent pas de domaine métier à eux seuls.

```txt
src/shared/
├─ components/
├─ context/
├─ hooks/
└─ ui/
```

Deux niveaux de composants, distingués par leur **direction de dépendance** et non par un
risque de collision de noms :

- **`shared/ui/`** : la couche feuille. Ces composants **ne dépendent de rien d'interne** : ni
  `features/`, ni `queries/`, ni le client généré. Ils sont purement présentationnels (`Card`,
  `DataTable`, `Breadcrumb`, les dropdowns, `combobox`, `loaders`...). C'est l'ancien
  `components/shared`.
- **`shared/components/`** : composants réutilisés qui ont le droit de **toucher un peu de
  métier** transverse sans appartenir à un domaine précis (`UserAvatar`, `PriorityBadge`,
  les `banners`, `LolfiMagistratLink`).

L'intérêt de `ui/` n'est donc pas d'éviter des collisions. Il est d'**isoler une couche sans
dépendance interne** : elle est testable seule et extractible dans un paquet sans entraîner le
reste de l'application. Cette invariante est mécanique et non seulement déclarative : une règle
`no-restricted-imports` scopée à `shared/ui/` dans `.oxlintrc.json` suffit à interdire tout
import de `features/`, `queries/` ou du client généré.

La convention d'organisation interne de ces composants (dossier `kebab-case`, barrel file
`index.ts`, import via un point d'entrée unique) est décrite dans
[Organisation des composants partagés](./2026-06-15-organisation-des-composants-partages.md).

## `pages/` : les points d'entrée du routeur

`pages/` contient les composants montés directement par le routeur. Une page **assemble**
des morceaux de `features/` et `shared/` ; elle ne contient pas de logique métier réutilisable.

```txt
src/pages/
├─ auth/
├─ documents/
│  ├─ agenda/
│  ├─ official-report/
│  └─ presentations/
├─ error/
├─ help/
├─ members/
├─ observations/
├─ reports/
├─ sessions/
├─ spaces/
├─ summary/
└─ transparence/
```

`pages/spaces/` regroupe les **coquilles par rôle** (layout + garde d'accès) :
`admin/`, `member/`, `secretariat-general/`. À quel public une page est servie est une
affaire du **routeur**, pas de la feature.

`pages/documents/` regroupe les pages des documents produits par le SG autour d'une session
(`agenda`, `official-report`, `presentations`). Ici, l'imbrication est légitime : `pages/`
**reflète l'arbre du routeur** qui est hiérarchique (`.../session/:id/docs/...`).

> [!NOTE]
> On regroupe dans `pages/` mais **pas** dans `features/`. Une feature est autonome : `agenda`,
> `official-report` et `presentations` restent à plat et **dépendent** de `features/documents/`,
> qui détient leurs briques communes (les sélecteurs de membres). Les imbriquer ferait de
> `documents/` un nœud hybride (feature _et_ namespace). Le groupement par arbre est l'affaire
> du routeur, donc de `pages/`.

## Les dossiers techniques restent à la racine

Ces dossiers ne sont **pas** des features et ne vont **pas** dans `shared/`. Ce sont des
couches techniques transverses, chacune un repère architectural reconnaissable :

```txt
src/
├─ constants/   valeurs littérales globales
├─ generated/   client API généré (hey-api), ne pas éditer à la main
├─ i18n/        internationalisation
├─ layout/      ossature de l'application (header...)
├─ queries/     couche d'état asynchrone (Tanstack Query + SDK)
├─ router.tsx   l'objet routeur (arbre des routes), rendu par main.tsx
├─ styles/      styles globaux + doc des couleurs DSFR
├─ types/       définitions de types transverses
└─ utils/       fonctions pures transverses
```

## Pourquoi pas tout dans `shared/` ?

C'est la question centrale. Pourquoi `queries/`, `types/`, `utils/`, `constants/` ne sont-ils
pas rangés sous `shared/` alors qu'ils sont eux aussi partagés ?

1. **`shared/` a un sens précis : "briques React réutilisables".** Si on y mettait aussi les
   types, les fonctions pures et la couche de données, `shared/` deviendrait un fourre-tout qui
   ne voudrait plus rien dire. "Partagé" n'est pas un critère utile à la racine, où tout est
   partagé : le critère, c'est la **nature** du fichier.

2. **Chaque dossier technique est une couche distincte.** `queries/` n'est pas "un composant
   partagé" : c'est la **couche d'accès aux données**, avec sa propre convention (un registre
   de clés par fichier, cf. `CLAUDE.md`). La garder visible et à part rend l'architecture
   lisible d'un coup d'œil. Pareil pour `types/` (définitions), `utils/` (fonctions pures),
   `constants/` (valeurs).

3. **Le test qui tranche** : ces fichiers seraient au même endroit qu'ils soient partagés ou
   non, leur place dépend de **ce qu'ils sont** (un type, une fonction, une requête), pas de
   leur réutilisation. À l'inverse, un composant ne va dans `shared/` que **parce qu'il est
   réutilisé** : sinon il reste dans sa feature.

En résumé :

|                                         | Critère de rangement                   |                       |
| --------------------------------------- | -------------------------------------- | --------------------- |
| `features/`                             | appartient à un domaine                | local                 |
| `shared/`                               | brique React réutilisée entre domaines | partagé par intention |
| racine (`queries`, `types`, `utils`...) | nature technique du fichier            | transverse par nature |

## Comment la migration a été faite

Migration **feature par feature**, une PR par feature, **sans big-bang** et **sans changement
de comportement**. Chaque PR suit la même procédure :

1. un commit qui **déplace** les fichiers (pour préserver `git blame`) ;
2. un commit qui **réécrit les imports**.

| #   | PR                                                     | Périmètre                                                     |
| --- | ------------------------------------------------------ | ------------------------------------------------------------- |
| 1   | [#427](https://github.com/betagouv/fondation/pull/427) | `summary` (pilote, valide la convention)                      |
| 2   | [#428](https://github.com/betagouv/fondation/pull/428) | `reports`                                                     |
| 3   | [#429](https://github.com/betagouv/fondation/pull/429) | dissolution de `secretariat-general` dans les features métier |
| 4   | [#430](https://github.com/betagouv/fondation/pull/430) | `admin`                                                       |
| 5   | [#431](https://github.com/betagouv/fondation/pull/431) | `auth` (login + guards)                                       |
| 6   | [#432](https://github.com/betagouv/fondation/pull/432) | `shared`                                                      |
| 7   | [#433](https://github.com/betagouv/fondation/pull/433) | `layout` + hooks transverses                                  |

## Dette connue et suites

- Le mouvement naturel à venir est de **pousser vers le bas** ce qui reste à la racine mais est
  en réalité spécifique à un domaine. Les `labels/` (libellés en dur) sont à migrer vers
  `react-intl` dans un ticket dédié.
- Certains composants `Session*` vivent dans `transparence/` (cohérent : la transparence est le
  workspace d'une session) mais sont mal nommés. Le renommage fera l'objet d'un ticket séparé,
  on ne les déplace pas au seul motif du nom.
