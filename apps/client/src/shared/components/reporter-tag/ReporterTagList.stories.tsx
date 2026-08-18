import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExcludedJurisdictionIcon } from '@/features/nomination-files-table/components/ExcludedJurisdictionIcon';
import { ExcludedJurisdictionLines } from '@/features/nomination-files-table/components/ExcludedJurisdictionLines';
import type { ExcludedJurisdictionConflict } from '@/features/nomination-files-table/context/member-excluded-jurisdictions';

import { ReporterTagList } from './ReporterTagList';

const LYON = "Cour d'appel de Lyon";
const RENNES = "Cour d'appel de Rennes";

const CAMILLE = { firstName: 'Camille', id: 'camille', lastName: 'Commun' };
const PAUL = { firstName: 'Paul', id: 'paul', lastName: 'Parquet' };
const SOPHIE = { firstName: 'Sophie', id: 'sophie', lastName: 'Siège' };

function conflict(memberName: string, jurisdiction: string): ExcludedJurisdictionConflict {
  return { fileId: 'file-1', fileNumber: 12, jurisdiction, memberId: memberName, memberName };
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
      SOPHIE,
      CAMILLE,
      PAUL,
    ],
  },
} satisfies Meta<typeof ReporterTagList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SharedExcludedJurisdiction: Story = {
  args: {
    details: (
      <ExcludedJurisdictionLines
        className="mt-1"
        conflicts={[conflict('Camille COMMUN', LYON), conflict('Sophie SIÈGE', LYON)]}
      />
    ),
    reporters: [
      { ...CAMILLE, icon: <ExcludedJurisdictionIcon /> },
      { ...SOPHIE, icon: <ExcludedJurisdictionIcon /> },
      PAUL,
    ],
  },
};

export const ExcludedJurisdictions: Story = {
  args: {
    details: (
      <ExcludedJurisdictionLines
        className="mt-1"
        conflicts={[
          conflict('Camille COMMUN', LYON),
          conflict('Camille COMMUN', RENNES),
          conflict('Sophie SIÈGE', LYON),
        ]}
      />
    ),
    reporters: [
      { ...CAMILLE, icon: <ExcludedJurisdictionIcon /> },
      { ...SOPHIE, icon: <ExcludedJurisdictionIcon /> },
      PAUL,
    ],
  },
};
