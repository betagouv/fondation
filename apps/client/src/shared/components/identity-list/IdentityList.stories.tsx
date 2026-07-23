import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormattedPositionDuration } from '@/i18n/components';

import { IdentityList } from './IdentityList';

const meta = {
  title: 'Shared/IdentityList',
  component: IdentityList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    positionDuration: { table: { disable: true } },
  },
} satisfies Meta<typeof IdentityList>;

export default meta;

type Story = StoryObj<typeof meta>;

const birthDate = { year: 1962, month: 6, day: 22 };

export const Playground: Story = {
  args: {
    birthDate,
    currentPosition: 'Avocat général CC PARIS',
    grade: 'G3sup',
    positionDuration: <FormattedPositionDuration value={{ year: 2022, month: 9, day: 1 }} />,
    rank: '2 sur une liste de 6',
    targetedGrade: 'G3sup',
    targetedPosition: 'Premier avocat général CC PARIS',
  },
};

export const RankFromApi: Story = {
  args: { ...Playground.args, rank: '(2 sur une liste de 6)' },
};

export const WithoutTargetedGrade: Story = {
  args: { ...Playground.args, targetedGrade: null },
};

export const Sparse: Story = {
  args: {
    birthDate: null,
    currentPosition: 'Avocat général CC PARIS',
    grade: null,
    rank: null,
    targetedGrade: null,
    targetedPosition: null,
  },
};
