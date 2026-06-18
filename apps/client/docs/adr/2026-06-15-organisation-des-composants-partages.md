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

Tous les composants doivent être dans le dossier [components/shared](../../src/components/shared).

## Des chemins propres

Pour encapsuler la complexité et facilité la découverte des composants, on respecte une convention proche des URLs. Du mieux possible, les exports des composants partagés doivent avoir un point de découverte unique qui expose toute la logique publique.

Les dossiers respectent une casse `kebab-case`, les composants internes respectent la convention classique en `PascalCase`.

Ce point d'export sera un fichier [barrel file](https://basarat.gitbook.io/typescript/main-1/barrel).

Ainsi pour un composant `Card` le chemin sur disque sera:

```txt
components/shared/
` - card/
  | - index.ts
  | - Card.tsx
  | - Card.stories.tsx
  | - Card.types.ts
  ` - useCard.hook.ts
```

Les composants qui importeront `Card` le feront ainsi

```tsx
import { Card } from '@/components/shared/card';
```

Le fichier barrel se contentera d'exporter les éléments publiques

```ts
// components/shared/card/index.ts
export { Card } from './Card.tsx';
export type { CardProps } from './Card.types.ts';
```

Les composants peuvent déclarer autant d'éléments internes utiles à leur fonctionnement (context, types, hooks, tests, stories storybook...) les exports
doivent correspondre à leur API publique.

## Exemples

- [card](../../src/components/shared/card)
- [data-table](../../src/components/shared/data-table)
