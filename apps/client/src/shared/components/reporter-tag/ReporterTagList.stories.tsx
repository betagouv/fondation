import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReporterTagList } from './ReporterTagList';

const CAMILLE = { firstName: 'Camille', id: 'camille', lastName: 'Commun' };
const PAUL = { firstName: 'Paul', id: 'paul', lastName: 'Parquet' };
const SOPHIE = { firstName: 'Sophie', id: 'sophie', lastName: 'Siège' };

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
