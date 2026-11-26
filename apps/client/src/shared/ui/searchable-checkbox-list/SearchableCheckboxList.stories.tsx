import type { Meta, StoryObj } from '@storybook/react-vite';

import { SearchableCheckboxList } from './SearchableCheckboxList';

const COURTS = [
  "Tribunal judiciaire d'Agen",
  "Tribunal judiciaire d'Ajaccio",
  "Tribunal judiciaire d'Albertville",
  "Tribunal judiciaire d'Auch",
  'Tribunal judiciaire de Bastia',
  'Tribunal judiciaire de Bayonne',
  'Tribunal judiciaire de Béziers',
  'Tribunal judiciaire de Cahors',
  'Tribunal judiciaire de Créteil',
  'Tribunal judiciaire de Grasse',
  'Tribunal judiciaire de Lyon',
  'Tribunal de première instance de Nouméa',
  'Tribunal judiciaire de Paris',
  'Tribunal judiciaire de Toulon',
].map((label) => ({ id: label, label }));

const CHOSEN = [COURTS[3]!.id, COURTS[7]!.id];

const STATES = {
  chosen: { checked: CHOSEN, countLabel: '2 juridictions sélectionnées', options: COURTS, search: '' },
  loading: {
    checked: [],
    countLabel: 'Aucune juridiction sélectionnée',
    isLoading: true,
    options: [],
    search: '',
  },
  noMatch: { checked: CHOSEN, countLabel: '2 juridictions sélectionnées', options: [], search: 'Marseille' },
  nothingChosen: {
    checked: [],
    countLabel: 'Aucune juridiction sélectionnée',
    error: 'Choisissez au moins une juridiction parmi les tribunaux judiciaires',
    options: COURTS,
    search: '',
  },
};

function SearchableCheckboxListStory(props: { state: keyof typeof STATES }) {
  return (
    <div className="max-w-xl">
      <SearchableCheckboxList
        emptyLabel="Aucune juridiction ne correspond à la recherche"
        legend="Tribunaux judiciaires"
        onChange={() => {}}
        onSearchChange={() => {}}
        searchLabel="Rechercher une juridiction parmi les tribunaux judiciaires"
        {...STATES[props.state]}
      />
    </div>
  );
}

const meta = {
  args: { state: 'chosen' },
  argTypes: {
    state: {
      control: {
        labels: {
          chosen: 'Juridictions choisies',
          loading: "Choix en cours de chargement depuis l'API",
          noMatch: 'Aucun choix ne correspond à la recherche',
          nothingChosen: 'Aucune juridiction choisie',
        },
        type: 'radio',
      },
      options: Object.keys(STATES),
    },
  },
  component: SearchableCheckboxListStory,
  parameters: {
    docs: {
      description: {
        component:
          "Une recherche au-dessus d'une liste de cases à cocher qui défile dans son cadre. La barre du bas compte la sélection et la vide. L'écran garde la recherche et la sélection. Il filtre les choix lui-même ou les demande à l'API.",
      },
    },
    layout: 'padded',
  },
  title: 'Shared/SearchableCheckboxList',
} satisfies Meta<typeof SearchableCheckboxListStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
