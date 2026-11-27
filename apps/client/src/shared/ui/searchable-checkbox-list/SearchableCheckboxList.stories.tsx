import Tag from '@codegouvfr/react-dsfr/Tag';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { matchesSearch, SearchableCheckboxList } from './SearchableCheckboxList';

const COURTS = [
  ['TJ  AGEN', "Tribunal judiciaire d'Agen"],
  ['TJ  AJACCIO', "Tribunal judiciaire d'Ajaccio"],
  ['TJ  ALBERTVILLE', "Tribunal judiciaire d'Albertville"],
  ['TJ  AUCH', "Tribunal judiciaire d'Auch"],
  ['TJ  BASTIA', 'Tribunal judiciaire de Bastia'],
  ['TJ  BAYONNE', 'Tribunal judiciaire de Bayonne'],
  ['TJ  BEZIERS', 'Tribunal judiciaire de Béziers'],
  ['TJ  CAHORS', 'Tribunal judiciaire de Cahors'],
  ['TJ  CRETEIL', 'Tribunal judiciaire de Créteil'],
  ['TJ  GRASSE', 'Tribunal judiciaire de Grasse'],
  ['TJ  LYON', 'Tribunal judiciaire de Lyon'],
  ['TPI NOUMEA', 'Tribunal de première instance de Nouméa'],
  ['TJ  PARIS', 'Tribunal judiciaire de Paris'],
  ['TJ  TOULON', 'Tribunal judiciaire de Toulon'],
].map(([id, label]) => ({ id: id!, label: label! }));

const CHOSEN = ['TJ  AUCH', 'TJ  CAHORS'];
const NOTHING: string[] = [];

const STATES = {
  chosen: { checked: CHOSEN, isLoading: false, search: '' },
  loading: { checked: NOTHING, isLoading: true, search: '' },
  noMatch: { checked: CHOSEN, isLoading: false, search: 'Marseille' },
  nothingChosen: { checked: NOTHING, isLoading: false, search: '' },
};

type StoryArgs = { state: keyof typeof STATES; withAdaptationTags: boolean; withCourtCodes: boolean };

function SearchableCheckboxListStory(props: StoryArgs) {
  return <InteractiveList key={props.state} {...props} />;
}

function InteractiveList(props: StoryArgs) {
  const start = STATES[props.state];
  const [checked, setChecked] = useState<string[]>(start.checked);
  const [search, setSearch] = useState(start.search);
  const [adapted, setAdapted] = useState(['TJ  AUCH']);
  const options = start.isLoading ? [] : COURTS.filter(({ label }) => matchesSearch(label, search));

  return (
    <div className="max-w-xl">
      <SearchableCheckboxList
        canShowCheckedOnly
        checked={checked}
        countLabel={
          <FormattedMessage
            defaultMessage="{count, plural, =0 {Aucune juridiction sélectionnée} one {# juridiction sélectionnée} other {# juridictions sélectionnées}}"
            values={{ count: checked.length }}
          />
        }
        emptyLabel="Aucune juridiction ne correspond à la recherche"
        error={
          !start.isLoading && checked.length === 0
            ? 'Choisissez au moins une juridiction parmi les tribunaux judiciaires'
            : undefined
        }
        isLoading={start.isLoading}
        legend="Tribunaux judiciaires"
        onChange={setChecked}
        onSearchChange={setSearch}
        options={options.map((court) => ({
          ...court,
          aside: props.withAdaptationTags && checked.includes(court.id) && (
            <Tag
              nativeButtonProps={{
                onClick: () =>
                  setAdapted(
                    adapted.includes(court.id)
                      ? adapted.filter((id) => id !== court.id)
                      : [...adapted, court.id],
                  ),
                type: 'button',
              }}
              pressed={adapted.includes(court.id)}
              small
            >
              Adapter les lignes directrices de gestion
            </Tag>
          ),
          hint: props.withCourtCodes ? court.id : undefined,
        }))}
        search={search}
        searchLabel="Rechercher une juridiction parmi les tribunaux judiciaires"
      />
    </div>
  );
}

const meta = {
  args: { state: 'chosen', withAdaptationTags: false, withCourtCodes: false },
  argTypes: {
    state: {
      control: 'inline-radio',
      description:
        "chosen part de juridictions choisies, nothingChosen d'aucune avec le message d'erreur, noMatch d'une recherche sans résultat et loading d'un chargement depuis l'API. Les cases et la recherche répondent ensuite.",
      options: Object.keys(STATES),
    },
    withAdaptationTags: {
      control: 'boolean',
      description:
        "Une étiquette en bout de ligne des juridictions cochées, comme l'adaptation d'un appel spécifique.",
    },
    withCourtCodes: {
      control: 'boolean',
      description: "Le code de chaque juridiction sous son nom, comme les juridictions exclues d'un membre.",
    },
  },
  component: SearchableCheckboxListStory,
  parameters: {
    docs: {
      description: {
        component:
          "Une recherche au-dessus d'une liste de cases à cocher qui défile dans son cadre. Toute la ligne d'un choix le coche, sauf ce qui se trouve en bout de ligne. La barre du bas compte la sélection, l'affiche seule ou la vide. L'écran garde la recherche et la sélection. Il filtre les choix lui-même ou les demande à l'API.",
      },
    },
    layout: 'padded',
  },
  title: 'Shared/SearchableCheckboxList',
} satisfies Meta<typeof SearchableCheckboxListStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
