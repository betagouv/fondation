import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormationEnum } from '@/shared/enums/formation.enum';
import { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';

import { OutcomeBadge } from './OutcomeBadge';

const formations = Object.values(FormationEnum);
const outcomes = Object.values(NominationFileOutcomeEnum);

const meta = {
  title: 'Shared/OutcomeBadge',
  component: OutcomeBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    acronym: { control: 'boolean' },
    formation: { control: 'inline-radio', options: formations },
    label: { table: { disable: true } },
    outcome: { control: 'inline-radio', options: outcomes },
    small: { control: 'boolean' },
  },
  args: {
    acronym: false,
    formation: FormationEnum.SIEGE,
    outcome: NominationFileOutcomeEnum.VALIDATED,
    small: true,
  },
} satisfies Meta<typeof OutcomeBadge>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
