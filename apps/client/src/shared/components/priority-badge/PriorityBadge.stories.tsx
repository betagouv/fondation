import type { Meta, StoryObj } from '@storybook/react-vite';

import { PrioriteEnum } from '@/types/enums.types';

import { PriorityBadge, PriorityBadgeList } from './PriorityBadge';

const priorities = Object.values(PrioriteEnum);

const meta = {
  title: 'Shared/PriorityBadge',
  component: PriorityBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    acronym: { control: 'boolean' },
    priority: { control: 'inline-radio', options: priorities },
    small: { control: 'boolean' },
  },
  args: {
    acronym: false,
    priority: PrioriteEnum.ETOILE,
    small: true,
  },
} satisfies Meta<typeof PriorityBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const List: Story = {
  render: (args) => (
    <PriorityBadgeList
      acronym={args.acronym}
      priorities={['PROFILE', 'ETOILE', 'PROFILE', 'OUTRE_MER']}
      small={args.small}
    />
  ),
};
