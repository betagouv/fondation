import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormationEnum } from '@/shared/enums/formation.enum';

import { FormationBadge } from './FormationBadge';

const formations = Object.values(FormationEnum);

const meta = {
  title: 'Shared/FormationBadge',
  component: FormationBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    formation: { control: 'inline-radio', options: formations },
    small: { control: 'boolean' },
  },
  args: {
    formation: FormationEnum.SIEGE,
    small: false,
  },
} satisfies Meta<typeof FormationBadge>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
