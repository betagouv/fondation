import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';

const meta = {
  title: 'Shared/Card',
  component: Card,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    className: { table: { disable: true } },
    description: { control: 'text' },
    linkProps: { table: { disable: true } },
    title: { control: 'text' },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    title: 'Titre de la carte',
    description: 'Une description qui présente le contenu de la carte.',
    linkProps: { to: '#' },
  },
};
