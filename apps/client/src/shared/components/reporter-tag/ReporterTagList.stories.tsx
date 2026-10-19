import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReporterTagList } from './ReporterTagList';

const CAMILLE = { firstName: 'Camille', id: 'camille', lastName: 'Commun' };

const OTHER_REPORTERS = [
  { firstName: 'Honorine', id: 'honorine', lastName: 'Valrose' },
  { firstName: 'Ada', id: 'ada', lastName: 'Lovelace' },
  { firstName: 'Jean-Pierre', id: 'jean-pierre', lastName: 'de la Tour' },
  { firstName: 'Marie', id: 'marie', lastName: 'Curie' },
  { firstName: 'Sophie', id: 'sophie', lastName: 'Siège' },
  { firstName: 'Paul', id: 'paul', lastName: 'Parquet' },
];

function ReporterTagListStory(props: { excludedJurisdiction: boolean; max: number }) {
  const camille = props.excludedJurisdiction
    ? { ...CAMILLE, excludedTitle: "Juridiction exclue pour Camille COMMUN : Cour d'appel de Lyon" }
    : CAMILLE;

  return <ReporterTagList max={props.max} reporters={[camille, ...OTHER_REPORTERS]} />;
}

const meta = {
  title: 'Shared/ReporterTagList',
  component: ReporterTagListStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    max: { control: { min: 1, type: 'number' } },
  },
  args: {
    excludedJurisdiction: false,
    max: 3,
  },
} satisfies Meta<typeof ReporterTagListStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
