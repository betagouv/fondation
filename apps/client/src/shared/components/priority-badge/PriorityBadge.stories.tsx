import type { Meta, StoryObj } from '@storybook/react-vite';

import { PrioriteEnum } from '@/shared/enums/priorite.enum';

import { PriorityBadge } from './PriorityBadge';

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

export const Playground: StoryObj<typeof meta> = {};
