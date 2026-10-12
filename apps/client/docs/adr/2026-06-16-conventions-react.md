---
title: Conventions de développement sur les composants React
author:
  - github.com/jquagliatini
  - github.com/jessicakossibale
date: 2026-06-16
---

> [!NOTE]
> Certaines de ces conventions sont difficilement portables vers oxlint.
> Si des plugins permettent de les vérifier automatiquement, ils sont à privilégier.

## [A] Privilégier le mot-clé `function`

Lorsqu'on déclare une fonction, on utilise le mot-clé `function` plutôt
que de déclarer une lambda.

### Exception

1. On a besoin d'utiliser `this` en dehors du scope courant.

2. On est déjà dans une fonction : y déclarer une autre fonction avec le mot-clé est déroutant.

3. En dehors des composants, certains hooks gagnent en lisibilité lorsqu'ils sont déclarés comme lambda (par exemple ceux de TanStack Query).

### Exemples

```ts
// Les hooks utilisent `function`
function useUpdateMovieRatingMutation() {
  const queryClient = useQueryClient();
  return useMutation({..., onSuccess: () => queryClient.invalidateQueries() });
}

// Les hooks TanStack Query sont plus lisibles comme lambda
const useMoviesListQuery = () => useQuery({ /* ... */ });
```

```tsx
// le composant exporté est une `function`
export function PokemonCard() {
  // fonction déclarée dans le composant, OK
  const fetchPokemen = () => fetch(`...`).then((res) => res.json());
}
```

### Candidat lint

[func-style](https://oxc.rs/docs/guide/usage/linter/rules/eslint/func-style)
est un bon candidat. Il est toutefois un peu trop systématique.

## [B] Les composants sont des fonctions

1. Les composants sont des fonctions et doivent donc utiliser le mot-clé `function`.
2. On n'utilise pas d'export par défaut.

```tsx
export function Card(props: React.PropsWithChildren) {
  return <div className="rounded shadow p-2 bg-[canvas]">{props.children}</div>;
}
```

### Exceptions

1. On a besoin de respecter un type précis (rare, à éviter).
2. On utilise `React.memo` ou un équivalent.

## [C] Les props sont typées en "inline"

On déclare le type directement sur l'unique paramètre de la fonction, nommé `props`.

```tsx
export function Card(props: React.PropsWithChildren<{ className: string }>) {
  return <div className={clsx('rounded shadow fr-p-2v bg-[canvas]', props.className)}>{props.children}</div>;
}
```

1. Avec `props`, la provenance de chaque donnée est claire.
2. Exporter ou réutiliser un type de props signale souvent un couplage inutile.

### Exceptions

On a besoin de complexifier le type, par exemple :

1. On hérite des props d'un élément HTML.

```ts
type CardProps = { title: string; description: string } & React.HTMLAttributes<HTMLDivElement>;
```

2. On a besoin d'un type complexe (union discriminée, `Omit`, `Pick`...), à éviter en général.

```ts
type ButtonProps =
  | ({ as: 'link'; link: LinkProps } & React.HTMLAttributes<HTMLAnchorElement>)
  | ({ as: 'button'; priority: 'primary' | 'secondary' } & React.HTMLAttributes<HTMLButtonElement>);
```

3. On déstructure les props dans le composant.

```tsx
export function Card(props: React.PropsWithChildren<{ className: string }>) {
  const { children, className } = props;
  return <div className={clsx('rounded', className)}>{children}</div>;
}
```

On perd le bénéfice C.1, au profit parfois de la lisibilité.
