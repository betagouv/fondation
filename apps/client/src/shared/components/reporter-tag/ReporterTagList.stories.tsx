import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReporterTagList } from './ReporterTagList';

const meta = {
  title: 'Shared/ReporterTagList',
  component: ReporterTagList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    enableTooltip: { control: 'boolean' },
    max: { control: { type: 'number', min: 1 } },
    reporters: { control: 'object' },
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
