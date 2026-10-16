import type { Meta, StoryObj } from '@storybook/react-vite';

import { DemoTable, InfiniteDemoTable } from './DataTable.fixtures';

const meta = {
  argTypes: {
    enableSorting: {
      control: 'boolean',
      description: 'Active le tri par colonne (la colonne Email reste non triable).',
    },
    height: {
      control: { max: 800, min: 200, step: 20, type: 'range' },
      description: 'Hauteur du conteneur scrollable (px).',
    },
    lockedRowIds: {
      control: 'object',
      description:
        'Lignes non sélectionnables (`person-0`, `person-1`...) : case désactivée, cellule grisée et tooltip expliquant pourquoi. Demande withSelection pour que la colonne soit affichée.',
    },
    rowCount: {
      control: { max: 10000, min: 0, step: 50, type: 'range' },
      description: 'Nombre de lignes dans le jeu de données (toutes virtualisées).',
    },
    rowTint: {
      control: 'inline-radio',
      description: 'Couleur de survol des lignes via rowTint (gris par défaut si non défini).',
      options: [undefined, 'blue', 'yellow'],
    },
    withSelection: {
      control: 'boolean',
      description: 'Active la colonne de sélection (checkbox + select-all + shift-click).',
    },
  },
  args: {
    enableSorting: false,
    height: 480,
    rowCount: 100,
    rowTint: undefined,
    withSelection: false,
  },
  component: DemoTable,
  parameters: { layout: 'fullscreen' },
  title: 'Shared/DataTable',
} satisfies Meta<typeof DemoTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithSelection: Story = {
  args: { withSelection: true },
};

export const LockedRows: Story = {
  args: { lockedRowIds: ['person-1', 'person-3'], rowCount: 8, withSelection: true },
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
