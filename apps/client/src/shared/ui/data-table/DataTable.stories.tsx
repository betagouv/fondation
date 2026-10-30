import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

import { DemoTable, InfiniteDemoTable } from './DataTable.fixtures';

function DataTableStory({
  infiniteScroll,
  ...props
}: ComponentProps<typeof DemoTable> & { infiniteScroll: boolean }) {
  return infiniteScroll ? <InfiniteDemoTable height={props.height} /> : <DemoTable {...props} />;
}

const WITHOUT_INFINITE_SCROLL = { arg: 'infiniteScroll', truthy: false } as const;

const meta = {
  argTypes: {
    enableSorting: {
      control: 'boolean',
      description: 'Active le tri par colonne (la colonne Email reste non triable).',
      if: WITHOUT_INFINITE_SCROLL,
    },
    height: {
      control: { max: 800, min: 200, step: 20, type: 'range' },
      description: 'Hauteur du conteneur scrollable (px).',
    },
    infiniteScroll: {
      control: 'boolean',
      description: '1 000 lignes chargées par pages de 50 en atteignant le bas du tableau (onEndReached).',
    },
    lockedRowIds: {
      control: 'object',
      description:
        'Lignes non sélectionnables (`person-0`, `person-1`...) : case désactivée, cellule grisée et tooltip expliquant pourquoi. Demande withSelection pour que la colonne soit affichée.',
      if: WITHOUT_INFINITE_SCROLL,
    },
    rowCount: {
      control: { max: 10000, min: 0, step: 50, type: 'range' },
      description: 'Nombre de lignes dans le jeu de données (toutes virtualisées).',
      if: WITHOUT_INFINITE_SCROLL,
    },
    rowTint: {
      control: 'inline-radio',
      description: 'Couleur de survol des lignes via rowTint (gris par défaut si non défini).',
      if: WITHOUT_INFINITE_SCROLL,
      options: [undefined, 'blue', 'yellow'],
    },
    unvirtualized: { table: { disable: true } },
    withSelection: {
      control: 'boolean',
      description: 'Active la colonne de sélection (checkbox + select-all + shift-click).',
      if: WITHOUT_INFINITE_SCROLL,
    },
  },
  args: {
    enableSorting: false,
    height: 480,
    infiniteScroll: false,
    rowCount: 100,
    rowTint: undefined,
    withSelection: false,
  },
  component: DataTableStory,
  parameters: { layout: 'fullscreen' },
  title: 'Shared/DataTable',
} satisfies Meta<typeof DataTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
