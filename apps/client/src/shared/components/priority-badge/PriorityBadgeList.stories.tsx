import type { Meta, StoryObj } from '@storybook/react-vite';

import { PrioriteEnum } from '@/shared/enums/priorite.enum';

import { PriorityBadgeList } from './PriorityBadge';

const meta = {
  title: 'Shared/PriorityBadgeList',
  component: PriorityBadgeList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    acronym: { control: 'boolean' },
    priorities: { control: 'check', options: Object.values(PrioriteEnum) },
    small: { control: 'boolean' },
  },
  args: {
    acronym: false,
    priorities: [PrioriteEnum.PROFILE, PrioriteEnum.ETOILE, PrioriteEnum.OUTRE_MER],
    small: true,
  },
} satisfies Meta<typeof PriorityBadgeList>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
