import type { Meta, StoryObj } from '@storybook/react-vite';

import { DemoTable, InfiniteDemoTable } from './NewTable.fixtures';

const meta = {
  title: 'Shared/NewTable',
  component: DemoTable,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    rowCount: {
      control: { type: 'range', min: 0, max: 10000, step: 50 },
      description: 'Nombre de lignes dans le jeu de données (toutes virtualisées).',
    },
    height: {
      control: { type: 'range', min: 200, max: 800, step: 20 },
      description: 'Hauteur du conteneur scrollable (px).',
    },
    withSelection: {
      control: 'boolean',
      description: 'Active la colonne de sélection (checkbox + select-all + shift-click).',
    },
    rowTint: {
      control: 'inline-radio',
      options: [undefined, 'blue', 'yellow'],
      description: 'Couleur de survol des lignes via rowTint (gris par défaut si non défini).',
    },
    enableSorting: {
      control: 'boolean',
      description: 'Active le tri par colonne (la colonne Email reste non triable).',
    },
  },
  args: {
    rowCount: 100,
    height: 480,
    withSelection: false,
    rowTint: undefined,
    enableSorting: false,
  },
} satisfies Meta<typeof DemoTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Default: Story = {
  args: { rowCount: 100 },
};

export const WithSelection: Story = {
  args: { withSelection: true },
};

export const Sorting: Story = {
  args: { enableSorting: true },
};

export const ManyRows: Story = {
  args: { rowCount: 10000, withSelection: true },
};

export const Empty: Story = {
  args: { rowCount: 0 },
};

export const InfiniteScroll: Story = {
  render: () => <InfiniteDemoTable />,
};
