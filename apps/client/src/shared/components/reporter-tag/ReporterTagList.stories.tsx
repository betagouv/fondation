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
      { firstName: 'Honorine', lastName: 'Valrose' },
      { firstName: 'Ada', lastName: 'Lovelace' },
      { firstName: 'Jean-Pierre', lastName: 'de la Tour' },
      { firstName: 'Marie', lastName: 'Curie' },
      { firstName: 'Sophie', lastName: 'Siège' },
      { firstName: 'Camille', lastName: 'Commun' },
      { firstName: 'Paul', lastName: 'Parquet' },
    ],
  },
} satisfies Meta<typeof ReporterTagList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
