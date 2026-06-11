import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';

const meta = {
  title: 'Shared/Card',
  component: Card,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Titre de la carte',
    description: 'Une description qui présente le contenu de la carte.',
    linkProps: { to: '#' },
  },
};
