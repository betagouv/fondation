---
title: Organisation des composants partagés
author:
  - github.com/jquagliatini
  - github.com/jessicakossibale
date: 2026-06-15
---

Quelques bonnes pratiques concernant l'organisation des fichiers pour les composants partagés.

## Questions en suspens

- Qu'est-ce qu'un composant partagé ?
- Est-ce qu'un composant partagé n'a pas de logique métier ?

## Un dossier où retrouver tous les composants partagés

Les composants partagés vivent dans [shared/ui](../../src/shared/ui) pour les briques sans métier et dans [shared/components](../../src/shared/components) pour celles qui en portent (voir l'ADR [architecture feature-first](./2026-06-18-architecture-front-feature-first.md), qui a remplacé l'ancien dossier `components/shared`).

## Des chemins propres

Pour encapsuler la complexité et faciliter la découverte des composants, on respecte une convention proche des URLs. Du mieux possible, les exports des composants partagés doivent avoir un point de découverte unique qui expose toute la logique publique.

Les dossiers respectent une casse `kebab-case`, les composants internes respectent la convention classique en `PascalCase`.

Ce point d'export sera un fichier [barrel file](https://basarat.gitbook.io/typescript/main-1/barrel).

Ainsi pour un composant `Card` le chemin sur disque sera :

```txt
shared/ui/
` - card/
  | - index.ts
  | - Card.tsx
  | - Card.stories.tsx
  ` - Card.test.tsx
```

Les composants qui importeront `Card` le feront ainsi :

```tsx
import { Card } from '@/shared/ui/card';
```

Le fichier barrel se contentera d'exporter les éléments publics :

```ts
// shared/ui/card/index.ts
export { Card, type CardProps } from './Card';
```

Les composants peuvent déclarer autant d'éléments internes utiles à leur fonctionnement (context, types, hooks, tests, stories storybook…). Leurs exports
doivent correspondre à leur API publique.

## Exemples

- [card](../../src/shared/ui/card)
- [data-table](../../src/shared/ui/data-table)
