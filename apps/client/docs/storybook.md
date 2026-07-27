# Storybook : guide pour créer une story

Ce guide s'adresse aux devs qui ne pratiquent pas Storybook au quotidien. Il ne remplace pas
la [doc officielle](https://storybook.js.org/docs) mais montre comment on l'utilise **ici**.

## C'est quoi, pourquoi

Storybook rend un composant React **isolé du reste de l'application** : pas de serveur, pas de
login, pas de navigation. Une **story** = un composant rendu avec un jeu de props donné. On
écrit une story par état métier significatif (vide, rempli, lecture seule, vue SG vs membre...).

L'analogie côté back : les **args d'une story sont aux composants ce que les fixtures sont aux
tests** : un jeu de données d'entrée nommé qui matérialise un cas.

```sh
# depuis la racine du monorepo
pnpm --filter client storybook        # dev sur http://localhost:6006
pnpm --filter client build-storybook  # build statique (celui de la CI)
```

Le Storybook est déployé automatiquement sur Scalingo à chaque push sur `develop` touchant
`apps/client/**` (workflow `deploy-storybook.yml`).

## Anatomie d'une story

Le fichier est **colocalisé** avec le composant : `Card/Card.stories.tsx`. Il est détecté
automatiquement (glob `src/**/*.stories.@(ts|tsx)` dans `.storybook/main.ts`).

Voici [`Card.stories.tsx`](../src/shared/ui/card/Card.stories.tsx), la story la plus simple du
projet :

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';

// L'export default décrit le composant : c'est le "meta"
const meta = {
  title: 'Shared/Card', // les "/" créent l'arborescence de la sidebar
  component: Card,
  parameters: { layout: 'padded' },
  tags: ['autodocs'], // génère la page "Docs" du composant
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

// Chaque export nommé = une story, affichée sous le composant dans la sidebar
export const Default: Story = {
  args: {
    title: 'Titre de la carte',
    description: 'Une description qui présente le contenu de la carte.',
    linkProps: { to: '#' },
  },
};
```

Points clés :

- `satisfies Meta<typeof Card>` + `StoryObj<typeof meta>` : les `args` sont **typés d'après
  les vraies props** du composant. Si une prop change, la story ne compile plus.
- Le nom de l'export devient le nom affiché (`Default`, `EditableEmpty` => "Editable Empty").
- `title` : `Shared/...` pour les briques génériques, `Features/...` pour les composants métier.
- `tags: ['autodocs']` : toujours, c'est la convention du projet.

## Args et Controls

Les **args** sont les props passées au composant. Storybook en déduit automatiquement le
panneau **Controls** dans l'UI (un champ texte pour une `string`, une checkbox pour un
`boolean`...) grâce aux types TypeScript. **Par défaut, on n'écrit rien** : l'inférence suffit.

On ajoute des `argTypes` uniquement quand l'inférence est inadéquate, comme dans
[`PriorityBadge.stories.tsx`](../src/shared/components/priority-badge/PriorityBadge.stories.tsx) :

```tsx
const meta = {
  title: 'Shared/PriorityBadge',
  component: PriorityBadge,
  argTypes: {
    priority: { control: 'inline-radio', options: priorities }, // radio plutôt que champ libre
    acronym: { control: 'boolean' },
  },
  args: { acronym: false, priority: PrioriteEnum.ETOILE, small: true }, // args par défaut du meta
  // ...
} satisfies Meta<typeof PriorityBadge>;
```

### Quel control choisir ?

Repère de choix quand l'inférence ne donne pas le résultat attendu :

| Donnée de la prop        | `control`                                           | Rendu dans le panneau           |
| ------------------------ | --------------------------------------------------- | ------------------------------- |
| `boolean`                | `'boolean'` (inféré)                                | interrupteur                    |
| `string` libre           | `'text'` (inféré)                                   | champ texte                     |
| `number`                 | `'number'` ou `'range'`                             | champ numérique ou slider       |
| un choix parmi une liste | `'radio'`, `'inline-radio'`, `'select'` + `options` | boutons radio ou menu déroulant |
| plusieurs choix          | `'check'`, `'multi-select'` + `options`             | cases à cocher                  |
| date                     | `'date'`                                            | sélecteur de date               |
| couleur                  | `'color'`                                           | pipette                         |
| objet ou tableau         | `'object'` (inféré)                                 | éditeur JSON                    |
| prop à cacher du panneau | `false`                                             | rien                            |

Deux raccourcis à connaître :

- une prop typée union de strings (`'SIEGE' | 'PARQUET'`) est inférée en radio / select toute
  seule, sans `argTypes`
- les props finissant par `color`/`background` ou `Date` reçoivent automatiquement une
  pipette / un sélecteur de date (matchers configurés dans `preview.tsx`)

La liste complète est dans la [doc des controls](https://storybook.js.org/docs/essentials/controls#annotation).

Les stories dérivent les unes des autres par leurs args, inutile de tout répéter :

```tsx
export const EditableUpcoming: Story = { args: { auditionDateTime: UPCOMING_AT } };
export const ReadonlyMemberUpcoming: Story = {
  args: { auditionDateTime: UPCOMING_AT, editable: false },
};
```

Les args non redéfinis viennent du `meta.args`.

## Les spécificités du projet

### Ce qui est déjà fourni globalement

[`.storybook/preview.tsx`](../.storybook/preview.tsx) enveloppe **toutes** les stories avec :

- le CSS DSFR + `startReactDsfr` (thème clair)
- `IntlProvider` de react-intl en `fr`
- un `MemoryRouter` de react-router

Donc : pas besoin d'ajouter ces providers dans une story. Si le composant lit l'URL
(`useParams`, route SG vs membre...), on configure le router par story :

```tsx
const meta = {
  // ...
  parameters: {
    layout: 'padded',
    router: { initialEntries: ['/secretariat-general/session/session-1'] },
    // et si le composant lit des params : router: { initialEntries: [...], path: '/session/:id' }
  },
} satisfies Meta<typeof MyComponent>;
```

### Composant qui fait des queries Tanstack Query

On ne mocke pas le réseau : on **seed le cache** avec
[`StoryQueryClient`](../src/shared/storybook/StoryQueryClient.tsx) et les factories de
`src/test-utils/factories/`. Quand le composant a besoin de contexte (provider, données), on
écrit un petit composant wrapper qui devient le `component` du meta. Voir
[`MagistratAuditionDate.stories.tsx`](../src/features/nomination-files-table/components/cells/magistrat-side-panel/components/magistrat-audition-date/MagistratAuditionDate.stories.tsx)
pour un exemple complet :

```tsx
function MagistratAuditionDateStory(props: { editable: boolean; auditionDateTime: number | null }) {
  const nominationFile = makeSessionNominationFile({/* ... */});
  return (
    <StoryQueryClient>
      <NominationFilesTableContext value={/* ... */}>
        <MagistratAuditionDate editable={props.editable} nominationFile={nominationFile} />
      </NominationFilesTableContext>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratAuditionDate',
  component: MagistratAuditionDateStory, // le wrapper, pas le composant nu
  // ...
} satisfies Meta<typeof MagistratAuditionDateStory>;
```

Les props du wrapper deviennent les args : on choisit ainsi des controls **métier** simples
(`editable`, `auditionDateTime`) plutôt que d'exposer des structures complexes. Pour seeder
une query : `<StoryQueryClient seed={(client) => client.setQueryData(key, data)}>`.

## Pour aller plus loin

- [Decorators](https://storybook.js.org/docs/writing-stories/decorators) : wrapper de rendu par story ou par composant
- [Play functions](https://storybook.js.org/docs/writing-stories/play-function) : simuler des interactions (clic, saisie) après le rendu

Note : la doc et les exemples du web mentionnent parfois `@storybook/addon-essentials` ou une
syntaxe "CSF factories". Les essentials sont intégrés au core depuis Storybook 9 (rien à
installer) et le projet utilise la syntaxe **CSF3** montrée ci-dessus.
