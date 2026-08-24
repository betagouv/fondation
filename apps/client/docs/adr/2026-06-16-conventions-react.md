---
title: Conventions de développements sur les composants React
author:
  - github.com/jquagliatini
  - github.com/jessicakossibale
date: 2026-06-16
---

> [!NOTE]
> Certains de ces conventions sont difficilement portable vers oxlint.
> Si des plugins permettent de forcer ces conventions on devrait privilégier
> leurs automatisations.

## [A] Privilégier le mot-clé `function`

Lorsqu'on déclare une fonction, on utilise le mot-clé `function` plutôt
que de déclarer une lambda

### Exception

1. On a besoin d'utiliser `this` en dehors du scope courant

2. On est déjà dans une fonction. Re-déclarer une fonction, avec le mot-clé est un peu déroutant

3. En dehors des composants, certains hooks gagnent en lisibilité lorsque déclaré comme lambda (e.g. les react-query)

### Exemples

```ts
// Les hooks utilisent `function`
function useUpdateMovieRatingMutation() {
  const client = useQueryClient();
  return useMutation({..., onSuccess: () => queryClient.invalidateQueries() });
}

// Les react-query sont plus lisible comme lambda
const useMoviesListQuery = useQuery({ /* ... */ });
```

```tsx
// le composant exporté est une `function`
export function PokemonCard() {
  // fonction déclaré dans la méthode, OK
  const fetchPokemen = () => fetch(`...`).then((res) => res.json());
}
```

### Candidat lint

[func-style](https://oxc.rs/docs/guide/usage/linter/rules/eslint/func-style)
est un bon candidat, mais un peu trop systématique.

## [B] Les composants sont des fonctions

1. Les composants sont des fonctions et doivent donc utiliser le mot-clé `function`.
2. On n'utilise pas d'export par défaut.

```tsx
export function Card(props: React.PropsWithChildren) {
  return <div className="rounded shadow p-2 bg-[canvas]">{props.children}</div>;
}
```

### Exceptions

1. On a besoin de respecter un type précis (très rare et globalement à éviter)
2. On utilise `React.memo` ou équivalent (obsolète avec React Compiler ?)

## [C] Les props sont typés en "inline"

De manière générale, on préférera déclarer les types directement au
niveau du seul paramètre de la fonction et utiliser le terme de props.

```tsx
export function Card(props: React.PropsWithChildren<{ className: string }>) {
  return <div className={clsx('rounded shadow fr-p-2v bg-[canvas]', props.className)}>{children}</div>;
}
```

1. en utilisant props, la provenance des informations est claire
2. l'export ou la réutilisation des types de Props est généralement un smell

### Exceptions

On a besoin de complexifier le type, par exemple:

1. On hérite des props d'un composant html

```ts
type CardProps = { title: string; description: string } & React.HTMLAttributes<HTMLDivElement>;
```

2. On veut créer un type complexe (discriminated union, Omit, Pick...). Généralement, _à éviter_

```ts
type ButtonProps =
  | ({ as: 'link'; link: LinkProps } & React.HTMLAttributes<HTMLAnchorElement>)
  | ({ as: 'button'; priority: 'primary' | 'secondary' } & React.HTMLAttributes<HTMLButtonElement>);
```

3. On peut déconstruire les éléments des props dans le composant

```tsx
export function Card(props: React.PropsWithChildren<{ className: string }>) {
  const { children, className } = props;
  return <div className={clsx('rounded', className)}>{children}</div>;
}
```

On perd le bénéfice C.1, mais on peut parfois gagner en lisibilité
