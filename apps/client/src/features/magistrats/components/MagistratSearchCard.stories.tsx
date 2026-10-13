import type { Meta, StoryObj } from '@storybook/react-vite';

import type { FoundMagistrat } from '@queries/magistrats.queries';

import { MagistratSearchCard } from './MagistratSearchCard';

const magistrat: FoundMagistrat = {
  currentPosition: {
    function: { id: 'SGCSG', label: "Substitut général chargé d'un secrétariat général" },
    jurisdiction: { id: 'TJ ORLEANS', label: "Tribunal judiciaire d'Orléans" },
  },
  firstName: 'JEAN-SÉBASTIEN',
  grade: 'G1',
  id: 'magistrat-1',
  lastName: 'BACH',
  name: 'BACH Jean-Sébastien',
};

const meta = {
  title: 'Features/MagistratSearch/Card',
  component: MagistratSearchCard,
  parameters: {
    docs: {
      description: {
        component:
          "Carte d'un magistrat trouvé par la recherche : la fonction de son poste actuel (ou sa juridiction quand le poste n'a pas de fonction), son grade et le code de sa juridiction, et un lien vers sa fiche dans l'espace courant.",
      },
    },
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: { magistrat: { table: { disable: true } } },
  args: { context: 'sg', magistrat },
} satisfies Meta<typeof MagistratSearchCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithFunction: Story = {};

export const WithoutFunction: Story = {
  args: {
    magistrat: {
      ...magistrat,
      currentPosition: {
        function: null,
        jurisdiction: { id: 'TJ RODEZ', label: 'Tribunal judiciaire de Rodez' },
      },
    },
  },
};

export const WithoutPosition: Story = {
  args: { magistrat: { ...magistrat, currentPosition: null, grade: null } },
};
