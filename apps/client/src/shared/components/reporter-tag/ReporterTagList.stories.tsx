import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExcludedJurisdictionIcon } from '@/features/nomination-files-table/components/ExcludedJurisdictionIcon';

import { ReporterTagList } from './ReporterTagList';

const LYON = "Cour d'appel de Lyon";
const RENNES = "Cour d'appel de Rennes";

function excludedJurisdictionDetails(titles: readonly string[]) {
  return (
    <ul className="fr-mb-0 mt-1 flex flex-col gap-1">
      {titles.map((title) => (
        <li key={title}>{title}</li>
      ))}
    </ul>
  );
}

const meta = {
  title: 'Shared/ReporterTagList',
  component: ReporterTagList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    details: { table: { disable: true } },
    enableTooltip: { control: 'boolean' },
    max: { control: { type: 'number', min: 1 } },
    reporters: { table: { disable: true } },
  },
  args: {
    enableTooltip: true,
    max: 3,
    reporters: [
      { firstName: 'Honorine', id: 'honorine', lastName: 'Valrose' },
      { firstName: 'Ada', id: 'ada', lastName: 'Lovelace' },
      { firstName: 'Jean-Pierre', id: 'jean-pierre', lastName: 'de la Tour' },
      { firstName: 'Marie', id: 'marie', lastName: 'Curie' },
      { firstName: 'Sophie', id: 'sophie', lastName: 'Siège' },
      { firstName: 'Camille', id: 'camille', lastName: 'Commun' },
      { firstName: 'Paul', id: 'paul', lastName: 'Parquet' },
    ],
  },
} satisfies Meta<typeof ReporterTagList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ExcludedJurisdictions: Story = {
  args: {
    details: excludedJurisdictionDetails([
      `Juridiction exclue pour Camille COMMUN : ${LYON}`,
      `Juridiction exclue pour Sophie SIÈGE : ${LYON}`,
    ]),
    reporters: [
      { firstName: 'Camille', icon: <ExcludedJurisdictionIcon />, id: 'camille', lastName: 'Commun' },
      { firstName: 'Sophie', icon: <ExcludedJurisdictionIcon />, id: 'sophie', lastName: 'Siège' },
      { firstName: 'Paul', id: 'paul', lastName: 'Parquet' },
    ],
  },
};

export const SeveralExcludedJurisdictions: Story = {
  args: {
    details: excludedJurisdictionDetails([`Juridictions exclues pour Camille COMMUN : ${LYON} et ${RENNES}`]),
    reporters: [
      { firstName: 'Camille', icon: <ExcludedJurisdictionIcon />, id: 'camille', lastName: 'Commun' },
      { firstName: 'Paul', id: 'paul', lastName: 'Parquet' },
    ],
  },
};
