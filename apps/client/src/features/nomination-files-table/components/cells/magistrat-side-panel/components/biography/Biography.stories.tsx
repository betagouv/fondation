import type { Meta, StoryObj } from '@storybook/react-vite';

import { Biography } from './Biography';

const meta = {
  title: 'Features/SidePanel/Biography',
  component: Biography,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { historique: { control: 'text' } },
  args: {
    historique:
      '2008 - Auditeur de justice\n2011 - Juge au tribunal de grande instance de Lille\n2017 - Vice-président chargé de l’instruction\n2022 - Conseiller à la cour d’appel de Douai',
  },
} satisfies Meta<typeof Biography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = { args: { historique: null } };
